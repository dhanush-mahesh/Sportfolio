-- Quick Database Update for Enhanced Sentiment

-- Add new columns to player_value_index
ALTER TABLE player_value_index 
ADD COLUMN IF NOT EXISTS stat_component FLOAT DEFAULT 0,
ADD COLUMN IF NOT EXISTS sentiment_component FLOAT DEFAULT 0,
ADD COLUMN IF NOT EXISTS momentum_score FLOAT DEFAULT 0,
ADD COLUMN IF NOT EXISTS confidence_score FLOAT DEFAULT 0;

-- Add source tracking to daily_player_sentiment
ALTER TABLE daily_player_sentiment 
ADD COLUMN IF NOT EXISTS source TEXT,
ADD COLUMN IF NOT EXISTS url TEXT;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sentiment_source ON daily_player_sentiment(source);
CREATE INDEX IF NOT EXISTS idx_sentiment_date ON daily_player_sentiment(article_date);
CREATE INDEX IF NOT EXISTS idx_value_date ON player_value_index(value_date);
CREATE INDEX IF NOT EXISTS idx_value_momentum ON player_value_index(momentum_score DESC);

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'player_value_index' 
  AND column_name IN ('stat_component', 'sentiment_component', 'momentum_score', 'confidence_score');
