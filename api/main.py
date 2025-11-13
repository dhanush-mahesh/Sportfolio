import os
from fastapi import FastAPI, HTTPException
from dotenv import load_dotenv
from supabase import create_client, Client
from fastapi.middleware.cors import CORSMiddleware

# --- 1. SETUP & CONFIG ---

# Load environment variables from .env file
load_dotenv()
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("Error: Supabase credentials not found in .env file.")
    exit()

# Create Supabase client
supabase: Client = create_client(url, key)

# Create FastAPI app
app = FastAPI()

# --- 2. CORS MIDDLEWARE ---
# This allows your React frontend (on a different URL)
# to make requests to this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins (for development)
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],
)

# --- 3. API ENDPOINTS (from your project plan) ---

@app.get("/")
def read_root():
    return {"message": "Player Asset Market API is running"}

# GET /players
@app.get("/players")
def get_players():
    """
    Lists all players for the search bar.
    """
    try:
        response = supabase.table('players').select('id, full_name, team_name, position').execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# GET /player/<player_id>
@app.get("/player/{player_id}")
def get_player_info(player_id: str):
    """
    Gets a specific player's info (name, team).
    """
    try:
        response = supabase.table('players').select('*').eq('id', player_id).single().execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# GET /player/<player_id>/value_history
@app.get("/player/{player_id}/value_history")
def get_player_value_history(player_id: str):
    """
    This is for the stock chart! Queries the player_value_index table.
    NOTE: This table is empty now, but the endpoint is ready for Phase 2, Stage 3.
    """
    try:
        response = supabase.table('player_value_index').select('value_date, value_score').eq('player_id', player_id).order('value_date').execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# GET /player/<player_id>/stats
@app.get("/player/{player_id}/stats")
def get_player_stats(player_id: str):
    """
    Queries the daily_player_stats table for recent stats.
    (This is a useful endpoint your plan implied)
    """
    try:
        # Get the last 5 games
        response = supabase.table('daily_player_stats').select('*').eq('player_id', player_id).order('game_date', desc=True).limit(5).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# GET /player/<player_id>/news
@app.get("/player/{player_id}/news")
def get_player_news(player_id: str):
    """
    Queries the daily_player_sentiment table for recent headlines.
    """
    try:
        response = supabase.table('daily_player_sentiment').select('article_date, headline_text, sentiment_score').eq('player_id', player_id).order('article_date', desc=True).limit(5).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# GET /market-movers (This is a TO-DO for your value_index script)
@app.get("/market-movers")
def get_market_movers():
    """
    Shows top 5 risers/fallers.
    This requires the player_value_index to be populated.
    This is a placeholder for now.
    """
    return {"risers": [], "fallers": []}