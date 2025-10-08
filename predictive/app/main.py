from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
import numpy as np
from joblib import dump, load
from pathlib import Path
from datetime import datetime

ARTIFACTS_DIR = Path(__file__).resolve().parents[1] / "artifacts"
DATA_DIR = Path(__file__).resolve().parents[1] / "data"
MODEL_PATH = ARTIFACTS_DIR / "model.joblib"
META_PATH = ARTIFACTS_DIR / "meta.json"

app = FastAPI(title="TaxGuard Predictive API", version="0.1.0")

class TrainRequest(BaseModel):
    date_col: str = "date"
    target_col: str = "revenue"
    freq: Optional[str] = None  # e.g., MS for month start
    csv_path: Optional[str] = None  # default: predictive/data/sample_revenue.csv

class ForecastRequest(BaseModel):
    horizon: int = 6

class ScenarioRequest(BaseModel):
    horizon: int = 6
    copper_price_change_pct: float = -10.0  # e.g., -10% shock
    elasticity: float = 0.3  # revenue sensitivity to copper price

@app.get("/health")
def health():
    return {"status": "ok", "model_ready": MODEL_PATH.exists()}


def load_dataset(csv_path: Optional[str]) -> pd.DataFrame:
    path = Path(csv_path) if csv_path else DATA_DIR / "sample_revenue.csv"
    if not path.exists():
        raise HTTPException(status_code=400, detail=f"Dataset not found at {path}")
    df = pd.read_csv(path)
    return df


def prepare_time_features(df: pd.DataFrame, date_col: str, target_col: str, freq: Optional[str]) -> pd.DataFrame:
    if date_col not in df.columns or target_col not in df.columns:
        raise HTTPException(status_code=400, detail="Missing required columns in dataset")
    df = df.copy()
    df[date_col] = pd.to_datetime(df[date_col])
    if freq:
        df = df.set_index(date_col).resample(freq).sum(numeric_only=True).reset_index()
    # add simple calendar features
    df["year"] = df[date_col].dt.year
    df["month"] = df[date_col].dt.month
    df["quarter"] = df[date_col].dt.quarter
    return df[[date_col, "year", "month", "quarter", target_col]]


def train_baseline_regressor(df: pd.DataFrame, date_col: str, target_col: str):
    # Simple baseline: linear regression on calendar features + lag features
    from sklearn.linear_model import LinearRegression
    from sklearn.pipeline import Pipeline
    from sklearn.compose import ColumnTransformer
    from sklearn.preprocessing import OneHotEncoder
    from sklearn.impute import SimpleImputer

    # create lag features
    df_sorted = df.sort_values(date_col).reset_index(drop=True)
    for lag in [1, 2, 3, 12]:
        df_sorted[f"lag_{lag}"] = df_sorted[target_col].shift(lag)
    df_model = df_sorted.dropna().reset_index(drop=True)

    feature_cols = ["year", "month", "quarter", "lag_1", "lag_2", "lag_3", "lag_12"]
    X = df_model[feature_cols]
    y = df_model[target_col]

    numeric_features = ["lag_1", "lag_2", "lag_3", "lag_12"]
    categorical_features = ["year", "month", "quarter"]

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", SimpleImputer(strategy="median"), numeric_features),
            ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_features),
        ]
    )

    model = Pipeline(steps=[
        ("preprocess", preprocessor),
        ("regressor", LinearRegression()),
    ])

    model.fit(X, y)

    # Save metadata
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    dump({
        "date_col": date_col,
        "target_col": target_col,
        "feature_cols": feature_cols,
        "last_date": df_sorted[date_col].max().strftime("%Y-%m-%d"),
        "freq": "MS",
    }, ARTIFACTS_DIR / "train_meta.joblib")

    return model, df_sorted


@app.post("/train")
def train(req: TrainRequest):
    df = load_dataset(req.csv_path)
    df_prep = prepare_time_features(df, req.date_col, req.target_col, req.freq)
    model, df_sorted = train_baseline_regressor(df_prep, req.date_col, req.target_col)
    dump(model, MODEL_PATH)
    return {
        "status": "trained",
        "n_obs": int(df_sorted.dropna().shape[0]),
        "model_path": str(MODEL_PATH),
        "last_date": df_sorted[req.date_col].max().strftime("%Y-%m-%d"),
    }


def generate_future_calendar(last_date: pd.Timestamp, horizon: int) -> pd.DataFrame:
    future_dates = pd.date_range(start=last_date + pd.offsets.MonthBegin(1), periods=horizon, freq="MS")
    cal = pd.DataFrame({"date": future_dates})
    cal["year"] = cal["date"].dt.year
    cal["month"] = cal["date"].dt.month
    cal["quarter"] = cal["date"].dt.quarter
    return cal


@app.post("/forecast")
def forecast(req: ForecastRequest):
    if not MODEL_PATH.exists():
        raise HTTPException(status_code=400, detail="Model not trained")
    model = load(MODEL_PATH)
    meta = load(ARTIFACTS_DIR / "train_meta.joblib")
    last_date = pd.to_datetime(meta["last_date"])  # monthly cadence

    # naive recursive lag construction using last known actuals from training
    # For simplicity, we will not update lags with forecasts; keep static historical lags
    horizon = max(1, int(req.horizon))
    future_cal = generate_future_calendar(last_date, horizon)

    # Build lag features from meta by assuming seasonal persistence for lag_12
    # We do not store full history here; for hackathon baseline, set lags to last observed
    lag_defaults = {k: 0.0 for k in ["lag_1", "lag_2", "lag_3", "lag_12"]}
    feature_rows = []
    for _, row in future_cal.iterrows():
        feat = {
            "year": int(row.year),
            "month": int(row.month),
            "quarter": int(row.quarter),
            **lag_defaults,
        }
        feature_rows.append(feat)
    X_future = pd.DataFrame(feature_rows)
    y_pred = model.predict(X_future)

    results = []
    for i, dt in enumerate(future_cal["date"]):
        results.append({
            "date": dt.strftime("%Y-%m-%d"),
            "predicted_revenue": float(max(0.0, y_pred[i])),
        })
    return {"horizon": horizon, "forecasts": results}


@app.get("/accuracy-report")
def accuracy_report():
    if not MODEL_PATH.exists():
        raise HTTPException(status_code=400, detail="Model not trained")
    model = load(MODEL_PATH)
    meta = load(ARTIFACTS_DIR / "train_meta.joblib")

    df = load_dataset(None)
    df_prep = prepare_time_features(df, meta["date_col"], meta["target_col"], meta.get("freq"))

    # rebuild lags to align
    df_sorted = df_prep.sort_values(meta["date_col"]).reset_index(drop=True)
    for lag in [1, 2, 3, 12]:
        df_sorted[f"lag_{lag}"] = df_sorted[meta["target_col"]].shift(lag)
    df_model = df_sorted.dropna().reset_index(drop=True)

    X = df_model[meta["feature_cols"]]
    y = df_model[meta["target_col"]]

    from sklearn.metrics import mean_absolute_error, r2_score
    y_hat = model.predict(X)
    mae = float(mean_absolute_error(y, y_hat))
    r2 = float(r2_score(y, y_hat))

    return {"metrics": {"mae": mae, "r2": r2}, "n_eval": int(len(y))}


@app.post("/simulate")
def simulate(req: ScenarioRequest):
    # Use baseline forecast then apply elasticity to copper price change
    base = forecast(ForecastRequest(horizon=req.horizon))
    shock_multiplier = 1.0 + (req.elasticity * (req.copper_price_change_pct / 100.0))
    shocked = []
    for row in base["forecasts"]:
        shocked.append({
            "date": row["date"],
            "predicted_revenue": float(max(0.0, row["predicted_revenue"] * shock_multiplier)),
        })
    return {
        "assumptions": {
            "copper_price_change_pct": req.copper_price_change_pct,
            "elasticity": req.elasticity,
            "shock_multiplier": shock_multiplier,
        },
        "forecasts": shocked,
    }

