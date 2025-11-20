"""
Test script to verify your enhanced sentiment setup
"""
import os
from dotenv import load_dotenv

print("\n" + "="*60)
print("ENHANCED SENTIMENT SETUP TEST")
print("="*60)

# Test 1: Load environment variables
print("\n[1/6] Testing environment variables...")
load_dotenv()

supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_KEY")
reddit_client_id = os.environ.get("REDDIT_CLIENT_ID")
reddit_client_secret = os.environ.get("REDDIT_CLIENT_SECRET")

if supabase_url and supabase_key:
    print("  ✓ Supabase credentials found")
else:
    print("  ✗ Supabase credentials missing")
    exit(1)

if reddit_client_id and reddit_client_secret:
    print("  ✓ Reddit API credentials found")
    reddit_available = True
else:
    print("  ⚠ Reddit API credentials not found (optional)")
    reddit_available = False

# Test 2: Import required packages
print("\n[2/6] Testing required packages...")
try:
    import supabase
    print("  ✓ supabase")
except ImportError:
    print("  ✗ supabase - run: pip install supabase")
    exit(1)

try:
    import feedparser
    print("  ✓ feedparser")
except ImportError:
    print("  ✗ feedparser - run: pip install feedparser")
    exit(1)

try:
    import transformers
    print("  ✓ transformers")
except ImportError:
    print("  ✗ transformers - run: pip install transformers")
    exit(1)

try:
    import praw
    print("  ✓ praw (Reddit)")
except ImportError:
    print("  ✗ praw - run: pip install praw")
    if reddit_available:
        exit(1)

try:
    from bs4 import BeautifulSoup
    print("  ✓ beautifulsoup4")
except ImportError:
    print("  ✗ beautifulsoup4 - run: pip install beautifulsoup4")
    exit(1)

try:
    import numpy
    print("  ✓ numpy")
except ImportError:
    print("  ✗ numpy - run: pip install numpy")
    exit(1)

# Test 3: Connect to Supabase
print("\n[3/6] Testing Supabase connection...")
try:
    from supabase import create_client, Client
    client: Client = create_client(supabase_url, supabase_key)
    print("  ✓ Connected to Supabase")
except Exception as e:
    print(f"  ✗ Failed to connect: {e}")
    exit(1)

# Test 4: Check database tables
print("\n[4/6] Testing database tables...")
try:
    response = client.table('players').select('id').limit(1).execute()
    print("  ✓ 'players' table accessible")
except Exception as e:
    print(f"  ✗ 'players' table error: {e}")

try:
    response = client.table('daily_player_sentiment').select('*').limit(1).execute()
    print("  ✓ 'daily_player_sentiment' table accessible")
except Exception as e:
    print(f"  ✗ 'daily_player_sentiment' table error: {e}")

try:
    response = client.table('player_value_index').select('*').limit(1).execute()
    print("  ✓ 'player_value_index' table accessible")
except Exception as e:
    print(f"  ✗ 'player_value_index' table error: {e}")

# Test 5: Test Reddit API (if configured)
if reddit_available:
    print("\n[5/6] Testing Reddit API...")
    try:
        reddit = praw.Reddit(
            client_id=reddit_client_id,
            client_secret=reddit_client_secret,
            user_agent=os.environ.get("REDDIT_USER_AGENT", "NBA Sentiment Test")
        )
        # Try to access a subreddit
        subreddit = reddit.subreddit('nba')
        post = next(subreddit.hot(limit=1))
        print(f"  ✓ Reddit API working (found post: '{post.title[:50]}...')")
    except Exception as e:
        print(f"  ✗ Reddit API error: {e}")
else:
    print("\n[5/6] Skipping Reddit API test (not configured)")

# Test 6: Test sentiment model
print("\n[6/6] Testing sentiment model...")
try:
    from transformers import pipeline
    print("  Loading model (this may take a moment)...")
    sentiment_pipeline = pipeline("sentiment-analysis", model="nlptown/bert-base-multilingual-uncased-sentiment")
    
    # Test with a sample text
    test_text = "LeBron James had an amazing game with 30 points!"
    result = sentiment_pipeline(test_text)[0]
    print(f"  ✓ Sentiment model working")
    print(f"    Test: '{test_text}'")
    print(f"    Result: {result['label']} (confidence: {result['score']:.2f})")
except Exception as e:
    print(f"  ✗ Sentiment model error: {e}")
    exit(1)

# Summary
print("\n" + "="*60)
print("SETUP TEST COMPLETE")
print("="*60)
print("\n✓ All critical components are working!")
if not reddit_available:
    print("\n⚠ Note: Reddit API not configured. The scraper will work but")
    print("  will only collect data from news sources.")
    print("  To enable Reddit: See SETUP_GUIDE.md")
print("\nYou're ready to run:")
print("  python enhanced_sentiment_scraper.py")
print("  python enhanced_value_index.py")
print("\nOr use the combined script:")
print("  ./run_enhanced.sh")
print("\n" + "="*60 + "\n")
