import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import HitSongBarChart from './HitSongBarChart';

const initialForm = {
  danceability: '',
  energy: '',
  key: '',
  loudness: '',
  mode: '',
  speechiness: '',
  acousticness: '',
  instrumentalness: '',
  liveness: '',
  valence: '',
  tempo: '',
  duration_ms: ''
};

function App() {
  const [notificationResponse, setNotificationResponse] = useState(null);
  // Visualization for user-input song
  const getSongForChart = () => {
    if (!result) return null;
    return {
      track_name: 'Your Song',
      artist_name: wallet.address ? wallet.address : 'Unknown',
      year: new Date().getFullYear(),
      popularity: result.confidence || 0,
      acousticness: parseFloat(form.acousticness) || 0,
      danceability: parseFloat(form.danceability) || 0,
      duration_ms: parseFloat(form.duration_ms) || 0,
      energy: parseFloat(form.energy) || 0,
      instrumentalness: parseFloat(form.instrumentalness) || 0,
      key: parseFloat(form.key) || 0,
      liveness: parseFloat(form.liveness) || 0,
      loudness: parseFloat(form.loudness) || 0,
      mode: parseFloat(form.mode) || 0,
      speechiness: parseFloat(form.speechiness) || 0,
      tempo: parseFloat(form.tempo) || 0,
      valence: parseFloat(form.valence) || 0,
      artwork_url: '',
      track_url: '',
      language: ''
    };
  };
  const [backendStatus, setBackendStatus] = useState('checking');

  const [backendError, setBackendError] = useState('');
  const checkBackend = async () => {
    setBackendStatus('checking');
    setBackendError('');
    try {
      const res = await fetch('http://localhost:5051/api/predict');
      if (res.ok) {
        setBackendStatus('connected');
      } else {
        setBackendStatus('disconnected');
        setBackendError(`Status: ${res.status} ${res.statusText}`);
      }
    } catch (err) {
      setBackendStatus('disconnected');
      setBackendError(err.message);
    }
  };
  React.useEffect(() => {
    checkBackend();
  }, []);
  const [form, setForm] = useState(initialForm);

  // Example test data for quick fill
  const exampleData = {
    danceability: '0.7',
    energy: '0.8',
    key: '5',
    loudness: '-5.2',
    mode: '1',
    speechiness: '0.05',
    acousticness: '0.12',
    instrumentalness: '0.0',
    liveness: '0.18',
    valence: '0.65',
    tempo: '120.0',
    duration_ms: '210000'
  };

  const fillTestData = () => {
    setForm(exampleData);
  };
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [wallet, setWallet] = useState({ address: '', connected: false });
  const [tokenBalance, setTokenBalance] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    setNotificationResponse(null);
    try {
      const response = await fetch('http://localhost:5051/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...Object.fromEntries(Object.entries(form).map(([k, v]) => [k, parseFloat(v)]))
        })
      });
      let debugText = '';
      if (!response.ok) {
        debugText = `Status: ${response.status} ${response.statusText}`;
        throw new Error('Prediction failed. ' + debugText);
      }
      const text = await response.text();
      try {
        const data = JSON.parse(text);
        setResult(data);
      } catch (jsonErr) {
        setError('Invalid JSON from backend: ' + text);
      }
    } catch (err) {
      setError('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Metamask connect logic
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setWallet({ address: accounts[0], connected: true });
      } catch (err) {
        setWallet({ address: '', connected: false });
        alert('Wallet connection failed');
      }
    } else {
      setWallet({ address: '', connected: false });
      alert('Metamask not found');
    }
  };

  // Fetch token balance from contract
  useEffect(() => {
    const fetchBalance = async () => {
      if (!wallet.connected || !wallet.address) return;
      try {
        // Contract ABI and address (update with your deployed address)
        const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '<YOUR_CONTRACT_ADDRESS>';
        const abi = [
          "function balanceOf(address) view returns (uint256)",
          "function name() view returns (string)",
          "function symbol() view returns (string)"
        ];
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const contract = new ethers.Contract(contractAddress, abi, provider);
        const bal = await contract.balanceOf(wallet.address);
        setTokenBalance(ethers.utils.formatUnits(bal, 18));
      } catch (err) {
        setTokenBalance('Error');
      }
    };
    fetchBalance();
  }, [wallet]);

  return (
    <>
  <div className="animated-bg"></div>
      <main>
        <div className="app-container">
          {result && (
            <div style={{width:'100%',marginBottom:'2rem'}}>
              <h2 style={{textAlign:'center',marginBottom:'0.5rem',fontWeight:900,letterSpacing:'0.04em',fontSize:'2em',color:'#ffde59',textShadow:'0 2px 12px #ffde5944'}}>🎵 Your Song Feature Visualization</h2>
              <div style={{display:'flex',alignItems:'center',gap:'1.5rem',flexDirection:'column'}}>
                <div style={{fontWeight:700,fontSize:'1.15em',textAlign:'center',color:'#61dafb'}}>
                  <span role="img" aria-label="user">👤</span> Your Song <span style={{fontWeight:400}}>- {wallet.address ? wallet.address : 'Unknown'}</span>
                </div>
                <HitSongBarChart song={getSongForChart()} />
              </div>
            </div>
          )}
          <div style={{position:'absolute',top:18,right:18,zIndex:10,display:'flex',gap:'0.5em'}}>
            <button
              type="button"
              style={{
                padding: '0.6em 1.2em',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 700,
                fontSize: '1em',
                background: backendStatus === 'connected' ? 'linear-gradient(90deg,#4caf50 60%,#61dafb 100%)' : 'linear-gradient(90deg,#ff4d4f 60%,#646cff 100%)',
                color: '#fff',
                boxShadow: '0 2px 8px #646cff33',
                cursor: 'default'
              }}
              disabled
            >
              {backendStatus === 'checking' ? 'Checking backend...' : backendStatus === 'connected' ? 'Backend Connected' : 'Backend Not Connected'}
              {backendStatus === 'disconnected' && backendError && (
                <span style={{display:'block',marginTop:'0.3em',fontSize:'0.85em',color:'#fff',fontWeight:400}}>
                  {backendError}
                </span>
              )}
            </button>
            <button
              type="button"
              style={{
                padding: '0.6em 1em',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 700,
                fontSize: '1em',
                background: 'linear-gradient(90deg,#646cff 60%,#61dafb 100%)',
                color: '#fff',
                boxShadow: '0 2px 8px #646cff33',
                cursor: 'pointer'
              }}
              onClick={checkBackend}
            >
              Retry
            </button>
          </div>
          <div className="header">
            <img src="https://cdn-icons-png.flaticon.com/512/727/727245.png" alt="Music" style={{width:'64px',marginBottom:'1rem',filter:'drop-shadow(0 2px 8px #646cff)'}} />
            <h1>Music Prediction Oracle</h1>
            <p>Predict song virality and store results on-chain. Powered by Avalanche & ML.</p>
          </div>
          <button className="wallet-btn" onClick={connectWallet}>
            {wallet.connected ? 'Wallet Connected' : 'Connect Wallet'}
          </button>
          {wallet.connected && wallet.address && (
            <div className="wallet-info">
              <div style={{fontWeight:'600',fontSize:'1.08em',color:'#61dafb',marginBottom:'0.2em'}}>
                Wallet: <span style={{fontWeight:'400'}}>{wallet.address.slice(0,6)}...{wallet.address.slice(-4)}</span>
              </div>
              <div style={{fontWeight:'600',fontSize:'1.08em',color:'#4caf50',marginBottom:'0.2em'}}>
                Token Balance: <span style={{fontWeight:'400'}}>{tokenBalance !== null ? tokenBalance : 'Loading...'}</span> <span style={{color:'#61dafb',fontWeight:'700'}}>HST</span>
              </div>
            </div>
          )}
          <button type="button" className="wallet-btn" style={{marginBottom:'1rem',background:'linear-gradient(90deg,#646cff 60%,#61dafb 100%)'}} onClick={fillTestData}>
            Test with Example Data
          </button>
          <form onSubmit={handleSubmit} className="prediction-form">
            {Object.keys(initialForm).map((key) => (
              <div key={key} className="form-group">
                <label htmlFor={key}>{key.replace('_', ' ').replace('ms', ' (ms)')}</label>
                <input
                  type="number"
                  step="any"
                  name={key}
                  id={key}
                  value={form[key]}
                  onChange={handleChange}
                  required
                />
              </div>
            ))}
            <button type="submit" disabled={loading}>
              {loading ? 'Predicting...' : 'Predict'}
            </button>
          </form>
          {error && <div className="error" style={{color:'red',margin:'1em 0',fontWeight:600}}>{error}</div>}
          {result && (
            <div className="result">
              <h2 style={{marginBottom: '1rem',fontWeight:900,letterSpacing:'0.04em',fontSize:'1.5em',color:'#ffde59',textShadow:'0 2px 12px #ffde5944'}}>Prediction Result</h2>
              <div style={{fontSize: '1.15em', wordBreak: 'break-word'}}>
                {result.prediction !== undefined ? (
                  <>
                    {result.is_hit ? (
                      <div className="result-hit"><span role="img" aria-label="trophy">🏆</span> Hit Song Predicted!</div>
                    ) : (
                      <div style={{fontWeight:700,color:'#ff4d4f',marginBottom:'0.5em'}}><span role="img" aria-label="star">⭐</span> Not a Hit</div>
                    )}
                    <strong>Virality Score:</strong> {result.prediction}<br/>
                    {result.suggestion && <><strong>Suggestion:</strong> {result.suggestion}<br/></>}
                  </>
                ) : (
                  <pre>{JSON.stringify(result, null, 2)}</pre>
                )}
              </div>
              {/* Inline notification for token update and gas expenditure */}
              {result.notification && result.notification.yes_no && notificationResponse === null && (
                <div style={{margin:'1.5em 0',padding:'1em',border:'2px solid #61dafb',borderRadius:'12px',background:'#f8fcff',boxShadow:'0 2px 12px #61dafb33'}}>
                  <div style={{fontWeight:700,color:'#1a237e',marginBottom:'0.5em',fontSize:'1.08em'}}>
                    <span role="img" aria-label="info">💡</span> {result.notification.message}
                  </div>
                  <div style={{display:'flex',gap:'1em',justifyContent:'center'}}>
                    <button style={{padding:'0.7em 1.5em',borderRadius:'8px',border:'none',background:'linear-gradient(90deg,#61dafb 60%,#4caf50 100%)',color:'#fff',fontWeight:700,cursor:'pointer',fontSize:'1.08em',boxShadow:'0 2px 8px #61dafb33'}} onClick={()=>setNotificationResponse('yes')}>Yes</button>
                    <button style={{padding:'0.7em 1.5em',borderRadius:'8px',border:'none',background:'linear-gradient(90deg,#ff4d4f 60%,#646cff 100%)',color:'#fff',fontWeight:700,cursor:'pointer',fontSize:'1.08em',boxShadow:'0 2px 8px #ff4d4f33'}} onClick={()=>setNotificationResponse('no')}>No</button>
                  </div>
                </div>
              )}
              {notificationResponse === 'yes' && (
                <div className="notification-success">
                  <span className="icon-check" role="img" aria-label="success">✅</span> Token update confirmed!<br/>
                  <span style={{fontWeight:400}}>Gas expenditure:</span> <span style={{fontWeight:700,color:'#388e3c'}}>{result.gas_expenditure}</span>
                </div>
              )}
              {notificationResponse === 'no' && (
                <div className="notification-error">
                  <span className="icon-cross" role="img" aria-label="error">❌</span> Token update declined. No changes made.
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default App;
