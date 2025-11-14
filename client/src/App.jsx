import { useState, useEffect } from 'react'
import axios from 'axios'
import PlayerList from './components/PlayerList'
import PlayerPage from './components/PlayerPage'

// Your API is running here
const API_URL = 'http://127.0.0.1:8000'

function App() {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPlayerId, setSelectedPlayerId] = useState(null)

  // Fetch all players once on load
  useEffect(() => {
    async function fetchPlayers() {
      try {
        const response = await axios.get(`${API_URL}/players`)
        setPlayers(response.data)
      } catch (error) {
        console.error("Error fetching players:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchPlayers()
  }, [])

  return (
    <div className="min-h-screen w-full">
      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {/* This is the main router logic */}
        {selectedPlayerId ? (
          <PlayerPage
            playerId={selectedPlayerId}
            onBackClick={() => setSelectedPlayerId(null)}
            apiUrl={API_URL}
          />
        ) : (
          <PlayerList
            players={players}
            loading={loading}
            onPlayerClick={(id) => setSelectedPlayerId(id)}
            apiURL={API_URL}
          />
        )}
      </main>
    </div>
  )
}

export default App
