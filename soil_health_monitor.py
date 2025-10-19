import pandas as pd
import numpy as np
import plotly.express as px
from plotly.offline import plot
from datetime import timedelta

# ==============================================================================
# 1. CONFIGURATION
# ==============================================================================

DATA_FILE_PATH = r"C:\Users\dell\Desktop\Smart irrigation system\irrigation_log_20251016.csv"

# Constants for Soil Health Score calculation
# Higher moisture readings indicate wetter soil in this dataset
IDEAL_MOISTURE = 650
MAX_DEVIATION = 650  # Normalize by distance from 0..650
# Simple thresholds for plain-language guidance
DRY_SOIL_THRESHOLD = 300
WET_SOIL_THRESHOLD = 600

# ==============================================================================
# 2. DATA PROCESSING AND METRIC FUNCTIONS
# ==============================================================================

def load_and_preprocess_data(file_path: str) -> pd.DataFrame | None:
    """Load CSV, parse timestamps, clean types, sort chronologically."""
    try:
        df = pd.read_csv(file_path)
    except FileNotFoundError:
        print(f"Error: File not found at {file_path}")
        return None

    # Expect existing headers: Timestamp, Date, Time, Soil_Moisture, ...
    # Parse timestamp robustly (handles YYYY-MM-DD HH:MM:SS)
    df['Timestamp_dt'] = pd.to_datetime(df['Timestamp'], errors='coerce')

    # Ensure numeric moisture
    df['Soil_Moisture'] = pd.to_numeric(df['Soil_Moisture'], errors='coerce')

    # Drop invalid rows
    df.dropna(subset=['Soil_Moisture', 'Timestamp_dt'], inplace=True)

    # Sort for trend analysis
    df.sort_values(by='Timestamp_dt', inplace=True)
    df.reset_index(drop=True, inplace=True)

    return df

def calculate_soil_health_score(df: pd.DataFrame) -> tuple[float, pd.DataFrame]:
    """Compute 0-100 health score based on distance from IDEAL_MOISTURE."""
    df['Moisture_Deviation'] = (df['Soil_Moisture'] - IDEAL_MOISTURE).abs()
    df['Soil_Health_Score'] = 100 - (df['Moisture_Deviation'] / MAX_DEVIATION) * 100
    df['Soil_Health_Score'] = df['Soil_Health_Score'].clip(0, 100)
    latest_score = float(df['Soil_Health_Score'].iloc[-1])
    return latest_score, df

def analyze_trends_and_build_alerts(df: pd.DataFrame) -> list[str]:
    """Assess drying rates vs. history and produce actionable alerts."""
    alerts: list[str] = []

    # Changes and rates (hours)
    df['Moisture_Change'] = df['Soil_Moisture'].diff()
    df['Time_Change'] = df['Timestamp_dt'].diff().dt.total_seconds() / 3600.0

    # Compute drying rate per-step (positive when drying, NaN otherwise)
    with np.errstate(divide='ignore', invalid='ignore'):
        rate = -df['Moisture_Change'] / df['Time_Change']
    df['Drying_Rate'] = np.where((df['Moisture_Change'] < 0) & (df['Time_Change'] > 0.01), rate, np.nan)

    historical_rate = float(df['Drying_Rate'].mean(skipna=True)) if df['Drying_Rate'].notna().any() else None

    # Compare last 24h vs historical
    window_start = df['Timestamp_dt'].max() - timedelta(hours=24)
    last_24h = df[df['Timestamp_dt'] >= window_start]
    current_rate = float(last_24h['Drying_Rate'].mean(skipna=True)) if last_24h['Drying_Rate'].notna().any() else None

    if historical_rate and current_rate and historical_rate > 0:
        rate_increase_percent = ((current_rate - historical_rate) / historical_rate) * 100.0
        if rate_increase_percent > 20:
            alerts.append(f"⚠️ TREND DETECTED: Soil drying {rate_increase_percent:.0f}% faster than normal.")

    # Degradation / low health
    latest_score = float(df['Soil_Health_Score'].iloc[-1])
    if latest_score < 40:
        alerts.append("🛑 SOIL DEGRADATION: Health score critically low. Add mulch/organic matter.")

    # Critical moisture (very dry)
    latest_moisture = float(df['Soil_Moisture'].iloc[-1])
    if latest_moisture < 300:
        alerts.append(f"💧 MOISTURE CRITICAL: {latest_moisture:.0f} (sensor units). Irrigation recommended.")

    return alerts

def build_farmer_summary(df: pd.DataFrame, alerts: list[str]) -> dict:
    latest_moisture = float(df['Soil_Moisture'].iloc[-1])
    latest_score = float(df['Soil_Health_Score'].iloc[-1])

    # Base status by sensor
    if latest_moisture < DRY_SOIL_THRESHOLD:
        status = 'DRY'
        action = 'Water now'
        traffic = 'red'
        reason = 'Soil is too dry.'
    elif latest_score < 40:
        status = 'POOR'
        action = 'Add mulch/compost'
        traffic = 'red'
        reason = 'Soil health is low.'
    elif any('TREND DETECTED' in a for a in alerts):
        status = 'GETTING DRIER'
        action = 'Check soil tomorrow'
        traffic = 'yellow'
        reason = 'Soil is drying faster than normal.'
    else:
        status = 'OK'
        action = 'No watering needed'
        traffic = 'green'
        reason = 'Moisture and health look good.'

    tips = []
    if traffic == 'red' and latest_moisture < DRY_SOIL_THRESHOLD:
        tips.append('Irrigate until moisture rises above 600.')
    if latest_score < 40:
        tips.append('Cover soil with mulch to hold water.')
    if any('MOISTURE CRITICAL' in a for a in alerts):
        tips.append('Irrigate immediately to protect crops.')

    return {
        'status': status,
        'action': action,
        'traffic': traffic,
        'reason': reason,
        'tips': tips,
    }

def create_dashboard_visuals(df: pd.DataFrame) -> dict:
    """Return Plotly HTML divs for 7-day, 30-day moisture and health score history."""
    last_7_days = df[df['Timestamp_dt'] >= df['Timestamp_dt'].max() - timedelta(days=7)]
    last_30_days = df[df['Timestamp_dt'] >= df['Timestamp_dt'].max() - timedelta(days=30)]

    visuals: dict[str, str] = {}

    fig_7d = px.line(last_7_days, x='Timestamp_dt', y='Soil_Moisture', title='Soil Moisture (Last 7 Days)')
    fig_7d.update_layout(xaxis_title='Date & Time', yaxis_title='Soil Moisture (sensor units)')
    visuals['moisture_7d_html'] = plot(fig_7d, output_type='div', include_plotlyjs=False)

    fig_30d = px.line(last_30_days, x='Timestamp_dt', y='Soil_Moisture', title='Soil Moisture (Last 30 Days)')
    fig_30d.update_layout(xaxis_title='Date & Time', yaxis_title='Soil Moisture (sensor units)')
    visuals['moisture_30d_html'] = plot(fig_30d, output_type='div', include_plotlyjs=False)

    fig_health = px.line(df, x='Timestamp_dt', y='Soil_Health_Score', title='Soil Health Score (History)')
    fig_health.update_layout(xaxis_title='Date & Time', yaxis_title='Health Score (%)', yaxis_range=[0, 100])
    visuals['health_score_html'] = plot(fig_health, output_type='div', include_plotlyjs=False)

    return visuals

# ==============================================================================
# 3. MAIN EXECUTION FUNCTION
# ==============================================================================

def generate_dashboard_data(file_path: str) -> dict:
    """Pipeline for UI consumption: metrics, alerts, and visuals."""
    print(f"--- Starting data analysis for file: {file_path} ---")

    df = load_and_preprocess_data(file_path)
    if df is None or df.empty:
        return {"status": "error", "message": "Data loading failed or dataset is empty."}

    latest_score, df = calculate_soil_health_score(df)
    alerts = analyze_trends_and_build_alerts(df)
    visuals = create_dashboard_visuals(df)

    # 6. Farmer-friendly summary
    farmer_summary = build_farmer_summary(df, alerts)

    output = {
        "status": "success",
        "latest_data_time": df['Timestamp_dt'].iloc[-1].strftime('%Y-%m-%d %H:%M:%S'),
        "latest_soil_moisture": float(df['Soil_Moisture'].iloc[-1]),
        "latest_health_score": round(float(latest_score), 2),
        "alerts": alerts,
        "visuals": visuals,
        "farmer_summary": farmer_summary,
    }

    print("--- Analysis complete. Data structures prepared for UI. ---")
    return output

if __name__ == "__main__":
    dashboard_data = generate_dashboard_data(DATA_FILE_PATH)
    if dashboard_data.get("status") == "success":
        print("Latest:")
        print(dashboard_data['latest_data_time'])
        print(dashboard_data['latest_soil_moisture'])
        print(dashboard_data['latest_health_score'])
        for a in dashboard_data['alerts']:
            print("-", a)
    else:
        print("Error:", dashboard_data.get('message', 'unknown'))
