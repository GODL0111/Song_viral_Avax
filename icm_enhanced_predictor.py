# import pandas as pd
# import numpy as np
# import asyncio
# import aiohttp
# import json
# from datetime import datetime
# from typing import Dict, List, Optional
# import hashlib
# from dataclasses import dataclass
# import importlib.util
# spec = importlib.util.spec_from_file_location("predict_V0_2", "predict_V0.2.py")
# predict_module = importlib.util.module_from_spec(spec)
# spec.loader.exec_module(predict_module)
# SongHitPredictor = predict_module.SongHitPredictor
# class ICMBridge:
#     """Placeholder for ICM bridge logic"""
#     def __init__(self):
#         pass

#     async def bridge_data(self, data):
#         # Simulate bridging data
#         await asyncio.sleep(0.1)
#         return data

# @dataclass
# class CrossChainData:
#     """Data structure for cross-chain music data"""
#     platform: str
#     song_id: str
#     streams: int
#     likes: int
#     shares: int
#     sentiment_score: float
#     nft_volume: float
#     timestamp: datetime

# class ICMDataAggregator:
#     """Handles cross-chain data aggregation via ICM"""
    
#     def __init__(self):
#         self.platforms = {
#             'spotify': 'https://api.spotify.com/v1',
#             'avalanche_music_chain': 'https://api.avax-music.com/v1',
#             'social_sentiment_chain': 'https://api.social-chain.com/v1',
#             'nft_marketplace_chain': 'https://api.nft-music.com/v1'
#         }
#         self.icm_bridge = ICMBridge()
    
#     async def aggregate_cross_chain_data(self, song_identifier: str) -> Dict:
#         """Aggregate data from multiple chains via ICM"""
#         tasks = [
#             self.get_streaming_data(song_identifier),
#             self.get_social_sentiment(song_identifier),
#             self.get_nft_trading_data(song_identifier),
#             self.get_avalanche_metrics(song_identifier)
#         ]
        
#         results = await asyncio.gather(*tasks, return_exceptions=True)
        
#         return {
#             'streaming_data': results[0] if not isinstance(results[0], Exception) else {},
#             'social_sentiment': results[1] if not isinstance(results[1], Exception) else 0.5,
#             'nft_data': results[2] if not isinstance(results[2], Exception) else {},
#             'avalanche_metrics': results[3] if not isinstance(results[3], Exception) else {}
#         }
    

# async def demo_icm_prediction():
#     aggregator = ICMDataAggregator()
#     song_id = "sample_song_123"
#     print("Aggregating cross-chain data for song:", song_id)
#     data = await aggregator.aggregate_cross_chain_data(song_id)
#     print("Aggregated Data:", json.dumps(data, indent=2, default=str))

#     # Example: Use SongHitPredictor with aggregated data
#     predictor = SongHitPredictor()
#     # You would pass actual features here; using dummy for demo
#     features = {
#         'danceability': 0.7,
#         'energy': 0.6,
#         'key': 5,
#         'loudness': -10.0,
#         'mode': 1,
#         'speechiness': 0.05,
#         'acousticness': 0.3,
#         'instrumentalness': 0.1,
#         'liveness': 0.2,
#         'valence': 0.5,
#         'tempo': 120.0,
#         'duration_ms': 200000
#     }
#     prediction = predictor.predict_song_hit_probability(features)
#     print("Prediction Result:", prediction)

# if __name__ == "__main__":
#     asyncio.run(demo_icm_prediction())

import pandas as pd
import asyncio
import json
from datetime import datetime
from typing import Dict
from dataclasses import dataclass
import importlib.util
import hashlib

# ✅ Load your trained SongHitPredictor from repo
spec = importlib.util.spec_from_file_location("predict_V0_2", "predict_V0.2.py")
predict_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(predict_module)
SongHitPredictor = predict_module.SongHitPredictor


# --------------------------
# 🔹 Simulated ICM Bridge
# --------------------------
class ICMBridge:
    """Simulates ICM bridge logic (like Avalanche Warp Messaging)"""

    def _init_(self):
        self.message_log = []

    async def bridge_data(self, data: Dict) -> Dict:
        """Simulate sending data to another chain"""
        await asyncio.sleep(0.2)  # network delay simulation
        msg_hash = hashlib.sha256(json.dumps(data).encode()).hexdigest()
        self.message_log.append({"hash": msg_hash, "payload": data})
        print(f"✅ ICM Message Sent | Hash: {msg_hash}")
        return data


# --------------------------
# 🔹 Cross-Chain Data Model
# --------------------------
@dataclass
class CrossChainData:
    """Data structure for music analytics updates"""
    song_id: str
    popularity: int
    danceability: float
    energy: float
    timestamp: datetime


# --------------------------
# 🔹 Watcher for Live Feed
# --------------------------
class CSVWatcher:
    """Watches live_feed.csv and detects changes vs dataset.csv"""

    def _init_(self, dataset_file="dataset.csv", live_file="live_feed.csv"):
        self.dataset_file = dataset_file
        self.live_file = live_file
        self.icm_bridge = ICMBridge()
        self.predictor = SongHitPredictor()

    async def check_updates(self):
        """Check if live_feed has changes and push them via ICM"""
        dataset = pd.read_csv(self.dataset_file)
        live = pd.read_csv(self.live_file)

        diffs = live.compare(dataset) if not live.equals(dataset) else pd.DataFrame()

        if not diffs.empty:
            print("⚡ Detected changes in live feed!")

            # overwrite dataset with new live data
            live.to_csv(self.dataset_file, index=False)

            # For each changed row → send to ICM
            for idx in diffs.index:
                row = live.loc[idx].to_dict()
                update = CrossChainData(
                    song_id=row["track_id"],
                    popularity=row["popularity"],
                    danceability=row["danceability"],
                    energy=row["energy"],
                    timestamp=datetime.now()
                )

                # Send via ICM
                payload = update._dict_
                await self.icm_bridge.bridge_data(payload)

                # Run prediction after update
                features = {
                    "danceability": row["danceability"],
                    "energy": row["energy"],
                    "key": 5,
                    "loudness": -10.0,
                    "mode": 1,
                    "speechiness": 0.05,
                    "acousticness": 0.3,
                    "instrumentalness": 0.1,
                    "liveness": 0.2,
                    "valence": 0.5,
                    "tempo": 120.0,
                    "duration_ms": 200000,
                }
                prediction = self.predictor.predict_song_hit_probability(features)
                print(f"🎵 Prediction for {row['track_id']} → {prediction:.2f}")


# --------------------------
# 🔹 Demo Runner
# --------------------------
async def run_demo():
    watcher = CSVWatcher()

    print("🚀 Starting CSV Watcher + ICM Bridge...\n")
    while True:
        await watcher.check_updates()
        await asyncio.sleep(5)  # check every 5 sec


if _name_ == "_main_":
    asyncio.run(run_demo())