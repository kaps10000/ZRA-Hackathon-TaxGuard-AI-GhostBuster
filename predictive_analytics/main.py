import seaborn as sns
import matplotlib.pyplot as plt
import logging
import os
from typing import List, Dict, Optional

import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

import joblib
import sys
from pathlib import Path
import io
import base64
import json
from datetime import datetime, timedelta
from typing import Union

import matplotlib
matplotlib.use('Agg')

# make imports resilient: when running from repo root or another cwd, ensure
# this package's directory is on sys.path so `import app` works
BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

try:
    from app.utils import load_data, preprocess, save_model
except ModuleNotFoundError:
    # fallback: try parent directory (in case predictive_analytics is a subdir)
    parent = str(BASE_DIR.parent)
    if parent not in sys.path:
        sys.path.insert(0, parent)
    from app.utils import load_data, preprocess, save_model

logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s - %(levelname)s - %(message)s")

DATA_DIR = str(BASE_DIR / "data")
MODEL_DIR = str(BASE_DIR / "models")
MODEL_PATH = os.path.join(MODEL_DIR, "revenue_forecast_model.pkl")

app = FastAPI(title="TaxGuard Predictive Analytics", version="0.1.0")


class TrainRequest(BaseModel):
    historical_file: Optional[str] = None
    economic_file: Optional[str] = None


class ForecastRequest(BaseModel):
    rows: List[Dict]


class SimulateRequest(BaseModel):
    # copper_price_change_pct can be a single float (applies to all forecast periods)
    # or a list of floats (one per period)
    copper_price_change_pct: Union[float, List[float]] = -10.0
    horizon: Optional[int] = 6
    elasticity: float = 0.3
    include_chart: bool = True
    # optional: name of a model feature that represents copper/commodity price
    copper_feature: Optional[str] = None


@app.get("/")
def root():
    return {"message": "Welcome to the TaxGuard Predictive Analytics API. Use /docs for API documentation."}


@app.get("/health")
def health():
    return {"status": "ok", "model_ready": os.path.exists(MODEL_PATH)}


def train_model(X, y):
    logging.info("Training predictive model...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42)

    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    mae = mean_absolute_error(y_test, preds)
    r2 = r2_score(y_test, preds)

    logging.info(f"✅ Model trained. MAE: {mae:.2f}, R²: {r2:.3f}")
    return model, {"mae": float(mae), "r2": float(r2)}


def simulate_scenario(model, copper_drop: float = -10.0):
    logging.info("Simulating copper price shock scenario...")

    scenario = pd.DataFrame({
        "Open": [3000],
        "High": [3050],
        "Low": [2950],
        "Volume": [1_500_000],
        "GDP_Growth": [1.5],
        "Inflation_Rate": [2.0],
        "Unemployment_Rate": [4.5],
        "EUR_USD": [1.12]
    })
    scenario[["Open", "High", "Low"]] *= (1 + copper_drop / 100)

    # Catch mismatched feature columns gracefully
    try:
        forecast = model.predict(scenario)[0]
    except Exception as e:
        raise RuntimeError(f"Model prediction failed for scenario: {e}")

    logging.info(
        f"📉 Predicted tax revenue after {copper_drop}% copper price drop: {forecast:.2f}")
    return float(forecast)


@app.post("/train")
def train(req: TrainRequest):
    historical = req.historical_file or os.path.join(
        DATA_DIR, "historical_atx.csv")
    economic = req.economic_file or os.path.join(
        DATA_DIR, "economic_factors_atx.csv")

    if not os.path.exists(historical) or not os.path.exists(economic):
        raise HTTPException(
            status_code=400, detail="Data files not found. Provide valid paths or place files in data/")

    df = load_data(historical, economic)
    X, y = preprocess(df)
    model, metrics = train_model(X, y)

    # ensure model dir exists
    os.makedirs(MODEL_DIR, exist_ok=True)

    save_model(model, MODEL_PATH)

    # save metadata (joblib + JSON) for easier introspection and validation
    meta = {"metrics": metrics, "features": list(
        X.columns), "trained_at": datetime.utcnow().isoformat()}
    meta_joblib_path = os.path.join(MODEL_DIR, "model_meta.joblib")
    meta_json_path = os.path.join(MODEL_DIR, "model_meta.json")
    joblib.dump(meta, meta_joblib_path)
    try:
        with open(meta_json_path, "w") as fh:
            json.dump(meta, fh, indent=2)
    except Exception:
        logging.exception("Failed to write JSON model metadata")

    return {"status": "trained", "metrics": metrics, "model_path": MODEL_PATH}


@app.post("/forecast")
def forecast(req: ForecastRequest):
    if not os.path.exists(MODEL_PATH):
        raise HTTPException(status_code=400, detail="Model not trained")
    model = joblib.load(MODEL_PATH)

    # load meta to validate incoming columns
    meta = None
    meta_path = os.path.join(MODEL_DIR, "model_meta.joblib")
    if os.path.exists(meta_path):
        try:
            meta = joblib.load(meta_path)
        except Exception:
            meta = None

    try:
        df_rows = pd.DataFrame(req.rows)
    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Invalid rows payload: {e}")

    # if we have model feature names, require them
    if meta and isinstance(meta.get("features"), list):
        features = meta.get("features")
        missing = [f for f in features if f not in df_rows.columns]
        extra = [c for c in df_rows.columns if c not in features]
        if missing:
            raise HTTPException(
                status_code=400, detail=f"Missing columns for prediction: {missing}")
        # reorder columns to the model's expected order
        df_rows = df_rows[features]

    try:
        preds = model.predict(df_rows)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Model prediction failed: {e}")

    return {"predictions": [float(p) for p in preds]}


@app.post("/simulate")
def simulate(req: SimulateRequest):
    if not os.path.exists(MODEL_PATH):
        raise HTTPException(status_code=400, detail="Model not trained")
    model = joblib.load(MODEL_PATH)

    # validate horizon
    horizon = int(req.horizon or 6)
    if horizon <= 0 or horizon > 60:
        raise HTTPException(
            status_code=400, detail="horizon must be between 1 and 60")

    # normalize shock sequence
    shock_input = req.copper_price_change_pct
    if isinstance(shock_input, list):
        if len(shock_input) != horizon:
            raise HTTPException(
                status_code=400, detail="length of copper_price_change_pct list must equal horizon")
        shock_seq = [float(x) for x in shock_input]
    else:
        shock_seq = [float(shock_input)] * horizon

    # build baseline scenario rows (repeat a default scenario)
    # default scenario (same as previous hard-coded) — can be extended later
    base_row = {
        "Open": 3000.0,
        "High": 3050.0,
        "Low": 2950.0,
        "Volume": 1_500_000.0,
        "GDP_Growth": 1.5,
        "Inflation_Rate": 2.0,
        "Unemployment_Rate": 4.5,
        "EUR_USD": 1.12,
    }

    # if model meta has feature names, ensure we only keep those keys
    meta_path = os.path.join(MODEL_DIR, "model_meta.joblib")
    features = None
    if os.path.exists(meta_path):
        try:
            m = joblib.load(meta_path)
            features = m.get("features")
        except Exception:
            features = None

    # simple validation: if we have feature names, ensure copper_feature (if provided) exists
    if req.copper_feature and features and req.copper_feature not in features:
        raise HTTPException(
            status_code=400, detail=f"copper_feature '{req.copper_feature}' not found in model features")

    # create dataframe of horizon rows using only model features
    rows = []
    for _ in range(horizon):
        if features:
            row = {f: base_row.get(f, 0.0) for f in features}
        else:
            row = base_row.copy()
        rows.append(row)

    df_rows = pd.DataFrame(rows)

    # baseline predictions
    try:
        baseline_preds = model.predict(df_rows)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Model prediction failed for baseline: {e}")

    # compute shocked predictions
    # if copper_feature provided and available, adjust that column per shock and predict; otherwise use elasticity multiplier
    shocked_preds = []
    if req.copper_feature and features and req.copper_feature in features:
        # adjust copper feature per period and predict
        for i, shock in enumerate(shock_seq):
            df_mod = df_rows.copy()
            df_mod[req.copper_feature] = df_mod[req.copper_feature] * \
                (1.0 + shock / 100.0)
            try:
                p = model.predict(df_mod)[i]
            except Exception as e:
                raise HTTPException(
                    status_code=500, detail=f"Model prediction failed for shocked scenario: {e}")
            shocked_preds.append(float(max(0.0, p)))
    else:
        # elasticity multiplier approach
        for i, shock in enumerate(shock_seq):
            mult = 1.0 + (req.elasticity * (shock / 100.0))
            shocked_preds.append(float(max(0.0, baseline_preds[i] * mult)))

    # prepare dates for output (monthly starting from today)
    start = datetime.utcnow().date()
    dates = [(start.replace(day=1) if i == 0 else (start.replace(day=1)))
             for i in range(horizon)]
    # better: create a simple month sequence
    dates = []
    cur = datetime.utcnow().date().replace(day=1)
    for i in range(horizon):
        month = cur.month + i
        year = cur.year + (month - 1) // 12
        month = ((month - 1) % 12) + 1
        dates.append(f"{year:04d}-{month:02d}-01")

    baseline_list = [{"date": dates[i], "predicted_revenue": float(
        max(0.0, float(baseline_preds[i])))} for i in range(horizon)]
    shocked_list = [{"date": dates[i], "predicted_revenue": float(
        shocked_preds[i])} for i in range(horizon)]
    delta_list = [{"date": dates[i], "delta": float(
        shocked_list[i]["predicted_revenue"] - baseline_list[i]["predicted_revenue"])} for i in range(horizon)]

    chart_info = None
    if req.include_chart:
        # create charts dir
        charts_dir = os.path.join(MODEL_DIR, "charts")
        os.makedirs(charts_dir, exist_ok=True)
        # cleanup old charts (keep disk usage bounded)

        def cleanup_charts(dir_path: str, max_age_days: int = 7, max_files: int = 50):
            try:
                now = datetime.utcnow()
                files = [os.path.join(dir_path, f) for f in os.listdir(
                    dir_path) if f.lower().endswith('.png')]
                # remove files older than max_age_days
                for fp in files:
                    try:
                        mtime = datetime.utcfromtimestamp(os.path.getmtime(fp))
                        if (now - mtime) > timedelta(days=max_age_days):
                            os.remove(fp)
                    except Exception:
                        continue
                # if still too many files, remove oldest
                files = [fp for fp in files if os.path.exists(fp)]
                if len(files) > max_files:
                    files_sorted = sorted(
                        files, key=lambda p: os.path.getmtime(p))
                    for fp in files_sorted[:len(files_sorted) - max_files]:
                        try:
                            os.remove(fp)
                        except Exception:
                            continue
            except Exception:
                logging.exception("chart cleanup failed")

        cleanup_charts(charts_dir)
        ts = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
        fname = f"simulate_{ts}.png"
        fpath = os.path.join(charts_dir, fname)

        # plot
        sns.set(style="whitegrid")
        plt.figure(figsize=(9, 5))
        plt.plot(dates, [x["predicted_revenue"]
                 for x in baseline_list], label="baseline", marker='o')
        plt.plot(dates, [x["predicted_revenue"]
                 for x in shocked_list], label="shocked", marker='o')
        plt.fill_between(dates, [x["predicted_revenue"] for x in baseline_list], [
                         x["predicted_revenue"] for x in shocked_list], color='gray', alpha=0.2)
        plt.xticks(rotation=45)
        plt.xlabel("Date")
        plt.ylabel("Predicted Revenue")
        plt.title(
            f"Baseline vs Shocked Forecast (elasticity={req.elasticity})")
        plt.legend()
        plt.tight_layout()
        plt.savefig(fpath, dpi=150)
        plt.close()

        # also return base64
        with open(fpath, "rb") as fh:
            b64 = base64.b64encode(fh.read()).decode('ascii')
        chart_info = {"path": fpath, "filename": fname, "base64": b64}

    summary = {"total_baseline": sum([x["predicted_revenue"] for x in baseline_list]), "total_shocked": sum([
        x["predicted_revenue"] for x in shocked_list])}
    summary["total_delta"] = summary["total_shocked"] - \
        summary["total_baseline"]

    return {
        "horizon": horizon,
        "assumptions": {"copper_price_change_pct": shock_seq, "elasticity": req.elasticity},
        "baseline": baseline_list,
        "shocked": shocked_list,
        "delta": delta_list,
        "summary": summary,
        "chart": chart_info,
    }


@app.get("/charts/{name}")
def get_chart(name: str):
    charts_dir = os.path.join(MODEL_DIR, "charts")
    fpath = os.path.join(charts_dir, name)
    if not os.path.exists(fpath):
        raise HTTPException(status_code=404, detail="chart not found")
    # return raw bytes with content-type -> FastAPI will return as file
    from fastapi.responses import FileResponse
    return FileResponse(fpath, media_type='image/png')


@app.get("/charts")
def list_charts(limit: int = 50):
    """List available PNG charts (most recent first).

    Query params:
    - limit: maximum number of files to return (default 50)
    """
    charts_dir = os.path.join(MODEL_DIR, "charts")
    if not os.path.exists(charts_dir):
        return {"charts": []}

    try:
        files = [f for f in os.listdir(
            charts_dir) if f.lower().endswith('.png')]
        # sort newest first
        files_sorted = sorted(files, key=lambda f: os.path.getmtime(
            os.path.join(charts_dir, f)), reverse=True)[:limit]
        charts = []
        for fname in files_sorted:
            fpath = os.path.join(charts_dir, fname)
            try:
                created = datetime.utcfromtimestamp(
                    os.path.getmtime(fpath)).isoformat() + 'Z'
                size = os.path.getsize(fpath)
                charts.append({
                    "filename": fname,
                    "path": fpath,
                    "created_at": created,
                    "size_bytes": size,
                    "url": f"/charts/{fname}"
                })
            except Exception:
                continue
        return {"charts": charts}
    except Exception:
        raise HTTPException(status_code=500, detail="failed to list charts")


@app.get("/model-info")
def model_info():
    if not os.path.exists(MODEL_PATH):
        return {"model_ready": False}
    meta_path = os.path.join(MODEL_DIR, "model_meta.joblib")
    meta = None
    if os.path.exists(meta_path):
        meta = joblib.load(meta_path)
    return {"model_ready": True, "model_path": MODEL_PATH, "meta": meta}


def main():
    # keep CLI behavior for local runs
    df = load_data(
        os.path.join(DATA_DIR, "historical_atx.csv"),
        os.path.join(DATA_DIR, "economic_factors_atx.csv")
    )
    X, y = preprocess(df)
    model, metrics = train_model(X, y)
    save_model(model, MODEL_PATH)
    simulate_scenario(model, copper_drop=-15)


if __name__ == "__main__":
    main()
