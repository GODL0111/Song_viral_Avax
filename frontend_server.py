from flask import Flask, request, jsonify, send_from_directory
import os
import sys
import json
import logging

# Ensure project root is on path
ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.append(ROOT)

import importlib.util

app = Flask(__name__, static_folder='frontend', static_url_path='')

# Setup basic logging
logging.basicConfig(level=logging.INFO, format='[%(levelname)s] %(message)s')
logger = logging.getLogger('frontend_server')

# Defensive imports and model loading
predictor = None
avalanche = None
try:
    # Load SongHitPredictor from predict_V0.2.py
    spec = importlib.util.spec_from_file_location("predict_v0_2", os.path.join(ROOT, "predict_V0.2.py"))
    predict_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(predict_module)
    SongHitPredictor = predict_module.SongHitPredictor
    predictor = SongHitPredictor()
    try:
        predictor.load_model()
        logger.info('Loaded SongHitPredictor model')
    except Exception as e:
        logger.warning('Could not load model on startup: %s', e)
        predictor = predictor  # leave instance, but model may be None
except Exception as e:
    logger.exception('Failed to import SongHitPredictor: %s', e)

try:
    # Load AvalancheSongPredictor
    spec2 = importlib.util.spec_from_file_location("avalanche_song_predictor", os.path.join(ROOT, "avalanche_song_predictor.py"))
    av_mod = importlib.util.module_from_spec(spec2)
    spec2.loader.exec_module(av_mod)
    AvalancheSongPredictor = av_mod.AvalancheSongPredictor
    try:
        avalanche = AvalancheSongPredictor(network=os.getenv('AVALANCHE_NETWORK', 'fuji'))
        try:
            avalanche.load_model()
            logger.info('Loaded AvalancheSongPredictor model')
        except Exception as e:
            logger.warning('Avalanche predictor loaded but model load failed: %s', e)
    except Exception as e:
        logger.warning('Could not instantiate AvalancheSongPredictor: %s', e)
        avalanche = None
except Exception as e:
    logger.exception('Failed to import AvalancheSongPredictor: %s', e)
    avalanche = None

@app.route('/')
def index():
    return send_from_directory('frontend', 'index.html')

@app.route('/api/predict', methods=['POST'])
def api_predict():
    data = request.get_json() or {}
    try:
        # Fill missing features with recommended defaults if possible
        defaults = {
            'danceability': 0.65,
            'energy': 0.72,
            'key': 5,
            'loudness': -6.5,
            'mode': 1,
            'speechiness': 0.08,
            'acousticness': 0.25,
            'instrumentalness': 0.05,
            'liveness': 0.15,
            'valence': 0.58,
            'tempo': 125,
            'duration_ms': 210000
        }

        for k, v in defaults.items():
            if k not in data:
                data[k] = v

        if predictor is None:
            logger.error('Predict called but predictor is not available')
            return jsonify({'error': 'Predictor not available on server'}), 500

        pred = predictor.predict_song_hit_probability(data)
        if not pred:
            return jsonify({'error':'Model returned no prediction or invalid input'}), 400
        # Convert any numpy types to native Python types for JSON serialization
        def to_native(val):
            import numpy as np
            if isinstance(val, (np.generic,)):
                return val.item()
            return val
        pred_native = {k: to_native(v) for k, v in pred.items()}
        meta_native = {k: to_native(v) for k, v in (predictor.model_metadata or {}).items()}
        return jsonify({
            'prediction': pred_native,
            'model_metadata': meta_native
        })
    except Exception as e:
        logger.exception('Error in /api/predict: %s', e)
        return jsonify({'error': str(e)}), 500

@app.route('/api/store', methods=['POST'])
def api_store():
    data = request.get_json() or {}
    try:
        # Merge defaults same as predict
        defaults = predictor.musical_dna_features
        for feat in defaults:
            if feat not in data:
                # try filling from predictor's optimal ranges if available
                data[feat] = 0.5

        if avalanche is None:
            logger.error('Store called but avalanche predictor is not available')
            return jsonify({'error': 'Avalanche predictor not available on server'}), 500

        result = avalanche.predict_and_store_on_avalanche(data, store_on_chain=True)
        # Convert numpy types to native Python types for JSON serialization
        def to_native(val):
            import numpy as np
            if isinstance(val, (np.generic,)):
                return val.item()
            return val
        result_native = {k: to_native(v) for k, v in result.items()}
        result_native['model_metadata'] = {k: to_native(v) for k, v in (getattr(avalanche, 'model_metadata', {}) or {}).items()}
        return jsonify(result_native)
    except Exception as e:
        logger.exception('Error in /api/store: %s', e)
        return jsonify({'error': str(e)}), 500


@app.route('/api/model', methods=['GET'])
def api_model():
    meta = {}
    try:
        if predictor is not None:
            meta = predictor.model_metadata or {}
    except Exception:
        logger.exception('Failed to read model metadata')
    return jsonify({'metadata': meta})


@app.route('/api/suggest', methods=['POST'])
def api_suggest():
    data = request.get_json() or {}
    try:
        if predictor is None:
            return jsonify({'error': 'Predictor not available'}), 500
        suggestions = predictor.suggest_feature_improvements(data)
        # Convert numpy types in suggestions
        def to_native(val):
            import numpy as np
            if isinstance(val, (np.generic,)):
                return val.item()
            return val
        suggestions_native = []
        for s in suggestions or []:
            if isinstance(s, dict):
                suggestions_native.append({k: to_native(v) for k, v in s.items()})
            else:
                suggestions_native.append(to_native(s))
        return jsonify({'suggestions': suggestions_native})
    except Exception as e:
        logger.exception('Error in /api/suggest: %s', e)
        return jsonify({'error': str(e)}), 500


@app.route('/api/history', methods=['GET'])
def api_history():
    try:
        history = []
        # If avalanche contract available, try to get predictor history
        if avalanche is not None and hasattr(avalanche, 'contract') and avalanche.contract:
            try:
                hist = avalanche.get_predictor_history()
                history = hist or []
            except Exception:
                logger.exception('Failed to fetch history from avalanche contract')
                history = []
        return jsonify({'history': history})
    except Exception as e:
        logger.exception('Error in /api/history: %s', e)
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv('FRONTEND_PORT', '5006'))
    try:
        logger.info('Starting frontend server on port %s', port)
        app.run(host='0.0.0.0', port=port, debug=True, use_reloader=False)
    except OSError as e:
        logger.exception('Failed to start server on port %s: %s', port, e)
        print(f'Error: could not start server on port {port}: {e}')
        raise
