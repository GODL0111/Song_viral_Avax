#!/usr/bin/env bash
set -euo pipefail

echo "Installing Python deps..."
python3 -m pip install -r requirements_blockchain.txt || true

if ! command -v forge >/dev/null 2>&1; then
  echo "Installing Foundry..."
  curl -L https://foundry.paradigm.xyz | bash
  source ~/.zshenv || true
  foundryup
fi

echo "Installing forge packages..."
forge install || true

echo "Building contracts..."
forge build

echo "Running predictor..."
python3 predict_V0.2.py

echo "Done."
