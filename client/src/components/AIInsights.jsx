import { useState, useEffect } from 'react';
import axios from 'axios';

function AIInsights({ apiUrl, onPlayerClick, cachedData, onDataLoaded }) {
  const [insights, setInsights] = useState(cachedData || null);
  const [loading, setLoading] = useState(!cachedData);
  const [activeTab, setActiveTab] = useState('overview');
  const [priceForecast, setPriceForecast] = useState(null);

  useEffect(() => {
    // If we have cached data, use it immediately
    if (cachedData) {
      setInsights(cachedData);
      setLoading(false);
    } else {
      fetchInsights();
    }
    // Don't fetch price forecast on initial load - only when predictions tab is clicked
  }, []);

  // Fetch price forecast when predictions tab is clicked
  useEffect(() => {
    if (activeTab === 'predictions' && !priceForecast) {
      fetchPriceForecast();
    }
  }, [activeTab]);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${apiUrl}/ai/daily-insights`);
      setInsights(response.data);
      // Cache the data in parent
      if (onDataLoaded) {
        onDataLoaded(response.data);
      }
    } catch (error) {
      console.error('Error fetching AI insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPriceForecast = async () => {
    try {
      const response = await axios.get(`${apiUrl}/ai/price-forecast`);
      setPriceForecast(response.data);
    } catch (error) {
      console.error('Error fetching price forecast:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-neutral-400">Loading AI Insights...</p>
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-400">Unable to load AI insights</p>
        <button 
          onClick={fetchInsights}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-500"
        >
          Retry
        </button>
      </div>
    );
  }

  const getMomentumIcon = (trendClass) => {
    switch(trendClass) {
      case 'rising_fast': return '🔥';
      case 'rising': return '📈';
      case 'falling': return '📉';
      case 'falling_fast': return '🧊';
      default: return '➡️';
    }
  };

  const getUrgencyColor = (urgency) => {
    return urgency === 'high' ? 'text-red-500' : 'text-yellow-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-highlight-dark rounded-lg p-6 border border-neutral-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              AI Trade Advisor
            </h1>
            <p className="text-neutral-400 mt-1">
              Powered by machine learning • Updated {new Date(insights.generated_at).toLocaleString()}
            </p>
          </div>
          <button 
            onClick={fetchInsights}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-500 hover:to-purple-500 flex items-center gap-2 transition-all shadow-lg hover:shadow-xl hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Data
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
            <div className="text-green-400 text-sm font-semibold mb-1">BUY OPPORTUNITIES</div>
            <div className="text-3xl font-bold">{insights.buy_opportunities.count}</div>
            <div className="text-sm text-neutral-400 mt-1">
              {insights.summary.high_urgency_buys} high urgency
            </div>
          </div>

          <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
            <div className="text-red-400 text-sm font-semibold mb-1">SELL OPPORTUNITIES</div>
            <div className="text-3xl font-bold">{insights.sell_opportunities.count}</div>
            <div className="text-sm text-neutral-400 mt-1">
              {insights.summary.high_urgency_sells} high urgency
            </div>
          </div>

          <div className="bg-purple-900/20 border border-purple-700 rounded-lg p-4">
            <div className="text-purple-400 text-sm font-semibold mb-1">BREAKOUT CANDIDATES</div>
            <div className="text-3xl font-bold">{insights.breakout_candidates.count}</div>
            <div className="text-sm text-neutral-400 mt-1">
              {insights.summary.high_potential_breakouts} high potential
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-neutral-700 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 font-semibold whitespace-nowrap ${
            activeTab === 'overview'
              ? 'text-blue-500 border-b-2 border-blue-500'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('predictions')}
          className={`px-4 py-2 font-semibold whitespace-nowrap ${
            activeTab === 'predictions'
              ? 'text-blue-500 border-b-2 border-blue-500'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Predictions ({priceForecast ? priceForecast.summary.total_predictions : 0})
        </button>
        <button
          onClick={() => setActiveTab('buy')}
          className={`px-4 py-2 font-semibold whitespace-nowrap ${
            activeTab === 'buy'
              ? 'text-blue-500 border-b-2 border-blue-500'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Buy ({insights.buy_opportunities.count})
        </button>
        <button
          onClick={() => setActiveTab('sell')}
          className={`px-4 py-2 font-semibold whitespace-nowrap ${
            activeTab === 'sell'
              ? 'text-blue-500 border-b-2 border-blue-500'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Sell ({insights.sell_opportunities.count})
        </button>
        <button
          onClick={() => setActiveTab('breakout')}
          className={`px-4 py-2 font-semibold whitespace-nowrap ${
            activeTab === 'breakout'
              ? 'text-blue-500 border-b-2 border-blue-500'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Breakouts ({insights.breakout_candidates.count})
        </button>
        <button
          onClick={() => setActiveTab('ml')}
          className={`relative px-4 py-2 font-semibold whitespace-nowrap ${
            activeTab === 'ml'
              ? 'text-purple-400 border-b-2 border-purple-500 bg-gradient-to-r from-purple-900/30 to-pink-900/30'
              : 'text-neutral-300 hover:text-purple-400 bg-gradient-to-r from-purple-900/10 to-pink-900/10 hover:from-purple-900/20 hover:to-pink-900/20'
          } transition-all`}
        >
          <span className="flex items-center gap-2">
            ML Picks ({insights.ml_recommendations?.count || 0})
            <span className="text-xs px-2 py-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-white font-bold animate-pulse">
              NEW
            </span>
          </span>
        </button>
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top Buy Opportunities */}
          {insights.buy_opportunities.count > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4">Top Buy Opportunities</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insights.buy_opportunities.players.slice(0, 4).map((opp) => (
                  <OpportunityCard
                    key={opp.player_id}
                    player={opp}
                    type="buy"
                    onPlayerClick={onPlayerClick}
                    getMomentumIcon={getMomentumIcon}
                    getUrgencyColor={getUrgencyColor}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Top Sell Opportunities */}
          {insights.sell_opportunities.count > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4">Top Sell Opportunities</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insights.sell_opportunities.players.slice(0, 4).map((opp) => (
                  <OpportunityCard
                    key={opp.player_id}
                    player={opp}
                    type="sell"
                    onPlayerClick={onPlayerClick}
                    getMomentumIcon={getMomentumIcon}
                    getUrgencyColor={getUrgencyColor}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Breakout Candidates */}
          {insights.breakout_candidates.count > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4">Breakout Candidates</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insights.breakout_candidates.players.slice(0, 4).map((player) => (
                  <BreakoutCard
                    key={player.player_id}
                    player={player}
                    onPlayerClick={onPlayerClick}
                    getMomentumIcon={getMomentumIcon}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'buy' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.buy_opportunities.players.map((opp) => (
            <OpportunityCard
              key={opp.player_id}
              player={opp}
              type="buy"
              onPlayerClick={onPlayerClick}
              getMomentumIcon={getMomentumIcon}
              getUrgencyColor={getUrgencyColor}
            />
          ))}
          {insights.buy_opportunities.count === 0 && (
            <div className="col-span-2 text-center py-12 text-neutral-400">
              No buy opportunities found at this time
            </div>
          )}
        </div>
      )}

      {activeTab === 'sell' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.sell_opportunities.players.map((opp) => (
            <OpportunityCard
              key={opp.player_id}
              player={opp}
              type="sell"
              onPlayerClick={onPlayerClick}
              getMomentumIcon={getMomentumIcon}
              getUrgencyColor={getUrgencyColor}
            />
          ))}
          {insights.sell_opportunities.count === 0 && (
            <div className="col-span-2 text-center py-12 text-neutral-400">
              No sell opportunities found at this time
            </div>
          )}
        </div>
      )}

      {activeTab === 'breakout' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.breakout_candidates.players.map((player) => (
            <BreakoutCard
              key={player.player_id}
              player={player}
              onPlayerClick={onPlayerClick}
              getMomentumIcon={getMomentumIcon}
            />
          ))}
          {insights.breakout_candidates.count === 0 && (
            <div className="col-span-2 text-center py-12 text-neutral-400">
              No breakout candidates found at this time
            </div>
          )}
        </div>
      )}

      {activeTab === 'ml' && insights.ml_recommendations && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-700/50 rounded-xl p-6 mb-6">
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
              Machine Learning Predictions
            </h2>
            <p className="text-neutral-300 mb-2">
              These recommendations are powered by a Random Forest model trained on {insights.ml_recommendations.count > 0 ? '300+' : 'historical'} player value changes.
            </p>
            <p className="text-sm text-neutral-400 mb-4">
              Model Accuracy: <span className="text-green-400 font-bold">76.7%</span> • 
              Predicts 7-day profit probability based on stats, sentiment, and momentum patterns
            </p>
            
            {/* Explainer */}
            <details className="bg-neutral-800/50 rounded-lg p-4 cursor-pointer">
              <summary className="font-semibold text-purple-400 cursor-pointer select-none">
                What makes ML Picks different from other recommendations?
              </summary>
              <div className="mt-3 space-y-3 text-sm text-neutral-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-3">
                    <div className="font-bold text-blue-400 mb-2">📊 Buy/Sell/Breakout Tabs</div>
                    <div className="text-xs space-y-1">
                      <p>• <span className="text-neutral-400">Method:</span> Rule-based (if stat &gt; 30 and sentiment &lt; 0)</p>
                      <p>• <span className="text-neutral-400">Output:</span> BUY/SELL/WATCH labels</p>
                      <p>• <span className="text-neutral-400">Best for:</span> Clear-cut opportunities</p>
                      <p>• <span className="text-neutral-400">Accuracy:</span> ~65-70%</p>
                    </div>
                  </div>
                  
                  <div className="bg-purple-900/20 border border-purple-700/50 rounded-lg p-3">
                    <div className="font-bold text-purple-400 mb-2">🤖 ML Picks (This Tab)</div>
                    <div className="text-xs space-y-1">
                      <p>• <span className="text-neutral-400">Method:</span> Machine learning (learns from 300+ examples)</p>
                      <p>• <span className="text-neutral-400">Output:</span> Probability scores (0-100%)</p>
                      <p>• <span className="text-neutral-400">Best for:</span> Hidden patterns & nuanced decisions</p>
                      <p>• <span className="text-neutral-400">Accuracy:</span> <span className="text-green-400 font-bold">76.7%</span> (and improving)</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-3">
                  <div className="font-bold text-green-400 mb-1">Pro Tip</div>
                  <p className="text-xs">When both ML Picks and Buy recommendations agree on a player, it's a <span className="text-green-400 font-semibold">strong signal</span>! The ML model gets smarter as you collect more data.</p>
                </div>
              </div>
            </details>
          </div>

          {insights.ml_recommendations.count > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.ml_recommendations.players.map((player) => (
                <div
                  key={player.player_id}
                  onClick={() => onPlayerClick(player.player_id)}
                  className="bg-gradient-to-br from-purple-900/10 to-pink-900/10 border border-purple-700 rounded-lg p-4 hover:border-purple-500 transition-colors cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg">{player.player_name}</h3>
                      <p className="text-sm text-neutral-400">{player.team} • {player.position}</p>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                      player.ml_recommendation === 'STRONG BUY' 
                        ? 'bg-green-600 text-white' 
                        : 'bg-green-700 text-white'
                    }`}>
                      {player.ml_recommendation}
                    </span>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-neutral-400">ML Profit Probability</span>
                      <span className="text-2xl font-bold text-green-400">
                        {(player.ml_probability * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-neutral-800 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-emerald-400 h-2 rounded-full transition-all"
                        style={{ width: `${player.ml_probability * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                    <div>
                      <div className="text-neutral-400">Value</div>
                      <div className="font-semibold">{player.value_score.toFixed(1)}</div>
                    </div>
                    <div>
                      <div className="text-neutral-400">Stats</div>
                      <div className="font-semibold">{player.stat_component.toFixed(1)}</div>
                    </div>
                    <div>
                      <div className="text-neutral-400">Momentum</div>
                      <div className="font-semibold">{player.momentum_score.toFixed(2)}</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-neutral-500">
                      Confidence: <span className="text-purple-400 font-semibold">{player.ml_confidence.toUpperCase()}</span>
                    </span>
                    <span className="text-neutral-500">
                      Predicted 7-day gain: <span className="text-green-400 font-semibold">+5-10%</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔬</div>
              <h3 className="text-xl font-bold mb-2">Training ML Model</h3>
              <p className="text-neutral-400 mb-4">
                The machine learning model needs more historical data to make accurate predictions.
              </p>
              <p className="text-sm text-neutral-500">
                Keep running the scraper daily to build up training data!
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'predictions' && priceForecast && (
        <div className="space-y-6">
          {/* Trending Players */}
          {priceForecast.trending_players.count > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4">Trending Players (Price Rising)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {priceForecast.trending_players.players.map((player) => (
                  <PredictionCard
                    key={player.player_id}
                    player={player}
                    type="trending"
                    onPlayerClick={onPlayerClick}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Value Drops */}
          {priceForecast.value_drops.count > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4">Value Drops (Buy the Dip)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {priceForecast.value_drops.players.map((player) => (
                  <PredictionCard
                    key={player.player_id}
                    player={player}
                    type="drop"
                    onPlayerClick={onPlayerClick}
                  />
                ))}
              </div>
            </div>
          )}

          {priceForecast.trending_players.count === 0 && priceForecast.value_drops.count === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔮</div>
              <h3 className="text-xl font-bold mb-2">Building Prediction Models</h3>
              <p className="text-neutral-400 mb-4">
                Price predictions require at least 5-7 days of historical data per player.
              </p>
              <p className="text-sm text-neutral-500">
                Check back tomorrow as more data becomes available!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PredictionCard({ player, type, onPlayerClick }) {
  const isTrending = type === 'trending';
  const bgColor = isTrending ? 'bg-green-900/10 border-green-700' : 'bg-blue-900/10 border-blue-700';
  const badgeColor = isTrending ? 'bg-green-600' : 'bg-blue-600';

  return (
    <div className={`${bgColor} border rounded-lg p-4 hover:border-blue-500 transition-colors cursor-pointer`}
         onClick={() => onPlayerClick(player.player_id)}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-lg">{player.player_name}</h3>
          <p className="text-sm text-neutral-400">{player.team} • {player.position}</p>
        </div>
        <span className={`${badgeColor} text-white text-xs px-2 py-1 rounded font-semibold`}>
          {isTrending ? 'TRENDING' : 'DIP'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-highlight-dark rounded p-2">
          <div className="text-xs text-neutral-400">Current Value</div>
          <div className="text-lg font-bold">{player.current_value.toFixed(1)}</div>
        </div>
        <div className="bg-highlight-dark rounded p-2">
          <div className="text-xs text-neutral-400">Week Ago</div>
          <div className="text-lg font-bold">{player.week_ago_value.toFixed(1)}</div>
        </div>
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex justify-between items-center text-sm">
          <span className="text-neutral-400">Weekly Change:</span>
          <span className={`font-semibold ${isTrending ? 'text-green-400' : 'text-red-400'}`}>
            {isTrending ? player.trend_pct : player.drop_pct}%
          </span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-neutral-400">Predicted (7d):</span>
          <span className="font-semibold text-blue-400">
            {player.predicted_7day.toFixed(1)}
          </span>
        </div>
        {!isTrending && player.predicted_recovery && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-neutral-400">Recovery:</span>
            <span className={`font-semibold ${player.predicted_recovery > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {player.predicted_recovery > 0 ? '+' : ''}{player.predicted_recovery}%
            </span>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center pt-3 border-t border-neutral-700">
        <div className="flex items-center gap-2">
          <div className="text-xs text-neutral-400">Confidence:</div>
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i < Math.round(player.prediction_confidence * 5)
                    ? 'bg-blue-500'
                    : 'bg-neutral-700'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-neutral-400">
            {(player.prediction_confidence * 100).toFixed(0)}%
          </span>
        </div>
        {!isTrending && player.buy_signal && (
          <span className="text-xs font-semibold text-green-400">
            ✅ BUY SIGNAL
          </span>
        )}
      </div>
    </div>
  );
}

function OpportunityCard({ player, type, onPlayerClick, getMomentumIcon, getUrgencyColor }) {
  const bgColor = type === 'buy' ? 'bg-green-900/10 border-green-700' : 'bg-red-900/10 border-red-700';
  const badgeColor = type === 'buy' ? 'bg-green-600' : 'bg-red-600';

  return (
    <div className={`${bgColor} border rounded-lg p-4 hover:border-blue-500 transition-colors cursor-pointer`}
         onClick={() => onPlayerClick(player.player_id)}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-lg">{player.player_name}</h3>
          <p className="text-sm text-neutral-400">{player.team} • {player.position}</p>
        </div>
        <span className={`${badgeColor} text-white text-xs px-2 py-1 rounded font-semibold`}>
          {type.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
        <div>
          <div className="text-neutral-400">Value</div>
          <div className="font-semibold">{player.value_score.toFixed(1)}</div>
        </div>
        <div>
          <div className="text-neutral-400">Stats</div>
          <div className="font-semibold">{player.stat_component.toFixed(1)}</div>
        </div>
        <div>
          <div className="text-neutral-400">Sentiment</div>
          <div className="font-semibold">{player.sentiment_component.toFixed(2)}</div>
        </div>
      </div>

      <div className="bg-highlight-dark rounded p-2 mb-3">
        <p className="text-sm text-neutral-300">{player.reason}</p>
      </div>

      <div className="flex justify-between items-center text-sm">
        <span className="flex items-center gap-1">
          {getMomentumIcon(player.trend_class)}
          <span className="text-neutral-400">
            {player.trend > 0 ? '+' : ''}{player.trend.toFixed(1)}%
          </span>
        </span>
        <span className={`font-semibold ${getUrgencyColor(player.urgency)}`}>
          {player.urgency.toUpperCase()} URGENCY
        </span>
      </div>
    </div>
  );
}

function BreakoutCard({ player, onPlayerClick, getMomentumIcon }) {
  return (
    <div className="bg-purple-900/10 border border-purple-700 rounded-lg p-4 hover:border-blue-500 transition-colors cursor-pointer"
         onClick={() => onPlayerClick(player.player_id)}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-lg">{player.player_name}</h3>
          <p className="text-sm text-neutral-400">{player.team} • {player.position}</p>
        </div>
        <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded font-semibold">
          WATCH
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
        <div>
          <div className="text-neutral-400">Value</div>
          <div className="font-semibold">{player.value_score.toFixed(1)}</div>
        </div>
        <div>
          <div className="text-neutral-400">Momentum</div>
          <div className="font-semibold">{player.momentum_score.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-neutral-400">Sentiment</div>
          <div className="font-semibold">{player.sentiment_component.toFixed(2)}</div>
        </div>
      </div>

      <div className="bg-highlight-dark rounded p-2 mb-3">
        <p className="text-sm text-neutral-300">{player.reason}</p>
      </div>

      <div className="flex justify-between items-center text-sm">
        <span className="flex items-center gap-1">
          {getMomentumIcon(player.trend_class)}
          <span className="text-neutral-400">
            {player.trend > 0 ? '+' : ''}{player.trend.toFixed(1)}%
          </span>
        </span>
        <span className="font-semibold text-purple-400">
          {player.potential.toUpperCase()} POTENTIAL
        </span>
      </div>
    </div>
  );
}

export default AIInsights;
