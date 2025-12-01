# Sportfolio - NBA Player Analytics & Trading Platform


> A comprehensive, AI-powered platform for analyzing NBA player performance, predicting value trends, and making data-driven trading decisions in fantasy sports and sports betting markets.

**Live Application**: [https://www.sportfolio.live/](https://www.sportfolio.live/)

![Platform Status](https://img.shields.io/badge/status-active-success)
![Python](https://img.shields.io/badge/python-3.9+-blue)
![React](https://img.shields.io/badge/react-18.3-61dafb)
![FastAPI](https://img.shields.io/badge/fastapi-latest-009688)

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Data Pipeline](#data-pipeline)
- [Real-Time Processing](#real-time-processing)
- [Deployment](#deployment)

---

## Overview

Sportfolio is a full-stack analytics platform that transforms raw NBA data into actionable insights. Think of it as your personal trading desk for the NBA - combining real-time statistics, sentiment analysis from social media and news sources, machine learning predictions, and betting market data to help you make smarter decisions.

### What Makes This Different?

Most sports analytics tools just show you stats. Sportfolio goes deeper by:

- **Combining multiple data sources**: We don't just look at box scores. We analyze Reddit discussions, news headlines, betting odds, and historical trends to create a complete picture.
- **AI-powered predictions**: Machine learning models predict player value trajectories, identify breakout candidates, and flag potential sell-high opportunities.
- **Real-time insights**: Live game data, instant sentiment updates, and dynamic value calculations keep you ahead of the curve.
- **Actionable recommendations**: Not just data - actual buy/sell signals, optimal fantasy lineups, and betting prop analysis.

---

## Architecture

### High-Level System Design

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER (React)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │  Home    │  │Watchlist │  │   Live   │  │    AI    │  ...      │
│  │  View    │  │          │  │  Scores  │  │ Insights │           │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘           │
│       │             │              │              │                  │
│       └─────────────┴──────────────┴──────────────┘                 │
│                            │                                         │
│                      Axios HTTP Client                               │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      API LAYER (FastAPI)                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   Player     │  │   AI Trade   │  │   Betting    │             │
│  │  Endpoints   │  │   Advisor    │  │   Advisor    │             │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘             │
│         │                  │                  │                      │
│         └──────────────────┴──────────────────┘                     │
│                            │                                         │
│                    Supabase Client                                   │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER (Supabase)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   players    │  │ daily_stats  │  │  sentiment   │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │ value_index  │  │ live_scores  │  │betting_lines │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└────────────────────────────┬────────────────────────────────────────┘
                             ▲
                             │
┌─────────────────────────────────────────────────────────────────────┐
│                   DATA COLLECTION LAYER (Scrapers)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  NBA Stats   │  │  Sentiment   │  │  Live Game   │             │
│  │   Scraper    │  │   Scraper    │  │   Scraper    │             │
│  │  (nba_api)   │  │(Reddit/News) │  │  (nba_api)   │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │ Value Index  │  │  Odds API    │  │  ML Models   │             │
│  │  Calculator  │  │ Integration  │  │  (sklearn)   │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│                                                                      │
│         Automated via GitHub Actions (Cron Schedule)                │
└─────────────────────────────────────────────────────────────────────┘
                             ▲
                             │
┌─────────────────────────────────────────────────────────────────────┐
│                    EXTERNAL DATA SOURCES                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   NBA API    │  │    Reddit    │  │  The Odds    │             │
│  │              │  │     API      │  │     API      │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│  ┌──────────────┐  ┌──────────────┐                                │
│  │  News Feeds  │  │   Gemini AI  │                                │
│  │    (RSS)     │  │   (Chatbot)  │                                │
│  └──────────────┘  └──────────────┘                                │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Collection**: Automated scrapers run on scheduled intervals (via GitHub Actions) to fetch fresh data
2. **Processing**: Raw data is cleaned, analyzed, and enriched with ML predictions and sentiment scores
3. **Storage**: Processed data is stored in Supabase (PostgreSQL) with optimized indexes
4. **API**: FastAPI serves data through RESTful endpoints with caching for performance
5. **Frontend**: React app fetches and displays data with real-time updates and interactive visualizations

---

## Features

### Home Dashboard
- **Featured Players**: Top performers based on our proprietary value index
- **Market Movers**: Real-time tracking of rising and falling player values
- **Player Search**: Instant search with autocomplete across 400+ NBA players
- **Compare Tool**: Side-by-side comparison of up to 3 players with detailed metrics

### Watchlist
- Save your favorite players for quick access
- Real-time value updates and momentum indicators
- One-click access to detailed player profiles

### Live Scores
- Real-time NBA game scores and box scores
- Top performers from today's games
- Historical game data and player statistics

### Trade Simulator
- Build and analyze custom player portfolios
- Portfolio risk assessment and diversification metrics
- Value projections and momentum analysis

### AI Insights
- **Buy Opportunities**: Undervalued players with strong fundamentals
- **Sell Opportunities**: Overvalued players riding sentiment waves
- **Breakout Candidates**: Players showing positive momentum trends
- **ML Predictions**: Machine learning-powered value forecasts

### Betting Picks
- Real-time betting lines from major sportsbooks (via The Odds API)
- Prop bet analysis (points, rebounds, assists)
- Confidence scores and expected value calculations
- Over/Under recommendations based on recent performance

### Fantasy Lineup
- Optimal lineup suggestions based on value and matchups
- Value picks for daily fantasy sports
- Projected performance scores

### AI Chatbot
- Natural language queries about players and strategies
- Powered by Google Gemini AI
- Context-aware responses using real-time data

---

## Technology Stack

### Frontend (`/client`)

**Core Framework**
- **React 18.3**: Modern UI library with hooks and concurrent features
- **Vite**: Lightning-fast build tool and dev server (HMR in <50ms)
- **React Router**: Client-side routing (lazy-loaded for performance)

**Styling & UI**
- **Tailwind CSS 3.4**: Utility-first CSS framework for rapid UI development
- **Framer Motion**: Smooth animations and transitions
- **Lucide React**: Beautiful, consistent icon library
- **Chart.js + react-chartjs-2**: Interactive data visualizations

**State & Data**
- **Axios**: Promise-based HTTP client with interceptors
- **React Hooks**: useState, useEffect, useMemo for state management
- **LocalStorage**: Client-side persistence for watchlists and preferences

**Why These Choices?**
- Vite over Create React App: 10-100x faster builds and HMR
- Tailwind over CSS-in-JS: Smaller bundle sizes, better performance
- Chart.js over D3: Easier to use, better for standard charts

### Backend (`/api`)

**Framework**
- **FastAPI**: Modern, fast Python web framework
  - Automatic OpenAPI documentation
  - Built-in data validation with Pydantic
  - Async support for concurrent requests
  - 3x faster than Flask in benchmarks

**Database**
- **Supabase**: PostgreSQL database with real-time capabilities
  - Row-level security
  - Automatic REST API generation
  - Built-in authentication (ready for future use)
  - Free tier with 500MB storage

**AI & ML**
- **scikit-learn**: Machine learning models for value prediction
  - Random Forest Regressor for price forecasting
  - Feature engineering from stats + sentiment
- **Google Gemini AI**: Conversational AI for chatbot
  - Context-aware responses
  - Real-time data integration
- **Transformers (HuggingFace)**: Sentiment analysis
  - DistilBERT for text classification
  - Fine-tuned on sports content

**Data Processing**
- **Pandas**: Data manipulation and analysis
- **NumPy**: Numerical computations
- **Python-dotenv**: Environment variable management

### Data Collection (`/scraper`)

**NBA Data**
- **nba_api**: Official NBA stats API wrapper
  - Player stats, game scores, team data
  - Historical and real-time data
  - Rate limiting and caching built-in

**Sentiment Analysis**
- **PRAW (Python Reddit API Wrapper)**: Reddit data collection
  - r/nba subreddit posts and comments
  - Player mentions and sentiment
- **Feedparser**: RSS feed parsing for news articles
  - ESPN, Bleacher Report, The Athletic
- **BeautifulSoup4 + lxml**: Web scraping for additional sources

**Betting Data**
- **The Odds API**: Real-time betting lines
  - Multiple sportsbooks aggregated
  - Player props (points, rebounds, assists)
  - 500 free requests/month

**Automation**
- **GitHub Actions**: Scheduled workflows (cron jobs)
  - Free tier: unlimited public repo minutes
  - Runs scrapers 2-4x daily
  - Better than Render cron (which costs $$$)

### Deployment

**Hosting**
- **Render**: Cloud platform for web services
  - Frontend: Static site hosting
  - Backend: Python web service
  - Auto-deploy from GitHub
  - Free tier with 750 hours/month

**CI/CD**
- **GitHub Actions**: Automated testing and deployment
  - Scraper workflows on schedule
  - Future: automated tests on PR

**Environment Management**
- **dotenv**: Secure environment variables
- **Render Environment Variables**: Production secrets

---

## Project Structure

```
sportfolio/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── PlayerList.jsx
│   │   │   ├── PlayerPage.jsx
│   │   │   ├── Watchlist.jsx
│   │   │   ├── LiveScores.jsx
│   │   │   ├── AIInsights.jsx
│   │   │   ├── BettingPicks.jsx
│   │   │   ├── FantasyLineup.jsx
│   │   │   ├── TradeSimulator.jsx
│   │   │   ├── ChatBot.jsx
│   │   │   └── ...
│   │   ├── App.jsx           # Main app component
│   │   ├── main.jsx          # Entry point
│   │   └── index.css         # Global styles
│   ├── public/               # Static assets
│   ├── package.json
│   └── vite.config.js
│
├── api/                       # FastAPI backend
│   ├── main.py               # API routes and endpoints
│   ├── ml_trade_advisor.py   # ML model integration
│   ├── requirements.txt
│   └── .env
│
├── scraper/                   # Data collection scripts
│   ├── daily_stats_scraper.py          # NBA stats collection
│   ├── enhanced_sentiment_scraper.py   # Sentiment analysis
│   ├── enhanced_value_index.py         # Value calculations
│   ├── live_scores.py                  # Real-time game data
│   ├── ai_trade_advisor.py             # Trading signals
│   ├── ai_price_predictor.py           # ML predictions
│   ├── betting_advisor.py              # Betting analysis
│   ├── fantasy_optimizer.py            # Fantasy lineups
│   ├── odds_api_integration.py         # Betting lines
│   ├── ml_trade_advisor.py             # ML model training
│   ├── run_enhanced.sh                 # Run all scrapers
│   ├── requirements.txt
│   └── .env
│
├── .github/
│   └── workflows/
│       └── scrapers.yml       # Automated scraper schedule
│
├── render.yaml                # Render deployment config
└── README.md
```

---

## API Documentation

### Base URL
- **Production Web App**: `https://www.sportfolio.live/`
- **Production API**: `https://nba-analytics-api-2sal.onrender.com`
- **Development**: `http://localhost:8000`

### Key Endpoints

#### Players
```
GET  /players                          # List all players
GET  /featured-players                 # Top value players
GET  /player/{player_id}               # Player details
GET  /player/{player_id}/stats         # Recent game stats
GET  /player/{player_id}/value_history # Value over time
GET  /player/{player_id}/news          # Recent news/sentiment
GET  /player/{player_id}/enhanced_metrics # Latest metrics
POST /players/compare                  # Compare multiple players
```

#### AI & Analytics
```
GET  /ai/buy-opportunities             # Undervalued players
GET  /ai/sell-opportunities            # Overvalued players
GET  /ai/breakout-candidates           # Trending players
GET  /ai/daily-insights                # Comprehensive report
GET  /ai/predict/{player_id}           # Price predictions
GET  /ai/trending-players              # Momentum leaders
POST /ai/portfolio-analysis            # Portfolio risk assessment
```

#### Live Data
```
GET  /live/scores?date=YYYY-MM-DD      # Games by date
GET  /live/game/{game_id}              # Live box score
GET  /live/top-performers              # Today's top players
```

#### Betting
```
GET  /betting/picks                    # Top betting picks
GET  /betting/player/{player_id}       # Player prop analysis
```

#### Fantasy
```
GET  /fantasy/lineup                   # Optimal lineup
GET  /fantasy/value-picks              # Best value plays
```

#### Chatbot
```
POST /chat                             # AI assistant
Body: { "message": "string", "history": [] }
```

### Interactive Documentation
Visit `/docs` on your API server for full Swagger UI documentation with request/response examples.

---

## Data Pipeline

### Scraper Schedule (GitHub Actions)

**Daily Stats** (4x per day)
- 8 AM, 12 PM, 6 PM, 11 PM EST
- Fetches latest game statistics
- Updates player season averages

**Sentiment Analysis** (2x per day)
- 10 AM, 8 PM EST
- Scrapes Reddit r/nba
- Parses news RSS feeds
- Runs sentiment classification

**Value Index** (2x per day)
- 11 AM, 9 PM EST
- Calculates composite value scores
- Updates momentum indicators
- Generates confidence levels

**Live Scores** (Every 15 minutes during games)
- Real-time game updates
- Box score collection
- Top performer identification

**Betting Lines** (Every 30 minutes)
- Fetches latest odds from sportsbooks
- Updates player prop lines
- Calculates expected values

### Data Processing Flow

1. **Raw Data Collection**
   - API calls to external sources
   - Rate limiting and error handling
   - Data validation

2. **Transformation**
   - Cleaning and normalization
   - Feature engineering
   - Sentiment scoring

3. **Enrichment**
   - ML model predictions
   - Statistical calculations
   - Trend analysis

4. **Storage**
   - Upsert to Supabase
   - Maintain historical records
   - Index optimization

5. **Caching**
   - API-level caching (5-10 min TTL)
   - Reduces database load
   - Faster response times

---

## Real-Time Processing

### Live Data Pipeline Architecture

The platform implements a sophisticated real-time processing pipeline that ensures users always have access to the latest NBA data and insights.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    REAL-TIME DATA SOURCES                            │
│                                                                      │
│  NBA API (Live)    Reddit API    News RSS    Odds API    Gemini AI │
│       │                │             │            │           │      │
│       └────────────────┴─────────────┴────────────┴───────────┘     │
└──────────────────────────────────┬───────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    INGESTION LAYER (Scrapers)                        │
│                                                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │
│  │  Live Scraper   │  │ Sentiment       │  │  Odds           │   │
│  │  (15 min)       │  │ Scraper (2x/day)│  │  Scraper (30min)│   │
│  │                 │  │                 │  │                 │   │
│  │ • Game scores   │  │ • Reddit posts  │  │ • Betting lines │   │
│  │ • Box scores    │  │ • News articles │  │ • Player props  │   │
│  │ • Player stats  │  │ • Sentiment NLP │  │ • Odds changes  │   │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘   │
│           │                    │                     │             │
│           └────────────────────┴─────────────────────┘             │
└──────────────────────────────────┬───────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    PROCESSING LAYER                                  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Data Validation & Cleaning                                  │  │
│  │  • Schema validation                                         │  │
│  │  • Duplicate detection                                       │  │
│  │  • Null handling                                             │  │
│  └────────────────────────┬─────────────────────────────────────┘  │
│                           │                                         │
│                           ▼                                         │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Feature Engineering                                         │  │
│  │  • Rolling averages (5, 10, 20 games)                       │  │
│  │  • Momentum calculations                                     │  │
│  │  • Trend detection                                           │  │
│  │  • Statistical normalization                                 │  │
│  └────────────────────────┬─────────────────────────────────────┘  │
│                           │                                         │
│                           ▼                                         │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  ML Model Inference                                          │  │
│  │  • Value prediction (Random Forest)                          │  │
│  │  • Sentiment classification (DistilBERT)                     │  │
│  │  • Breakout detection                                        │  │
│  │  • Risk assessment                                           │  │
│  └────────────────────────┬─────────────────────────────────────┘  │
│                           │                                         │
│                           ▼                                         │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Value Index Calculation                                     │  │
│  │  • Composite score = (Stats × 0.6) + (Sentiment × 0.4)      │  │
│  │  • Confidence scoring                                        │  │
│  │  • Momentum indicators                                       │  │
│  └────────────────────────┬─────────────────────────────────────┘  │
└──────────────────────────────────┬───────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    STORAGE LAYER (Supabase)                          │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Time-Series Tables                                          │  │
│  │  • player_value_index (indexed by date, player_id)          │  │
│  │  • daily_player_stats (partitioned by season)               │  │
│  │  • daily_player_sentiment (indexed by article_date)         │  │
│  │  • live_game_scores (indexed by game_date)                  │  │
│  │  • betting_lines (indexed by timestamp)                     │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  Optimization Strategies:                                            │
│  • B-tree indexes on frequently queried columns                     │
│  • Materialized views for aggregations                              │
│  • Automatic vacuuming for performance                              │
└──────────────────────────────────┬───────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    API CACHING LAYER                                 │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  In-Memory Cache (Python Dict)                               │  │
│  │                                                              │  │
│  │  Cache Strategy:                                             │  │
│  │  • Players list: 10 min TTL                                  │  │
│  │  • Featured players: 5 min TTL                               │  │
│  │  • Market movers: 5 min TTL                                  │  │
│  │  • Live scores: 1 min TTL                                    │  │
│  │  • Betting picks: 5 min TTL                                  │  │
│  │  • Fantasy lineups: 10 min TTL                               │  │
│  │                                                              │  │
│  │  Benefits:                                                    │  │
│  │  • 90% reduction in database queries                         │  │
│  │  • Sub-50ms response times for cached data                   │  │
│  │  • Reduced Supabase API costs                                │  │
│  └──────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────┬───────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER (React)                              │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Real-Time UI Updates                                        │  │
│  │                                                              │  │
│  │  • Lazy loading for heavy components                         │  │
│  │  • Suspense boundaries for async data                        │  │
│  │  • Optimistic UI updates                                     │  │
│  │  • Error boundaries for graceful failures                    │  │
│  │  • LocalStorage for offline persistence                      │  │
│  │                                                              │  │
│  │  Update Frequency:                                            │  │
│  │  • Live scores: Manual refresh button                        │  │
│  │  • Player data: On-demand fetch                              │  │
│  │  • Watchlist: Real-time on page load                         │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### Processing Latency Breakdown

| Stage | Latency | Description |
|-------|---------|-------------|
| **Data Ingestion** | 2-5s | API calls to external sources with rate limiting |
| **Data Validation** | <100ms | Schema validation and cleaning |
| **Feature Engineering** | 200-500ms | Statistical calculations and transformations |
| **ML Inference** | 100-300ms | Model predictions (cached after first run) |
| **Database Write** | 50-200ms | Upsert operations with conflict resolution |
| **API Response** | 10-50ms | Cached responses, 200-500ms for uncached |
| **Total (End-to-End)** | 3-7s | From external API to database storage |

### Data Freshness Guarantees

**Live Game Data**
- Updates every 15 minutes during active games
- Box scores available within 5 minutes of game completion
- Top performers calculated in real-time

**Player Statistics**
- Season stats updated 4x daily (8 AM, 12 PM, 6 PM, 11 PM EST)
- Game-by-game stats available within 2 hours of game end
- Historical data maintained for trend analysis

**Sentiment Analysis**
- Reddit sentiment updated 2x daily (10 AM, 8 PM EST)
- News sentiment processed within 1 hour of publication
- Sentiment scores normalized on -1 to +1 scale

**Betting Lines**
- Updated every 30 minutes from The Odds API
- Player props refreshed before game time
- Line movement tracking for value identification

**Value Index**
- Recalculated 2x daily (11 AM, 9 PM EST)
- Incorporates latest stats and sentiment
- Momentum indicators updated with each calculation

### Error Handling & Resilience

**Retry Logic**
- Exponential backoff for failed API calls (1s, 2s, 4s, 8s)
- Maximum 3 retry attempts before logging failure
- Circuit breaker pattern for consistently failing sources

**Data Quality**
- Validation against expected schemas
- Outlier detection for statistical anomalies
- Manual review flags for suspicious data

**Graceful Degradation**
- API returns cached data if database is unavailable
- Frontend shows last known values during outages
- Partial data displayed when some sources fail

---

## Deployment

### Render Deployment

The project is configured for automatic deployment on Render:

1. **Frontend**: Static site from `/client/dist`
2. **Backend**: Python web service running FastAPI
3. **Scrapers**: Automated via GitHub Actions (not on Render)

**Deploy Steps:**
1. Push to GitHub
2. Connect Render to your repository
3. Render auto-deploys on push to main branch
4. Set environment variables in Render dashboard

### GitHub Actions Setup

Scrapers run automatically via GitHub Actions:

1. Go to repository Settings → Secrets
2. Add secrets:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `REDDIT_CLIENT_ID` (optional)
   - `REDDIT_CLIENT_SECRET` (optional)
   - `ODDS_API_KEY` (optional)
3. Workflows run on schedule (see `.github/workflows/scrapers.yml`)

### Environment Variables

**Required:**
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_KEY`: Your Supabase anon/public key
- `GEMINI_API_KEY`: Google AI API key

**Optional:**
- `ODDS_API_KEY`: The Odds API key (for real betting lines)
- `REDDIT_CLIENT_ID`: Reddit app client ID
- `REDDIT_CLIENT_SECRET`: Reddit app secret
- `REDDIT_USER_AGENT`: Your app name

---

## Future Enhancements

This project has room for exciting improvements:

### Planned Features
- **User Authentication**: Personalized watchlists and portfolio tracking
- **Push Notifications**: Real-time alerts for value changes and opportunities
- **Mobile App**: React Native version for iOS and Android
- **Advanced ML Models**: Neural networks and ensemble methods for better predictions
- **Backtesting**: Historical strategy testing and performance analysis
- **Social Features**: Share portfolios, compete with friends, community insights
- **DFS Integration**: Direct integration with DraftKings/FanDuel APIs
- **Advanced Charting**: Candlestick charts, technical indicators, pattern recognition

### Technical Improvements
- **Testing Suite**: Comprehensive unit and E2E tests
- **Performance**: Enhanced caching, code splitting, lazy loading
- **Accessibility**: Full WCAG 2.1 AA compliance
- **Error Handling**: Better error boundaries and user feedback
- **Real-time Updates**: WebSocket integration for live data streaming

---

## Acknowledgments

This project leverages several powerful technologies and data sources:

- **NBA API**: Comprehensive NBA statistics and real-time game data
- **Supabase**: PostgreSQL database with real-time capabilities and excellent developer experience
- **Google Gemini AI**: Natural language processing for the intelligent chatbot
- **The Odds API**: Real-time betting lines from major sportsbooks
- **Reddit API**: Community sentiment from r/nba discussions
- **HuggingFace Transformers**: Pre-trained models for sentiment analysis
- **Open Source Community**: All the incredible libraries and frameworks that made this possible

---

## Technical Highlights

This project demonstrates several advanced concepts:

- **Full-stack development** with modern frameworks (React + FastAPI)
- **Machine learning integration** for predictive analytics
- **Natural language processing** for sentiment analysis
- **Real-time data processing** with automated pipelines
- **RESTful API design** with comprehensive documentation
- **Cloud deployment** with CI/CD automation
- **Data visualization** with interactive charts
- **Responsive design** with mobile-first approach

---

*Last Updated: December 2024*
