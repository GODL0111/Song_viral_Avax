import { ethers } from 'ethers';
import { CONFIG } from '../config';

declare global {
  interface Window {
    ethereum?: any;
  }
}

const CHAIN_PARAMS = {
  chainId: CONFIG.CHAIN_ID_HEX,
  chainName: CONFIG.CHAIN_NAME,
  nativeCurrency: { name: 'AVAX', symbol: 'AVAX', decimals: 18 },
  rpcUrls: CONFIG.RPC_URLS,
  blockExplorerUrls: CONFIG.EXPLORERS
};

export async function ensureChain() {
  if (!window.ethereum) throw new Error('MetaMask not detected');
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: CONFIG.CHAIN_ID_HEX }]
    });
  } catch (err: any) {
    if (err?.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [CHAIN_PARAMS]
      });
    } else {
      throw err;
    }
  }
}

export async function connectWallet() {
  if (!window.ethereum) throw new Error('MetaMask not detected');
  await ensureChain();
  const accounts: string[] = await window.ethereum.request({ method: 'eth_requestAccounts' });
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const network = await provider.getNetwork();
  return { accounts, provider, signer, network };
}