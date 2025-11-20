-- ============================================
-- Enhanced Sentiment Analysis Database Updates
-- ============================================

-- 1. Add new columns to player_value_index table
-- These store the component breakdowns of the value score
ALTER TABLE player_value_index 
ADD COLUMN IF NOT EXISTS stat_component FLOAT DEFAULT 0,
ADD COLUMN IF NOT EXISTS sentiment_component FLOAT DEFAULT 0,
ADD COLUMN IF NOT EXISTS momentum_score FLOAT DEFAULT 0,
ADD COLUMN IF NOT EXISTS confidence_score FLOAT DEFAULT 0;

-- Add comments to explain the columns
COMMENT ON COLUMN player_value_index.stat_component IS 'Player performance score based on recent game stats';
COMMENT ON COLUMN player_value_index.sentiment_component IS 'Weighted sentiment score from multiple sources';
COMMENT ON COLUMN player_value_index.momentum_score IS 'Momentum indicator when stats and sentiment align';
COMMENT ON COLUMN player_value_index.confidence_score IS 'Data quality indicator (0-1)';

-- 2. Add source tracking to daily_player_sentiment
-- This allows us to track which platform the sentiment came from
ALTER TABLE daily_player_sentiment 
ADD COLUMN IF NOT EXISTS source TEXT,
ADD COLUMN IF NOT EXISTS url TEXT;

-- Add comments
COMMENT ON COLUMN daily_player_sentiment.source IS 'Source of sentiment (e.g., reddit_nba, news_espn)';
COMMENT ON COLUMN daily_player_sentiment.url IS 'URL to the original content';

-- 3. Update the unique constraint if needed
-- This ensures we don't duplicate sentiment records
ALTER TABLE daily_player_sentiment 
DROP CONSTRAINT IF EXISTS daily_player_sentiment_player_id_article_guid_key;

ALTER TABLE daily_player_sentiment 
ADD CONSTRAINT daily_player_sentiment_player_id_article_guid_key 
UNIQUE (player_id, article_guid);

-- 4. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sentiment_source 
ON daily_player_sentiment(source);

CREATE INDEX IF NOT EXISTS idx_sentiment_date 
ON daily_player_sentiment(article_date);

CREATE INDEX IF NOT EXISTS idx_value_date 
ON player_value_index(value_date);

CREATE INDEX IF NOT EXISTS idx_value_momentum 
ON player_value_index(momentum_score DESC);

-- 5. Create a view for easy querying of player value with names
CREATE OR REPLACE VIEW player_value_summary AS
SELECT 
    p.id,
    p.full_name,
    p.team_name,
    p.position,
    v.value_date,
    v.value_score,
    v.stat_component,
    v.sentiment_component,
    v.momentum_score,
    v.confidence_score,
    CASE 
        WHEN v.momentum_score > 0.5 THEN '🔥 Hot'
        WHEN v.momentum_score > 0.2 THEN '📈 Rising'
        WHEN v.momentum_score > -0.2 THEN '➡️ Stable'
        WHEN v.momentum_score > -0.5 THEN '📉 Falling'
        ELSE '🧊 Cold'
    END as momentum_status,
    CASE 
        WHEN v.confidence_score > 0.7 THEN 'High'
        WHEN v.confidence_score > 0.4 THEN 'Medium'
        ELSE 'Low'
    END as confidence_level
FROM players p
LEFT JOIN player_value_index v ON p.id = v.player_id
WHERE v.value_date = CURRENT_DATE
ORDER BY v.value_score DESC;

-- 6. Create a view for sentiment breakdown by source
CREATE OR REPLACE VIEW sentiment_by_source AS
SELECT 
    p.full_name,
    s.source,
    COUNT(*) as mention_count,
    AVG(s.sentiment_score) as avg_sentiment,
    MIN(s.sentiment_score) as min_sentiment,
    MAX(s.sentiment_score) as max_sentiment,
    s.article_date
FROM daily_player_sentiment s
JOIN players p ON p.id = s.player_id
WHERE s.article_date = CURRENT_DATE
GROUP BY p.full_name, s.source, s.article_date
ORDER BY mention_count DESC;

-- ============================================
-- Verification Queries
-- ============================================

-- Check if columns were added successfully
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'player_value_index' 
  AND column_name IN ('stat_component', 'sentiment_component', 'momentum_score', 'confidence_score');

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'daily_player_sentiment' 
  AND column_name IN ('source', 'url');

-- Check if indexes were created
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename IN ('player_value_index', 'daily_player_sentiment')
  AND indexname LIKE 'idx_%';

-- Check if views were created
SELECT table_name 
FROM information_schema.views 
WHERE table_name IN ('player_value_summary', 'sentiment_by_source');

-- ============================================
-- Sample Queries
-- ============================================

-- Top 10 players by value score
SELECT * FROM player_value_summary LIMIT 10;

-- Players with highest momentum (rising stars)
SELECT full_name, value_score, momentum_score, momentum_status
FROM player_value_summary
WHERE momentum_score > 0.3
ORDER BY momentum_score DESC
LIMIT 10;

-- Sentiment breakdown for a specific player
SELECT * FROM sentiment_by_source
WHERE full_name = 'LeBron James';

-- Players with high confidence scores
SELECT full_name, value_score, confidence_score, confidence_level
FROM player_value_summary
WHERE confidence_score > 0.7
ORDER BY value_score DESC;

-- Undervalued players (high stats, low sentiment)
SELECT full_name, value_score, stat_component, sentiment_component
FROM player_value_summary
WHERE stat_component > 40 
  AND sentiment_component < 0
ORDER BY (stat_component - sentiment_component) DESC
LIMIT 10;

-- Overvalued players (high sentiment, low stats)
SELECT full_name, value_score, stat_component, sentiment_component
FROM player_value_summary
WHERE sentiment_component > 0.5 
  AND stat_component < 30
ORDER BY (sentiment_component - stat_component) DESC
LIMIT 10;
