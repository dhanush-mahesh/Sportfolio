import os
import feedparser
from transformers import pipeline
from dotenv import load_dotenv
from supabase import create_client, Client
import datetime
import time

# --- 1. SETUP ---
print("\nStarting Sentiment Scraper (Phase 2, Stage 2)...")
load_dotenv()
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("Error: SUPABASE_URL or SUPABASE_KEY not found in .env file.")
    exit()

try:
    supabase: Client = create_client(url, key)
    print("Successfully connected to Supabase.")
except Exception as e:
    print(f"Error connecting to Supabase: {e}")
    exit()

print("Loading sentiment model (this may take a moment)...")
try:
    sentiment_pipeline = pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english")
    print("Sentiment model loaded successfully.")
except Exception as e:
    print(f"Error loading sentiment model: {e}")
    exit()

# --- 2. MAIN EXECUTION ---
def run_sentiment_pipeline():
    print("Fetching player list from Supabase...")
    player_map = {} # Maps {full_name: supabase_id}
    try:
        response = supabase.table('players').select('id, full_name').execute()
        if not response.data:
            print("No players found. Exiting sentiment scraper.")
            return
        for player in response.data:
            player_map[player['full_name']] = player['id']
        print(f"Found {len(player_map)} players to check against headlines.")
    except Exception as e:
        print(f"Error fetching players: {e}")
        return

    print("Fetching ESPN NBA RSS feed...")
    feed_url = "https://www.espn.com/espn/rss/nba/news"
    feed = feedparser.parse(feed_url)
    
    if not feed.entries:
        print("No articles found in RSS feed.")
        return
        
    print(f"Found {len(feed.entries)} articles.")
    
    sentiment_to_insert = []
    today = datetime.date.today().isoformat()
    processed_pairs = set()

    for entry in feed.entries:
        headline = entry.title
        article_guid = entry.id 
        
        for player_name, player_id in player_map.items():
            if f" {player_name} " in f" {headline} ":
                
                if (player_id, article_guid) in processed_pairs:
                    continue 

                print(f"  Found match: '{player_name}' in headline: '{headline}'")
                
                try:
                    result = sentiment_pipeline(headline)[0]
                    label = result['label']
                    score = result['score']
                    
                    if label == 'NEGATIVE':
                        sentiment_score = -score
                    else:
                        sentiment_score = score
                        
                    sentiment_obj = {
                        "player_id": player_id,
                        "article_date": today,
                        "headline_text": headline,
                        "sentiment_score": sentiment_score,
                        "article_guid": article_guid
                    }
                    sentiment_to_insert.append(sentiment_obj)
                    processed_pairs.add((player_id, article_guid))
                    
                except Exception as e:
                    print(f"    Error analyzing sentiment for headline: {e}")

    if sentiment_to_insert:
        print(f"\nUpserting {len(sentiment_to_insert)} sentiment records...")
        try:
            # --- ⭐️ THIS IS THE FIX ⭐️ ---
            # Use the COLUMN NAMES, not the constraint name
            response = supabase.table('daily_player_sentiment').upsert(
                sentiment_to_insert, 
                on_conflict='player_id, article_guid'
            ).execute()
            
            if response.data:
                print(f"Successfully upserted {len(response.data)} sentiment records.")
            print("--- SENTIMENT SCRAPE COMPLETE ---")
        except Exception as e:
            print(f"Error upserting sentiment: {e}")
    else:
        print("\nNo new player sentiment to insert.")

if __name__ == "__main__":
    run_sentiment_pipeline()