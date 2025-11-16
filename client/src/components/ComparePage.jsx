import { useState, useEffect } from 'react'
import axios from 'axios'
import { ArrowLeft, Loader2, X, RefreshCw } from 'lucide-react'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import CompareSearch from './CompareSearch'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

// (This PlayerChart component is now fixed to 0-100 scale)
function PlayerChart({ valueHistory }) {
  const labels = valueHistory.length ? valueHistory.map(d => new Date(d.value_date).toLocaleDateString()) : ['No Data'];
  const data = valueHistory.length ? valueHistory.map(d => d.value_score) : [50];
  if (data.length === 1) {
    labels.push(labels[0])
    data.push(data[0])
  }
  const chartData = {
    labels: labels,
    datasets: [
      {
        label: 'Player Value',
        data: data,
        borderColor: 'rgb(56, 189, 248)',
        backgroundColor: 'rgba(56, 189, 248, 0.2)',
        fill: true,
        tension: 0.3,
        pointBackgroundColor: 'rgb(56, 189, 248)',
        pointRadius: 5,
      },
    ],
  }
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { grid: { color: 'rgba(255, 255, 255, 0.1)' }, ticks: { color: '#a3a3a3' } },
      y: { grid: { color: 'rgba(255, 255, 255, 0.1)' }, ticks: { color: '#a3a3a3' }, min: 0, max: 100 }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: '#171717',
        titleFont: { size: 16, weight: 'bold' },
        bodyFont: { size: 14 },
        padding: 12,
        cornerRadius: 4,
      }
    }
  }
  return <Line data={chartData} options={options} />
}

// (This getStat helper is safe)
const getStat = (player, statKey, toFixed = 1) => {
  try {
    if (player && player.season_stats && player.season_stats[statKey] != null) {
      if (typeof player.season_stats[statKey] === 'number') {
        return player.season_stats[statKey].toFixed(toFixed);
      }
      return player.season_stats[statKey];
    }
  } catch (e) {
    console.error("Error getting stat:", e);
  }
  return 'N/A';
};

// (This getBetterStat helper is safe)
const getBetterStat = (playerStat, allStats, lowerIsBetter = false) => {
  const validStats = allStats.filter(s => s !== 'N/A');
  if (validStats.length < 2) return false;
  const numValue = parseFloat(playerStat);
  if (isNaN(numValue)) return false;
  const maxStat = Math.max(...validStats.map(s => parseFloat(s)));
  const minStat = Math.min(...validStats.map(s => parseFloat(s)));
  if (lowerIsBetter) {
    return numValue === minStat;
  } else {
    return numValue === maxStat;
  }
};

// (This StatRow component is safe)
const StatRow = ({ label, statKey, toFixed = 1, lowerIsBetter = false, players }) => {
  const allStats = players.map(p => getStat(p, statKey, toFixed));
  return (
    <tr className="border-b border-highlight-light even:bg-highlight-light/10">
      <td className="p-4 text-sm font-semibold text-neutral-400 whitespace-nowrap">{label}</td>
      {players.map((player, index) => {
        const value = allStats[index];
        const isBetter = getBetterStat(value, allStats, lowerIsBetter);
        return (
          <td key={player.info.id} className={`p-4 text-lg font-medium text-center whitespace-nowrap ${ isBetter ? 'text-green-400 font-bold' : 'text-white' }`}>
            {value}
          </td>
        );
      })}
    </tr>
  );
};


function ComparePage({ playerIds, onBackClick, onClear, apiUrl, allPlayers, onReplacePlayer }) {
  const [playerData, setPlayerData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [replacingPlayer, setReplacingPlayer] = useState(null)

  useEffect(() => {
    window.scrollTo(0, 0)
    setLoading(true);
    
    async function fetchCompareData() {
      try {
        const response = await axios.post(`${apiUrl}/players/compare`, {
          player_ids: playerIds
        })
        
        // --- ⭐️ THIS IS THE FIX ⭐️ ---
        // The API returns an object { id_A: {...}, id_B: {...} }
        // We must re-map this object into an array that
        // RESPECTS the order of the `playerIds` prop.
        const orderedData = playerIds.map(id => response.data[id]);
        setPlayerData(orderedData);
        // --- ⭐️ END OF FIX ⭐️ ---
        
      } catch (error) {
        console.error("Error fetching compare data:", error)
      } finally {
        setLoading(false)
      }
    }
    
    if (playerIds.length > 1) {
      fetchCompareData()
    } else {
      onBackClick()
    }
  }, [playerIds, apiUrl, onBackClick]) // Re-run if playerIds changes

  if (replacingPlayer) {
    return (
      <CompareSearch
        allPlayers={allPlayers}
        onCancel={() => setReplacingPlayer(null)}
        onSelectPlayer={(newPlayer) => {
          onReplacePlayer(replacingPlayer.info.id, newPlayer.id);
          setReplacingPlayer(null);
        }}
        existingPlayerIds={playerIds} 
        replacingPlayerName={replacingPlayer.info.full_name}
      />
    )
  }

  if (loading || !playerData || playerData.some(p => !p)) { // Safe check
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="animate-spin text-neutral-500" size={48} />
      </div>
    )
  }

  const colWidth = playerData.length === 2 ? 'w-1/3' : 'w-1/4';

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={onBackClick}
          className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={18} />
          Back to Player List
        </button>
        <button
          onClick={onClear}
          className="flex items-center gap-2 text-red-400 hover:text-red-300"
        >
          <X size={18} />
          Clear Comparison
        </button>
      </div>

      <h1 className="text-5xl font-bold mb-8">Player Comparison</h1>
      
      <div className="overflow-x-auto bg-highlight-dark border border-highlight-light rounded-xl shadow-lg">
        <table className="w-full table-fixed">
          {/* Headshots */}
          <thead>
            <tr className="border-b-2 border-highlight-light">
              <th className={`p-4 text-left text-sm font-semibold uppercase text-neutral-500 ${colWidth}`}>Player</th>
              {playerData.map(player => (
                <th key={player.info.id} className={`p-4 ${colWidth} relative`}>
                  <img 
                    src={player.info.headshot_url} 
                    alt={player.info.full_name}
                    className="w-24 h-24 rounded-full bg-highlight-light object-cover border-2 border-neutral-700 mx-auto"
                    onError={(e) => e.target.src = 'https://cdn.nba.com/headshots/nba/latest/1040x760/fallback.png'}
                  />
                  <p className="text-xl font-bold mt-4 text-white truncate">{player.info.full_name}</p>
                  <p className="text-neutral-400 truncate">{player.info.team_name} &middot; {player.info.position}</p>
                  
                  <button
                    onClick={() => setReplacingPlayer(player)}
                    className="mt-2 flex items-center gap-1.5 mx-auto text-xs text-blue-400 hover:text-blue-300"
                  >
                    <RefreshCw size={12} />
                    Replace
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          
          {/* Season Stats */}
          <thead className="bg-highlight-light/20">
            <tr>
              <th colSpan={playerData.length + 1} className="p-3 text-left text-sm font-semibold uppercase text-blue-300 tracking-wider">
                Season Averages
              </th>
            </tr>
          </thead>
          <tbody>
            <StatRow label="Games Played" statKey="games_played" toFixed={0} players={playerData} />
            <StatRow label="MIN" statKey="minutes_avg" players={playerData} />
            <StatRow label="PTS" statKey="points_avg" players={playerData} />
            <StatRow label="REB" statKey="rebounds_avg" players={playerData} />
            <StatRow label="AST" statKey="assists_avg" players={playerData} />
            <StatRow label="STL" statKey="steals_avg" players={playerData} />
            <StatRow label="BLK" statKey="blocks_avg" players={playerData} />
            <StatRow label="TOV" statKey="turnovers_avg" lowerIsBetter={true} players={playerData} />
          </tbody>
          
          {/* Value Charts */}
          <thead className="bg-highlight-light/20">
            <tr>
              <th colSpan={playerData.length + 1} className="p-3 text-left text-sm font-semibold uppercase text-blue-300 tracking-wider">
                Value Chart
              </th>
            </tr>
          </thead>
          <tbody className="even:bg-highlight-light/10">
            <tr className="border-b-0">
              <td className="p-4 text-sm font-semibold text-neutral-400">Value Trend</td>
              {playerData.map(player => (
                <td key={player.info.id} className="p-4 h-64">
                  <PlayerChart valueHistory={player.value_history} />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ComparePage