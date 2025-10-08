# Predictive Analytics (TaxGuard)

This folder contains a simple ML service (FastAPI) for training and forecasting tax/revenue using historical and economic features.

Key files

- `main.py` — FastAPI app exposing `/health`, `/train`, `/forecast`, `/simulate`, `/model-info`.
- `main.py` — FastAPI app exposing `/health`, `/train`, `/forecast`, `/simulate`, `/model-info`, `/charts` (list + file serve).
- `app/utils.py` — data loading / preprocessing helpers.
- `data/` — sample CSV files used for training (default dataset).
- `models/` — saved model and metadata after training.
- `run.sh` — helper script that creates a virtualenv (always at repo root `.venv`), installs requirements and starts the server.

Quick start

1. Make sure you have a supported Python (3.8+). The repo's scripts prefer `python3` on PATH.

2. Make the helper script executable (only required once):

```bash
chmod +x predictive_analytics/run.sh
```

3. Run the helper to create the venv, install dependencies and start the server:

```bash
predictive_analytics/run.sh
```

Notes:

- The virtualenv is created at the repository root: `.venv` (so it's consistent no matter where you run the script from).
- The service will start at `http://0.0.0.0:8001` (dev server via uvicorn, `--reload` enabled).
- Logs from the helper run are written to `predictive_analytics/run.log` when you run the script in the background.

Running manually (alternative)

If you prefer to create and manage the venv manually:

```bash
# from repo root
python3 -m venv .venv
source .venv/bin/activate
pip install -r predictive_analytics/requirements.txt
uvicorn predictive_analytics.main:app --reload --host 0.0.0.0 --port 8001
```

API endpoints / examples

1. Health

```bash
curl -sS http://127.0.0.1:8001/health | jq .
```

Response: {"status":"ok","model_ready": <true|false>}

2. Train (uses `predictive_analytics/data/historical_atx.csv` and `predictive_analytics/data/economic_factors_atx.csv` by default)

```bash
curl -sS -X POST http://127.0.0.1:8001/train \
  -H 'Content-Type: application/json' \
  -d '{}' | jq .
```

Response: JSON with `status`, `metrics` and `model_path`. The model is saved to `predictive_analytics/models/revenue_forecast_model.pkl` and metadata is saved to `predictive_analytics/models/model_meta.joblib`.
Note: metadata is now also written as JSON at `predictive_analytics/models/model_meta.json` for easy inspection.

3. Forecast

The `/forecast` endpoint expects a JSON body with `rows` as an array of feature objects. Feature names are saved in the `model_meta.joblib` as `features` after training.

Example:

```bash
curl -sS -X POST http://127.0.0.1:8001/forecast \
  -H 'Content-Type: application/json' \
  -d '{"rows":[{"Open":3000,"High":3050,"Low":2950,"Volume":1500000,"GDP_Growth":1.5,"Inflation_Rate":2.0,"Unemployment_Rate":4.5,"EUR_USD":1.12}]}' | jq .
```

4. Simulate

Run a copper-price shock simulation:

```bash
curl -sS -X POST http://127.0.0.1:8001/simulate \
  -H 'Content-Type: application/json' \
  -d '{"copper_price_change_pct": -10.0, "horizon": 6, "include_chart": true }' | jq .
```

The `/simulate` response contains `baseline`, `shocked`, `delta`, and a `chart` object when `include_chart` is true. The `chart` object contains `filename`, `path` and a `base64` string of the PNG. For dashboards you can instead call the `/charts` endpoint below and use the `/charts/{filename}` URL to fetch the PNG directly.

6.a Charts listing

List previously generated simulation charts (returns JSON metadata and URL):

```bash
curl -sS 'http://127.0.0.1:8001/charts?limit=20' | jq .
```

Response example:

```json
{
  "charts": [
    {
      "filename": "simulate_20251008T220206Z.png",
      "path": ".../models/charts/simulate_20251008T220206Z.png",
      "created_at": "2025-10-08T22:02:06Z",
      "size_bytes": 12345,
      "url": "/charts/simulate_20251008T220206Z.png"
    }
  ]
}
```

5. Model info

```bash
curl -sS http://127.0.0.1:8001/model-info | jq .
```

Troubleshooting

- If `predictive_analytics/run.sh` fails with "python interpreter not found", point the `PYTHON` env var to a valid interpreter: `PYTHON=/usr/bin/python3.11 predictive_analytics/run.sh`.
- If you see import errors like `No module named 'app'` when running the module directly, prefer starting via uvicorn as shown above or run from the package with `python -m uvicorn predictive_analytics.main:app`.
- If `pip install` fails building packages (rare), ensure system build tools (gcc, make) are installed and pip/setuptools/wheel are up to date. The helper script upgrades pip/setuptools/wheel automatically.

Next steps (suggestions)

- Add a `predictive_analytics/tests/` integration test that runs a train + forecast roundtrip (I can add this quickly).
- Persist model metadata to JSON in addition to joblib for easier inspection.
- Persist model metadata to JSON in addition to joblib for easier inspection (`models/model_meta.json`).
- Extend `/simulate` to accept custom scenario rows.

If you want, I can add the integration test or change the venv location to `.venv-predictive_analytics` instead of `.venv` in repo root—tell me which.
