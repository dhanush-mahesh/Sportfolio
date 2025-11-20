"""
Comparison script to show the difference between old and new sentiment analysis
"""
import os
from dotenv import load_dotenv
from supabase import create_client, Client
import datetime

load_dotenv()
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

def compare_sentiment_coverage():
    """Compare sentiment data coverage between old and new system"""
    
    today = datetime.date.today().isoformat()
    yesterday = (datetime.date.today() - datetime.timedelta(days=1)).isoformat()
    
    print("\n" + "="*60)
    print("SENTIMENT ANALYSIS COMPARISON")
    print("="*60)
    
    # Get all players
    players_response = supabase.table('players').select('id, full_name').execute()
    total_players = len(players_response.data)
    
    # Count players with sentiment data today
    sentiment_response = supabase.table('daily_player_sentiment') \
        .select('player_id, source, sentiment_score') \
        .eq('article_date', today) \
        .execute()
    
    if not sentiment_response.data:
        print(f"\nNo sentiment data found for today ({today})")
        print("Try running: python enhanced_sentiment_scraper.py")
        return
    
    # Group by player
    player_sentiment = {}
    source_breakdown = {}
    
    for record in sentiment_response.data:
        player_id = record['player_id']
        source = record.get('source', 'unknown')
        
        if player_id not in player_sentiment:
            player_sentiment[player_id] = []
        player_sentiment[player_id].append(record)
        
        # Count sources
        source_breakdown[source] = source_breakdown.get(source, 0) + 1
    
    players_with_sentiment = len(player_sentiment)
    total_mentions = len(sentiment_response.data)
    
    print(f"\nCOVERAGE STATS:")
    print(f"  Total Players: {total_players}")
    print(f"  Players with Sentiment: {players_with_sentiment} ({players_with_sentiment/total_players*100:.1f}%)")
    print(f"  Total Mentions: {total_mentions}")
    print(f"  Avg Mentions per Player: {total_mentions/players_with_sentiment:.1f}")
    
    print(f"\nSOURCE BREAKDOWN:")
    for source, count in sorted(source_breakdown.items(), key=lambda x: x[1], reverse=True):
        print(f"  {source}: {count} mentions")
    
    # Show top players by mention volume
    print(f"\nTOP 10 MOST MENTIONED PLAYERS:")
    player_mention_counts = [(pid, len(mentions)) for pid, mentions in player_sentiment.items()]
    player_mention_counts.sort(key=lambda x: x[1], reverse=True)
    
    for i, (player_id, count) in enumerate(player_mention_counts[:10], 1):
        player_name = next(p['full_name'] for p in players_response.data if p['id'] == player_id)
        avg_sentiment = sum(m['sentiment_score'] for m in player_sentiment[player_id]) / count
        print(f"  {i}. {player_name}: {count} mentions (avg sentiment: {avg_sentiment:+.2f})")
    
    # Show sentiment distribution
    print(f"\nSENTIMENT DISTRIBUTION:")
    all_scores = [r['sentiment_score'] for r in sentiment_response.data]
    positive = sum(1 for s in all_scores if s > 0.2)
    neutral = sum(1 for s in all_scores if -0.2 <= s <= 0.2)
    negative = sum(1 for s in all_scores if s < -0.2)
    
    print(f"  Positive (>0.2): {positive} ({positive/len(all_scores)*100:.1f}%)")
    print(f"  Neutral (-0.2 to 0.2): {neutral} ({neutral/len(all_scores)*100:.1f}%)")
    print(f"  Negative (<-0.2): {negative} ({negative/len(all_scores)*100:.1f}%)")
    
    print("\n" + "="*60)

def compare_value_index():
    """Compare value index scores"""
    
    today = datetime.date.today().isoformat()
    
    print("\n" + "="*60)
    print("VALUE INDEX COMPARISON")
    print("="*60)
    
    # Get today's value index
    value_response = supabase.table('player_value_index') \
        .select('player_id, value_score, stat_component, sentiment_component, momentum_score, confidence_score') \
        .eq('value_date', today) \
        .execute()
    
    if not value_response.data:
        print(f"\nNo value index data found for today ({today})")
        print("Try running: python enhanced_value_index.py")
        return
    
    # Get player names
    players_response = supabase.table('players').select('id, full_name').execute()
    player_names = {p['id']: p['full_name'] for p in players_response.data}
    
    # Sort by value score
    sorted_values = sorted(value_response.data, key=lambda x: x['value_score'], reverse=True)
    
    print(f"\nTOP 15 PLAYERS BY VALUE SCORE:")
    print(f"{'Rank':<6}{'Player':<25}{'Value':<10}{'Stats':<10}{'Sentiment':<12}{'Momentum':<12}{'Confidence':<12}")
    print("-" * 95)
    
    for i, record in enumerate(sorted_values[:15], 1):
        player_name = player_names.get(record['player_id'], 'Unknown')
        value = record['value_score']
        stats = record.get('stat_component', 0)
        sentiment = record.get('sentiment_component', 0)
        momentum = record.get('momentum_score', 0)
        confidence = record.get('confidence_score', 0)
        
        print(f"{i:<6}{player_name:<25}{value:<10.1f}{stats:<10.1f}{sentiment:<12.2f}{momentum:<12.2f}{confidence:<12.2f}")
    
    print(f"\nBOTTOM 10 PLAYERS BY VALUE SCORE:")
    print(f"{'Rank':<6}{'Player':<25}{'Value':<10}{'Stats':<10}{'Sentiment':<12}{'Momentum':<12}{'Confidence':<12}")
    print("-" * 95)
    
    for i, record in enumerate(sorted_values[-10:], 1):
        player_name = player_names.get(record['player_id'], 'Unknown')
        value = record['value_score']
        stats = record.get('stat_component', 0)
        sentiment = record.get('sentiment_component', 0)
        momentum = record.get('momentum_score', 0)
        confidence = record.get('confidence_score', 0)
        
        print(f"{i:<6}{player_name:<25}{value:<10.1f}{stats:<10.1f}{sentiment:<12.2f}{momentum:<12.2f}{confidence:<12.2f}")
    
    # Show players with highest momentum
    momentum_sorted = sorted(value_response.data, key=lambda x: x.get('momentum_score', 0), reverse=True)
    
    print(f"\nTOP 10 PLAYERS BY MOMENTUM (Rising Stars):")
    for i, record in enumerate(momentum_sorted[:10], 1):
        player_name = player_names.get(record['player_id'], 'Unknown')
        momentum = record.get('momentum_score', 0)
        value = record['value_score']
        print(f"  {i}. {player_name}: Momentum {momentum:+.3f} (Value: {value:.1f})")
    
    print("\n" + "="*60)

if __name__ == "__main__":
    compare_sentiment_coverage()
    compare_value_index()
