import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ethers } from 'ethers';
import { CONFIG } from './config';
import { connectWallet } from './lib/metamask';
import { getBalance, getTokenMeta, transferToken } from './lib/erc20';

type PreparedTx = {
  to: string;
  data: string;
  value?: string;
  gas?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
};

export default function App() {
  const [account, setAccount] = useState<string>('');
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [network, setNetwork] = useState<ethers.providers.Network | null>(null);
  const [status, setStatus] = useState<string>('Disconnected');
  const [balance, setBalance] = useState<string>('0');
  const [tokenSymbol, setTokenSymbol] = useState<string>('');
  const [tokenDecimals, setTokenDecimals] = useState<number>(18);
  const [preparedTx, setPreparedTx] = useState<PreparedTx | null>(null);

  const tokenAddress = useMemo(() => CONFIG.TOKEN_ADDRESS, []);

  const handleConnect = useCallback(async () => {
    try {
      setStatus('Connecting...');
      const { accounts, provider, signer, network } = await connectWallet();
      setAccount(accounts[0]);
      setProvider(provider);
      setSigner(signer);
      setNetwork(network);
      setStatus(`Connected to ${network.name} (${network.chainId})`);
      setStatus('Connected');
    } catch (e: any) {
      setStatus(`Connection error: ${e.message || e}`);
    }
  }, []);

  const refreshTokenInfo = useCallback(async () => {
    if (!provider || !account || !tokenAddress) return;
    try {
      setStatus('Fetching token info...');
      const meta = await getTokenMeta(tokenAddress, provider);
      setTokenSymbol(meta.symbol);
      setTokenDecimals(meta.decimals);
      const bal = await getBalance(tokenAddress, account, provider);
      setBalance(bal.formatted);
      setStatus('Ready');
    } catch (e: any) {
      setStatus(`Token info error: ${e.message || e}`);
    }
  }, [provider, account, tokenAddress]);

  useEffect(() => {
    if (provider && account) {
      refreshTokenInfo();
    }
  }, [provider, account, refreshTokenInfo]);

  async function handlePrepareReward() {
    if (!account) return setStatus('Connect wallet first.');
    try {
      setStatus('Requesting preparedTx from backend...');
      const resp = await fetch(`${CONFIG.BACKEND_URL}/icm/prepare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: account,
          song: { features: { tempo: 120, energy: 0.8 }, title: 'Demo Song' }
        })
      });
      if (!resp.ok) throw new Error(`Backend responded ${resp.status}`);
      const data = await resp.json();
      const tx: PreparedTx = data.preparedTx || data.prepared || data.tx;
      if (!tx?.to || !tx?.data) throw new Error('Malformed preparedTx from backend');
      setPreparedTx(tx);
      setStatus('Prepared tx received. Ready to send.');
    } catch (e: any) {
      setStatus(`Prepare error: ${e.message || e}`);
    }
  }

  async function handleSendPrepared() {
    if (!signer) return setStatus('Connect wallet first.');
    if (!preparedTx) return setStatus('No prepared tx. Click Prepare first.');
    try {
      setStatus('Sending tx via MetaMask...');
      const populated = { ...preparedTx };
      const txResponse = await (signer as any).sendTransaction(populated);
      setStatus(`Broadcasted: ${txResponse.hash}. Waiting...`);
      const receipt = await txResponse.wait();
      setStatus(`Confirmed in block ${receipt.blockNumber}. Hash: ${receipt.transactionHash}`);
      refreshTokenInfo();
    } catch (e: any) {
      setStatus(`Send error: ${e.message || e}`);
    }
  }

  async function handleManualTransfer(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    if (!signer) return setStatus('Connect wallet first.');
    if (!tokenAddress) return setStatus('No token address configured.');
    
    const form = ev.currentTarget;
    const formData = new FormData(form);
    const to = formData.get('to') as string;
    const amount = formData.get('amount') as string;
    
    if (!to || !amount) return setStatus('Please fill recipient and amount.');
    
    try {
      setStatus('Sending transfer...');
      const receipt = await transferToken(tokenAddress, to, amount, signer);
      setStatus(`Transfer confirmed in block ${receipt.blockNumber}. Hash: ${receipt.transactionHash}`);
      refreshTokenInfo();
      form.reset();
    } catch (e: any) {
      setStatus(`Transfer error: ${e.message || e}`);
    }
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🎵 Song Viral AVAX - Frontend</h1>
      
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h2>📡 Connection Status</h2>
        <p><strong>Status:</strong> {status}</p>
        {account && (
          <>
            <p><strong>Account:</strong> {account}</p>
            {network && <p><strong>Network:</strong> {network.name} (ID: {network.chainId})</p>}
            {tokenSymbol && (
              <p><strong>Token Balance:</strong> {balance} {tokenSymbol}</p>
            )}
          </>
        )}
        <button 
          onClick={handleConnect}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#0066cc', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px', 
            cursor: 'pointer' 
          }}
        >
          {account ? 'Reconnect' : 'Connect MetaMask'}
        </button>
      </div>

      {account && (
        <>
          <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h2>🎁 Reward Transactions</h2>
            <p>Request a prepared reward transaction from the backend and sign it via MetaMask.</p>
            
            <div style={{ marginBottom: '10px' }}>
              <button 
                onClick={handlePrepareReward}
                style={{ 
                  padding: '10px 20px', 
                  backgroundColor: '#28a745', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '5px', 
                  cursor: 'pointer',
                  marginRight: '10px'
                }}
              >
                Prepare Reward Tx
              </button>
              
              <button 
                onClick={handleSendPrepared}
                disabled={!preparedTx}
                style={{ 
                  padding: '10px 20px', 
                  backgroundColor: preparedTx ? '#17a2b8' : '#6c757d', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '5px', 
                  cursor: preparedTx ? 'pointer' : 'not-allowed'
                }}
              >
                Send Prepared Tx
              </button>
            </div>
            
            {preparedTx && (
              <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
                <p><strong>Prepared Transaction:</strong></p>
                <p><strong>To:</strong> {preparedTx.to}</p>
                <p><strong>Data:</strong> {preparedTx.data.substring(0, 50)}...</p>
                {preparedTx.value && <p><strong>Value:</strong> {preparedTx.value}</p>}
              </div>
            )}
          </div>

          {tokenAddress && (
            <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
              <h2>💸 Manual Token Transfer</h2>
              <p>Send {tokenSymbol || 'tokens'} to another address.</p>
              
              <form onSubmit={handleManualTransfer}>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>
                    <strong>Recipient Address:</strong>
                  </label>
                  <input
                    name="to"
                    type="text"
                    placeholder="0x..."
                    required
                    style={{ 
                      width: '100%', 
                      padding: '10px', 
                      border: '1px solid #ddd', 
                      borderRadius: '5px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>
                    <strong>Amount ({tokenSymbol || 'tokens'}):</strong>
                  </label>
                  <input
                    name="amount"
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0.0"
                    required
                    style={{ 
                      width: '100%', 
                      padding: '10px', 
                      border: '1px solid #ddd', 
                      borderRadius: '5px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                
                <button 
                  type="submit"
                  style={{ 
                    padding: '10px 20px', 
                    backgroundColor: '#dc3545', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '5px', 
                    cursor: 'pointer'
                  }}
                >
                  Send Transfer
                </button>
              </form>
            </div>
          )}

          <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f8f9fa' }}>
            <h3>ℹ️ Configuration</h3>
            <p><strong>Chain ID:</strong> {CONFIG.CHAIN_ID_HEX} ({CONFIG.CHAIN_ID_DEC})</p>
            <p><strong>Chain Name:</strong> {CONFIG.CHAIN_NAME}</p>
            <p><strong>RPC URLs:</strong> {CONFIG.RPC_URLS.join(', ')}</p>
            <p><strong>Token Address:</strong> {CONFIG.TOKEN_ADDRESS || 'Not configured'}</p>
            <p><strong>Backend URL:</strong> {CONFIG.BACKEND_URL}</p>
          </div>
        </>
      )}
    </div>
  );
}