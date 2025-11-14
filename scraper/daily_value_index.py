import os
from dotenv import load_dotenv
from supabase import create_client, Client
import datetime

# --- 1. SETUP ---
print("\nStarting Value Index Calculator (Phase 2, Stage 3)...")
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
    """
    Calculates a simple fantasy score based on a common formula.
    (1*pts + 1.2*reb + 1.5*ast + 3*stl + 3*blk - 1*tov)
    """
    return (
        stats['points'] +
        (stats['rebounds'] * 1.2) +
        (stats['assists'] * 1.5) +
        (stats['steals'] * 3) +
        (stats['blocks'] * 3) -
        stats['turnovers']
    )

def get_stat_score(player_id, start_date):
    """
    Gets the average fantasy score for a player over the last 7 days.
    """
    try:
        response = supabase.table('daily_player_stats') \
            .select('points, rebounds, assists, steals, blocks, turnovers') \
            .eq('player_id', player_id) \
            .gte('game_date', start_date) \
            .execute()
        
        if not response.data:
            return 0  # No stats in the last 7 days

        fantasy_scores = [calculate_fantasy_score(game) for game in response.data]
        return sum(fantasy_scores) / len(fantasy_scores)

    except Exception as e:
        print(f"  Error fetching stats for player {player_id}: {e}")
        return 0

def get_sentiment_score(player_id, start_date):
    """
    Gets the average sentiment score for a player over the last 3 days.
    """
    try:
        response = supabase.table('daily_player_sentiment') \
            .select('sentiment_score') \
            .eq('player_id', player_id) \
            .gte('article_date', start_date) \
            .execute()
            
        if not response.data:
            return 0  # No sentiment in the last 3 days
            
        scores = [item['sentiment_score'] for item in response.data]
        avg_score = sum(scores) / len(scores)
        
        # Scale sentiment from -1 -> +1 to a 0 -> 100 range
        return (avg_score * 50) + 50

    except Exception as e:
        print(f"  Error fetching sentiment for player {player_id}: {e}")
        return 0

# --- 3. MAIN EXECUTION ---
def run_value_index_pipeline():
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
    stats_start_date = (today - datetime.timedelta(days=7)).isoformat()
    sentiment_start_date = (today - datetime.timedelta(days=3)).isoformat()
    
    value_index_to_insert = []

    for player in players:
        player_id = player['id']
        
        stat_score = get_stat_score(player_id, stats_start_date)
        sentiment_score = get_sentiment_score(player_id, sentiment_start_date)

        if stat_score == 0 and sentiment_score == 0:
            final_value_score = 50.0
        elif stat_score == 0:
            final_value_score = sentiment_score
        elif sentiment_score == 0:
            final_value_score = stat_score
        else:
            final_value_score = (0.7 * stat_score) + (0.3 * sentiment_score)

        print(f"  Processed {player['full_name']}: Stats({stat_score:.2f}), Sent({sentiment_score:.2f}) -> Value: {final_value_score:.2f}")

        value_index_to_insert.append({
            "player_id": player_id,
            "value_date": today.isoformat(),
            "value_score": final_value_score
        })

    # --- 4. INSERT all new value scores ---
    if value_index_to_insert:
        # --- ⭐️ THIS IS THE FIX ⭐️ ---
        print(f"\nUpserting {len(value_index_to_insert)} records into 'player_value_index'...")
        try:
            # Use upsert with the column names from your unique constraint
            response = supabase.table('player_value_index').upsert(
                value_index_to_insert,
                on_conflict='player_id, value_date'
            ).execute()
            
            if response.data:
                print(f"Successfully upserted {len(response.data)} value index records.")
            print("--- VALUE INDEX CALCULATION COMPLETE ---")
        except Exception as e:
            print(f"Error upserting value index records: {e}")
    else:
        print("No value index records to insert.")

if __name__ == "__main__":
    run_value_index_pipeline()