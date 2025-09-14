from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import os
import numpy as np
from predict_V0_2 import SongHitPredictor
app = Flask(__name__)
CORS(app)
predictor = SongHitPredictor()
model_loaded = predictor.load_model()
predictor.load_and_prepare_data("/Users/chandan/Documents/Song_viral_Avax/datasets/spotify_tracks.csv")
@app.route('/api/predict', methods=['GET'])
def predict_get():
    return jsonify({'message': 'Use POST to submit song features for prediction.'}), 200

@app.route('/api/predict', methods=['POST'])
def predict():
    data = request.get_json()
    # Ensure all features are present and convert to float
    features = {k: float(v) for k, v in data.items()}
    result = predictor.predict_song_hit_probability(features)
    def to_native(val):
        if hasattr(val, 'item'):
            return val.item()
        return float(val) if isinstance(val, (np.float32, np.float64)) else val

    if result:
        response = {
            'prediction': to_native(round(result['hit_probability'], 4)),
            'is_hit': bool(result['is_hit_prediction']),
            'confidence': to_native(round(result['confidence'], 4))
        }
        # Optionally add suggestions if not a hit
        if not response['is_hit']:
            suggestions = predictor.suggest_feature_improvements(features)
            if suggestions:
                response['suggestion'] = f"Try adjusting: {', '.join([s['feature'] for s in suggestions[:3]])}"

        # --- Contract interaction ---
        from web3 import Web3
        import json
        contract_address = os.getenv('CONTRACT_ADDRESS')
        private_key = os.getenv('PRIVATE_KEY')
        rpc_url = os.getenv('RPC_URL')
        account = os.getenv('WALLET_ADDRESS')
        abi_path = 'out/MusicPredictionOracle.sol/MusicPredictionOracle.json'
        # Load ABI
        with open(abi_path) as f:
            contract_json = json.load(f)
            abi = contract_json['abi']
        w3 = Web3(Web3.HTTPProvider(rpc_url))
        contract = w3.eth.contract(address=Web3.to_checksum_address(contract_address), abi=abi)
        # Prepare transaction
        song_id = int(features.get('songId', 0))
        hit_probability = int(response['prediction'] * 100)
        is_predicted_hit = response['is_hit']
        model_version = 'V0.2'
        song_hash = 'demo_hash'  # Replace with actual hash logic
        # Store prediction
        tx = contract.functions.storePrediction(song_id, hit_probability, is_predicted_hit, model_version, song_hash).build_transaction({
            'from': account,
            'nonce': w3.eth.get_transaction_count(account),
            'gas': 300000,
            'gasPrice': w3.eth.gas_price
        })
        signed_tx = w3.eth.account.sign_transaction(tx, private_key)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        prediction_id = contract.functions.getTotalPredictions().call() - 1
        # Verify prediction (owner only)
        tx2 = contract.functions.verifyPrediction(prediction_id, response['is_hit']).build_transaction({
            'from': account,
            'nonce': w3.eth.get_transaction_count(account),
            'gas': 300000,
            'gasPrice': w3.eth.gas_price
        })
        signed_tx2 = w3.eth.account.sign_transaction(tx2, private_key)
        tx_hash2 = w3.eth.send_raw_transaction(signed_tx2.rawTransaction)
        receipt2 = w3.eth.wait_for_transaction_receipt(tx_hash2)
        gas_used = receipt2.gasUsed

        # Notification logic
        response['token_update'] = True
        response['gas_expenditure'] = gas_used
        response['notification'] = {
            'message': f"Token update will occur. Gas used: {gas_used}. Proceed?",
            'yes_no': True
        }
        return jsonify(response)
    else:
        return jsonify({'error': 'Prediction failed'}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5051, debug=True)
