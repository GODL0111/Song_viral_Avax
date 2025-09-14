import React, { useState } from 'react';
import { FaWallet, FaMusic, FaStar, FaTrophy } from 'react-icons/fa';

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
	const [form, setForm] = useState(initialForm);
	const [result, setResult] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [wallet, setWallet] = useState({ address: '', connected: false });
	const [tokenBalance, setTokenBalance] = useState(100);
	const [txHistory, setTxHistory] = useState([]);

	const handleChange = (e) => {
		setForm({ ...form, [e.target.name]: e.target.value });
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError('');
		setResult(null);
		try {
			const response = await fetch('http://localhost:5051/api/predict', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...Object.fromEntries(Object.entries(form).map(([k, v]) => [k, parseFloat(v)]))
				})
			});
			if (!response.ok) throw new Error('Prediction failed.');
			const data = await response.json();
			setResult(data);
			if (data.is_hit !== undefined) {
				let change = data.is_hit ? 10 : -5;
				setTokenBalance(prev => Math.max(0, prev + change));
				setTxHistory(prev => [
					{
						type: data.is_hit ? 'Hit' : 'Flop',
						amount: change,
						newBalance: Math.max(0, tokenBalance + change),
						timestamp: new Date().toLocaleString()
					},
					...prev
				]);
			}
		} catch (err) {
			setError('Error: ' + err.message);
		} finally {
			setLoading(false);
		}
	};

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

	return (
		<div style={{
			minHeight: '100vh',
			width: '100vw',
			background: 'linear-gradient(135deg, #23232a 0%, #646cff 100%)',
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'center',
			justifyContent: 'center',
			fontFamily: 'Poppins, Inter, system-ui, sans-serif',
			color: '#fff',
			overflow: 'hidden',
			boxSizing: 'border-box',
			margin: 0,
			padding: 0
		}}>
			<div style={{
				width: '100%',
				maxWidth: 820,
				minWidth: 340,
				background: 'rgba(40,44,60,0.96)',
				borderRadius: 32,
				boxShadow: '0 12px 40px #646cff55, 0 2px 12px #0003',
				padding: '2.5rem 2.5rem',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				position: 'relative',
				margin: '0 auto',
				transition: 'max-width 0.3s',
			}}>
				<div style={{textAlign:'center',marginBottom:'2rem'}}>
					<FaMusic size={64} style={{color:'#61dafb',marginBottom:'1rem',filter:'drop-shadow(0 2px 8px #646cff)'}} />
					<h1 style={{fontSize:'2.7rem',fontWeight:900,letterSpacing:'0.04em',background:'linear-gradient(90deg,#ffde59 20%,#61dafb 60%,#646cff 100%)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',marginBottom:'0.5rem'}}>Music Prediction Oracle</h1>
					<p style={{color:'#b3b3b3',fontSize:'1.1rem',marginTop:'0.5rem'}}>Predict song virality and store results on-chain.<br/>Powered by Avalanche & ML.</p>
				</div>
				<button onClick={connectWallet} style={{
					marginBottom:'1.5rem',
					padding:'0.7em 1.5em',
					borderRadius:12,
					border:'none',
					background:'linear-gradient(90deg,#61dafb 40%,#646cff 100%)',
					color:'#fff',
					fontWeight:700,
					fontSize:'1.08em',
					cursor:'pointer',
					boxShadow:'0 2px 12px #61dafb44',
					width:'100%',
					letterSpacing:'0.01em'
				}}>
					<FaWallet style={{marginRight:8}} /> {wallet.connected ? 'Wallet Connected' : 'Connect Wallet'}
				</button>
				{wallet.connected && wallet.address && (
					<div style={{textAlign:'center',marginBottom:'1.5rem',fontSize:'1.12em',background:'linear-gradient(90deg,#23232a 60%,#61dafb33 100%)',borderRadius:16,padding:'1em 1.2em',boxShadow:'0 2px 12px #61dafb33',border:'1.5px solid #61dafb44',display:'flex',flexDirection:'column',alignItems:'center',gap:'0.3em'}}>
						<span style={{fontWeight:'600',fontSize:'1.08em',color:'#61dafb'}}>Wallet: <span style={{fontWeight:'400'}}>{wallet.address.slice(0,6)}...{wallet.address.slice(-4)}</span></span>
						<span style={{fontWeight:'600',fontSize:'1.08em',color:'#ffde59'}}>Demo Token Balance: <span style={{fontWeight:'700',color:'#fff'}}>{tokenBalance}</span></span>
					</div>
				)}
				<form onSubmit={handleSubmit} style={{width:'100%',marginBottom:'2rem',display:'flex',flexDirection:'column',gap:'1.1rem'}}>
					{Object.keys(initialForm).map((key) => (
						<div key={key} style={{display:'flex',flexDirection:'column',gap:'0.25rem',alignItems:'flex-start',width:'100%'}}>
							<label htmlFor={key} style={{fontWeight:600,color:'#b3b3b3',marginBottom:'0.2rem',marginLeft:'0.2rem',fontSize:'0.97em'}}>{key.replace('_', ' ').replace('ms', ' (ms)')}</label>
							<input type="number" step="any" name={key} id={key} value={form[key]} onChange={handleChange} required style={{padding:'0.5rem 0.7rem',borderRadius:8,border:'1px solid #646cff',background:'#23232a',color:'#fff',fontSize:'1em',width:'100%'}} />
						</div>
					))}
					<button type="submit" disabled={loading} style={{alignSelf:'flex-start',padding:'0.9em 2em',borderRadius:10,border:'none',background:'linear-gradient(90deg,#646cff 60%,#61dafb 100%)',color:'#fff',fontWeight:700,fontSize:'1.08em',cursor:'pointer',marginTop:'1.2rem',boxShadow:'0 2px 8px #646cff33',width:'100%'}}>
						{loading ? 'Predicting...' : 'Predict'}
					</button>
				</form>
				{error && <div style={{color:'#ff4d4f',marginTop:'1rem',textAlign:'center',fontWeight:600}}>{error}</div>}
				{result && (
					<div style={{background:'linear-gradient(135deg,#23232a 60%,#646cff 100%)',borderRadius:18,padding:'1.5rem 1.2rem',marginTop:'2rem',color:'#fff',boxShadow:'0 2px 16px #646cff22',width:'100%',textAlign:'left',position:'relative',overflow:'hidden'}}>
						<h2 style={{marginBottom:'1rem',fontWeight:900,letterSpacing:'0.04em',fontSize:'1.5em',color:'#ffde59',textShadow:'0 2px 12px #ffde5944'}}>Prediction Result</h2>
						<div style={{fontSize:'1.15em',wordBreak:'break-word'}}>
							{result.prediction !== undefined ? (
								<>
									{result.is_hit ? (
										<div style={{display:'flex',alignItems:'center',gap:'0.7em',fontSize:'1.2em',fontWeight:700,color:'#ffde59',marginBottom:'0.5em',textShadow:'0 2px 12px #ffde5944'}}><FaTrophy /> Hit Song Predicted! <span style={{color:'#fff',fontWeight:400,fontSize:'0.9em'}}>+10 tokens</span></div>
									) : (
										<div style={{fontWeight:700,color:'#ff4d4f',marginBottom:'0.5em'}}><FaStar /> Not a Hit <span style={{color:'#fff',fontWeight:400,fontSize:'0.9em'}}>-5 tokens</span></div>
									)}
									<strong>Virality Score:</strong> {result.prediction}<br/>
									{result.suggestion && (<><strong>Suggestion:</strong> {result.suggestion}<br/></>)}
								</>
							) : (
								<pre>{JSON.stringify(result, null, 2)}</pre>
							)}
						</div>
						{txHistory.length > 0 && (
							<div style={{marginTop:'2rem',background:'#23232a',borderRadius:12,padding:'1rem',boxShadow:'0 2px 8px #646cff22'}}>
								<h3 style={{color:'#61dafb',fontWeight:700,marginBottom:'0.7em'}}>Demo Token Transactions</h3>
								<ul style={{listStyle:'none',padding:0,margin:0}}>
									{txHistory.slice(0,5).map((tx, idx) => (
										<li key={idx} style={{marginBottom:'0.7em',fontSize:'1em',color:tx.type==='Hit'?'#ffde59':'#ff4d4f'}}>
											<strong>{tx.type === 'Hit' ? 'Hit' : 'Flop'}:</strong> {tx.amount > 0 ? '+' : ''}{tx.amount} tokens &nbsp;
											<span style={{color:'#fff',fontWeight:400}}>Balance: {tx.newBalance}</span> &nbsp;
											<span style={{color:'#b3b3b3',fontSize:'0.92em'}}>{tx.timestamp}</span>
										</li>
									))}
								</ul>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}


// =============================
// To restore the original version, uncomment the code below this line and comment out the clean version above.
// =============================
/*
[DUPLICATE/CORRUPTED CODE BLOCK]
...existing code...
*/

export default App;
