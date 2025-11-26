import { useState, useEffect } from 'react';
import axios from 'axios';

function FantasyLineup({ apiUrl, onPlayerClick }) {
  const [topPlayers, setTopPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('builder');
  
  // User's lineup (8 slots)
  const [userLineup, setUserLineup] = useState(Array(8).fill(null));
  const [lineupGrade, setLineupGrade] = useState(null);
  
  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchTopPlayers();
  }, []);

  const fetchTopPlayers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${apiUrl}/fantasy/lineup`);
      setTopPlayers(response.data.lineup || []);
    } catch (error) {
      console.error('Error fetching fantasy data:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchPlayers = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    try {
      setSearching(true);
      const response = await axios.get(`${apiUrl}/players`);
      const filtered = response.data.filter(p => 
        p.full_name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 10);
      setSearchResults(filtered);
    } catch (error) {
      console.error('Error searching players:', error);
    } finally {
      setSearching(false);
    }
  };

  const addToLineup = (player) => {
    const emptySlot = userLineup.findIndex(slot => slot === null);
    if (emptySlot !== -1) {
      const newLineup = [...userLineup];
      newLineup[emptySlot] = player;
      setUserLineup(newLineup);
      setSearchQuery('');
      setSearchResults([]);
      setLineupGrade(null); // Reset grade when lineup changes
    }
  };

  const removeFromLineup = (index) => {
    const newLineup = [...userLineup];
    newLineup[index] = null;
    setUserLineup(newLineup);
    setLineupGrade(null);
  };

  const gradeLineup = async () => {
    const filledSlots = userLineup.filter(p => p !== null);
    if (filledSlots.length === 0) return;

    try {
      // Get detailed stats for each player
      const playerDetails = await Promise.all(
        filledSlots.map(async (player) => {
          try {
            const [statsRes, seasonRes] = await Promise.all([
              axios.get(`${apiUrl}/player/${player.id}/stats`),
              axios.get(`${apiUrl}/player/${player.id}/season_stats`)
            ]);
            
            const recentStats = statsRes.data[0] || {};
            const seasonStats = seasonRes.data || {};
            
            return {
              ...player,
              recent_points: recentStats.points || 0,
              recent_rebounds: recentStats.rebounds || 0,
              recent_assists: recentStats.assists || 0,
              season_ppg: seasonStats.ppg || 0,
              season_rpg: seasonStats.rpg || 0,
              season_apg: seasonStats.apg || 0
            };
          } catch (err) {
            return { ...player, recent_points: 0, recent_rebounds: 0, recent_assists: 0 };
          }
        })
      );

      // Calculate fantasy points for each player
      const playersWithFP = playerDetails.map(p => {
        const fp = (p.recent_points || 0) + 
                   (p.recent_rebounds || 0) * 1.2 + 
                   (p.recent_assists || 0) * 1.5;
        return { ...p, fantasy_points: fp };
      });

      const totalFP = playersWithFP.reduce((sum, p) => sum + p.fantasy_points, 0);
      const avgFP = totalFP / filledSlots.length;

      // Grade the lineup
      let grade, gradeColor, feedback;
      if (avgFP >= 40) {
        grade = 'A+';
        gradeColor = 'text-green-400';
        feedback = 'Elite lineup! Your players are performing at a high level.';
      } else if (avgFP >= 35) {
        grade = 'A';
        gradeColor = 'text-green-400';
        feedback = 'Excellent lineup with strong performers across the board.';
      } else if (avgFP >= 30) {
        grade = 'B+';
        gradeColor = 'text-blue-400';
        feedback = 'Solid lineup. Consider upgrading your lowest performers.';
      } else if (avgFP >= 25) {
        grade = 'B';
        gradeColor = 'text-blue-400';
        feedback = 'Decent lineup but has room for improvement.';
      } else if (avgFP >= 20) {
        grade = 'C';
        gradeColor = 'text-yellow-400';
        feedback = 'Below average lineup. Look for players with better recent form.';
      } else {
        grade = 'D';
        gradeColor = 'text-red-400';
        feedback = 'Weak lineup. Consider replacing multiple players.';
      }

      // Find weakest spots
      const sorted = [...playersWithFP].sort((a, b) => a.fantasy_points - b.fantasy_points);
      const weakSpots = sorted.slice(0, Math.min(3, sorted.length));

      setLineupGrade({
        grade,
        gradeColor,
        feedback,
        totalFP: totalFP.toFixed(1),
        avgFP: avgFP.toFixed(1),
        players: playersWithFP,
        weakSpots
      });
    } catch (error) {
      console.error('Error grading lineup:', error);
    }
  };

  const clearLineup = () => {
    setUserLineup(Array(8).fill(null));
    setLineupGrade(null);
  };

  const filledSlots = userLineup.filter(p => p !== null).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-neutral-400">Loading fantasy data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-highlight-dark rounded-lg p-6 border border-neutral-700">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          Fantasy Lineup Builder
        </h1>
        <p className="text-neutral-400 mt-1">
          Build your lineup and get it graded by our AI
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-neutral-700">
        <button
          onClick={() => setActiveTab('builder')}
          className={`px-4 py-2 font-semibold ${
            activeTab === 'builder'
              ? 'text-purple-500 border-b-2 border-purple-500'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Build Lineup ({filledSlots}/8)
        </button>
        <button
          onClick={() => setActiveTab('suggestions')}
          className={`px-4 py-2 font-semibold ${
            activeTab === 'suggestions'
              ? 'text-purple-500 border-b-2 border-purple-500'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Top Suggestions ({topPlayers.length})
        </button>
      </div>

      {/* Lineup Builder Tab */}
      {activeTab === 'builder' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Lineup Slots */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-highlight-dark rounded-lg p-6 border border-neutral-700">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Your Lineup</h2>
                <div className="flex gap-2">
                  <button
                    onClick={gradeLineup}
                    disabled={filledSlots === 0}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    Grade Lineup
                  </button>
                  <button
                    onClick={clearLineup}
                    className="bg-neutral-700 text-white px-4 py-2 rounded-lg hover:bg-neutral-600"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {userLineup.map((player, idx) => (
                  <div
                    key={idx}
                    className="bg-neutral-800 border border-neutral-700 rounded-lg p-4 hover:border-purple-500 transition-colors"
                  >
                    {player ? (
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center font-bold">
                            {idx + 1}
                          </div>
                          <div>
                            <div className="font-bold">{player.full_name}</div>
                            <div className="text-sm text-neutral-400">
                              {player.team_name} • {player.position}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromLineup(idx)}
                          className="text-red-400 hover:text-red-300 px-3 py-1 rounded hover:bg-red-900/20"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 text-neutral-500">
                        <div className="w-8 h-8 bg-neutral-700 rounded-full flex items-center justify-center font-bold">
                          {idx + 1}
                        </div>
                        <div>Empty Slot - Search for a player to add</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Lineup Grade */}
            {lineupGrade && (
              <div className="bg-highlight-dark rounded-lg p-6 border border-purple-700">
                <h2 className="text-xl font-bold mb-4">Lineup Grade</h2>
                
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-neutral-800 rounded-lg p-4 text-center">
                    <div className={`text-5xl font-bold ${lineupGrade.gradeColor}`}>
                      {lineupGrade.grade}
                    </div>
                    <div className="text-sm text-neutral-400 mt-2">Overall Grade</div>
                  </div>
                  <div className="bg-neutral-800 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-purple-400">
                      {lineupGrade.totalFP}
                    </div>
                    <div className="text-sm text-neutral-400 mt-2">Total Fantasy Points</div>
                  </div>
                  <div className="bg-neutral-800 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-blue-400">
                      {lineupGrade.avgFP}
                    </div>
                    <div className="text-sm text-neutral-400 mt-2">Avg Per Player</div>
                  </div>
                </div>

                <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mb-4">
                  <p className="text-sm">{lineupGrade.feedback}</p>
                </div>

                {lineupGrade.weakSpots.length > 0 && (
                  <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">⚠️ Spots Needing Improvement:</h3>
                    <div className="space-y-2">
                      {lineupGrade.weakSpots.map((player, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>{player.full_name}</span>
                          <span className="text-yellow-400">{player.fantasy_points.toFixed(1)} FP</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Player Search */}
          <div className="space-y-4">
            <div className="bg-highlight-dark rounded-lg p-6 border border-neutral-700 sticky top-4">
              <h2 className="text-xl font-bold mb-4">Search Players</h2>
              
              <div className="relative mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    searchPlayers(e.target.value);
                  }}
                  placeholder="Search by name..."
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500"
                  disabled={filledSlots >= 8}
                />
                {searching && (
                  <div className="absolute right-3 top-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-500"></div>
                  </div>
                )}
              </div>

              {filledSlots >= 8 && (
                <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-400">Lineup is full! Remove a player to add another.</p>
                </div>
              )}

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {searchResults.length > 0 ? (
                  searchResults.map((player) => (
                    <div
                      key={player.id}
                      onClick={() => filledSlots < 8 && addToLineup(player)}
                      className={`bg-neutral-800 border border-neutral-700 rounded-lg p-3 ${
                        filledSlots < 8 ? 'cursor-pointer hover:border-purple-500' : 'opacity-50 cursor-not-allowed'
                      } transition-colors`}
                    >
                      <div className="font-semibold">{player.full_name}</div>
                      <div className="text-sm text-neutral-400">
                        {player.team_name} • {player.position}
                      </div>
                    </div>
                  ))
                ) : searchQuery.length >= 2 ? (
                  <div className="text-center text-neutral-500 py-4">
                    No players found
                  </div>
                ) : (
                  <div className="text-center text-neutral-500 py-4">
                    Type to search for players
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suggestions Tab */}
      {activeTab === 'suggestions' && (
        <div>
          {topPlayers.length > 0 ? (
            <div className="space-y-4">
              <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mb-4">
                <h3 className="font-semibold mb-2">Top Projected Players</h3>
                <p className="text-sm text-neutral-300">
                  These players have the highest projected fantasy points based on recent performance and momentum.
                  Click any player to view their full profile.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {topPlayers.map((player, idx) => (
                  <TopPlayerCard
                    key={player.player_id}
                    player={player}
                    rank={idx + 1}
                    onClick={() => onPlayerClick(player.player_id)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-highlight-dark rounded-lg border border-neutral-700">
              <div className="text-6xl mb-4">🏀</div>
              <h3 className="text-xl font-bold mb-2">No Suggestions Available</h3>
              <p className="text-neutral-400">
                Unable to load player suggestions. Check back later.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TopPlayerCard({ player, rank, onClick }) {
  const borderColor = rank <= 3 ? 'border-yellow-500' : 'border-neutral-700';
  const bgColor = rank <= 3 ? 'bg-yellow-900/10' : 'bg-highlight-dark';

  return (
    <div
      onClick={onClick}
      className={`${bgColor} border ${borderColor} rounded-lg p-4 cursor-pointer hover:border-purple-500 transition-all hover:scale-[1.02]`}
    >
      <div className="flex items-start gap-4">
        {/* Rank */}
        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${
          rank === 1 ? 'bg-yellow-500 text-black' :
          rank === 2 ? 'bg-gray-400 text-black' :
          rank === 3 ? 'bg-orange-600 text-white' :
          'bg-neutral-700 text-neutral-300'
        }`}>
          {rank}
        </div>

        {/* Player Info */}
        <div className="flex-1">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-bold text-lg">{player.player_name}</h3>
              <p className="text-sm text-neutral-400">{player.team} • {player.position}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-purple-400">
                {player.projected_fantasy_points}
              </div>
              <div className="text-xs text-neutral-400">Projected FP</div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-5 gap-3 mb-3">
            <div className="bg-neutral-800 rounded p-2">
              <div className="text-xs text-neutral-400">PTS</div>
              <div className="font-semibold">{player.recent_stats.points}</div>
            </div>
            <div className="bg-neutral-800 rounded p-2">
              <div className="text-xs text-neutral-400">REB</div>
              <div className="font-semibold">{player.recent_stats.rebounds}</div>
            </div>
            <div className="bg-neutral-800 rounded p-2">
              <div className="text-xs text-neutral-400">AST</div>
              <div className="font-semibold">{player.recent_stats.assists}</div>
            </div>
            <div className="bg-neutral-800 rounded p-2">
              <div className="text-xs text-neutral-400">Avg FP</div>
              <div className="font-semibold">{player.avg_fantasy_points}</div>
            </div>
            <div className="bg-neutral-800 rounded p-2">
              <div className="text-xs text-neutral-400">Consistency</div>
              <div className="font-semibold">{player.consistency_score}</div>
            </div>
          </div>

          {/* Metrics */}
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-neutral-400">Momentum:</span>
              <div className="flex items-center gap-1">
                <div className="w-16 bg-neutral-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                    style={{ width: `${Math.min(player.momentum * 100, 100)}%` }}
                  />
                </div>
                <span className="text-purple-400 font-semibold">
                  {(player.momentum * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FantasyLineup;
