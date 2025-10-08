#!/usr/bin/env bash
set -euo pipefail

VENV_DIR=".venv"
REQUIREMENTS_FILE="predictive_analytics/requirements.txt"
PYTHON=${PYTHON:-python3}

echo "🔧 Setting up virtual environment in $VENV_DIR"

# 1️⃣ Create venv if it doesn't exist
if [ ! -d "$VENV_DIR" ]; then
  echo "📦 Creating new virtual environment..."
  $PYTHON -m venv "$VENV_DIR"
else
  echo "✅ Virtual environment already exists."
fi

# 2️⃣ Activate it (works for Linux/macOS)
source "$VENV_DIR/bin/activate"

# 3️⃣ Upgrade pip
echo "⬆️  Upgrading pip..."
python -m pip install --upgrade pip

# 4️⃣ Install dependencies
if [ -f "$REQUIREMENTS_FILE" ]; then
  echo "📥 Installing dependencies from $REQUIREMENTS_FILE..."
  pip install -r "$REQUIREMENTS_FILE"
else
  echo "⚠️  Requirements file not found at $REQUIREMENTS_FILE"
  exit 1
fi

echo "✅ Environment setup complete!"
