#!/bin/bash

echo "=========================================="
echo "NBA Enhanced Data Pipeline"
echo "=========================================="
echo ""

# Stage 1: Scrape player stats from NBA API
echo "Stage 1: Scraping player statistics..."
python daily_stats_scraper.py
if [ $? -ne 0 ]; then
    echo "Error in stats scraper. Continuing anyway..."
fi
echo ""

# Stage 2: Enhanced sentiment analysis from multiple sources
echo "Stage 2: Running enhanced sentiment analysis..."
python enhanced_sentiment_scraper.py
if [ $? -ne 0 ]; then
    echo "Error in sentiment scraper. Continuing anyway..."
fi
echo ""

# Stage 3: Calculate enhanced value index with trends
echo "Stage 3: Calculating enhanced value index..."
python enhanced_value_index.py
if [ $? -ne 0 ]; then
    echo "Error in value index calculator."
fi
echo ""

echo "=========================================="
echo "Pipeline Complete!"
echo "=========================================="
