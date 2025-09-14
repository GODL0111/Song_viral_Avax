# Makefile for common tasks
.PHONY: install foundry install-deps build test run predict

install:
	# Install Python deps
	python3 -m pip install -r requirements_blockchain.txt || true

foundry:
	# Install Foundryup if missing
	bash -c "([ -x \"$(which forge)\" ] || curl -L https://foundry.paradigm.xyz | bash)"
	~/.foundry/bin/foundryup || true

install-deps: install foundry
	forge install || true

build:
	forge build

test:
	forge test

run-predict:
	python3 predict_V0.2.py

run-avalanche-demo:
	python3 avalanche_song_predictor.py

run-all: build run-predict
