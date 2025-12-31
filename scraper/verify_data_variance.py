"""
Check if we have players with actual varying data for ML training
"""
import os
from dotenv import load_dotenv
from supabase import create_client
import numpy as np

load_dotenv()
supabase = create_client(
    os.environ.get("SUPABASE_URL"),
    os.environ.get("SUPABASE_KEY")
)

print("="*80)
print("CHECKING DATA VARIANCE FOR ML TRAINING")
print("="*80)

# Get all players with recent data
response = supabase.table('player_value_index').select(
    'player_id, value_score, stat_component, sentiment_component, momentum_score'
).order('value_date', desc=True).limit(1000).execute()

print(f"\nTotal records: {len(response.data)}")

# Group by player
player_data = {}
for record in response.data:
    player_id = record['player_id']
    if player_id not in player_data:
        player_data[player_id] = []
    player_data[player_id].append(record)

print(f"Total players: {len(player_data)}")

# Find players with variance
players_with_variance = []

for player_id, records in player_data.items():
    if len(records) < 5:
        continue
    
    values = [r['value_score'] for r in records]
    stats = [r['stat_component'] for r in records]
    
    value_std = np.std(values)
    stat_std = np.std(stats)
    
    # Check if there's actual variance
    if value_std > 1 or stat_std > 1:  # More than 1 point variance
        players_with_variance.append({
            'player_id': player_id,
            'records': len(records),
            'value_std': value_std,
            'stat_std': stat_std,
            'value_range': (min(values), max(values)),
            'stat_range': (min(stats), max(stats))
        })

print(f"\nPlayers with actual variance: {len(players_with_variance)}")

if players_with_variance:
    # Sort by variance
    players_with_variance.sort(key=lambda x: x['value_std'], reverse=True)
    
    print("\nTop 10 players with most variance (best for ML training):")
    print("-"*80)
    
    for i, player in enumerate(players_with_variance[:10], 1):
        # Get player name
        player_info = supabase.table('players').select('full_name').eq('id', player['player_id']).single().execute()
        name = player_info.data['full_name']
        
        print(f"{i}. {name}")
        print(f"   Records: {player['records']}")
        print(f"   Value range: {player['value_range'][0]:.1f} - {player['value_range'][1]:.1f}")
        print(f"   Value std dev: {player['value_std']:.2f}")
        print(f"   Stat range: {player['stat_range'][0]:.1f} - {player['stat_range'][1]:.1f}")
        print(f"   Stat std dev: {player['stat_std']:.2f}")
        print()
else:
    print("\n❌ NO PLAYERS WITH VARIANCE FOUND!")
    print("\nThis means:")
    print("1. All players have constant value scores (50.00)")
    print("2. No actual stats or sentiment data is being collected")
    print("3. ML models can't learn from flat data")
    print("\nSolution:")
    print("- Run the daily stats scraper to collect real game data")
    print("- Run the sentiment scraper to collect social media data")
    print("- Run the value index calculator to compute varying scores")
    print("- Wait a few days to accumulate data with natural variance")

print("="*80)
