import { useState, useEffect } from 'react';
import axios from 'axios';

function BettingPicks({ apiUrl }) {
  const [picks, setPicks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalPick, setModalPick] = useState(null);

  useEffect(() => {
    fetchBettingPicks();
  }, []);

  const fetchBettingPicks = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${apiUrl}/betting/picks`, {
        params: { 
          todays_games: true, 
          force_refresh: true,
          _t: Date.now() // Cache buster
        }
      });
      console.log('Betting picks response:', response.data);
      console.log('First pick:', response.data.picks?.[0]);
      console.log('First pick has last_5_games?', !!response.data.picks?.[0]?.last_5_games);
      console.log('First pick last_5_games:', response.data.picks?.[0]?.last_5_games);
      setPicks(response.data.picks || []);
    } catch (error) {
      console.error('Error fetching betting picks:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-neutral-400">Loading betting picks...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Modal Overlay */}
      {modalPick && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn"
          onClick={() => setModalPick(null)}
        >
          <div 
            className="bg-highlight-dark rounded-2xl border border-neutral-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-highlight-dark border-b border-neutral-700 p-6 rounded-t-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-1">{modalPick.player_name}</h3>
                  <p className="text-neutral-400">{modalPick.team} • {modalPick.position}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="text-sm">
                      <span className="text-neutral-400">Prop: </span>
                      <span className="font-semibold">{modalPick.prop_type}</span>
                    </div>
                    <span className="text-neutral-600">•</span>
                    <div className="text-sm">
                      <span className="text-neutral-400">Line: </span>
                      <span className="font-semibold text-blue-400">{modalPick.line}</span>
                    </div>
                    <span className="text-neutral-600">•</span>
                    <div className="text-sm">
                      <span className={`font-bold ${
                        modalPick.recommendation === 'OVER' ? 'text-green-400' :
                        modalPick.recommendation === 'UNDER' ? 'text-red-400' :
                        'text-neutral-400'
                      }`}>
                        {modalPick.recommendation}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setModalPick(null)}
                  className="text-neutral-400 hover:text-white transition-colors p-2 hover:bg-neutral-800 rounded-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Stats Summary */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-neutral-800 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {modalPick.last_5_games.filter(g => g.stat >= modalPick.line).length}
                  </div>
                  <div className="text-xs text-neutral-400 mt-1">Games Over</div>
                </div>
                <div className="bg-neutral-800 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {(modalPick.last_5_games.reduce((sum, g) => sum + g.stat, 0) / modalPick.last_5_games.length).toFixed(1)}
                  </div>
                  <div className="text-xs text-neutral-400 mt-1">Average</div>
                </div>
                <div className="bg-neutral-800 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold">{modalPick.player_avg}</div>
                  <div className="text-xs text-neutral-400 mt-1">Season Avg</div>
                </div>
              </div>

              {/* Chart Title */}
              <div className="mb-4">
                <h4 className="text-lg font-bold mb-1">Last 5 Games Performance</h4>
                <p className="text-sm text-neutral-400">{modalPick.reason}</p>
              </div>

              {/* Visual bar chart */}
              <div className="space-y-3">
                {modalPick.last_5_games.map((game, idx) => {
                  const maxStat = Math.max(...modalPick.last_5_games.map(g => g.stat), modalPick.line) * 1.1;
                  const barWidth = (game.stat / maxStat) * 100;
                  const linePosition = (modalPick.line / maxStat) * 100;
                  const isOver = game.stat >= modalPick.line;
                  
                  return (
                    <div key={idx} className="relative">
                      {/* Game info */}
                      <div className="flex items-center justify-between text-sm mb-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-neutral-400 font-semibold w-16">
                            {game.date ? new Date(game.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                          </span>
                          {game.opponent && (
                            <span className="text-neutral-300 truncate">vs {game.opponent}</span>
                          )}
                        </div>
                        <span className={`font-bold text-lg ml-2 ${
                          isOver ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {game.stat}
                        </span>
                      </div>
                      
                      {/* Bar chart */}
                      <div className="relative h-8 bg-neutral-800 rounded-lg overflow-hidden shadow-inner">
                        {/* Stat bar */}
                        <div 
                          className={`absolute left-0 top-0 h-full transition-all duration-500 ${
                            isOver 
                              ? 'bg-gradient-to-r from-green-600 to-green-500' 
                              : 'bg-gradient-to-r from-red-600 to-red-500'
                          }`}
                          style={{ width: `${barWidth}%` }}
                        />
                        
                        {/* Line indicator */}
                        <div 
                          className="absolute top-0 bottom-0 w-0.5 bg-blue-400 z-10 shadow-lg"
                          style={{ left: `${linePosition}%` }}
                        >
                          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-400 rounded-full shadow-lg" />
                          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-400 rounded-full shadow-lg" />
                        </div>
                        
                        {/* Stat value inside bar */}
                        <div className="absolute inset-0 flex items-center px-3">
                          <span className="text-sm font-bold text-white drop-shadow-lg">
                            {game.stat}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Legend */}
              <div className="flex items-center justify-center gap-6 mt-6 pt-6 border-t border-neutral-700 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-neutral-300">Over Line</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span className="text-neutral-300">Under Line</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 bg-blue-400 rounded"></div>
                  <span className="text-neutral-300">Betting Line ({modalPick.line})</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
      <div className="bg-highlight-dark rounded-lg p-6 border border-neutral-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Sports Betting Picks</h1>
            <p className="text-neutral-400 mt-1">Real sportsbook lines for today's games</p>
          </div>
          <button 
            onClick={fetchBettingPicks}
            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-500 hover:to-emerald-500 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <div className="font-semibold text-yellow-400 mb-1">Responsible Gambling</div>
              <p className="text-sm text-neutral-300">
                These picks are for informational purposes only. Always gamble responsibly.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Best Props for Today</h2>
        {picks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {picks.map((pick) => (
              <div
                key={pick.player_id}
                className="bg-gradient-to-br from-green-900/10 to-emerald-900/10 border border-green-700 rounded-lg p-4 hover:border-green-500 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg">{pick.player_name}</h3>
                    <p className="text-sm text-neutral-400">{pick.team} • {pick.position}</p>
                    {pick.bookmaker && (
                      <p className="text-xs text-blue-400 mt-1">{pick.bookmaker}</p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded font-semibold ${
                    pick.confidence_level === 'HIGH' ? 'bg-green-600 text-white' :
                    pick.confidence_level === 'MEDIUM' ? 'bg-yellow-600 text-white' :
                    'bg-neutral-600 text-white'
                  }`}>
                    {pick.confidence_level}
                  </span>
                </div>

                <div className="bg-highlight-dark rounded-lg p-3 mb-3">
                  <div className="text-sm text-neutral-400 mb-1">{pick.prop_type}</div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <div className="text-2xl font-bold">{pick.line}</div>
                    {pick.bookmaker && (
                      <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded font-semibold">
                        {pick.bookmaker}
                      </span>
                    )}
                  </div>
                  
                  <div className={`text-lg font-bold ${
                    pick.recommendation === 'OVER' ? 'text-green-400' :
                    pick.recommendation === 'UNDER' ? 'text-red-400' :
                    'text-neutral-400'
                  }`}>
                    {pick.recommendation}
                  </div>
                  
                  {pick.over_odds && (
                    <div className="text-xs text-neutral-400 mt-1">
                      Over: {pick.over_odds > 0 ? '+' : ''}{pick.over_odds}
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-sm mb-3">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Player Avg:</span>
                    <span className="font-semibold">{pick.player_avg}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">Consistency:</span>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold">{pick.consistency}</span>
                      {pick.matchup_adjusted && (
                        <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded font-semibold">
                          MATCHUP
                        </span>
                      )}
                    </div>
                  </div>
                  {pick.consistency_explanation && (
                    <div className="flex justify-between text-xs">
                      <span className="text-neutral-500">{pick.consistency_explanation}</span>
                    </div>
                  )}
                  {pick.opponent && (
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Opponent:</span>
                      <span className="font-semibold text-blue-400">{pick.opponent}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-neutral-700">
                  <p className="text-xs text-neutral-400 mb-3">{pick.reason}</p>
                  
                  {/* Last 5 Games Button */}
                  {pick.last_5_games && pick.last_5_games.length > 0 && (
                    <div className="mt-3">
                      <button
                        onClick={() => setModalPick(pick)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 border border-blue-500/30 hover:border-blue-500/50 rounded-lg transition-all text-sm group"
                      >
                        <div className="flex items-center gap-2">
                          <svg 
                            className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform"
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          <span className="font-semibold text-neutral-200">View Last 5 Games</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="text-green-400 font-bold">{pick.last_5_games.filter(g => g.stat >= pick.line).length}</span>
                            <span className="text-neutral-400">/</span>
                            <span className="text-neutral-400">{pick.last_5_games.length} over</span>
                          </div>
                          <span className="text-neutral-600">•</span>
                          <span className="text-neutral-400">Avg: <span className="text-blue-400 font-semibold">{(pick.last_5_games.reduce((sum, g) => sum + g.stat, 0) / pick.last_5_games.length).toFixed(1)}</span></span>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-highlight-dark rounded-lg border border-neutral-700">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-bold mb-2">No Props Available</h3>
            <p className="text-neutral-400 mb-4">
              Props are usually posted closer to game time, or you may have reached your API limit.
            </p>
            <div className="text-sm text-neutral-500 max-w-md mx-auto">
              <p className="mb-2">Possible reasons:</p>
              <ul className="text-left space-y-1">
                <li>• No NBA games scheduled today</li>
                <li>• Props not posted yet (check closer to game time)</li>
                <li>• Odds API credits exhausted (500/month free tier)</li>
              </ul>
              <p className="mt-4 text-neutral-400">
                The rest of the app (AI Insights, Fantasy, etc.) works without API credits!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}

export default BettingPicks;
