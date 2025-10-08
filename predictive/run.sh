#!/usr/bin/env bash
set -euo pipefail
VENV_DIR=".venv"
PYTHON=${PYTHON:-python3}
if [ ! -d "$VENV_DIR" ]; then
  $PYTHON -m venv "$VENV_DIR"
fi
source "$VENV_DIR/bin/activate"
python -m pip install --upgrade pip
pip install -r predictive/requirements.txt
exec uvicorn predictive.app.main:app --host 0.0.0.0 --port 8001 --reload
