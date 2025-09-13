export const CONFIG = {
  // Avalanche Fuji testnet by default; override via .env
  CHAIN_ID_HEX: import.meta.env.VITE_CHAIN_ID_HEX || '0xA869', // 43113 Fuji
  CHAIN_ID_DEC: parseInt((import.meta as any).env.VITE_CHAIN_ID_DEC || '43113', 10),
  CHAIN_NAME: import.meta.env.VITE_CHAIN_NAME || 'Avalanche Fuji C-Chain',
  RPC_URLS: (import.meta.env.VITE_RPC_URLS || 'https://api.avax-test.network/ext/bc/C/rpc').split(','),
  EXPLORERS: (import.meta.env.VITE_EXPLORERS || 'https://testnet.snowtrace.io').split(','),
  TOKEN_ADDRESS: import.meta.env.VITE_TOKEN_ADDRESS || '', // ERC-20 contract
  BACKEND_URL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000' // your Node server exposing /icm/prepare
};