import { useState, useMemo } from 'react'
import { Search, Loader2 } from 'lucide-react'
import MarketMovers from './MarketMovers' // <-- 1. Import the new component

function PlayerList({ players, loading, onPlayerClick, apiUrl }) { // <-- 2. Get apiUrl as a prop
  const [searchQuery, setSearchQuery] = useState("")

  const filteredPlayers = useMemo(() => {
    if (searchQuery === "") {
      return players
    }
    return players.filter(player =>
      player.full_name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [searchQuery, players])

  const displayPlayers = searchQuery === "" 
    ? filteredPlayers.slice(0, 9) 
    : filteredPlayers

  return (
    <div className="flex flex-col"> 
      
      <div className="text-center max-w-2xl mx-auto mb-12 mt-8">
        <h1 className="text-5xl font-bold tracking-tight text-transparent 
                       bg-clip-text bg-gradient-to-r from-neutral-100 to-neutral-500 mb-4">
          Player Asset Market
        </h1>
        <p className="text-xl text-neutral-400">
          The stock market for professional athletes. Track value, analyze sentiment, and buy low.
        </p>
      </div>

      {/* --- 3. Add the MarketMovers component here --- */}
      <MarketMovers onPlayerClick={onPlayerClick} apiUrl={apiUrl} />
      
      {/* Search Section */}
      <div className="w-full max-w-xl relative mb-12 self-center">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="text-neutral-500" size={24} />
        </div>
        <input
          type="text"
          placeholder="Search for a player (e.g. 'LeBron')..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-4 pl-12 bg-highlight-dark text-white border border-highlight-light 
                     rounded-2xl text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 
                     shadow-lg shadow-brand-light/50 transition-all"
        />
      </div>

      {/* Loading Spinner */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin text-neutral-500" size={48} />
        </div>
      )}

      {/* Player Grid */}
      {!loading && (
        <div className="w-full">
          <h2 className="text-2xl font-semibold mb-6 text-neutral-300 pl-1">
            {searchQuery ? `Search Results (${filteredPlayers.length})` : "Featured Players"}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayPlayers.map(player => (
              <div
                key={player.id}
                onClick={() => onPlayerClick(player.id)}
                className="group bg-highlight-dark border border-highlight-light rounded-xl p-6 
                           cursor-pointer transition-all duration-300 hover:bg-highlight-light 
                           hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 
                           transform hover:-translate-y-1"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">
                      {player.full_name}
                    </h3>
                    <p className="text-neutral-400 font-medium">{player.team_name}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-highlight-light text-xs font-bold text-neutral-300 border border-neutral-700">
                    {player.position || 'N/A'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {searchQuery === "" && (
            <p className="text-center text-neutral-500 mt-12">
              Start typing to search {players.length} players...
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default PlayerList