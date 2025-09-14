# Integration Guide

This repository contains a machine-learning predictor and a smart contract for storing predictions.

Quick steps to integrate and run locally:

1. Create a Python virtualenv and install Python dependencies:

```bash
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r requirements_blockchain.txt
```

2. Install Foundry (if you want to build/deploy contracts):

```bash
bash -c "([ -x \"$(which forge)\" ] || curl -L https://foundry.paradigm.xyz | bash)"
source ~/.zshenv
foundryup
forge install
forge build
```

3. Run the ML predictor:

```bash
python3 predict_V0.2.py
```

4. Run Avalanche demo script (requires `.env` with private key and RPC URL):

```bash
cp .env.example .env
# edit .env
python3 avalanche_song_predictor.py
```

5. Deploy contract with Foundry script (Anvil recommended):

```bash
anvil &
forge script script/deploy_music_prediction_oracle.s.sol:DeployMusicPredictionOracle --broadcast --rpc-url http://127.0.0.1:8545 -vvvv
```

Support
- If you need a JS deploy example, ask and I'll add a Hardhat/Ethers.js script.
