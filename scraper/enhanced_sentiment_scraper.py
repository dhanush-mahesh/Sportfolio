import os
import praw
import feedparser
from transformers import pipeline
from dotenv import load_dotenv
from supabase import create_client, Client
import datetime
import time
import requests
from bs4 import BeautifulSoup

# --- 1. SETUP ---
print("\nStarting Enhanced Sentiment Scraper...")
load_dotenv()

# Supabase
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

# Reddit API (you'll need to create an app at https://www.reddit.com/prefs/apps)
reddit_client_id = os.environ.get("REDDIT_CLIENT_ID")
reddit_client_secret = os.environ.get("REDDIT_CLIENT_SECRET")
reddit_user_agent = os.environ.get("REDDIT_USER_AGENT", "NBA Sentiment Scraper v1.0")

if not url or not key:
    print("Error: SUPABASE_URL or SUPABASE_KEY not found in .env file.")
    exit()

try:
    supabase: Client = create_client(url, key)
    print("Successfully connected to Supabase.")
except Exception as e:
    print(f"Error connecting to Supabase: {e}")
    exit()

# Initialize Reddit API (optional - will skip if not configured)
reddit = None
if reddit_client_id and reddit_client_secret:
    try:
        reddit = praw.Reddit(
            client_id=reddit_client_id,
            client_secret=reddit_client_secret,
            user_agent=reddit_user_agent
        )
        print("Successfully connected to Reddit API.")
    except Exception as e:
        print(f"Warning: Could not connect to Reddit API: {e}")
else:
    print("Reddit API credentials not found. Skipping Reddit sentiment.")

# Load sentiment model
print("Loading sentiment model...")
try:
    model_name = "nlptown/bert-base-multilingual-uncased-sentiment"
    sentiment_pipeline = pipeline("sentiment-analysis", model=model_name)
    print("Sentiment model loaded successfully.")
except Exception as e:
    print(f"Error loading sentiment model: {e}")
    exit()

# --- 2. DATA COLLECTION FUNCTIONS ---

def scrape_reddit_sentiment(player_name, player_id, subreddits=['nba', 'nbadiscussion', 'fantasybball']):
    """Scrape Reddit posts and comments mentioning the player"""
    if not reddit:
        return []
    
    sentiment_data = []
    print(f"  Searching Reddit for '{player_name}'...")
    
    for subreddit_name in subreddits:
        try:
            subreddit = reddit.subreddit(subreddit_name)
            
            # Search for posts mentioning the player (last 24 hours)
            for submission in subreddit.search(player_name, time_filter='day', limit=10):
                text = f"{submission.title} {submission.selftext}"
                if len(text) > 512:
                    text = text[:512]
                
                sentiment_data.append({
                    'player_id': player_id,
                    'source': f'reddit_{subreddit_name}',
                    'text': text,
                    'url': f"https://reddit.com{submission.permalink}",
                    'created_at': datetime.datetime.fromtimestamp(submission.created_utc).isoformat()
                })
                
                # Also check top comments
                submission.comments.replace_more(limit=0)
                for comment in submission.comments[:5]:
                    if len(comment.body) > 50 and player_name.lower() in comment.body.lower():
                        comment_text = comment.body[:512]
                        sentiment_data.append({
                            'player_id': player_id,
                            'source': f'reddit_{subreddit_name}_comment',
                            'text': comment_text,
                            'url': f"https://reddit.com{comment.permalink}",
                            'created_at': datetime.datetime.fromtimestamp(comment.created_utc).isoformat()
                        })
            
            time.sleep(1)  # Rate limiting
            
        except Exception as e:
            print(f"    Error scraping r/{subreddit_name}: {e}")
    
    print(f"    Found {len(sentiment_data)} Reddit mentions")
    return sentiment_data

def scrape_news_headlines(player_name, player_id):
    """Scrape news headlines from multiple RSS feeds"""
    sentiment_data = []
    
    feeds = [
        ("https://www.espn.com/espn/rss/nba/news", "espn"),
        ("https://www.cbssports.com/rss/headlines/nba/", "cbssports"),
        ("https://sports.yahoo.com/nba/rss.xml", "yahoo")
    ]
    
    print(f"  Searching news feeds for '{player_name}'...")
    
    # Parse name parts
    full_name = player_name.lower()
    name_parts = player_name.split()
    first_name = name_parts[0].lower() if name_parts else ""
    last_name = name_parts[-1].lower() if len(name_parts) > 1 else ""
    
    source_counts = {}
    
    for feed_url, source_name in feeds:
        try:
            feed = feedparser.parse(feed_url)
            count = 0
            
            for entry in feed.entries:
                headline = entry.title.lower()
                
                # Priority 1: Full name match (most specific)
                if full_name in headline:
                    sentiment_data.append({
                        'player_id': player_id,
                        'source': f'news_{source_name}',
                        'text': entry.title,
                        'url': entry.link,
                        'created_at': datetime.datetime.now().isoformat()
                    })
                    count += 1
                # Priority 2: First + Last name both present (but not together)
                elif first_name and last_name and first_name in headline and last_name in headline:
                    sentiment_data.append({
                        'player_id': player_id,
                        'source': f'news_{source_name}',
                        'text': entry.title,
                        'url': entry.link,
                        'created_at': datetime.datetime.now().isoformat()
                    })
                    count += 1
                # Priority 3: Last name only (if unique enough, first name not in headline, and no other common first names)
                # Skip this to avoid false matches with family members (e.g., Giannis vs Thanasis Antetokounmpo)
                # Only match if we're very confident it's about this specific player
            
            source_counts[source_name] = count
            
        except Exception as e:
            print(f"    Error scraping {source_name}: {e}")
            source_counts[source_name] = 0
    
    # Detailed logging
    total = len(sentiment_data)
    if total > 0:
        details = ", ".join([f"{name}: {count}" for name, count in source_counts.items() if count > 0])
        print(f"    Found {total} news mentions ({details})")
    else:
        print(f"    Found 0 news mentions (ESPN: {source_counts.get('espn', 0)}, CBS: {source_counts.get('cbssports', 0)}, Yahoo: {source_counts.get('yahoo', 0)})")
    
    return sentiment_data

def scrape_bleacher_report(player_name, player_id):
    """Scrape Bleacher Report articles"""
    sentiment_data = []
    
    try:
        # Search Bleacher Report
        search_url = f"https://bleacherreport.com/search?query={player_name.replace(' ', '+')}"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        response = requests.get(search_url, headers=headers, timeout=10)
        if response.status_code == 200:
            soup = BeautifulSoup(response.content, 'html.parser')
            articles = soup.find_all('article', limit=5)
            
            for article in articles:
                title_elem = article.find('h3') or article.find('h2')
                if title_elem:
                    title = title_elem.get_text(strip=True)
                    link_elem = article.find('a')
                    link = link_elem['href'] if link_elem and 'href' in link_elem.attrs else ''
                    
                    sentiment_data.append({
                        'player_id': player_id,
                        'source': 'bleacher_report',
                        'text': title,
                        'url': link,
                        'created_at': datetime.datetime.now().isoformat()
                    })
        
        if len(sentiment_data) > 0:
            print(f"    Found {len(sentiment_data)} Bleacher Report mentions")
        else:
            print(f"    Found 0 Bleacher Report mentions")
        
    except Exception as e:
        print(f"    Error scraping Bleacher Report: {e}")
        print(f"    Found 0 Bleacher Report mentions")
    
    return sentiment_data

# --- 3. SENTIMENT ANALYSIS ---

def analyze_sentiment(text):
    """Analyze sentiment and return normalized score (-1 to +1)"""
    try:
        result = sentiment_pipeline(text[:512])[0]  # Truncate to model max length
        label = result['label']
        confidence = result['score']
        
        # Convert 1-5 star rating to -1 to +1 scale
        score_map = {
            '5 stars': 1.0,
            '4 stars': 0.5,
            '3 stars': 0.0,
            '2 stars': -0.5,
            '1 star': -1.0
        }
        
        base_score = score_map.get(label, 0.0)
        # Weight by confidence
        return base_score * confidence
        
    except Exception as e:
        print(f"    Error analyzing sentiment: {e}")
        return 0.0

def calculate_weighted_sentiment(sentiment_records):
    """Calculate weighted average sentiment with recency bias"""
    if not sentiment_records:
        return 0.0
    
    # Weight sources differently
    source_weights = {
        'reddit_nba': 1.2,
        'reddit_nbadiscussion': 1.3,
        'reddit_fantasybball': 1.1,
        'reddit_nba_comment': 1.0,
        'reddit_nbadiscussion_comment': 1.1,
        'reddit_fantasybball_comment': 0.9,
        'news_espn': 1.5,
        'news_cbssports': 1.3,
        'news_yahoo': 1.2,
        'bleacher_report': 1.4
    }
    
    total_weighted_score = 0
    total_weight = 0
    
    for record in sentiment_records:
        source = record['source']
        score = record['sentiment_score']
        weight = source_weights.get(source, 1.0)
        
        total_weighted_score += score * weight
        total_weight += weight
    
    return total_weighted_score / total_weight if total_weight > 0 else 0.0

# --- 4. MAIN EXECUTION ---

def run_enhanced_sentiment_pipeline():
    print("\nFetching player list from Supabase...")
    player_map = {}
    
    try:
        response = supabase.table('players').select('id, full_name').execute()
        if not response.data:
            print("No players found. Exiting.")
            return
        
        for player in response.data:
            player_map[player['full_name']] = player['id']
        
        print(f"Found {len(player_map)} players to analyze.")
    except Exception as e:
        print(f"Error fetching players: {e}")
        return
    
    all_sentiment_data = []
    today = datetime.date.today().isoformat()
    
    for player_name, player_id in player_map.items():
        print(f"\nProcessing: {player_name}")
        
        # Collect data from all sources
        reddit_data = scrape_reddit_sentiment(player_name, player_id)
        news_data = scrape_news_headlines(player_name, player_id)
        br_data = scrape_bleacher_report(player_name, player_id)
        
        combined_data = reddit_data + news_data + br_data
        
        if not combined_data:
            print(f"  No mentions found for {player_name}")
            continue
        
        # Analyze sentiment for each piece of content
        for item in combined_data:
            sentiment_score = analyze_sentiment(item['text'])
            item['sentiment_score'] = sentiment_score
            item['article_date'] = today
            item['headline_text'] = item['text'][:500]  # Truncate for storage
            item['article_guid'] = f"{item['source']}_{item['url']}"
            
            # Remove temporary fields
            item.pop('text', None)
            item.pop('created_at', None)
            
            all_sentiment_data.append(item)
        
        # Calculate and display weighted sentiment
        weighted_sentiment = calculate_weighted_sentiment(combined_data)
        print(f"  Weighted sentiment: {weighted_sentiment:.3f} (from {len(combined_data)} sources)")
        
        time.sleep(2)  # Rate limiting between players
    
    # Insert all sentiment data
    if all_sentiment_data:
        print(f"\n\nUpserting {len(all_sentiment_data)} sentiment records...")
        try:
            # Insert in batches to avoid timeout
            batch_size = 100
            for i in range(0, len(all_sentiment_data), batch_size):
                batch = all_sentiment_data[i:i+batch_size]
                response = supabase.table('daily_player_sentiment').upsert(
                    batch,
                    on_conflict='player_id, article_guid'
                ).execute()
                print(f"  Upserted batch {i//batch_size + 1}/{(len(all_sentiment_data)-1)//batch_size + 1}")
                time.sleep(1)
            
            print("--- ENHANCED SENTIMENT SCRAPE COMPLETE ---")
        except Exception as e:
            print(f"Error upserting sentiment: {e}")
    else:
        print("\nNo sentiment data to insert.")

if __name__ == "__main__":
    run_enhanced_sentiment_pipeline()
