"""
Debug script to see what the NBA API returns for box scores
"""
from nba_api.live.nba.endpoints import scoreboard, boxscore
import json

# Get today's games
print("Fetching today's games...\n")
board = scoreboard.ScoreBoard()
games = board.games.get_dict()

if not games:
    print("No games today")
    exit()

# Get the first game
game = games[0]
game_id = game['gameId']
print(f"Game ID: {game_id}")
print(f"Status: {game['gameStatusText']}")
print(f"{game['awayTeam']['teamTricode']} @ {game['homeTeam']['teamTricode']}\n")

# Get box score
print("Fetching box score...\n")
try:
    box = boxscore.BoxScore(game_id)
    
    # Check what attributes are available
    print("Available attributes:")
    print([attr for attr in dir(box) if not attr.startswith('_')])
    print()
    
    # Try to get player stats
    if hasattr(box, 'home_team_player_stats'):
        print("Home team player stats structure:")
        home_stats = box.home_team_player_stats.get_dict()
        if home_stats:
            print(f"First player: {json.dumps(home_stats[0], indent=2)}")
    
    if hasattr(box, 'away_team_player_stats'):
        print("\nAway team player stats structure:")
        away_stats = box.away_team_player_stats.get_dict()
        if away_stats:
            print(f"First player: {json.dumps(away_stats[0], indent=2)}")
    
    # Check game data
    if hasattr(box, 'game'):
        print("\nGame data:")
        game_data = box.game.get_dict()
        print(f"Game clock: {game_data.get('gameClock')}")
        print(f"Period: {game_data.get('period')}")
        print(f"Status: {game_data.get('gameStatus')}")
        
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
