#!/usr/bin/env python3
"""Test betting advisor to debug why no picks are showing"""

from betting_advisor import BettingAdvisor

print("=" * 60)
print("Testing Betting Advisor")
print("=" * 60)

# Create advisor with real lines
advisor = BettingAdvisor(use_real_lines=True)

print(f"\nReal lines cache has {len(advisor.real_lines_cache)} players")

if advisor.real_lines_cache:
    print("\nSample players in cache:")
    for i, (player_name, props) in enumerate(list(advisor.real_lines_cache.items())[:10]):
        print(f"  {i+1}. {player_name}: {list(props.keys())}")

print("\n" + "=" * 60)
print("Getting picks for today's games...")
print("=" * 60)

picks = advisor.get_top_betting_picks(limit=20, todays_games_only=True)

print(f"\nFound {len(picks)} picks")

if picks:
    for i, pick in enumerate(picks[:5], 1):
        print(f"\n{i}. {pick['player_name']} ({pick['team']})")
        print(f"   {pick['prop_type']}: {pick['recommendation']} {pick['line']}")
        print(f"   Confidence: {pick['confidence_level']}")
        print(f"   Reason: {pick['reason']}")
else:
    print("\n⚠️  No picks found!")
    print("\nThis could mean:")
    print("  1. Players from Odds API don't match database names")
    print("  2. Not enough recent stats for players")
    print("  3. No games scheduled today")
