import { useState, useEffect } from 'react'
import axios from 'axios'
import { ArrowLeft, Loader2, Newspaper, TrendingUp, BarChartHorizontal } from 'lucide-react'
import PlayerChart from './Chart' // We will create this next
import StatCard from './StatCard' // We will create this next

function PlayerPage({ playerId, onBackClick, apiUrl }) {
  const [player, setPlayer] = useState(null)
  const [stats, setStats] = useState([])
  const [news, setNews] = useState([])
  const [valueHistory, setValueHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Scroll to top when the page loads
    window.scrollTo(0, 0)
    
    async function fetchPlayerData() {
      setLoading(true)
      try {
        // Run all API calls in parallel for speed
        const [infoRes, statsRes, newsRes, valueRes] = await Promise.all([
          axios.get(`${apiUrl}/player/${playerId}`),
          axios.get(`${apiUrl}/player/${playerId}/stats`),
          axios.get(`${apiUrl}/player/${playerId}/news`),
          axios.get(`${apiUrl}/player/${playerId}/value_history`)
        ])
        
        setPlayer(infoRes.data)
        setStats(statsRes.data)
        setNews(newsRes.data)
        setValueHistory(valueRes.data)

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

  if (!player) {
    return <p>Player not found.</p>
  }

  // Get the most recent value score for the header
  const latestValue = valueHistory.length > 0 ? valueHistory[valueHistory.length - 1]?.value_score : null;

  return (
    <div>
      {/* Back Button */}
      <button
        onClick={onBackClick}
        className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft size={18} />
        Back to Player List
      </button>

      {/* Player Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-5xl font-bold">{player.full_name}</h1>
          <p className="text-2xl text-neutral-400">{player.team_name} &middot; {player.position || 'N/A'}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-neutral-500">Current Value</p>
          <p className="text-5xl font-bold text-green-400">
            {latestValue ? latestValue.toFixed(2) : 'N/A'}
          </p>
        </div>
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

          {/* Stats Section */}
          <div className="bg-highlight-dark border border-highlight-light rounded-lg p-6">
            <h2 className="flex items-center gap-2 text-2xl font-semibold mb-4">
              <BarChartHorizontal size={24} />
              Recent Performance
            </h2>
            {stats.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <StatCard label="Points" value={stats[0].points} />
                <StatCard label="Rebounds" value={stats[0].rebounds} />
                <StatCard label="Assists" value={stats[0].assists} />
                <StatCard label="Steals" value={stats[0].steals} />
                <StatCard label="Blocks" value={stats[0].blocks} />
              </div>
            ) : (
              <p className="text-neutral-400">No recent game stats found.</p>
            )}
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