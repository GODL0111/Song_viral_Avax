import { ethers } from 'ethers';

const erc20Abi = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)'
];

export function erc20Contract(tokenAddress: string, signerOrProvider: ethers.Signer | ethers.providers.Provider) {
  return new ethers.Contract(tokenAddress, erc20Abi, signerOrProvider);
}

export async function getTokenMeta(tokenAddress: string, provider: ethers.providers.Provider) {
  const c = erc20Contract(tokenAddress, provider);
  const [decimals, symbol] = await Promise.all([c.decimals(), c.symbol()]);
  return { decimals, symbol };
}

export async function getBalance(tokenAddress: string, holder: string, provider: ethers.providers.Provider) {
  const c = erc20Contract(tokenAddress, provider);
  const [raw, decimals] = await Promise.all([c.balanceOf(holder), c.decimals()]);
  return { raw, formatted: ethers.utils.formatUnits(raw, decimals), decimals };
}

export async function transferToken(
  tokenAddress: string,
  to: string,
  humanAmount: string,
  signer: ethers.Signer
) {
  const c = erc20Contract(tokenAddress, signer);
  const decimals: number = await c.decimals();
  const amount = ethers.utils.parseUnits(humanAmount, decimals);
  const tx = await c.transfer(to, amount);
  return tx.wait();
}