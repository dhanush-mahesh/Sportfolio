import { useState, useEffect } from 'react'
import axios from 'axios'
import PlayerList from './components/PlayerList'
import PlayerPage from './components/PlayerPage'
import ComparePage from './components/ComparePage'

const API_URL = 'http://127.0.0.1:8000'
const COMPARE_LIMIT = 3 // We'll keep the 3-player limit logic

function App() {
  const [players, setPlayers] = useState([])
  const [featuredPlayers, setFeaturedPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPlayerId, setSelectedPlayerId] = useState(null)
  
  // --- ⭐️ 1. CHANGED STATE TO AN ARRAY [] ---
  const [compareIds, setCompareIds] = useState([]) // Was new Set()
  const [viewingCompare, setViewingCompare] = useState(false)

  useEffect(() => {
    async function fetchInitialData() {
      try {
        const [playersRes, featuredRes] = await Promise.all([
          axios.get(`${API_URL}/players`),
          axios.get(`${API_URL}/featured-players`)
        ])
        setPlayers(playersRes.data)
        setFeaturedPlayers(featuredRes.data)
      } catch (error) {
        console.error("Error fetching initial data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchInitialData()
  }, [])

  // --- ⭐️ 2. UPDATED TOGGLE FUNCTION FOR ARRAYS ---
  const handleToggleCompare = (playerId) => {
    setCompareIds(prevIds => {
      // Check if player is already in the array
      if (prevIds.includes(playerId)) {
        // Remove them
        return prevIds.filter(id => id !== playerId);
      } else {
        // Add them if we are under the limit
        if (prevIds.length < COMPARE_LIMIT) {
          return [...prevIds, playerId];
        }
      }
      // If limit is reached, just return the old array
      return prevIds;
    })
  }

  // --- ⭐️ 3. UPDATED REPLACE FUNCTION FOR ARRAYS ---
  const handleReplacePlayer = (oldPlayerId, newPlayerId) => {
    setCompareIds(prevIds => {
      // Check if new player is already in the list
      if (prevIds.includes(newPlayerId)) {
        // Just remove the old one
        return prevIds.filter(id => id !== oldPlayerId);
      }
      
      // Swap them by mapping over the array, PRESERVING ORDER
      return prevIds.map(id => {
        if (id === oldPlayerId) {
          return newPlayerId; // This is the swap
        }
        return id;
      });
    });
  };

  const handleClearCompare = () => {
    setCompareIds([]) // Set to empty array
    setViewingCompare(false)
  }

  return (
    <div className="min-h-screen w-full">
      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {selectedPlayerId ? (
          <PlayerPage
            playerId={selectedPlayerId}
            onBackClick={() => setSelectedPlayerId(null)}
            apiUrl={API_URL}
          />
        ) : viewingCompare ? (
          <ComparePage 
            playerIds={compareIds} // Pass the array directly
            onBackClick={() => setViewingCompare(false)}
            onClear={handleClearCompare}
            apiUrl={API_URL}
            allPlayers={players}
            onReplacePlayer={handleReplacePlayer}
          />
        ) : (
          <PlayerList
            allPlayers={players}
            featuredPlayers={featuredPlayers}
            loading={loading}
            onPlayerClick={(id) => setSelectedPlayerId(id)}
            apiUrl={API_URL}
            compareIds={compareIds} // Pass the array
            onToggleCompare={handleToggleCompare}
            compareLimit={COMPARE_LIMIT}
          />
        )}
      </main>
      
      {/* Compare Bar */}
      {/* --- ⭐️ 4. CHANGED .size TO .length --- */}
      {compareIds.length > 0 && !selectedPlayerId && !viewingCompare && (
        <div className="sticky bottom-0 left-0 w-full bg-highlight-dark border-t-2 border-blue-500 shadow-lg p-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <p className="text-lg font-semibold">Comparing {compareIds.length} / {COMPARE_LIMIT} players</p>
            <div>
              <button
                onClick={handleClearCompare}
                className="text-neutral-400 hover:text-white mr-4"
              >
                Clear All
              </button>
              <button
                onClick={() => setViewingCompare(true)}
                disabled={compareIds.length < 2}
                className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-500
                           disabled:bg-neutral-600 disabled:cursor-not-allowed"
              >
                Compare Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
