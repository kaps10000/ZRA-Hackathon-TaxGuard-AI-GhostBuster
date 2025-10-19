"""
WATER HARVESTING DASHBOARD - Flask Web Server with Data Logging
Real-time monitoring with beautiful UI + CSV data logging
FIXED: Correct soil moisture logic (lower value = wetter)
"""

from flask import Flask, render_template, jsonify, send_file
from flask_cors import CORS
import serial
import threading
import time
import requests
from datetime import datetime, timedelta
import csv
import os
import json

# ML model imports
try:
    import joblib
except Exception:
    joblib = None
import pickle
import numpy as np
import pandas as pd

import soil_health_monitor as shm
import crop_recommendation as cr

app = Flask(__name__)
CORS(app)

# ============= CONFIGURATION =============
ARDUINO_PORT = 'COM7'
BAUD_RATE = 9600

# WeatherAPI.com Configuration
API_KEY = '2ff9003665874003b3a232437251110'
CITY = 'Lusaka'

# CORRECT Thresholds (LOWER value = WETTER soil)
DRY_SOIL_THRESHOLD = 300  # BELOW this = dry soil
WET_SOIL_THRESHOLD = 500  # ABOVE this = wet soil
RETRY_WINDOW_SEC  = 5   # if still DRY this long after IRRIGATE, send IRRIGATE again

# Data Logging Configuration
LOG_FILE = 'irrigation_data_log.csv'
LOG_INTERVAL = 60  # Log every 60 seconds (1 minute)

# ML Model Configuration
MODEL_PATH = os.path.join('models', 'irrigation_decision_model_REAL.pkl')
MODEL_INFO_PATH = os.path.join('models', 'model_info_REAL.json')
STATE_FILE = os.path.join('models', 'runtime_state.json')

# ============= GLOBAL DATA =============
system_data = {
    'soil_moisture': 0,
    'temperature': 0,
    'humidity': 0,
    'soil_status': 'Unknown',
    'weather': {
        'description': 'Loading...',
        'temperature': 0,
        'humidity': 0,
        'cloud_coverage': 0,
        'rain_coming': False,
        'precip_mm': 0,
    },
    'decision': 'Starting...',
    'model_decision': 'N/A',
    'water_saved': 0,
    'irrigation_count': 0,
    'last_update': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
    'system_status': 'Initializing',
    'alerts': []
}

arduino = None
total_water_saved = 0
irrigation_count = 0
last_log_time = time.time()

# Command gating to avoid repeated identical commands
last_decision_sent = None  # Track last sent command to Arduino (e.g., 'IRRIGATE','STOP','RAIN_ALERT')
last_irrigate_time = 0.0   # Timestamp of last IRRIGATE command sent

# ML runtime state
model = None
model_classes = None
feature_columns = []
last_rain_time: datetime | None = None

# ============= DATA LOGGING FUNCTIONS =============
def initialize_log_file():
    """Create CSV file with headers if it doesn't exist"""
    if not os.path.exists(LOG_FILE):
        with open(LOG_FILE, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow([
                'Timestamp',
                'Date',
                'Time',
                'Soil_Moisture',
                'Soil_Status',
                'Temperature_C',
                'Humidity_Percent',
                'Weather_Description',
                'Weather_Temp_C',
                'Weather_Humidity',
                'Rain_Coming',
                'Decision',
                'Water_Saved_L',
                'Irrigation_Count'
            ])
        print(f"✓ Created new log file: {LOG_FILE}")
    else:
        print(f"✓ Using existing log file: {LOG_FILE}")

def log_data_to_csv():
    """Log current system data to CSV file"""
    try:
        with open(LOG_FILE, 'a', newline='') as f:
            writer = csv.writer(f)
            
            now = datetime.now()
            
            writer.writerow([
                now.strftime('%Y-%m-%d %H:%M:%S'),
                now.strftime('%Y-%m-%d'),
                now.strftime('%H:%M:%S'),
                system_data['soil_moisture'],
                system_data['soil_status'],
                system_data['temperature'],
                system_data['humidity'],
                system_data['weather']['description'],
                system_data['weather']['temperature'],
                system_data['weather']['humidity'],
                'Yes' if system_data['weather']['rain_coming'] else 'No',
                system_data['decision'],
                system_data['water_saved'],
                system_data['irrigation_count']
            ])
        
        print(f"📝 Data logged at {now.strftime('%H:%M:%S')}")
        
    except Exception as e:
        print(f"✗ Error logging data: {e}")

def get_log_stats():
    """Get statistics from log file"""
    try:
        if not os.path.exists(LOG_FILE):
            return {
                'total_entries': 0,
                'file_size': '0 KB',
                'date_range': 'No data yet'
            }
        
        with open(LOG_FILE, 'r') as f:
            reader = csv.reader(f)
            rows = list(reader)
            
            if len(rows) <= 1:
                return {
                    'total_entries': 0,
                    'file_size': '0 KB',
                    'date_range': 'No data yet'
                }
            
            file_size = os.path.getsize(LOG_FILE) / 1024
            first_date = rows[1][1] if len(rows) > 1 else 'N/A'
            last_date = rows[-1][1] if len(rows) > 1 else 'N/A'
            
            return {
                'total_entries': len(rows) - 1,
                'file_size': f'{file_size:.2f} KB',
                'date_range': f'{first_date} to {last_date}'
            }
    
    except Exception as e:
        print(f"✗ Error reading log stats: {e}")
        return {
            'total_entries': 0,
            'file_size': 'Error',
            'date_range': 'Error'
        }

# ============= ARDUINO CONNECTION =============
def connect_arduino():
    global arduino
    try:
        arduino = serial.Serial(ARDUINO_PORT, BAUD_RATE, timeout=1)
        time.sleep(2)
        print(f"✓ Connected to Arduino on {ARDUINO_PORT}")
        system_data['system_status'] = 'Connected'
        add_alert('success', 'Arduino connected successfully')
        return True
    except Exception as e:
        print(f"✗ Error connecting to Arduino: {e}")
        system_data['system_status'] = 'Disconnected'
        add_alert('error', f'Arduino connection failed: {e}')
        return False

# ============= MODEL LOADING & FEATURE ENGINEERING =============
def load_model_and_info():
    global model, model_classes, feature_columns
    try:
        with open(MODEL_INFO_PATH, 'r') as f:
            info = json.load(f)
            feature_columns = info.get('feature_columns', [])
    except Exception as e:
        print(f"✗ Error reading model info: {e}")
        feature_columns = [
            'Soil_Moisture','Temperature_C','Humidity_Percent','Rain_Coming_Binary',
            'Days_Since_Rain','Hour','Weather_Humidity','Weather_Temp_C'
        ]

    try:
        if joblib:
            model = joblib.load(MODEL_PATH)
        else:
            with open(MODEL_PATH, 'rb') as f:
                model = pickle.load(f)
        model_classes = getattr(model, 'classes_', None)
        print("✓ ML model loaded")
    except Exception as e:
        print(f"✗ Error loading model: {e}")
        model = None


def persist_state():
    try:
        payload = {
            'last_rain_time': last_rain_time.strftime('%Y-%m-%d %H:%M:%S') if last_rain_time else None
        }
        with open(STATE_FILE, 'w') as f:
            json.dump(payload, f)
    except Exception:
        pass


def restore_state():
    global last_rain_time
    try:
        if os.path.exists(STATE_FILE):
            with open(STATE_FILE, 'r') as f:
                payload = json.load(f)
                ts = payload.get('last_rain_time')
                if ts:
                    last_rain_time = datetime.strptime(ts, '%Y-%m-%d %H:%M:%S')
    except Exception:
        pass


def initialize_rain_state_from_log():
    """Try to infer last_rain_time from recent log entries."""
    global last_rain_time
    if last_rain_time:
        return
    try:
        if not os.path.exists(LOG_FILE):
            return
        with open(LOG_FILE, 'r') as f:
            reader = csv.DictReader(f)
            rows = list(reader)
            for row in reversed(rows):
                desc = (row.get('Weather_Description') or '').lower()
                precip = row.get('Rain_Coming') or 'No'
                ts = row.get('Timestamp')
                if any(k in desc for k in ['rain','drizzle','shower','thunderstorm']) or precip == 'Yes':
                    if ts:
                        last_rain_time = datetime.strptime(ts, '%Y-%m-%d %H:%M:%S')
                    else:
                        last_rain_time = datetime.now() - timedelta(days=1)
                    break
    except Exception:
        pass


def compute_days_since_rain(now_dt: datetime, weather: dict) -> float:
    global last_rain_time
    # Update last_rain_time if current weather indicates precipitation
    try:
        precip_now = (weather.get('precip_mm', 0) or 0) > 0
        desc = (weather.get('description') or '').lower()
        raining_keywords = any(k in desc for k in ['rain','drizzle','shower','thunder'])
        if precip_now or raining_keywords:
            last_rain_time = now_dt
            persist_state()
    except Exception:
        pass

    if not last_rain_time:
        # Fallback: assume 2 days without rain initially
        last_rain_time = now_dt - timedelta(days=2)
    delta = now_dt - last_rain_time
    return max(delta.total_seconds() / 86400.0, 0.0)


def build_feature_vector(soil_moisture: int | float, temperature: float, humidity: float, weather: dict, now_dt: datetime) -> pd.DataFrame:
    rain_binary = 1 if weather and weather.get('rain_coming') else 0
    days_since_rain = compute_days_since_rain(now_dt, weather)
    hour = now_dt.hour
    weather_h = weather.get('humidity') if weather else 0
    weather_t = weather.get('temperature') if weather else 0

    features = {
        'Soil_Moisture': soil_moisture,
        'Temperature_C': temperature,
        'Humidity_Percent': humidity,
        'Rain_Coming_Binary': rain_binary,
        'Days_Since_Rain': days_since_rain,
        'Hour': hour,
        'Weather_Humidity': weather_h,
        'Weather_Temp_C': weather_t,
    }

    # Ensure order/columns exactly as model expects
    row = [features.get(col, 0) for col in feature_columns]
    X = pd.DataFrame([row], columns=feature_columns)
    return X


def model_irrigation_decision(soil_moisture: int, temperature: float, humidity: float, weather: dict, now_dt: datetime) -> str:
    if model is None:
        # Fallback: legacy rule if model not available
        return 'IRRIGATE' if soil_moisture < DRY_SOIL_THRESHOLD else 'STOP'

    X = build_feature_vector(soil_moisture, temperature, humidity, weather, now_dt)
    try:
        pred = model.predict(X)
        # Map to label string
        if isinstance(pred, (list, tuple, np.ndarray)):
            pred = pred[0]
        if isinstance(pred, (np.integer, int)) and model_classes is not None:
            # classes_ maps index to label
            # Some estimators output encoded ints; guard range
            idx = int(pred)
            if 0 <= idx < len(model_classes):
                return str(model_classes[idx])
        return str(pred)
    except Exception as e:
        add_alert('error', f'Model prediction error: {e}')
        return 'STOP'

# ============= WEATHER API =============
def get_weather_forecast():
    try:
        url = f"http://api.weatherapi.com/v1/current.json?key={API_KEY}&q={CITY}"
        response = requests.get(url, timeout=5)
        data = response.json()
        
        if response.status_code == 200:
            weather = {
                'description': data['current']['condition']['text'],
                'temperature': data['current']['temp_c'],
                'humidity': data['current']['humidity'],
                'cloud_coverage': data['current']['cloud'],
                'precip_mm': data['current']['precip_mm']
            }
            
            rain_keywords = ['rain', 'drizzle', 'shower', 'thunderstorm', 'storm']
            weather['rain_coming'] = (
                any(keyword in weather['description'].lower() for keyword in rain_keywords) or
                weather['precip_mm'] > 0 or
                weather['cloud_coverage'] > 70
            )
            
            return weather
        else:
            return None
            
    except Exception as e:
        print(f"✗ Error fetching weather: {e}")
        return None

# ============= DECISION ENGINE (MODEL-DRIVEN) =============
def decide_with_model(soil_moisture: int, temperature: float, humidity: float, weather: dict) -> str:
    """Use ML model as primary brain; override to IRRIGATE if sensor is DRY."""
    global irrigation_count
    now_dt = datetime.now()

    # ML decision
    ml_decision = model_irrigation_decision(soil_moisture, temperature, humidity, weather, now_dt)
    system_data['model_decision'] = ml_decision

    # Sensor override: if DRY -> IRRIGATE regardless of model
    if soil_moisture < DRY_SOIL_THRESHOLD:
        irrigation_count += 1
        add_alert('info', f'Irrigation #{irrigation_count} (sensor override)')
        return 'IRRIGATE'

    # Otherwise follow model
    if ml_decision == 'IRRIGATE':
        irrigation_count += 1
        add_alert('info', f'Irrigation #{irrigation_count} (model)')
        return 'IRRIGATE'

    return 'STOP'

# ============= ALERT SYSTEM =============
def add_alert(alert_type, message):
    """Add alert to system (keep last 10)"""
    alert = {
        'type': alert_type,
        'message': message,
        'time': datetime.now().strftime('%H:%M:%S')
    }
    system_data['alerts'].insert(0, alert)
    if len(system_data['alerts']) > 10:
        system_data['alerts'].pop()

# ============= DATA PROCESSING =============
def process_arduino_data(line):
    global total_water_saved, irrigation_count, last_log_time, last_decision_sent, last_irrigate_time
    
    try:
        if line.startswith("DATA,"):
            parts = line.strip().split(',')
            soil_moisture = int(parts[1])
            temperature = float(parts[2])
            humidity = float(parts[3])
            
            # CORRECT soil status logic (lower = wetter)
            if soil_moisture < DRY_SOIL_THRESHOLD:
                soil_status = 'DRY'
            elif soil_moisture < WET_SOIL_THRESHOLD:
                soil_status = 'MODERATE'
            else:
                soil_status = 'WET'
            
            # Update system data
            system_data['soil_moisture'] = soil_moisture
            system_data['temperature'] = temperature
            system_data['humidity'] = humidity
            system_data['soil_status'] = soil_status
            system_data['last_update'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            
            # Get weather
            weather = get_weather_forecast()
            if weather:
                system_data['weather'] = weather
            
            # Rule-based decision (ignore repeated IRRIGATE)
            if soil_moisture < DRY_SOIL_THRESHOLD:
                if weather and weather.get('rain_coming'):
                    total_water_saved += 5
                    decision = 'RAIN_ALERT'
                else:
                    decision = 'IRRIGATE'
            else:
                decision = 'STOP'
            
            # Count only on transition to IRRIGATE
            if decision == 'IRRIGATE' and last_decision_sent != 'IRRIGATE':
                irrigation_count += 1
                add_alert('info', f'Irrigation #{irrigation_count} activated')
                last_irrigate_time = time.time()
            elif decision == 'RAIN_ALERT':
                add_alert('warning', 'Rain expected! Water saved: 5L')
            
            system_data['decision'] = decision
            system_data['water_saved'] = total_water_saved
            system_data['irrigation_count'] = irrigation_count
            
            # Send command only if it changed (ignores repeats)
            if arduino and decision != last_decision_sent:
                arduino.write(f"{decision}\n".encode())
                last_decision_sent = decision
                if decision == 'IRRIGATE':
                    last_irrigate_time = time.time()
            
            # LED on pin 8 follows DRY status (sent each loop)
            if arduino:
                led_cmd = 'LED8_ON' if soil_status == 'DRY' else 'LED8_OFF'
                arduino.write(f"{led_cmd}\n".encode())
            
            # Retry IRRIGATE after RETRY_WINDOW_SEC if still DRY and last_decision_sent is IRRIGATE
            if last_decision_sent == 'IRRIGATE' and soil_moisture < DRY_SOIL_THRESHOLD and (time.time() - last_irrigate_time) >= RETRY_WINDOW_SEC:
                if arduino:
                    arduino.write(b"IRRIGATE\n")
                last_irrigate_time = time.time()
                irrigation_count += 1
                add_alert('info', f'Irrigation retry #{irrigation_count} (still dry)')
            
            # LOG DATA TO CSV
            current_time = time.time()
            if current_time - last_log_time >= LOG_INTERVAL:
                log_data_to_csv()
                last_log_time = current_time
            
    except Exception as e:
        print(f"✗ Error processing data: {e}")
        add_alert('error', f'Data processing error: {e}')
                # LED on pin 8 follows DRY status (sent each loop)
        led_cmd = 'LED8_ON' if soil_status == 'DRY' else 'LED8_OFF'
        arduino.write(f"{led_cmd}\n".encode())
            
            # LOG DATA TO CSV
        current_time = time.time()
        if current_time - last_log_time >= LOG_INTERVAL:
                log_data_to_csv()
                last_log_time = current_time
            
    except Exception as e:
        print(f"✗ Error processing data: {e}")
        add_alert('error', f'Data processing error: {e}')

# ============= BACKGROUND THREAD =============
def arduino_monitor():
    """Background thread to monitor Arduino"""
    while True:
        try:
            if arduino and arduino.in_waiting > 0:
                line = arduino.readline().decode('utf-8').strip()
                if line:
                    print(f"← Arduino: {line}")
                    process_arduino_data(line)
            time.sleep(0.1)
        except Exception as e:
            print(f"Monitor error: {e}")
            time.sleep(1)

# ============= FLASK ROUTES =============
@app.route('/')
def index():
    """Serve the main Water Harvesting dashboard"""
    return render_template('dashboard.html')

@app.route('/soil-health')
def soil_health():
    """Render Soil Health analytics dashboard (historical dataset)."""
    data = shm.generate_dashboard_data(shm.DATA_FILE_PATH)
    if data.get('status') != 'success':
        return render_template('soil_health.html', error=data.get('message', 'Unable to load data'), data=None)
    return render_template('soil_health.html', data=data, error=None)

@app.route('/api/soil-health')
def soil_health_api():
    """JSON API with soil health metrics/alerts for client-side refresh if needed."""
    data = shm.generate_dashboard_data(shm.DATA_FILE_PATH)
    return jsonify(data)

@app.route('/api/data')
def get_data():
    """API endpoint for real-time data"""
    data_with_stats = system_data.copy()
    data_with_stats['log_stats'] = get_log_stats()
    return jsonify(data_with_stats)

# ============= CROP RECOMMENDATION UI & API =============
@app.route('/crop-recommend')
def crop_recommend_page():
    # Pre-fill with current weather if available
    weather = get_weather_forecast() or system_data.get('weather') or {}
    now = datetime.now()
    month = now.month
    season = 'Rainy' if month in [11,12,1,2,3] else 'Dry'
    default_ctx = {
        'temperature': round(weather.get('temperature', 26.0), 1),
        'rainfall': max(weather.get('precip_mm', 0.0), 0.0),
        'season': season,
        'soil_type': 'Loam',
    }
    return render_template('crop_recommend.html', defaults=default_ctx)

@app.route('/api/crop/recommend', methods=['POST'])
def crop_recommend_api():
    try:
        payload = None
        if 'application/json' in (str(getattr(__import__('flask').request, 'content_type', '') or '')).lower():
            payload = __import__('flask').request.get_json(force=True)
        else:
            payload = __import__('flask').request.form.to_dict()
        temperature = float(payload.get('temperature'))
        rainfall = float(payload.get('rainfall'))
        season = str(payload.get('season'))
        soil_type = str(payload.get('soil_type'))
        result = cr.get_recommendation(temperature, rainfall, season, soil_type)
        return jsonify({'status':'success', **result})
    except Exception as e:
        return jsonify({'status':'error','message':str(e)})

@app.route('/api/test/irrigate')
def test_irrigate():
    """Test irrigation manually"""
    if arduino:
        arduino.write(b"IRRIGATE\n")
        add_alert('info', 'Manual irrigation test triggered')
        log_data_to_csv()
        return jsonify({'status': 'success', 'message': 'Irrigation triggered'})
    return jsonify({'status': 'error', 'message': 'Arduino not connected'})

@app.route('/api/test/rain')
def test_rain():
    """Test rain alert manually"""
    if arduino:
        arduino.write(b"RAIN_ALERT\n")
        add_alert('warning', 'Manual rain alert test triggered')
        log_data_to_csv()
        return jsonify({'status': 'success', 'message': 'Rain alert triggered'})
    return jsonify({'status': 'error', 'message': 'Arduino not connected'})

@app.route('/api/log/download')
def download_log():
    """Download CSV log file"""
    try:
        return send_file(LOG_FILE, as_attachment=True, download_name=f'irrigation_log_{datetime.now().strftime("%Y%m%d")}.csv')
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

# ============= MAIN =============
if __name__ == '__main__':
    print("\n" + "="*60)
    print("  WATER HARVESTING DASHBOARD - STARTING")
    print("="*60)
    
    initialize_log_file()
    print(f"📝 Logging data every {LOG_INTERVAL} seconds to: {LOG_FILE}")

    # ML setup (Irrigation)
    restore_state()
    initialize_rain_state_from_log()
    load_model_and_info()
    if model is None:
        print("⚠️ ML model not available; falling back to rule-based decisions.")
    else:
        print("🤖 ML-driven decisions enabled.")

    # ML setup (Crop recommender)
    cr.ensure_crop_model()
    
    stats = get_log_stats()
    print(f"📊 Log Statistics:")
    print(f"   - Total entries: {stats['total_entries']}")
    print(f"   - File size: {stats['file_size']}")
    print(f"   - Date range: {stats['date_range']}")
    
    print("\n📌 SOIL LOGIC: Lower value = Wetter soil")
    print(f"   - Below {DRY_SOIL_THRESHOLD} = DRY (override to IRRIGATE)")
    print(f"   - {DRY_SOIL_THRESHOLD}-{WET_SOIL_THRESHOLD} = MODERATE")
    print(f"   - Above {WET_SOIL_THRESHOLD} = WET (STOP)")
    
    if connect_arduino():
        monitor_thread = threading.Thread(target=arduino_monitor, daemon=True)
        monitor_thread.start()
        print("✓ Background monitoring started")
    
    print("\n" + "="*60)
    print("  🌐 DASHBOARD READY!")
    print("  📊 Open your browser and go to:")
    print("     http://127.0.0.1:5000")
    print("  💾 Data is being logged to: " + LOG_FILE)
    print("="*60 + "\n")
    
    app.run(host='0.0.0.0', port=5000, debug=False)
