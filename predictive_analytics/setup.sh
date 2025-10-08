#!/usr/bin/env bash
set -euo pipefail

# Improved runner: creates venv if missing, installs requirements, and starts uvicorn.
# Use: ./run.sh  (or bash ./run.sh)

VENV_DIR=".venv"
PYTHON=${PYTHON:-python3}
REQ_FILE="$(dirname "${BASH_SOURCE[0]}")/requirements.txt"

echo "[predictive_analytics/run] using python: ${PYTHON}"

if [ ! -x "$(command -v ${PYTHON})" ]; then
  echo "[error] python interpreter not found: ${PYTHON}. Set PYTHON env to a valid interpreter." >&2
  exit 2
fi

if [ ! -d "$VENV_DIR" ]; then
  echo "[predictive_analytics/run] creating virtualenv in $VENV_DIR"
  $PYTHON -m venv "$VENV_DIR"
else
  echo "[predictive_analytics/run] using existing virtualenv $VENV_DIR"
fi

# Activate the venv in a POSIX-compatible way: use '.' which works in sh/bash
if [ -f "$VENV_DIR/bin/activate" ]; then
  # shellcheck source=/dev/null
  . "$VENV_DIR/bin/activate"
else
  echo "[error] venv activate script not found at $VENV_DIR/bin/activate" >&2
  exit 3
fi

echo "[predictive_analytics/run] upgrading pip,setuptools,wheel"
python -m pip install --upgrade pip setuptools wheel

if [ ! -f "$REQ_FILE" ]; then
  echo "[error] requirements file not found at $REQ_FILE" >&2
  deactivate 2>/dev/null || true
  exit 4
fi

echo "[predictive_analytics/run] installing from $REQ_FILE"
python -m pip install -r "$REQ_FILE"

echo "[predictive_analytics/run] starting uvicorn on 0.0.0.0:8001 (use CTRL+C to stop)"
uvicorn predictive_analytics.main:app --host 0.0.0.0 --port 8001 --reload

