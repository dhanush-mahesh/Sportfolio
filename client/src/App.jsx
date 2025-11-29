import { useState, useEffect, lazy, Suspense } from 'react'
import axios from 'axios'
import PlayerList from './components/PlayerList'
import PlayerPage from './components/PlayerPage'

// Lazy load heavy components
const ComparePage = lazy(() => import('./components/ComparePage'))
const AIInsights = lazy(() => import('./components/AIInsights'))
const LiveScores = lazy(() => import('./components/LiveScores'))
const Watchlist = lazy(() => import('./components/Watchlist'))
const TradeSimulator = lazy(() => import('./components/TradeSimulator'))
const ChatBot = lazy(() => import('./components/ChatBot'))
const BettingPicks = lazy(() => import('./components/BettingPicks'))
const FantasyLineup = lazy(() => import('./components/FantasyLineup'))

// Loading fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <p className="text-neutral-400">Loading...</p>
    </div>
  </div>
)

const API_URL = import.meta.env.PROD 
  ? 'https://nba-analytics-api-2sal.onrender.com'  // Production (Render subdomain)
  : 'http://localhost:8000'                         // Development
const COMPARE_LIMIT = 3

function App() {
  const [players, setPlayers] = useState([])
  const [featuredPlayers, setFeaturedPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPlayerId, setSelectedPlayerId] = useState(null)
  const [currentView, setCurrentView] = useState('home')
  const [compareIds, setCompareIds] = useState([])
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
      {/* Navigation Bar */}
      {!selectedPlayerId && (
        <nav className="bg-highlight-dark border-b border-neutral-700 sticky top-0 z-50 backdrop-blur-lg bg-opacity-95">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <div className="flex items-center py-3">
                <img 
                  src="/SportfolioLogo.png" 
                  alt="Sportfolio Logo" 
                  className="h-50 w-40 object-contain cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => {
                    setCurrentView('home');
                    setViewingCompare(false);
                  }}
                />
              </div>
              
              {/* Navigation Tabs */}
              <NavigationDropdown 
                currentView={currentView}
                setCurrentView={setCurrentView}
                setViewingCompare={setViewingCompare}
              />
            </div>
          </div>
        </nav>
      )}

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {selectedPlayerId ? (
          <PlayerPage
            playerId={selectedPlayerId}
            onBackClick={() => setSelectedPlayerId(null)}
            apiUrl={API_URL}
          />
        ) : currentView === 'watchlist' ? (
          <Watchlist
            apiUrl={API_URL}
            onPlayerClick={(id) => setSelectedPlayerId(id)}
          />
        ) : currentView === 'simulator' ? (
          <Suspense fallback={<LoadingFallback />}>
            <TradeSimulator
              apiUrl={API_URL}
              onPlayerClick={(id) => setSelectedPlayerId(id)}
            />
          </Suspense>
        ) : currentView === 'live' ? (
          <Suspense fallback={<LoadingFallback />}>
            <LiveScores
              apiUrl={API_URL}
              onPlayerClick={(id) => setSelectedPlayerId(id)}
            />
          </Suspense>
        ) : currentView === 'ai' ? (
          <Suspense fallback={<LoadingFallback />}>
            <AIInsights
              apiUrl={API_URL}
              onPlayerClick={(id) => setSelectedPlayerId(id)}
            />
          </Suspense>
        ) : currentView === 'betting' ? (
          <Suspense fallback={<LoadingFallback />}>
            <BettingPicks
              apiUrl={API_URL}
              onPlayerClick={(id) => setSelectedPlayerId(id)}
            />
          </Suspense>
        ) : currentView === 'fantasy' ? (
          <Suspense fallback={<LoadingFallback />}>
            <FantasyLineup
              apiUrl={API_URL}
              onPlayerClick={(id) => setSelectedPlayerId(id)}
            />
          </Suspense>
        ) : viewingCompare ? (
          <Suspense fallback={<LoadingFallback />}>
            <ComparePage 
              playerIds={compareIds} // Pass the array directly
              onBackClick={() => setViewingCompare(false)}
              onClear={handleClearCompare}
              apiUrl={API_URL}
              allPlayers={players}
              onReplacePlayer={handleReplacePlayer}
            />
          </Suspense>
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
      
      {/* Compare Bar - Only show on home page */}
      {compareIds.length > 0 && !selectedPlayerId && !viewingCompare && currentView === 'home' && (
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

      {/* ChatBot - Always visible */}
      <ChatBot apiUrl={API_URL} />
    </div>
  )
}

// Navigation Tabs Component
function NavigationDropdown({ currentView, setCurrentView, setViewingCompare }) {
  const menuItems = [
    { id: 'home', label: 'Home' },
    { id: 'watchlist', label: 'Watchlist' },
    { id: 'live', label: 'Live Scores' },
    { id: 'simulator', label: 'Trade Simulator' },
    { id: 'ai', label: 'AI Insights' },
    { id: 'betting', label: 'Betting Picks' },
    { id: 'fantasy', label: 'Fantasy Lineup' },
  ];

  const handleSelect = (id) => {
    setCurrentView(id);
    setViewingCompare(false);
  };

  return (
    <div className="flex items-center gap-1 overflow-x-auto">
      {menuItems.map((item) => (
        <button
          key={item.id}
          onClick={() => handleSelect(item.id)}
          className={`px-4 py-2 font-medium text-sm whitespace-nowrap transition-all ${
            currentView === item.id
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-neutral-400 hover:text-neutral-200 border-b-2 border-transparent hover:border-neutral-600'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export default App
