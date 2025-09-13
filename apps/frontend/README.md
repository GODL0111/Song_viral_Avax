# Song Viral AVAX - Frontend

A React + TypeScript frontend for integrating MetaMask with Avalanche C-Chain token flows.

## Features

- 🦊 MetaMask wallet connection
- ⛰️ Avalanche chain switching (Fuji testnet by default, configurable for Mainnet)
- 🪙 ERC-20 token metadata reading and balance display
- 🎁 Backend integration for prepared reward transactions
- 💸 Manual ERC-20 token transfers

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run development server:**
   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

## Configuration

Create a `.env` file in this directory to override defaults:

```env
# Avalanche Mainnet configuration (optional)
VITE_CHAIN_ID_HEX=0xA86A
VITE_CHAIN_ID_DEC=43114
VITE_CHAIN_NAME=Avalanche Mainnet C-Chain
VITE_RPC_URLS=https://api.avax.network/ext/bc/C/rpc
VITE_EXPLORERS=https://snowtrace.io

# Token and backend configuration
VITE_TOKEN_ADDRESS=0x1234567890123456789012345678901234567890
VITE_BACKEND_URL=http://localhost:3000
```

## Usage

1. **Connect MetaMask:** Click "Connect MetaMask" to connect your wallet
2. **Chain Setup:** The app will automatically switch to or add the Avalanche chain
3. **View Token Info:** If a token address is configured, see your balance
4. **Prepare Rewards:** Request prepared transactions from the backend
5. **Manual Transfers:** Send tokens directly to other addresses

## Requirements

- MetaMask browser extension
- AVAX for gas fees
- Node.js 16+ for development