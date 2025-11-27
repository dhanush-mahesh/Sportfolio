#!/usr/bin/env python3
"""Test script to verify betting picks include last_5_games data"""

from betting_advisor import BettingAdvisor
import json

print("🧪 Testing betting advisor with last_5_games data...\n")

# Create advisor with real lines
advisor = BettingAdvisor(use_real_lines=True)

# Get picks
picks = advisor.get_top_betting_picks(limit=3, todays_games_only=True)

print(f"✅ Got {len(picks)} picks\n")

# Check first pick
if picks:
    first_pick = picks[0]
    print(f"First pick: {first_pick['player_name']} - {first_pick['prop_type']}")
    print(f"Line: {first_pick['line']}")
    print(f"Recommendation: {first_pick['recommendation']}")
    
    if 'last_5_games' in first_pick:
        print(f"\n✅ last_5_games field exists!")
        print(f"Number of games: {len(first_pick['last_5_games'])}")
        print("\nLast 5 games data:")
        for i, game in enumerate(first_pick['last_5_games'], 1):
            print(f"  Game {i}: {game}")
    else:
        print("\n❌ last_5_games field is MISSING!")
    
    print("\n" + "="*60)
    print("Full pick data:")
    print(json.dumps(first_pick, indent=2, default=str))
else:
    print("❌ No picks returned")
