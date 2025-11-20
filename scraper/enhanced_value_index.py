import os
from dotenv import load_dotenv
from supabase import create_client, Client
import datetime
import numpy as np

# --- 1. SETUP ---
print("\nStarting Enhanced Value Index Calculator...")
load_dotenv()
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("Error: Supabase credentials not found.")
    exit()

try:
    supabase: Client = create_client(url, key)
    print("Successfully connected to Supabase.")
except Exception as e:
    print(f"Error connecting to Supabase: {e}")
    exit()

# --- 2. HELPER FUNCTIONS ---

def calculate_fantasy_score(stats):
    """Enhanced fantasy score calculation"""
    return (
        stats['points'] +
        (stats['rebounds'] * 1.2) +
        (stats['assists'] * 1.5) +
        (stats['steals'] * 3) +
        (stats['blocks'] * 3) -
        stats['turnovers']
    )

def get_stat_trend(player_id, start_date):
    """
    Gets stats trend with recency weighting.
    Returns: (avg_score, trend_direction, consistency)
    """
    try:
        response = supabase.table('daily_player_stats') \
            .select('points, rebounds, assists, steals, blocks, turnovers, game_date') \
            .eq('player_id', player_id) \
            .gte('game_date', start_date) \
            .order('game_date', desc=True) \
            .execute()
        
        if not response.data or len(response.data) < 2:
            return 0, 0, 0
        
        # Calculate fantasy scores for each game
        fantasy_scores = [calculate_fantasy_score(game) for game in response.data]
        
        # Weighted average (more recent games weighted higher)
        weights = np.exp(np.linspace(0, 1, len(fantasy_scores)))
        weighted_avg = np.average(fantasy_scores, weights=weights)
        
        # Calculate trend (positive if improving, negative if declining)
        if len(fantasy_scores) >= 3:
            recent_avg = np.mean(fantasy_scores[:3])
            older_avg = np.mean(fantasy_scores[3:]) if len(fantasy_scores) > 3 else recent_avg
            trend = (recent_avg - older_avg) / (older_avg + 1)  # Normalized trend
        else:
            trend = 0
        
        # Calculate consistency (lower std dev = more consistent)
        consistency = 1 / (1 + np.std(fantasy_scores))
        
        return weighted_avg, trend, consistency
        
    except Exception as e:
        print(f"  Error fetching stats for player {player_id}: {e}")
        return 0, 0, 0

def get_sentiment_trend(player_id, start_date):
    """
    Gets sentiment trend with source weighting and recency bias.
    Returns: (avg_sentiment, trend_direction, volume)
    """
    try:
        response = supabase.table('daily_player_sentiment') \
            .select('sentiment_score, source, article_date') \
            .eq('player_id', player_id) \
            .gte('article_date', start_date) \
            .order('article_date', desc=True) \
            .execute()
        
        if not response.data:
            return 0, 0, 0
        
        # Weight different sources
        source_weights = {
            'reddit_nba': 1.2,
            'reddit_nbadiscussion': 1.3,
            'reddit_fantasybball': 1.1,
            'news_espn': 1.5,
            'news_cbssports': 1.3,
            'news_yahoo': 1.2,
            'bleacher_report': 1.4
        }
        
        weighted_scores = []
        dates = []
        
        for item in response.data:
            source = item.get('source', 'unknown')
            score = item['sentiment_score']
            
            # Get base weight for source
            weight = 1.0
            for key, val in source_weights.items():
                if key in source:
                    weight = val
                    break
            
            weighted_scores.append(score * weight)
            dates.append(item['article_date'])
        
        # Calculate weighted average
        avg_sentiment = np.mean(weighted_scores)
        
        # Calculate trend (recent vs older sentiment)
        if len(weighted_scores) >= 5:
            recent_sentiment = np.mean(weighted_scores[:len(weighted_scores)//2])
            older_sentiment = np.mean(weighted_scores[len(weighted_scores)//2:])
            trend = recent_sentiment - older_sentiment
        else:
            trend = 0
        
        # Volume (more mentions = more confidence in sentiment)
        volume = min(len(weighted_scores) / 20, 1.0)  # Normalize to 0-1
        
        return avg_sentiment, trend, volume
        
    except Exception as e:
        print(f"  Error fetching sentiment for player {player_id}: {e}")
        return 0, 0, 0

def calculate_momentum_score(stat_trend, sentiment_trend):
    """
    Calculate momentum based on alignment of stats and sentiment trends.
    When both are positive or both negative, momentum is stronger.
    """
    if stat_trend * sentiment_trend > 0:  # Same direction
        return abs(stat_trend + sentiment_trend) * 1.5
    else:  # Opposite directions
        return (stat_trend + sentiment_trend) * 0.5

def normalize_to_100_scale(value, min_val=-50, max_val=50):
    """Normalize a value to 0-100 scale"""
    normalized = ((value - min_val) / (max_val - min_val)) * 100
    return max(0, min(100, normalized))

# --- 3. MAIN EXECUTION ---

def run_enhanced_value_index_pipeline():
    print("Fetching all players from 'players' table...")
    try:
        player_response = supabase.table('players').select('id, full_name').execute()
        if not player_response.data:
            print("No players found. Exiting.")
            return
        players = player_response.data
        print(f"Found {len(players)} players to process.")
    except Exception as e:
        print(f"Error fetching players: {e}")
        return

    today = datetime.date.today()
    stats_start_date = (today - datetime.timedelta(days=10)).isoformat()
    sentiment_start_date = (today - datetime.timedelta(days=5)).isoformat()
    
    value_index_to_insert = []

    for player in players:
        player_id = player['id']
        player_name = player['full_name']
        
        # Get stats metrics
        stat_score, stat_trend, stat_consistency = get_stat_trend(player_id, stats_start_date)
        
        # Get sentiment metrics
        sentiment_score, sentiment_trend, sentiment_volume = get_sentiment_trend(player_id, sentiment_start_date)
        
        # Calculate momentum
        momentum = calculate_momentum_score(stat_trend, sentiment_trend)
        
        # Enhanced value calculation
        if stat_score == 0 and sentiment_score == 0:
            # No data available
            final_value_score = 50.0
            confidence = 0.0
        else:
            # Base score from stats (60% weight)
            stat_component = stat_score * 0.6
            
            # Sentiment component (25% weight)
            # Scale sentiment from -1,1 to match stat scale
            sentiment_scaled = sentiment_score * 30  # Approximate scaling
            sentiment_component = sentiment_scaled * 0.25
            
            # Momentum component (10% weight)
            momentum_component = momentum * 10 * 0.1
            
            # Consistency bonus (5% weight)
            consistency_component = stat_consistency * 20 * 0.05
            
            # Combine all components
            raw_score = stat_component + sentiment_component + momentum_component + consistency_component
            
            # Normalize to 0-100 scale
            final_value_score = normalize_to_100_scale(raw_score)
            
            # Calculate confidence based on data availability
            confidence = min(
                (stat_consistency * 0.4) + 
                (sentiment_volume * 0.4) + 
                (0.2 if stat_score > 0 and sentiment_score != 0 else 0),
                1.0
            )
        
        print(f"  {player_name}:")
        print(f"    Stats: {stat_score:.1f} (trend: {stat_trend:+.2f}, consistency: {stat_consistency:.2f})")
        print(f"    Sentiment: {sentiment_score:+.2f} (trend: {sentiment_trend:+.2f}, volume: {sentiment_volume:.2f})")
        print(f"    Momentum: {momentum:+.2f}")
        print(f"    → Value Score: {final_value_score:.1f} (confidence: {confidence:.2f})")
        
        value_index_to_insert.append({
            "player_id": player_id,
            "value_date": today.isoformat(),
            "value_score": round(final_value_score, 2),
            "stat_component": round(stat_score, 2),
            "sentiment_component": round(sentiment_score, 3),
            "momentum_score": round(momentum, 3),
            "confidence_score": round(confidence, 3)
        })

    # Insert all new value scores
    if value_index_to_insert:
        print(f"\n\nUpserting {len(value_index_to_insert)} records into 'player_value_index'...")
        try:
            response = supabase.table('player_value_index').upsert(
                value_index_to_insert,
                on_conflict='player_id, value_date'
            ).execute()
            
            if response.data:
                print(f"Successfully upserted {len(response.data)} value index records.")
            print("--- ENHANCED VALUE INDEX CALCULATION COMPLETE ---")
        except Exception as e:
            print(f"Error upserting value index records: {e}")
            print("Note: You may need to add new columns to your player_value_index table:")
            print("  - stat_component (float)")
            print("  - sentiment_component (float)")
            print("  - momentum_score (float)")
            print("  - confidence_score (float)")
    else:
        print("No value index records to insert.")

if __name__ == "__main__":
    run_enhanced_value_index_pipeline()
