import os
import json
import random
from datetime import datetime

import numpy as np
import pandas as pd

try:
    import joblib
except Exception:
    joblib = None

try:
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.model_selection import train_test_split
except Exception:
    RandomForestClassifier = None

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, 'models') if not BASE_DIR.endswith('models') else BASE_DIR
if not os.path.exists(MODELS_DIR):
    MODELS_DIR = os.path.join(os.path.dirname(BASE_DIR), 'models')

DATA_CSV = os.path.join(MODELS_DIR, 'crop_synthetic_dataset.csv')
MODEL_PKL = os.path.join(MODELS_DIR, 'crop_recommender.pkl')
MODEL_INFO = os.path.join(MODELS_DIR, 'crop_model_info.json')

SEASONS = ['Rainy', 'Dry']
SOIL_TYPES = ['Sand', 'Loam', 'Clay']
CROPS = ['Maize', 'Sorghum', 'Groundnuts', 'Millet', 'Cassava', 'Sunflower', 'Soybeans']

# Simplified crop requirements (approximate, illustrative)
CROP_REQ = {
    'Maize':      {'temp': (20, 30), 'rain': (500, 1200), 'soils': {'Loam': 1.0, 'Sand': 0.8, 'Clay': 0.9}, 'seasons': {'Rainy': 1.0, 'Dry': 0.6}},
    'Sorghum':    {'temp': (18, 35), 'rain': (300, 700),  'soils': {'Loam': 0.9, 'Sand': 1.0, 'Clay': 0.8}, 'seasons': {'Rainy': 0.9, 'Dry': 1.0}},
    'Groundnuts': {'temp': (22, 30), 'rain': (500, 1000), 'soils': {'Loam': 1.0, 'Sand': 0.9, 'Clay': 0.7}, 'seasons': {'Rainy': 1.0, 'Dry': 0.7}},
    'Millet':     {'temp': (20, 35), 'rain': (200, 600),  'soils': {'Loam': 0.9, 'Sand': 1.0, 'Clay': 0.7}, 'seasons': {'Rainy': 0.9, 'Dry': 1.0}},
    'Cassava':    {'temp': (20, 34), 'rain': (800, 1500), 'soils': {'Loam': 1.0, 'Sand': 0.7, 'Clay': 0.9}, 'seasons': {'Rainy': 1.0, 'Dry': 0.8}},
    'Sunflower':  {'temp': (18, 30), 'rain': (300, 800),  'soils': {'Loam': 1.0, 'Sand': 0.9, 'Clay': 0.8}, 'seasons': {'Rainy': 0.9, 'Dry': 1.0}},
    'Soybeans':   {'temp': (20, 30), 'rain': (450, 800),  'soils': {'Loam': 1.0, 'Sand': 0.8, 'Clay': 0.9}, 'seasons': {'Rainy': 1.0, 'Dry': 0.7}},
}

FEATURE_COLUMNS = ['Temperature_C', 'Rainfall_mm', 'Season', 'Soil_Type']


def _score_crop(crop: str, t: float, r: float, season: str, soil: str) -> float:
    req = CROP_REQ[crop]
    tmin, tmax = req['temp']
    rmin, rmax = req['rain']
    # temp score
    if tmin <= t <= tmax:
        ts = 1.0
    else:
        dt = min(abs(t - tmin), abs(t - tmax))
        ts = max(0.0, 1.0 - dt / 15.0)
    # rain score
    if rmin <= r <= rmax:
        rs = 1.0
    else:
        dr = min(abs(r - rmin), abs(r - rmax))
        rs = max(0.0, 1.0 - dr / 600.0)
    ss = req['seasons'].get(season, 0.8)
    sols = req['soils'].get(soil, 0.8)
    return 0.4*ts + 0.4*rs + 0.1*ss + 0.1*sols


def generate_synthetic_dataset(n: int = 200, path: str = DATA_CSV) -> str:
    rng = np.random.default_rng(42)
    rows = []
    for _ in range(n):
        season = random.choice(SEASONS)
        soil = random.choices(SOIL_TYPES, weights=[0.3, 0.5, 0.2])[0]
        # Zambia-like ranges
        if season == 'Rainy':
            temp = float(rng.normal(26, 3))
            rainfall = float(max(200, min(1500, rng.normal(800, 250))))
        else:
            temp = float(rng.normal(24, 4))
            rainfall = float(max(0, min(600, rng.normal(150, 120))))
        # label by best score
        scores = {c: _score_crop(c, temp, rainfall, season, soil) for c in CROPS}
        label = max(scores.items(), key=lambda kv: kv[1])[0]
        rows.append({
            'Temperature_C': round(temp, 1),
            'Rainfall_mm': int(round(rainfall)),
            'Season': season,
            'Soil_Type': soil,
            'Recommended_Crop': label
        })
    df = pd.DataFrame(rows)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    df.to_csv(path, index=False)
    return path


def _load_or_make_dataset():
    if not os.path.exists(DATA_CSV):
        generate_synthetic_dataset(240, DATA_CSV)
    return pd.read_csv(DATA_CSV)


def train_and_save_model():
    if RandomForestClassifier is None or joblib is None:
        return False
    df = _load_or_make_dataset()
    # Simple ordinal encoding
    season_map = {s:i for i,s in enumerate(SEASONS)}
    soil_map = {s:i for i,s in enumerate(SOIL_TYPES)}
    X = pd.DataFrame({
        'Temperature_C': df['Temperature_C'].astype(float),
        'Rainfall_mm': df['Rainfall_mm'].astype(float),
        'Season': df['Season'].map(season_map).astype(int),
        'Soil_Type': df['Soil_Type'].map(soil_map).astype(int),
    })
    y = df['Recommended_Crop']
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=7, stratify=y)
    clf = RandomForestClassifier(n_estimators=200, random_state=7, class_weight='balanced')
    clf.fit(X_train, y_train)
    os.makedirs(MODELS_DIR, exist_ok=True)
    joblib.dump(clf, MODEL_PKL)
    info = {
        'feature_columns': list(X.columns),
        'classes': sorted(list(y.unique())),
        'encoders': {
            'Season_map': season_map,
            'Soil_Type_map': soil_map
        },
        'created_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'data_source': DATA_CSV
    }
    with open(MODEL_INFO, 'w') as f:
        json.dump(info, f)
    return True


def ensure_crop_model():
    if not os.path.exists(DATA_CSV):
        generate_synthetic_dataset(240, DATA_CSV)
    if not os.path.exists(MODEL_PKL):
        train_and_save_model()


def _load_model_and_info():
    model = None
    info = None
    if joblib and os.path.exists(MODEL_PKL):
        try:
            model = joblib.load(MODEL_PKL)
        except Exception:
            model = None
    if os.path.exists(MODEL_INFO):
        with open(MODEL_INFO, 'r') as f:
            info = json.load(f)
    return model, info


def _rule_based_recommendation(temperature: float, rainfall: float, season: str, soil_type: str):
    scores = {c: _score_crop(c, temperature, rainfall, season, soil_type) for c in CROPS}
    ranked = sorted(scores.items(), key=lambda kv: kv[1], reverse=True)
    return ranked


def _risk_assessment(crop: str, temperature: float, rainfall: float, season: str, soil: str) -> dict:
    s = _score_crop(crop, temperature, rainfall, season, soil)
    risk = 'Low' if s >= 0.75 else ('Moderate' if s >= 0.55 else 'High')
    msg = {
        'Low': 'Favorable climate match expected.',
        'Moderate': 'Some climate mismatch; monitor closely.',
        'High': 'Climate risk elevated; consider alternatives.'
    }[risk]
    return {'score': round(s, 2), 'risk': risk, 'message': msg}


def get_recommendation(temperature: float, rainfall: float, season: str, soil_type: str) -> dict:
    # Try ML first
    model, info = _load_model_and_info()
    if model is not None and info is not None:
        season_map = info['encoders']['Season_map']
        soil_map = info['encoders']['Soil_Type_map']
        x = pd.DataFrame([{
            'Temperature_C': float(temperature),
            'Rainfall_mm': float(rainfall),
            'Season': int(season_map.get(season, 0)),
            'Soil_Type': int(soil_map.get(soil_type, 1)),
        }])[info['feature_columns']]
        try:
            probs = None
            if hasattr(model, 'predict_proba'):
                probs = model.predict_proba(x)[0]
                classes = list(model.classes_)
                ranked = sorted(zip(classes, probs), key=lambda kv: kv[1], reverse=True)
            else:
                pred = model.predict(x)[0]
                ranked = [(pred, 1.0)]
            top = ranked[:3]
            best_crop = top[0][0]
            risk = _risk_assessment(best_crop, temperature, rainfall, season, soil_type)
            return {
                'input': {'temperature': temperature, 'rainfall': rainfall, 'season': season, 'soil_type': soil_type},
                'recommendations': [{'crop': c, 'confidence': round(float(p), 2)} for c, p in top],
                'best': {'crop': best_crop, **risk}
            }
        except Exception:
            pass
    # Fallback: rule-based
    ranked = _rule_based_recommendation(temperature, rainfall, season, soil_type)
    top = ranked[:3]
    best_crop = top[0][0]
    risk = _risk_assessment(best_crop, temperature, rainfall, season, soil_type)
    return {
        'input': {'temperature': temperature, 'rainfall': rainfall, 'season': season, 'soil_type': soil_type},
        'recommendations': [{'crop': c, 'confidence': round(float(s), 2)} for c, s in top],
        'best': {'crop': best_crop, **risk}
    }
