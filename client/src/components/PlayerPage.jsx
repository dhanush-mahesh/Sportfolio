import { useState, useEffect } from 'react'
import axios from 'axios'
import { ArrowLeft, Loader2, Newspaper, TrendingUp, BarChartHorizontal, CheckSquare } from 'lucide-react'
import PlayerChart from './Chart'
import StatCard from './StatCard'

function PlayerPage({ playerId, onBackClick, apiUrl }) {
  const [player, setPlayer] = useState(null)
  const [stats, setStats] = useState([])
  const [news, setNews] = useState([])
  const [valueHistory, setValueHistory] = useState([])
  const [seasonStats, setSeasonStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isInWatchlist, setIsInWatchlist] = useState(false)

  // Check if player is in watchlist
  useEffect(() => {
    const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
    setIsInWatchlist(watchlist.includes(playerId));
  }, [playerId]);

  const toggleWatchlist = () => {
    const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
    
    if (isInWatchlist) {
      // Remove from watchlist
      const updated = watchlist.filter(id => id !== playerId);
      localStorage.setItem('watchlist', JSON.stringify(updated));
      setIsInWatchlist(false);
    } else {
      // Add to watchlist
      const updated = [...watchlist, playerId];
      localStorage.setItem('watchlist', JSON.stringify(updated));
      setIsInWatchlist(true);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0)
    
    async function fetchPlayerData() {
      setLoading(true)
      try {
        const [infoRes, statsRes, newsRes, valueRes, seasonStatsRes] = await Promise.all([
          axios.get(`${apiUrl}/player/${playerId}`),
          axios.get(`${apiUrl}/player/${playerId}/stats`),
          axios.get(`${apiUrl}/player/${playerId}/news`),
          axios.get(`${apiUrl}/player/${playerId}/value_history`),
          axios.get(`${apiUrl}/player/${playerId}/season_stats`)
        ])
        
        setPlayer(infoRes.data)
        setStats(statsRes.data)
        setNews(newsRes.data)
        setValueHistory(valueRes.data)
        setSeasonStats(seasonStatsRes.data)

      } catch (error) {
        console.error("Error fetching player details:", error)
      } finally {
        setLoading(false)
      }
    }

    if (playerId) {
      fetchPlayerData()
    }
  }, [playerId, apiUrl])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="animate-spin text-neutral-500" size={48} />
      </div>
    )
  }

  // Check if player has played this season
  const hasPlayedThisSeason = stats && stats.length > 0;
  const hasSeasonStats = seasonStats && seasonStats.games_played > 0;
  
  // Check for injury/inactive status from news
  const injuryKeywords = ['injury', 'injured', 'out', 'sidelined', 'surgery', 'tear', 'sprain', 'fracture', 'inactive', 'dnp'];
  const injuryNews = news.find(article => 
    injuryKeywords.some(keyword => 
      article.headline_text?.toLowerCase().includes(keyword)
    )
  );
  
  const getPlayerStatus = () => {
    if (hasPlayedThisSeason) return null;
    
    if (injuryNews) {
      return {
        icon: '🏥',
        title: 'Injured - No Games This Season',
        description: injuryNews.headline_text,
        source: injuryNews.source,
        date: injuryNews.article_date
      };
    }
    
    return {
      icon: '⏸️',
      title: 'Inactive This Season',
      description: 'This player has not played any games this season. Check news for updates on their status.',
      source: null,
      date: null
    };
  };
  
  const playerStatus = getPlayerStatus();

  // If player data failed to load
  if (!player) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold mb-2">Unable to Load Player Data</h2>
        <p className="text-neutral-400 mb-6">There was an error loading this player's information. Please try again.</p>
        <button
          onClick={onBackClick}
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl transition-colors"
        >
          Back to Player List
        </button>
      </div>
    )
  }

  // --- ⭐️ 1. NEW LOGIC TO CALCULATE ALL 3 VALUES ---
  let latestValue = null;
  let previousValue = null; // We will pass this to the UI
  let valueChange = null;
  let valueChangeColor = 'text-neutral-500';
  let valueChangeSymbol = ''; // Use '+' or '-'

  if (valueHistory.length > 0) {
    latestValue = valueHistory[valueHistory.length - 1].value_score;
  }
  
  if (valueHistory.length > 1) {
    previousValue = valueHistory[valueHistory.length - 2].value_score; // Get previous score
    valueChange = latestValue - previousValue;
    
    if (valueChange > 0) {
      valueChangeColor = 'text-green-400';
      valueChangeSymbol = '+'; // Use a plus sign
    } else if (valueChange < 0) {
      valueChangeColor = 'text-red-400';
      valueChangeSymbol = '-'; // Use a minus sign
    }
    // if 0, it will just be 'text-neutral-500' and no symbol
  }
  // --- ⭐️ END OF NEW LOGIC ---

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <img 
          src="/SportfolioLogo.png" 
          alt="Sportfolio Logo" 
          className="w-40 h-30 cursor-pointer" 
          onClick={onBackClick}
        />
        
        <div className="flex items-center gap-4">
          <button
            onClick={toggleWatchlist}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
              isInWatchlist
                ? 'bg-yellow-600 text-white hover:bg-yellow-500'
                : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
            }`}
          >
            <span>{isInWatchlist ? '⭐' : '☆'}</span>
            {isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
          </button>
          
          <button
            onClick={onBackClick}
            className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
            Back to Player List
          </button>
        </div>
      </div>

      {/* Player Header */}
      <div className="flex justify-between items-center mb-8">
         <div>
          <h1 className="text-5xl font-bold">{player.full_name}</h1>
          <p className="text-2xl text-neutral-400">{player.team_name} &middot; {player.position || 'N/A'}</p>
        </div>

        {/* --- ⭐️ 2. UPDATED JSX FOR CURRENT VALUE --- */}
        <div className="text-right">
          <p className="text-sm text-neutral-500">Current Value</p>
          
          {/* The main current value */}
          <p className="text-5xl font-bold">
            {latestValue ? latestValue.toFixed(2) : 'N/A'}
          </p>
          
          {/* The new sub-header showing previous and change */}
          {valueChange !== null ? (
            <div className="flex items-baseline justify-end gap-2">
              <span className={`text-lg font-semibold ${valueChangeColor}`}>
                {valueChangeSymbol}{Math.abs(valueChange).toFixed(2)}
              </span>
              <span className="text-md text-neutral-500">
                (from {previousValue.toFixed(2)})
              </span>
            </div>
          ) : (
            // Fallback for when there's only 1 day of data
            <span className="text-md text-neutral-500">No change data yet</span>
          )}
        </div>
        {/* --- ⭐️ END OF UPDATED JSX --- */}
        
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: Chart & Stats */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Chart */}
          <div className="bg-highlight-dark border border-highlight-light rounded-lg p-6">
             <h2 className="flex items-center gap-2 text-2xl font-semibold mb-4">
              <TrendingUp size={24} />
              Value Index Chart
            </h2>
            <div className="h-96">
              <PlayerChart valueHistory={valueHistory} />
            </div>
          </div>

          {/* Recent Game Stats */}
          <div className="bg-highlight-dark border border-highlight-light rounded-lg p-6">
            <h2 className="flex items-center gap-2 text-2xl font-semibold mb-4">
              <BarChartHorizontal size={24} />
              Most Recent Game
            </h2>
            {!hasPlayedThisSeason && playerStatus ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">{playerStatus.icon}</div>
                <p className="text-lg font-semibold text-neutral-300 mb-2">{playerStatus.title}</p>
                <p className="text-sm text-neutral-400 mb-3 max-w-md mx-auto">{playerStatus.description}</p>
                {playerStatus.source && (
                  <p className="text-xs text-neutral-600">
                    Source: {playerStatus.source} • {new Date(playerStatus.date).toLocaleDateString()}
                  </p>
                )}
              </div>
            ) : hasPlayedThisSeason && stats.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatCard label="Points" value={stats[0].points} />
                <StatCard label="Rebounds" value={stats[0].rebounds} />
                <StatCard label="Assists" value={stats[0].assists} />
                <StatCard label="Steals" value={stats[0].steals} />
                <StatCard label="Blocks" value={stats[0].blocks} />
                <StatCard label="TOVs" value={stats[0].turnovers} />
              </div>
            ) : null}
          </div>
          
          {/* Season Stats Table */}
          <div className="bg-highlight-dark border border-highlight-light rounded-lg p-6">
            <h2 className="flex items-center gap-2 text-2xl font-semibold mb-4">
              <CheckSquare size={24} />
              Season Averages (Per Game)
            </h2>
            {!hasSeasonStats && playerStatus ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">📊</div>
                <p className="text-lg font-semibold text-neutral-300 mb-2">No Season Stats Available</p>
                <p className="text-sm text-neutral-400">{playerStatus.title}</p>
              </div>
            ) : hasSeasonStats && seasonStats ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-highlight-light">
                      <th className="p-2 text-neutral-400">Season</th>
                      <th className="p-2 text-neutral-400">GP</th>
                      <th className="p-2 text-neutral-400">MIN</th>
                      <th className="p-2 text-neutral-400">PTS</th>
                      <th className="p-2 text-neutral-400">REB</th>
                      <th className="p-2 text-neutral-400">AST</th>
                      <th className="p-2 text-neutral-400">STL</th>
                      <th className="p-2 text-neutral-400">BLK</th>
                      <th className="p-2 text-neutral-400">TOV</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="font-medium">
                      <td className="p-2">{seasonStats.season}</td>
                      <td className="p-2">{seasonStats.games_played}</td>
                      <td className="p-2">{seasonStats.minutes_avg?.toFixed(1) || 'N/A'}</td>
                      <td className="p-2">{seasonStats.points_avg?.toFixed(1) || 'N/A'}</td>
                      <td className="p-2">{seasonStats.rebounds_avg?.toFixed(1) || 'N/A'}</td>
                      <td className="p-2">{seasonStats.assists_avg?.toFixed(1) || 'N/A'}</td>
                      <td className="p-2">{seasonStats.steals_avg?.toFixed(1) || 'N/A'}</td>
                      <td className="p-2">{seasonStats.blocks_avg?.toFixed(1) || 'N/A'}</td>
                      <td className="p-2">{seasonStats.turnovers_avg?.toFixed(1) || 'N/A'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
          
        </div>

        {/* Right Column: Market Buzz */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-highlight-dark border border-highlight-light rounded-lg p-6">
            <h2 className="flex items-center gap-2 text-2xl font-semibold mb-4">
              <Newspaper size={24} />
              Market Buzz
            </h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {news.length > 0 ? (
                news.map((article, index) => (
                  <div key={index} className="border-b border-highlight-light pb-4 last:border-b-0">
                    <p className="font-medium">{article.headline_text}</p>
                    <p className={`text-sm ${article.sentiment_score > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      Sentiment Score: {article.sentiment_score.toFixed(2)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-neutral-400">No recent news found.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlayerPage