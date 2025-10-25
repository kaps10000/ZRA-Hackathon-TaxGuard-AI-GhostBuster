## ZRA TaxGuard AI — Copilot / AI-Agent Instructions

This file gives short, actionable guidance for AI coding agents to be productive in this repository. Keep instructions concrete and reference local files and patterns.

### Big picture (what to know first)

- Multi-service micro‑stack run natively (no Docker required by default). See `start-all-services.sh` which orchestrates 10 services and creates virtualenvs for Python services.
- Main components live under top-level folders: `api-gateway/`, `dashboard_integration/`, `vrt_guard/`, `ai_risk_scoring/`, `predictive_analytics/`, `ghostbuster/`, `ocr-ai-service/`, `ocr-backend/`, `blockchain/`, `whistlepro_backend/`.
- The frontend dashboard is at `dashboard_integration/frontend` (port 3000). API gateway is port 4001. See ports and service responsibilities documented in `README.md`.

### Startup / dev workflow (explicit commands)

- Start everything locally (recommended): `./start-all-services.sh` — this installs Node deps and creates/activates Python virtualenvs, starts services and writes logs to `/tmp/taxguard-logs/`.
- Stop: `./stop-all-services.sh`.
- Per-service dev: cd into a service folder. Node services: `npm install` then `npm start` / `npm run dev`. Python services: create venv (`python3 -m venv venv`), `source venv/bin/activate`, `pip install -r requirements.txt`, then `python app.py` or `uvicorn main:app` depending on the service.

### Key files & endpoints to reference when editing / adding code

- `app.py` (root) — example Flask model-serving app: feature engineering, dataset bundle parsing, and endpoints: `/api/predict`, `/upload/intake`, `/upload/datasets`, `/upload/return`. Look at `models/feature_config.json`, `models/best_model.pkl` (artifacts) referenced here.
- `start-all-services.sh` — canonical startup script and the source of truth for which services run, how venvs are handled, and where logs go (`/tmp/taxguard-logs/`).
- `SETUP.md` — step-by-step installation/troubleshooting; consult for environment expectations.
- `docker-compose-basic.yml.backup` — full Docker-based stack (keeps env var names and service wiring). Use it to infer network/DB env vars if adding containerization.

### Patterns & conventions found in repo

- Python services: use a local `venv` created by the startup script and `requirements.txt`. The startup script installs dependencies quietly; follow that pattern in docs and tests.
- Node services: lightweight `package.json` per service. `npm install` is run by the startup script; when editing package.json, keep dependency additions minimal and consistent with existing versions.
- Logging: services write logs to `/tmp/taxguard-logs/<service>.log`. When adding services or scripts, follow this convention.
- Feature engineering: `app.py` expects `models/feature_config.json` with `features` and optional `id_cols`. New model training must update `feature_config.json`, `best_model.pkl` and `metrics.json` in `models/`.

### Integration / data formats

- Dataset bundle: a ZIP with 8 CSVs or XLSX with 8 sheets. `app.py` maps filenames to keys like `zra_vatclaims.csv` -> `claims` (see `_load_bundle_to_frames`). Keep the mapping if changing upload logic.
- Intake template and feature templates are in `data/` (e.g., `data/intake_template.csv`, `data/feature_template.csv`) — reference them when adding examples or UI templates.

### Tests & linting

- Unit test patterns: Node services use `npm test` if present; Python uses `pytest`. Per-service README files often explain testing for that service. Add tests adjacent to changed code in the same service folder.

### Quick examples to use in PRs or edits

- To run just the OCR AI service locally:
  - cd `ocr-ai-service`; python3 -m venv venv; source venv/bin/activate; pip install -r requirements.txt; uvicorn main:app --port 8000
- To call model API (root Flask app): POST JSON to `http://localhost:5000/api/predict` with either feature-ready keys or intake fields; `app.py` will auto-detect and featureize.

### Safety checks & low-risk edits

- Preserve `feature_config.json` ordering when editing feature pipelines — model input order matters.
- When changing ports or env var names, update `start-all-services.sh` and `docker-compose-basic.yml.backup` in the same PR.

### Where to look for more context

- Root README (`README.md`) — architecture diagram, service ports, and management commands.
- Per-service READMEs (e.g., `ocr-backend/README.md`, `ghostbuster/README.md`) — contain service-specific startup and API docs.

If anything below is missing or unclear, tell me which service or workflow you want clarified and I will expand this file with concrete examples or additional commands.
