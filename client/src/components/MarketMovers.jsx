import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
// --- ⭐️ 1. IMPORT 'motion' FROM FRAMER MOTION ---
import { motion } from 'framer-motion';

// --- ⭐️ 2. DEFINE OUR ANIMATIONS ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1, // Each child will animate 0.1s after the previous
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 }, // Start invisible and 20px down
  visible: {
    opacity: 1,
    y: 0, // Animate to visible and 0px
    transition: {
      type: 'spring',
      stiffness: 100,
    },
  },
};

// A reusable component for each player card
function MoverCard({ player, onPlayerClick }) {
  const isRiser = player.value_change > 0;
  
  return (
    // --- ⭐️ 3. WRAP THE CARD IN A 'motion.div' ---
    <motion.div
      variants={itemVariants} // Use the item animation
      className="flex items-center justify-between p-3 bg-highlight-dark border border-highlight-light rounded-lg 
                 cursor-pointer transition-all duration-200 hover:bg-highlight-light hover:border-blue-500"
      onClick={() => onPlayerClick(player.player_id)}
    >
      <div>
        <p className="text-sm font-semibold truncate">{player.full_name}</p>
        <p className="text-xs text-neutral-400">{player.team_name}</p>
      </div>
      <div className={`flex items-center text-sm font-bold ${isRiser ? 'text-green-400' : 'text-red-400'}`}>
        {isRiser ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
        <span className="ml-1">{player.value_change.toFixed(2)}</span>
      </div>
    </motion.div>
  );
}

// The main component that holds the two lists
function MarketMovers({ onPlayerClick, apiUrl }) {
  const [movers, setMovers] = useState({ risers: [], fallers: [] });
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    async function fetchMarketMovers() {
      try {
        const response = await axios.get(`${apiUrl}/market-movers`);
        setMovers(response.data || { risers: [], fallers: [] });
      } catch (error) {
        console.error("Error fetching market movers:", error);
        setMovers({ risers: [], fallers: [] });
      } finally {
        setLoading(false);
      }
    }
    fetchMarketMovers();
  }, [apiUrl]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="animate-spin text-neutral-500" size={32} />
      </div>
    );
  }

  const hasData = movers && (movers.risers?.length > 0 || movers.fallers?.length > 0);

  return (
    <div className="mb-12">
      {hasData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Risers Column */}
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-semibold mb-4 text-green-400">
              <TrendingUp size={24} /> Top Risers
            </h2>
            {/* --- ⭐️ 4. WRAP THE LIST IN A 'motion.div' --- */}
            <motion.div
              className="space-y-3"
              variants={containerVariants}
              initial="hidden"
              animate="visible" // Animate when it appears
            >
              {movers.risers.map(player => (
                <MoverCard key={player.player_id} player={player} onPlayerClick={onPlayerClick} />
              ))}
            </motion.div>
          </div>
          
          {/* Fallers Column */}
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-semibold mb-4 text-red-400">
              <TrendingDown size={24} /> Top Fallers
            </h2>
            {/* --- ⭐️ 5. WRAP THE LIST IN A 'motion.div' --- */}
            <motion.div
              className="space-y-3"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {movers.fallers.map(player => (
                <MoverCard key={player.player_id} player={player} onPlayerClick={onPlayerClick} />
              ))}
            </motion.div>
          </div>
        </div>
      ) : (
        <div className="text-center p-8 bg-highlight-dark border border-highlight-light rounded-lg">
          <p className="text-neutral-400">Market movers are being calculated. Check back tomorrow for the first report!</p>
        </div>
      )}
    </div>
  );
}

export default MarketMovers;