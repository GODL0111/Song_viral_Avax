import { Mechanism } from '../types/mechanism';
import { getAvalancheClient } from '../avalanche/client';
import { logger } from '../utils/logger';
import { ethers } from 'ethers';
import { signAndSendTx, getServerWallet } from '../wallet/serverSigner';

const EERC_CONTRACT = process.env.EERC_CONTRACT || '';

/**
 * EERC — Extended ERC-like mechanism
 * - prepares unsigned ERC20 transfer TransactionRequest objects
 * - can optionally send via server signer when PRIVATE_KEY is configured
 * - safe by default: prepare-only, no automatic signing unless explicitly requested
 */
export class EERC implements Mechanism {
  name = 'EERC';
  private provider: ethers.providers.Provider | null = null;
  private contractAddress: string | null = null;
  private abi = ['function transfer(address to, uint256 amount) public returns (bool)', 'function balanceOf(address) view returns (uint256)'];

  async init(): Promise<void> {
    const client = getAvalancheClient();
    this.provider = client.ethersProvider;
    this.contractAddress = EERC_CONTRACT || null;
    logger.info('[EERC] initialized', { contract: this.contractAddress });
  }

  async execute(input: { action?: string; contract?: string; params?: any } = {}): Promise<any> {
    const action = input.action || 'info';
    const contractAddress = input.contract || this.contractAddress;

    if (action === 'info') {
      return { message: 'EERC ready', contract: contractAddress };
    }

    if (!contractAddress) throw new Error('EERC contract address not configured');

    if (action === 'prepareTransfer') {
      const to: string = input.params?.to;
      const amount: ethers.BigNumberish = input.params?.amount;
      if (!to || !amount) throw new Error('prepareTransfer requires params.to and params.amount');

      const iface = new ethers.utils.Interface(['function transfer(address to, uint256 amount)']);
      const data = iface.encodeFunctionData('transfer', [to, amount]);

      const tx: ethers.providers.TransactionRequest = {
        to: contractAddress,
        data,
        // Value left unset for ERC20
      };

      logger.info('[EERC] prepared transfer', { to, amount: amount.toString ? amount.toString() : amount, contract: contractAddress });
      return { prepared: tx };
    }

    if (action === 'balanceOf') {
      const address = input.params?.address;
      if (!address) throw new Error('balanceOf requires params.address');
      const contract = new ethers.Contract(contractAddress, this.abi, this.provider as ethers.providers.Provider);
      const balance = await contract.balanceOf(address);
      return { address, balance: balance.toString() };
    }

    if (action === 'sendPrepared' ) {
      // send a prepared tx using server private key
      const tx = input.params?.tx;
      if (!tx) throw new Error('sendPrepared requires params.tx');
      const response = await signAndSendTx(tx);
      return { txHash: response.hash };
    }

    return { message: `Unknown action: ${action}` };
  }
}