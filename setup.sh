#!/bin/bash
set -eu

# --- Python Backend Setup ---
echo "--- Setting up Python backend ---"

# 1. Create and activate virtual environment
if [ ! -d "backend/.venv" ]; then
    python3 -m venv backend/.venv
    echo "Virtual environment created at backend/.venv"
fi
source backend/.venv/bin/activate
echo "Virtual environment activated"

# 2. Install dependencies
pip install -r backend/requirements.txt
echo "Backend dependencies installed"


# --- Node Frontend Setup ---
echo ""
echo "--- Setting up Node frontend ---"
(cd frontend && npm install)
echo "Frontend dependencies installed"

echo ""
echo "✅ Setup complete!"
echo "To activate the virtual environment, run: source backend/.venv/bin/activate"
