"""
AI Price Predictor - Predicts future player values using machine learning
"""
import os
from dotenv import load_dotenv
from supabase import create_client, Client
import datetime
import numpy as np
from typing import List, Dict, Tuple
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
import warnings
warnings.filterwarnings('ignore')

load_dotenv()
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

class AIPricePredictor:
    """AI-powered price prediction using machine learning"""
    
    def __init__(self):
        self.today = datetime.date.today()
        self.scaler = StandardScaler()
        self.models = {}  # Cache models per player
    
    def get_historical_data(self, player_id: str, days: int = 30) -> List[Dict]:
        """Get historical value data for a player"""
        try:
            start_date = (self.today - datetime.timedelta(days=days)).isoformat()
            
            response = supabase.table('player_value_index').select(
                'value_date, value_score, stat_component, sentiment_component, '
                'momentum_score, confidence_score'
            ).eq('player_id', player_id).gte('value_date', start_date).order('value_date').execute()
            
            return response.data
        except Exception as e:
            print(f"Error fetching historical data: {e}")
            return []
    
    def prepare_features(self, historical_data: List[Dict]) -> Tuple[np.ndarray, np.ndarray]:
        """Prepare features for ML model"""
        if len(historical_data) < 5:
            return None, None
        
        # Extract features
        X = []
        y = []
        
        for i in range(len(historical_data)):
            record = historical_data[i]
            
            # Features: day_index, stat_component, sentiment_component, momentum_score
            features = [
                i,  # Time index
                record.get('stat_component', 0),
                record.get('sentiment_component', 0),
                record.get('momentum_score', 0),
                record.get('confidence_score', 0)
            ]
            
            # Add moving averages if we have enough data
            if i >= 3:
                recent_values = [historical_data[j]['value_score'] for j in range(max(0, i-3), i)]
                features.append(np.mean(recent_values))  # 3-day moving average
            else:
                features.append(record['value_score'])
            
            X.append(features)
            y.append(record['value_score'])
        
        return np.array(X), np.array(y)
    
    def train_model(self, player_id: str) -> bool:
        """Train ML model for a specific player"""
        historical_data = self.get_historical_data(player_id, days=30)
        
        if len(historical_data) < 5:
            return False
        
        X, y = self.prepare_features(historical_data)
        
        if X is None or len(X) < 5:
            return False
        
        try:
            # Train linear regression model
            model = LinearRegression()
            model.fit(X, y)
            
            # Store model
            self.models[player_id] = {
                'model': model,
                'last_index': len(X) - 1,
                'last_data': historical_data[-1],
                'trained_at': datetime.datetime.now()
            }
            
            return True
        except Exception as e:
            print(f"Error training model for player {player_id}: {e}")
            return False
    
    def predict_future_value(self, player_id: str, days_ahead: int = 7) -> List[Dict]:
        """Predict future values for a player"""
        # Train model if not already trained
        if player_id not in self.models:
            if not self.train_model(player_id):
                return []
        
        model_data = self.models[player_id]
        model = model_data['model']
        last_index = model_data['last_index']
        last_data = model_data['last_data']
        
        predictions = []
        
        try:
            for day in range(1, days_ahead + 1):
                # Prepare features for prediction
                future_index = last_index + day
                
                # Use last known values for components (conservative estimate)
                features = [
                    future_index,
                    last_data.get('stat_component', 0),
                    last_data.get('sentiment_component', 0),
                    last_data.get('momentum_score', 0),
                    last_data.get('confidence_score', 0),
                    last_data.get('value_score', 50)  # Last moving average
                ]
                
                # Predict
                predicted_value = model.predict([features])[0]
                
                # Ensure value is within reasonable bounds
                predicted_value = max(0, min(100, predicted_value))
                
                prediction_date = self.today + datetime.timedelta(days=day)
                
                predictions.append({
                    'date': prediction_date.isoformat(),
                    'predicted_value': round(predicted_value, 2),
                    'confidence': self._calculate_prediction_confidence(day, len(self.get_historical_data(player_id))),
                    'days_ahead': day
                })
            
            return predictions
        except Exception as e:
            print(f"Error predicting future values: {e}")
            return []
    
    def _calculate_prediction_confidence(self, days_ahead: int, data_points: int) -> float:
        """Calculate confidence in prediction based on time horizon and data availability"""
        # Confidence decreases with time and increases with more data
        time_factor = max(0, 1 - (days_ahead / 14))  # Decreases over 2 weeks
        data_factor = min(1, data_points / 30)  # Increases up to 30 days of data
        
        return round(time_factor * data_factor, 3)
    
    def get_price_momentum(self, player_id: str) -> Dict:
        """Analyze price momentum and trend"""
        historical_data = self.get_historical_data(player_id, days=14)
        
        if len(historical_data) < 7:
            return {
                'trend': 'insufficient_data',
                'momentum': 0,
                'volatility': 0,
                'direction': 'unknown'
            }
        
        values = [d['value_score'] for d in historical_data]
        
        # Calculate trend
        recent_avg = np.mean(values[-3:])
        older_avg = np.mean(values[:3])
        trend_pct = ((recent_avg - older_avg) / older_avg * 100) if older_avg > 0 else 0
        
        # Calculate momentum (rate of change)
        momentum = np.mean(np.diff(values))
        
        # Calculate volatility (standard deviation)
        volatility = np.std(values)
        
        # Determine direction
        if trend_pct > 5:
            direction = 'strong_upward'
        elif trend_pct > 2:
            direction = 'upward'
        elif trend_pct < -5:
            direction = 'strong_downward'
        elif trend_pct < -2:
            direction = 'downward'
        else:
            direction = 'stable'
        
        return {
            'trend': round(trend_pct, 2),
            'momentum': round(momentum, 3),
            'volatility': round(volatility, 2),
            'direction': direction,
            'current_value': values[-1],
            'week_ago_value': values[0] if len(values) >= 7 else values[0]
        }
    
    def find_trending_players(self, limit: int = 10) -> List[Dict]:
        """Find players with strong upward trends"""
        print("\n📈 Finding Trending Players...")
        
        try:
            # Get all players with recent data
            week_ago = (self.today - datetime.timedelta(days=7)).isoformat()
            
            response = supabase.table('player_value_index').select(
                'player_id, value_score, value_date'
            ).gte('value_date', week_ago).execute()
            
            # Group by player
            player_data = {}
            for record in response.data:
                player_id = record['player_id']
                if player_id not in player_data:
                    player_data[player_id] = []
                player_data[player_id].append(record)
            
            trending = []
            
            for player_id, data in player_data.items():
                if len(data) < 5:
                    continue
                
                # Sort by date
                data.sort(key=lambda x: x['value_date'])
                
                # Calculate trend
                values = [d['value_score'] for d in data]
                trend = ((values[-1] - values[0]) / values[0] * 100) if values[0] > 0 else 0
                
                if trend > 3:  # At least 3% increase
                    # Get player info
                    player = supabase.table('players').select('full_name, team_name, position').eq('id', player_id).single().execute()
                    
                    # Get predictions
                    predictions = self.predict_future_value(player_id, days_ahead=7)
                    
                    if predictions:
                        trending.append({
                            'player_id': player_id,
                            'player_name': player.data['full_name'],
                            'team': player.data['team_name'],
                            'position': player.data['position'],
                            'current_value': values[-1],
                            'week_ago_value': values[0],
                            'trend_pct': round(trend, 2),
                            'predicted_7day': predictions[-1]['predicted_value'],
                            'prediction_confidence': predictions[-1]['confidence'],
                            'momentum': self.get_price_momentum(player_id)
                        })
            
            # Sort by trend
            trending.sort(key=lambda x: x['trend_pct'], reverse=True)
            
            return trending[:limit]
            
        except Exception as e:
            print(f"Error finding trending players: {e}")
            return []
    
    def find_value_drops(self, limit: int = 10) -> List[Dict]:
        """Find players with significant value drops (potential buy opportunities)"""
        print("\n📉 Finding Value Drops...")
        
        try:
            week_ago = (self.today - datetime.timedelta(days=7)).isoformat()
            
            response = supabase.table('player_value_index').select(
                'player_id, value_score, value_date'
            ).gte('value_date', week_ago).execute()
            
            player_data = {}
            for record in response.data:
                player_id = record['player_id']
                if player_id not in player_data:
                    player_data[player_id] = []
                player_data[player_id].append(record)
            
            drops = []
            
            for player_id, data in player_data.items():
                if len(data) < 5:
                    continue
                
                data.sort(key=lambda x: x['value_date'])
                values = [d['value_score'] for d in data]
                drop = ((values[-1] - values[0]) / values[0] * 100) if values[0] > 0 else 0
                
                if drop < -3:  # At least 3% decrease
                    player = supabase.table('players').select('full_name, team_name, position').eq('id', player_id).single().execute()
                    predictions = self.predict_future_value(player_id, days_ahead=7)
                    
                    if predictions:
                        # Check if predicted to recover
                        predicted_change = ((predictions[-1]['predicted_value'] - values[-1]) / values[-1] * 100) if values[-1] > 0 else 0
                        
                        drops.append({
                            'player_id': player_id,
                            'player_name': player.data['full_name'],
                            'team': player.data['team_name'],
                            'position': player.data['position'],
                            'current_value': values[-1],
                            'week_ago_value': values[0],
                            'drop_pct': round(drop, 2),
                            'predicted_7day': predictions[-1]['predicted_value'],
                            'predicted_recovery': round(predicted_change, 2),
                            'prediction_confidence': predictions[-1]['confidence'],
                            'buy_signal': predicted_change > 2  # Predicted to recover
                        })
            
            drops.sort(key=lambda x: x['drop_pct'])
            
            return drops[:limit]
            
        except Exception as e:
            print(f"Error finding value drops: {e}")
            return []

def generate_predictions_report():
    """Generate daily predictions report"""
    print("="*60)
    print("AI PRICE PREDICTOR - DAILY REPORT")
    print("="*60)
    
    predictor = AIPricePredictor()
    
    # Trending players
    trending = predictor.find_trending_players(5)
    print(f"\n📈 TOP 5 TRENDING PLAYERS (Rising Fast)")
    print("-"*60)
    for i, player in enumerate(trending, 1):
        print(f"{i}. {player['player_name']} ({player['team']}) - {player['position']}")
        print(f"   Current: {player['current_value']:.1f} | Week Ago: {player['week_ago_value']:.1f}")
        print(f"   Trend: {player['trend_pct']:+.1f}% | Predicted (7d): {player['predicted_7day']:.1f}")
        print(f"   Confidence: {player['prediction_confidence']:.0%}")
        print()
    
    # Value drops
    drops = predictor.find_value_drops(5)
    print(f"\n📉 TOP 5 VALUE DROPS (Potential Recoveries)")
    print("-"*60)
    for i, player in enumerate(drops, 1):
        print(f"{i}. {player['player_name']} ({player['team']}) - {player['position']}")
        print(f"   Current: {player['current_value']:.1f} | Week Ago: {player['week_ago_value']:.1f}")
        print(f"   Drop: {player['drop_pct']:.1f}% | Predicted Recovery: {player['predicted_recovery']:+.1f}%")
        print(f"   Buy Signal: {'✅ YES' if player['buy_signal'] else '❌ NO'}")
        print()
    
    print("="*60)
    print("Predictions generated!")
    print("="*60)

if __name__ == "__main__":
    generate_predictions_report()
