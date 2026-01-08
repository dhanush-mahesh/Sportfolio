"""
Backfill with REAL calendar dates (not system date)
Handles system date being wrong (2026 vs 2025)
"""
import os
from dotenv import load_dotenv
from supabase import create_client
import time
from nba_api.stats.endpoints import scoreboardv2, boxscoretraditionalv3

load_dotenv()
supabase = create_client(
    os.environ.get("SUPABASE_URL"),
    os.environ.get("SUPABASE_KEY")
)

print("="*80)
print("BACKFILL WITH REAL DATES")
print("="*80)
print("\nNBA Season 2025-2026 is currently active")
print("Last successful scrape: December 28, 2025")

# Manually specify the dates to backfill
# These are the actual dates games were played
dates_to_scrape = [
    "2025-12-29",
    "2025-12-30",
    "2025-12-31",
    "2026-01-01",
    "2026-01-02",
    "2026-01-03",
    "2026-01-04",
    "2026-01-05",
    "2026-01-06",
]

print(f"\nWill scrape {len(dates_to_scrape)} dates:")
for date in dates_to_scrape:
    print(f"  - {date}")

response = input("\nContinue? (yes/no): ")
if response.lower() != 'yes':
    print("Cancelled.")
    exit(0)

total_games = 0
total_stats = 0

for date_str in dates_to_scrape:
    print(f"\n{'='*80}")
    print(f"Processing {date_str}")
    print("="*80)
    
    try:
        # Convert to MM/DD/YYYY format for NBA API
        year, month, day = date_str.split('-')
        nba_date_format = f"{month}/{day}/{year}"
        
        print(f"Fetching games for {nba_date_format}...")
        time.sleep(1)
        
        # Get scoreboard
        scoreboard = scoreboardv2.ScoreboardV2(game_date=nba_date_format)
        games = scoreboard.game_header.get_data_frame()
        
        if games.empty:
            print("  No games found")
            continue
        
        game_ids = games['GAME_ID'].tolist()
        print(f"  Found {len(game_ids)} games")
        total_games += len(game_ids)
        
        # Scrape each game
        for idx, game_id in enumerate(game_ids, 1):
            print(f"\n  Game {idx}/{len(game_ids)}: {game_id}")
            
            # Check if already scraped
            existing = supabase.table('daily_player_stats').select('player_id').eq('game_date', date_str).limit(1).execute()
            if existing.data:
                print("    ✅ Already scraped - skipping")
                continue
            
            try:
                time.sleep(0.6)
                
                # Get box score using V3 API
                boxscore = boxscoretraditionalv3.BoxScoreTraditionalV3(game_id=game_id)
                player_stats_df = boxscore.player_stats.get_data_frame()
                
                print(f"    DataFrame shape: {player_stats_df.shape}")
                
                if player_stats_df.empty:
                    print("    ⚠️  No player stats found")
                    continue
                
                stats_to_insert = []
                
                for _, stat in player_stats_df.iterrows():
                    # Get minutes - it's called 'minutes' in V3
                    minutes = stat.get('minutes', '') or ''
                    
                    # Skip players who didn't play
                    if not minutes or minutes == '' or minutes == '0:00':
                        continue
                    
                    # Convert minutes from "MM:SS" format to float
                    if isinstance(minutes, str) and ':' in minutes:
                        try:
                            mins, secs = minutes.split(':')
                            minutes_float = int(mins) + int(secs) / 60
                        except:
                            continue
                    else:
                        try:
                            minutes_float = float(minutes) if minutes else 0
                        except:
                            continue
                    
                    if minutes_float == 0:
                        continue
                    
                    # Convert NBA API player ID (integer) to string format
                    nba_api_id = str(stat['personId'])
                    
                    # Look up the player's UUID in your database using nba_api_id
                    player_lookup = supabase.table('players').select('id').eq('nba_api_id', nba_api_id).limit(1).execute()
                    
                    if not player_lookup.data:
                        # Player not in database, skip
                        continue
                    
                    player_uuid = player_lookup.data[0]['id']
                    
                    stats_to_insert.append({
                        'player_id': player_uuid,  # Use the UUID from your database
                        'game_date': date_str,
                        'points': stat.get('points', 0) or 0,
                        'rebounds': stat.get('reboundsTotal', 0) or 0,
                        'assists': stat.get('assists', 0) or 0,
                        'steals': stat.get('steals', 0) or 0,
                        'blocks': stat.get('blocks', 0) or 0,
                        'turnovers': stat.get('turnovers', 0) or 0,
                        'three_pointers_made': stat.get('threePointersMade', 0) or 0,
                    })
                
                print(f"    Valid stats to insert: {len(stats_to_insert)}")
                
                if stats_to_insert:
                    response = supabase.table('daily_player_stats').upsert(
                        stats_to_insert,
                        on_conflict='player_id,game_date'
                    ).execute()
                    
                    print(f"    ✅ Inserted {len(stats_to_insert)} player stats")
                    total_stats += len(stats_to_insert)
                else:
                    print("    ⚠️  No valid stats")
                    
            except Exception as e:
                print(f"    ❌ Error: {e}")
                continue
                
    except Exception as e:
        print(f"  ❌ Error fetching games: {e}")
        continue

print("\n" + "="*80)
print("BACKFILL COMPLETE")
print("="*80)
print(f"Total games processed: {total_games}")
print(f"Total player stats inserted: {total_stats}")

if total_stats > 0:
    print("\n✅ SUCCESS! Now run:")
    print("1. python enhanced_value_index.py")
    print("2. python verify_database_updates.py (to confirm)")
    print("3. Clear API cache and refresh browser")
else:
    print("\n⚠️  No stats inserted - check errors above")

print("="*80)
