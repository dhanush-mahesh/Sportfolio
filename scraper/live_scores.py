"""
Live Scores - Real-time NBA game scores and player stats
"""
import os
from dotenv import load_dotenv
from supabase import create_client, Client
import datetime
from nba_api.live.nba.endpoints import scoreboard, boxscore
import time

load_dotenv()
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

class LiveScores:
    """Fetch and manage live NBA scores and stats"""
    
    def __init__(self):
        self.today = datetime.date.today()
    
    def save_games_to_db(self, games, game_date):
        """Save game data to database for historical access"""
        try:
            for game in games:
                game_record = {
                    'game_id': game['game_id'],
                    'game_date': game_date.isoformat() if isinstance(game_date, datetime.date) else game_date,
                    'game_status': game['game_status'],
                    'game_status_text': game['game_status_text'],
                    'period': game['period'],
                    'game_clock': game['game_clock'],
                    'home_team_id': game['home_team']['team_id'],
                    'home_team_name': game['home_team']['team_name'],
                    'home_team_city': game['home_team']['team_city'],
                    'home_team_tricode': game['home_team']['team_tricode'],
                    'home_team_score': game['home_team']['score'],
                    'home_team_wins': game['home_team']['wins'],
                    'home_team_losses': game['home_team']['losses'],
                    'away_team_id': game['away_team']['team_id'],
                    'away_team_name': game['away_team']['team_name'],
                    'away_team_city': game['away_team']['team_city'],
                    'away_team_tricode': game['away_team']['team_tricode'],
                    'away_team_score': game['away_team']['score'],
                    'away_team_wins': game['away_team']['wins'],
                    'away_team_losses': game['away_team']['losses'],
                    'is_live': game['is_live'],
                    'is_final': game['is_final'],
                    'updated_at': datetime.datetime.now().isoformat()
                }
                
                # Upsert (insert or update if exists)
                supabase.table('nba_games').upsert(game_record, on_conflict='game_id').execute()
            
            print(f"✅ Saved {len(games)} games to database")
            
        except Exception as e:
            print(f"Error saving games to database: {e}")
    
    def save_box_score_to_db(self, game_id, box_score):
        """Save player box score data to database"""
        try:
            # Save home team players
            for player in box_score['home_players']:
                player_record = {
                    'game_id': game_id,
                    'player_id': player['player_id'],
                    'player_name': player['name'],
                    'position': player['position'],
                    'minutes': player['minutes'],
                    'points': player['points'],
                    'rebounds': player['rebounds'],
                    'assists': player['assists'],
                    'steals': player['steals'],
                    'blocks': player['blocks'],
                    'turnovers': player['turnovers'],
                    'fg_made': player['fg_made'],
                    'fg_attempted': player['fg_attempted'],
                    'fg_pct': player['fg_pct'],
                    'three_made': player['three_made'],
                    'three_attempted': player['three_attempted'],
                    'plus_minus': player['plus_minus'],
                    'is_home_team': True
                }
                supabase.table('game_player_stats').upsert(player_record, on_conflict='game_id,player_id').execute()
            
            # Save away team players
            for player in box_score['away_players']:
                player_record = {
                    'game_id': game_id,
                    'player_id': player['player_id'],
                    'player_name': player['name'],
                    'position': player['position'],
                    'minutes': player['minutes'],
                    'points': player['points'],
                    'rebounds': player['rebounds'],
                    'assists': player['assists'],
                    'steals': player['steals'],
                    'blocks': player['blocks'],
                    'turnovers': player['turnovers'],
                    'fg_made': player['fg_made'],
                    'fg_attempted': player['fg_attempted'],
                    'fg_pct': player['fg_pct'],
                    'three_made': player['three_made'],
                    'three_attempted': player['three_attempted'],
                    'plus_minus': player['plus_minus'],
                    'is_home_team': False
                }
                supabase.table('game_player_stats').upsert(player_record, on_conflict='game_id,player_id').execute()
            
            print(f"✅ Saved box score for game {game_id}")
            
        except Exception as e:
            print(f"Error saving box score to database: {e}")
    
    def get_games_from_db(self, target_date):
        """Get games from database for a specific date"""
        try:
            date_str = target_date.isoformat() if isinstance(target_date, datetime.date) else target_date
            
            response = supabase.table('nba_games').select('*').eq('game_date', date_str).execute()
            
            if not response.data:
                return []
            
            games = []
            for record in response.data:
                game_data = {
                    'game_id': record['game_id'],
                    'game_status': record['game_status'],
                    'game_status_text': record['game_status_text'],
                    'period': record['period'],
                    'game_clock': record['game_clock'],
                    'home_team': {
                        'team_id': record['home_team_id'],
                        'team_name': record['home_team_name'],
                        'team_city': record['home_team_city'],
                        'team_tricode': record['home_team_tricode'],
                        'score': record['home_team_score'],
                        'wins': record['home_team_wins'],
                        'losses': record['home_team_losses']
                    },
                    'away_team': {
                        'team_id': record['away_team_id'],
                        'team_name': record['away_team_name'],
                        'team_city': record['away_team_city'],
                        'team_tricode': record['away_team_tricode'],
                        'score': record['away_team_score'],
                        'wins': record['away_team_wins'],
                        'losses': record['away_team_losses']
                    },
                    'is_live': record['is_live'],
                    'is_final': record['is_final'],
                    'game_date': date_str
                }
                games.append(game_data)
            
            print(f"📚 Retrieved {len(games)} games from database for {date_str}")
            return games
            
        except Exception as e:
            print(f"Error retrieving games from database: {e}")
            return []
    
    def get_box_score_from_db(self, game_id):
        """Get box score from database for a specific game"""
        try:
            response = supabase.table('game_player_stats').select('*').eq('game_id', game_id).execute()
            
            if not response.data:
                return None
            
            home_players = []
            away_players = []
            
            for record in response.data:
                player_stats = {
                    'player_id': record['player_id'],
                    'name': record['player_name'],
                    'position': record['position'],
                    'minutes': record['minutes'],
                    'points': record['points'],
                    'rebounds': record['rebounds'],
                    'assists': record['assists'],
                    'steals': record['steals'],
                    'blocks': record['blocks'],
                    'turnovers': record['turnovers'],
                    'fg_made': record['fg_made'],
                    'fg_attempted': record['fg_attempted'],
                    'fg_pct': record['fg_pct'],
                    'three_made': record['three_made'],
                    'three_attempted': record['three_attempted'],
                    'plus_minus': record['plus_minus']
                }
                
                if record['is_home_team']:
                    home_players.append(player_stats)
                else:
                    away_players.append(player_stats)
            
            # Sort by points
            home_players.sort(key=lambda x: x['points'], reverse=True)
            away_players.sort(key=lambda x: x['points'], reverse=True)
            
            return {
                'game_id': game_id,
                'home_players': home_players,
                'away_players': away_players,
                'game_status': 3,  # Historical games are final
                'period': 4,
                'game_clock': ''
            }
            
        except Exception as e:
            print(f"Error retrieving box score from database: {e}")
            return None
    
    def get_games_by_date(self, target_date=None):
        """Get all games for a specific date - from DB if historical, from API if today"""
        if target_date is None:
            target_date = self.today
        
        date_str = target_date.strftime('%Y-%m-%d') if isinstance(target_date, datetime.date) else target_date
        
        # If requesting today's games, fetch from API and save to DB
        if target_date == self.today:
            try:
                print(f"\n🏀 Fetching live scores for {target_date}...")
                
                board = scoreboard.ScoreBoard()
                games = board.games.get_dict()
                
                if not games:
                    print(f"No games found for {date_str}")
                    return []
                
                live_games = []
                
                # Helper function to format game clock
                def format_clock(clock_str):
                    if not clock_str or clock_str == '':
                        return ''
                    try:
                        if clock_str.startswith('PT'):
                            clock_str = clock_str[2:]
                            minutes = 0
                            seconds = 0
                            if 'M' in clock_str:
                                parts = clock_str.split('M')
                                minutes = int(parts[0])
                                if 'S' in parts[1]:
                                    seconds = int(float(parts[1].replace('S', '')))
                            elif 'S' in clock_str:
                                seconds = int(float(clock_str.replace('S', '')))
                            return f"{minutes}:{seconds:02d}"
                        return clock_str
                    except:
                        return clock_str
                
                for game in games:
                    game_data = {
                        'game_id': game['gameId'],
                        'game_status': game['gameStatus'],
                        'game_status_text': game['gameStatusText'],
                        'period': game.get('period', 0),
                        'game_clock': format_clock(game.get('gameClock', '')),
                        'home_team': {
                            'team_id': game['homeTeam']['teamId'],
                            'team_name': game['homeTeam']['teamName'],
                            'team_city': game['homeTeam']['teamCity'],
                            'team_tricode': game['homeTeam']['teamTricode'],
                            'score': game['homeTeam']['score'],
                            'wins': game['homeTeam'].get('wins', 0),
                            'losses': game['homeTeam'].get('losses', 0)
                        },
                        'away_team': {
                            'team_id': game['awayTeam']['teamId'],
                            'team_name': game['awayTeam']['teamName'],
                            'team_city': game['awayTeam']['teamCity'],
                            'team_tricode': game['awayTeam']['teamTricode'],
                            'score': game['awayTeam']['score'],
                            'wins': game['awayTeam'].get('wins', 0),
                            'losses': game['awayTeam'].get('losses', 0)
                        },
                        'is_live': game['gameStatus'] == 2,
                        'is_final': game['gameStatus'] == 3,
                        'game_date': date_str
                    }
                    
                    live_games.append(game_data)
                    
                    status = "🔴 LIVE" if game_data['is_live'] else "✅ FINAL" if game_data['is_final'] else "⏰ SCHEDULED"
                    print(f"{status} | {game_data['away_team']['team_tricode']} {game_data['away_team']['score']} @ {game_data['home_team']['team_tricode']} {game_data['home_team']['score']}")
                
                # Save to database
                self.save_games_to_db(live_games, target_date)
                
                return live_games
                
            except Exception as e:
                print(f"Error fetching live scores: {e}")
                # Fallback to database if API fails
                return self.get_games_from_db(target_date)
        else:
            # For historical dates, get from database
            return self.get_games_from_db(target_date)
    
    def get_todays_games(self):
        """Get all games for today with live scores"""
        try:
            print(f"\n🏀 Fetching live scores for {self.today}...")
            
            # Get scoreboard
            board = scoreboard.ScoreBoard()
            games = board.games.get_dict()
            
            if not games:
                print("No games today")
                return []
            
            live_games = []
            
            # Helper function to format game clock
            def format_clock(clock_str):
                if not clock_str or clock_str == '':
                    return ''
                try:
                    if clock_str.startswith('PT'):
                        clock_str = clock_str[2:]
                        minutes = 0
                        seconds = 0
                        if 'M' in clock_str:
                            parts = clock_str.split('M')
                            minutes = int(parts[0])
                            if 'S' in parts[1]:
                                seconds = int(float(parts[1].replace('S', '')))
                        elif 'S' in clock_str:
                            seconds = int(float(clock_str.replace('S', '')))
                        return f"{minutes}:{seconds:02d}"
                    return clock_str
                except:
                    return clock_str
            
            for game in games:
                game_data = {
                    'game_id': game['gameId'],
                    'game_status': game['gameStatus'],  # 1=scheduled, 2=live, 3=finished
                    'game_status_text': game['gameStatusText'],
                    'period': game.get('period', 0),
                    'game_clock': format_clock(game.get('gameClock', '')),
                    'home_team': {
                        'team_id': game['homeTeam']['teamId'],
                        'team_name': game['homeTeam']['teamName'],
                        'team_city': game['homeTeam']['teamCity'],
                        'team_tricode': game['homeTeam']['teamTricode'],
                        'score': game['homeTeam']['score'],
                        'wins': game['homeTeam'].get('wins', 0),
                        'losses': game['homeTeam'].get('losses', 0)
                    },
                    'away_team': {
                        'team_id': game['awayTeam']['teamId'],
                        'team_name': game['awayTeam']['teamName'],
                        'team_city': game['awayTeam']['teamCity'],
                        'team_tricode': game['awayTeam']['teamTricode'],
                        'score': game['awayTeam']['score'],
                        'wins': game['awayTeam'].get('wins', 0),
                        'losses': game['awayTeam'].get('losses', 0)
                    },
                    'is_live': game['gameStatus'] == 2,
                    'is_final': game['gameStatus'] == 3
                }
                
                live_games.append(game_data)
                
                status = "🔴 LIVE" if game_data['is_live'] else "✅ FINAL" if game_data['is_final'] else "⏰ SCHEDULED"
                print(f"{status} | {game_data['away_team']['team_tricode']} {game_data['away_team']['score']} @ {game_data['home_team']['team_tricode']} {game_data['home_team']['score']}")
            
            return live_games
            
        except Exception as e:
            print(f"Error fetching live scores: {e}")
            return []
    
    def get_live_box_score(self, game_id: str, save_to_db=True):
        """Get live box score for a specific game"""
        try:
            print(f"\n📊 Fetching box score for game {game_id}...")
            
            # Try to get from API first
            try:
                box = boxscore.BoxScore(game_id)
                game_data = box.game.get_dict()
            except:
                # If API fails, try database
                print(f"API failed, trying database...")
                return self.get_box_score_from_db(game_id)
            
            # Get player stats
            home_players = []
            away_players = []
            
            # Helper function to safely convert to int
            def safe_int(value, default=0):
                try:
                    return int(value) if value is not None else default
                except (ValueError, TypeError):
                    return default
            
            # Helper function to safely convert to float
            def safe_float(value, default=0.0):
                try:
                    return float(value) if value is not None else default
                except (ValueError, TypeError):
                    return default
            
            # Helper function to format minutes from ISO 8601 duration
            def format_minutes(minutes_str):
                if not minutes_str or minutes_str == '':
                    return '0:00'
                try:
                    if minutes_str.startswith('PT'):
                        minutes_str = minutes_str[2:]
                        minutes = 0
                        seconds = 0
                        if 'M' in minutes_str:
                            parts = minutes_str.split('M')
                            minutes = int(parts[0])
                            if 'S' in parts[1]:
                                seconds = int(float(parts[1].replace('S', '')))
                        elif 'S' in minutes_str:
                            seconds = int(float(minutes_str.replace('S', '')))
                        return f"{minutes}:{seconds:02d}"
                    return minutes_str
                except:
                    return '0:00'
            
            # Home team players
            if hasattr(box, 'home_team_player_stats'):
                for player in box.home_team_player_stats.get_dict():
                    # Stats are nested in 'statistics' object
                    stats = player.get('statistics', {})
                    
                    player_stats = {
                        'player_id': player.get('personId', 0),
                        'name': player.get('name', 'Unknown'),
                        'position': player.get('position', ''),
                        'minutes': format_minutes(stats.get('minutes', '0:00')),
                        'points': safe_int(stats.get('points')),
                        'rebounds': safe_int(stats.get('reboundsTotal')),
                        'assists': safe_int(stats.get('assists')),
                        'steals': safe_int(stats.get('steals')),
                        'blocks': safe_int(stats.get('blocks')),
                        'turnovers': safe_int(stats.get('turnovers')),
                        'fg_made': safe_int(stats.get('fieldGoalsMade')),
                        'fg_attempted': safe_int(stats.get('fieldGoalsAttempted')),
                        'fg_pct': safe_float(stats.get('fieldGoalsPercentage')),
                        'three_made': safe_int(stats.get('threePointersMade')),
                        'three_attempted': safe_int(stats.get('threePointersAttempted')),
                        'plus_minus': safe_int(stats.get('plusMinusPoints'))
                    }
                    home_players.append(player_stats)
            
            # Away team players
            if hasattr(box, 'away_team_player_stats'):
                for player in box.away_team_player_stats.get_dict():
                    # Stats are nested in 'statistics' object
                    stats = player.get('statistics', {})
                    
                    player_stats = {
                        'player_id': player.get('personId', 0),
                        'name': player.get('name', 'Unknown'),
                        'position': player.get('position', ''),
                        'minutes': format_minutes(stats.get('minutes', '0:00')),
                        'points': safe_int(stats.get('points')),
                        'rebounds': safe_int(stats.get('reboundsTotal')),
                        'assists': safe_int(stats.get('assists')),
                        'steals': safe_int(stats.get('steals')),
                        'blocks': safe_int(stats.get('blocks')),
                        'turnovers': safe_int(stats.get('turnovers')),
                        'fg_made': safe_int(stats.get('fieldGoalsMade')),
                        'fg_attempted': safe_int(stats.get('fieldGoalsAttempted')),
                        'fg_pct': safe_float(stats.get('fieldGoalsPercentage')),
                        'three_made': safe_int(stats.get('threePointersMade')),
                        'three_attempted': safe_int(stats.get('threePointersAttempted')),
                        'plus_minus': safe_int(stats.get('plusMinusPoints'))
                    }
                    away_players.append(player_stats)
            
            # Helper function to format game clock from ISO 8601 duration
            def format_game_clock(clock_str):
                if not clock_str or clock_str == '':
                    return ''
                # Convert PT03M46.00S to 3:46
                try:
                    if clock_str.startswith('PT'):
                        clock_str = clock_str[2:]  # Remove 'PT'
                        minutes = 0
                        seconds = 0
                        
                        if 'M' in clock_str:
                            parts = clock_str.split('M')
                            minutes = int(parts[0])
                            if 'S' in parts[1]:
                                seconds = int(float(parts[1].replace('S', '')))
                        elif 'S' in clock_str:
                            seconds = int(float(clock_str.replace('S', '')))
                        
                        return f"{minutes}:{seconds:02d}"
                    return clock_str
                except:
                    return clock_str
            
            box_score_data = {
                'game_id': game_id,
                'home_players': sorted(home_players, key=lambda x: x['points'], reverse=True),
                'away_players': sorted(away_players, key=lambda x: x['points'], reverse=True),
                'game_status': game_data.get('gameStatus', 0),
                'period': game_data.get('period', 0),
                'game_clock': format_game_clock(game_data.get('gameClock', ''))
            }
            
            # Save to database if requested
            if save_to_db:
                self.save_box_score_to_db(game_id, box_score_data)
            
            return box_score_data
            
        except Exception as e:
            print(f"Error fetching box score: {e}")
            # Try database as fallback
            return self.get_box_score_from_db(game_id)
    
    def get_top_performers(self):
        """Get top performers from today's games"""
        try:
            games = self.get_todays_games()
            
            if not games:
                return []
            
            all_performers = []
            
            for game in games:
                if game['is_live'] or game['is_final']:
                    box_score = self.get_live_box_score(game['game_id'])
                    
                    if box_score:
                        # Get top performers from both teams
                        for player in box_score['home_players'][:3]:
                            all_performers.append({
                                **player,
                                'team': game['home_team']['team_tricode'],
                                'opponent': game['away_team']['team_tricode'],
                                'game_status': 'LIVE' if game['is_live'] else 'FINAL'
                            })
                        
                        for player in box_score['away_players'][:3]:
                            all_performers.append({
                                **player,
                                'team': game['away_team']['team_tricode'],
                                'opponent': game['home_team']['team_tricode'],
                                'game_status': 'LIVE' if game['is_live'] else 'FINAL'
                            })
                    
                    time.sleep(1)  # Rate limiting
            
            # Sort by points
            all_performers.sort(key=lambda x: x['points'], reverse=True)
            
            return all_performers[:10]
            
        except Exception as e:
            print(f"Error getting top performers: {e}")
            return []

def display_live_scores():
    """Display live scores in terminal"""
    print("="*60)
    print("🏀 NBA LIVE SCORES")
    print("="*60)
    
    live = LiveScores()
    games = live.get_todays_games()
    
    if not games:
        print("\nNo games scheduled for today")
        return
    
    print(f"\n📅 {live.today.strftime('%A, %B %d, %Y')}")
    print(f"📊 {len(games)} games today\n")
    
    for game in games:
        status = "🔴 LIVE" if game['is_live'] else "✅ FINAL" if game['is_final'] else "⏰ SCHEDULED"
        
        print(f"{status}")
        print(f"{game['away_team']['team_city']} {game['away_team']['team_name']} ({game['away_team']['wins']}-{game['away_team']['losses']})")
        print(f"  Score: {game['away_team']['score']}")
        print(f"@ {game['home_team']['team_city']} {game['home_team']['team_name']} ({game['home_team']['wins']}-{game['home_team']['losses']})")
        print(f"  Score: {game['home_team']['score']}")
        
        if game['is_live']:
            print(f"  Q{game['period']} - {game['game_clock']}")
        elif not game['is_final']:
            print(f"  {game['game_status_text']}")
        
        print()
    
    # Show top performers
    print("\n🌟 TOP PERFORMERS TODAY")
    print("-"*60)
    
    performers = live.get_top_performers()
    
    for i, player in enumerate(performers[:5], 1):
        print(f"{i}. {player['name']} ({player['team']})")
        print(f"   {player['points']} PTS, {player['rebounds']} REB, {player['assists']} AST")
        print(f"   Status: {player['game_status']}")
        print()
    
    print("="*60)

if __name__ == "__main__":
    display_live_scores()
