import { useState, useEffect } from 'react'

const API_BASE = 'http://localhost:8000/api'

interface ItemInfo {
  name: string;
  description: string;
  item_type: 'weapon' | 'armor' | 'consumable';
  value: number;
  attack_bonus?: number;
  defense_bonus?: number;
  heal_hp?: number;
  restore_energy?: number;
}

interface PlayerState {
  name: string;
  hp: number;
  max_hp: number;
  attack_power: number;
  base_attack_power: number;
  energy: number;
  max_energy: number;
  level: number;
  xp: number;
  gold: number;
  inventory: ItemInfo[];
  summons: string[];
  equipped_weapon: ItemInfo | null;
  equipped_armor: ItemInfo | null;
  current_location: string;
}

interface EnemyState {
  name: string;
  hp: number;
  max_hp: number;
  attack_power: number;
  xp_reward: number;
  gold_reward: number;
}

interface GameStateData {
  player: PlayerState;
  combat: {
    enemies: EnemyState[];
    log: string[];
  };
}

interface MapLocation {
  name: string;
  description: string;
  region: string;
  x: number;
  y: number;
  connections: string[];
}

function App() {
  const [gameState, setGameState] = useState<GameStateData | null>(null)
  const [mapData, setMapData] = useState<Record<string, MapLocation>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>(["Connecting to Soul Society backend..."])

  const addLog = (msg: string) => {
    setLogs(prev => [msg, ...prev].slice(0, 50))
  }

  const fetchState = async () => {
    try {
      const res = await fetch(`${API_BASE}/state`)
      if (!res.ok) throw new Error("Server error")
      const data = await res.json() as GameStateData
      setGameState(data)
      setError(null)
    } catch (err) {
      console.error(err)
      setError("Unable to connect to game server. Make sure the FastAPI backend is running on port 8000.")
    } finally {
      setLoading(false)
    }
  };

  const fetchMap = async () => {
    try {
      const res = await fetch(`${API_BASE}/map`)
      if (res.ok) {
        const data = await res.json() as Record<string, MapLocation>
        setMapData(data)
      }
    } catch (err) {
      console.error("Error fetching map details:", err)
    }
  }

  useEffect(() => {
    fetchState()
    fetchMap()
    const timer = setInterval(fetchState, 5000) // Poll every 5s
    return () => clearInterval(timer)
  }, [])

  const handleAction = async (endpoint: string, body = {}, successMsg: string | null = null) => {
    try {
      const res = await fetch(`${API_BASE}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (!res.ok) {
        const errData = await res.json() as { detail?: string }
        throw new Error(errData.detail || "Action failed")
      }
      const data = await res.json() as { state?: GameStateData; log?: string; message?: string }
      if (data.state) {
        setGameState(data.state)
      } else {
        await fetchState()
      }
      if (successMsg) addLog(successMsg)
      else if (data.log) addLog(data.log)
      else if (data.message) addLog(data.message)
    } catch (err) {
      if (err instanceof Error) {
        addLog(`Error: ${err.message}`)
      } else {
        addLog('An unknown error occurred')
      }
    }
  }

  const exploreDungeon = () => handleAction('explore/dungeon')
  const saveGame = () => handleAction('game/save', {}, "Game saved successfully.")
  const loadGame = () => handleAction('game/load', {}, "Game loaded successfully.")

  const resetPlayer = async () => {
    const name = prompt("Enter a name for your soul reaper:", gameState?.player?.name || "Ichigo")
    if (name) {
      try {
        const res = await fetch(`${API_BASE}/player/reset?name=${encodeURIComponent(name)}`, {
          method: 'POST'
        })
        const data = await res.json() as GameStateData
        setGameState(data)
        addLog(`Re-entered the Soul Society as ${name}!`)
      } catch (err) {
        if (err instanceof Error) {
          addLog(`Reset failed: ${err.message}`)
        }
      }
    }
  }

  const useItem = (itemName: string, type: 'weapon' | 'armor' | 'consumable') => {
    if (type === 'consumable') {
      handleAction('player/use', { item_name: itemName })
    } else {
      handleAction('player/equip', { item_name: itemName })
    }
  }

  const movePlayer = (dest: string) => {
    handleAction('player/move', { destination: dest })
  }

  const attackEnemy = () => handleAction('combat/attack')
  const runAway = () => handleAction('combat/run')

  if (loading && !gameState) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <div className="text-neon-cyan font-mono text-xl tracking-widest mb-5 animate-pulse">Syncing Soul Energy...</div>
        <div className="w-12 h-12 border-4 border-neon-cyan/20 border-t-neon-cyan rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error && !gameState) {
    return (
      <div className="max-w-[600px] mx-auto mt-24 p-8 text-center bg-bg-panel/45 backdrop-blur-md border border-red-500/20 rounded-xl shadow-2xl">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Server Connection Offline</h2>
        <p className="text-gray-400 mb-6 leading-relaxed">{error}</p>
        <div className="bg-black/30 p-4 rounded-lg font-mono text-sm text-left mb-6 text-gray-300 border border-white/5">
          # Start the backend server:<br/>
          cd /home/chetan/Documents/Hinaverse/domain-of-the-soul-society<br/>
          /home/chetan/Documents/Hinaverse/.venv/bin/uvicorn app:app --reload
        </div>
        <button 
          className="bg-gradient-to-br from-neon-magenta to-neon-purple text-white border-0 rounded-lg py-3 px-6 font-bold uppercase tracking-wider cursor-pointer shadow-[0_4px_15px_rgba(255,0,127,0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(255,0,127,0.5)] transition-all duration-200" 
          onClick={fetchState}
        >
          Retry Connection
        </button>
      </div>
    )
  }

  if (!gameState || !gameState.player) return null

  const { player, combat } = gameState
  const hpPct = (player.hp / player.max_hp) * 100
  const energyPct = (player.energy / player.max_energy) * 100
  const xpPct = (player.xp / (player.level * 100)) * 100

  // Calculate current location details
  const currentLocDetails = mapData[player.current_location]
  const inCombat = combat.enemies && combat.enemies.length > 0
  const activeEnemy = inCombat ? combat.enemies[0] : null
  const enemyHpPct = activeEnemy ? (activeEnemy.hp / activeEnemy.max_hp) * 100 : 0

  // Region theme detectors
  const currentRegion = currentLocDetails?.region || "Shibuya"
  const isShibuya = currentRegion.toLowerCase() === 'shibuya'
  const isSeireitei = currentRegion.toLowerCase() === 'soul society'
  const isHuecoMundo = currentRegion.toLowerCase() === 'hueco mundo'

  return (
    <div className={`min-h-screen w-full relative transition-all duration-500 ${
      isShibuya 
        ? 'shibuya-scanlines bg-[#0a0a0f] text-gray-200' 
        : isSeireitei
          ? 'bg-[#060814] text-[#d1d5db]'
          : isHuecoMundo
            ? 'bg-[#0c0d12] text-[#e7e5e4]'
            : 'bg-bg-dark text-[#c5c6c7]'
    }`}>
      {/* Floating Sakura Petals for Soul Society theme */}
      {isSeireitei && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="sakura-petal" style={{ left: '10%', animationDelay: '0s', width: '10px', height: '14px' }}></div>
          <div className="sakura-petal" style={{ left: '25%', animationDelay: '3s', width: '14px', height: '18px' }}></div>
          <div className="sakura-petal" style={{ left: '42%', animationDelay: '6s', width: '8px', height: '12px' }}></div>
          <div className="sakura-petal" style={{ left: '60%', animationDelay: '1.5s', width: '12px', height: '16px' }}></div>
          <div className="sakura-petal" style={{ left: '78%', animationDelay: '8s', width: '16px', height: '22px' }}></div>
          <div className="sakura-petal" style={{ left: '90%', animationDelay: '4.5s', width: '10px', height: '14px' }}></div>
        </div>
      )}

      {/* Floating Sandstorm Particles for Hueco Mundo theme */}
      {isHuecoMundo && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="sand-particle" style={{ left: '5%', top: '10%', animationDelay: '0s', width: '4px', height: '4px' }}></div>
          <div className="sand-particle" style={{ left: '22%', top: '35%', animationDelay: '1.8s', width: '6px', height: '5px' }}></div>
          <div className="sand-particle" style={{ left: '45%', top: '15%', animationDelay: '3.5s', width: '3px', height: '3px' }}></div>
          <div className="sand-particle" style={{ left: '65%', top: '55%', animationDelay: '0.8s', width: '5px', height: '4px' }}></div>
          <div className="sand-particle" style={{ left: '78%', top: '22%', animationDelay: '5.2s', width: '7px', height: '6px' }}></div>
          <div className="sand-particle" style={{ left: '92%', top: '48%', animationDelay: '2.4s', width: '4px', height: '4px' }}></div>
        </div>
      )}

      <div className="max-w-[1200px] w-full mx-auto p-5 box-border relative z-10">
        
        {/* Dynamic header style based on active zone */}
        <header className={`mb-7 text-center border-b-2 pb-5 transition-all duration-500 ${
          isShibuya 
            ? 'border-neon-magenta/25' 
            : isSeireitei
              ? 'border-pink-500/20'
              : isHuecoMundo
                ? 'border-amber-500/20'
                : 'border-neon-cyan/20'
        }`}>
          <h1 className={`text-4xl md:text-5xl font-black uppercase tracking-widest transition-all duration-500 my-2 ${
            isShibuya 
              ? 'text-white shibuya-neon-text' 
              : isSeireitei
                ? 'text-white seireitei-neon-text'
                : isHuecoMundo
                  ? 'text-white hueco-neon-text'
                  : 'text-white [text-shadow:0_0_10px_rgba(102,252,241,0.3),0_0_20px_rgba(255,0,127,0.2)]'
          }`}>
            Domain of the Soul Society
          </h1>
          <div className={`font-mono text-xs tracking-widest transition-all duration-500 ${
            isShibuya 
              ? 'text-neon-magenta font-semibold' 
              : isSeireitei
                ? 'text-pink-300 font-semibold'
                : isHuecoMundo
                  ? 'text-yellow-400 font-semibold'
                  : 'text-neon-cyan'
          }`}>
            {isShibuya && '⚠️ SECTOR LOCKDOWN: SHIBUYA DISTRICT ACTIVE'}
            {isSeireitei && '🌸 SPIRITUAL PRESSURE AREA: SEIREITEI / SOUL SOCIETY'}
            {isHuecoMundo && '🌙 HOLLOW INFESTATION AREA: LAS NOCHES / HUECO MUNDO'}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6 mb-7">
          {/* Left Column: Player Stats */}
          <section className={`backdrop-blur-md border rounded-xl p-5 shadow-2xl transition-all duration-300 ${
            isShibuya 
              ? 'bg-black/45 border-neon-magenta/20 hover:border-neon-magenta/40 hover:shadow-[0_8px_32px_rgba(255,0,127,0.05)]' 
              : isSeireitei
                ? 'bg-black/45 border-pink-500/20 hover:border-pink-500/40 hover:shadow-[0_8px_32px_rgba(255,183,197,0.05)]'
                : isHuecoMundo
                  ? 'bg-black/45 border-amber-500/20 hover:border-amber-500/40 hover:shadow-[0_8px_32px_rgba(245,158,11,0.05)]'
                  : 'bg-bg-panel/45 border-neon-cyan/20 hover:border-neon-cyan/40 hover:shadow-[0_8px_32px_rgba(102,252,241,0.05)]'
          }`}>
            <h2 className={`text-xl font-bold text-white border-l-4 pl-3 mb-5 uppercase tracking-wider transition-all duration-500 ${
              isShibuya 
                ? 'border-neon-magenta text-white' 
                : isSeireitei
                  ? 'border-pink-400 text-white'
                  : isHuecoMundo
                    ? 'border-yellow-500 text-white'
                    : 'border-neon-cyan'
            }`}>
              Soul Status
            </h2>
            
            <div className="flex justify-between items-baseline mb-4">
              <span className="text-2xl font-bold text-white">{player.name}</span>
              <span className={`font-mono text-sm tracking-wide transition-all duration-500 ${
                isShibuya 
                  ? 'text-neon-magenta' 
                  : isSeireitei
                    ? 'text-pink-300'
                    : isHuecoMundo
                      ? 'text-yellow-400'
                      : 'text-neon-cyan'
              }`}>
                RANK: Soul Reaper (LVL {player.level})
              </span>
            </div>

            {/* HP Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1 uppercase font-bold text-gray-300">
                <span>HP</span>
                <span>{player.hp} / {player.max_hp}</span>
              </div>
              <div className="w-full bg-white/10 h-3.5 rounded-full overflow-hidden border border-white/5">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    isSeireitei 
                      ? 'bg-gradient-to-r from-pink-700 to-pink-400 shadow-[0_0_8px_rgba(236,72,153,0.5)]'
                      : isHuecoMundo
                        ? 'bg-gradient-to-r from-amber-700 to-yellow-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                        : 'bg-gradient-to-r from-red-800 to-hp-color shadow-[0_0_8px_rgba(255,62,62,0.5)]'
                  }`} 
                  style={{ width: `${hpPct}%` }}
                ></div>
              </div>
            </div>

            {/* Energy Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1 uppercase font-bold text-gray-300">
                <span>Reiryoku (Energy)</span>
                <span>{player.energy} / {player.max_energy}</span>
              </div>
              <div className="w-full bg-white/10 h-3.5 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-cyan-800 to-energy-color shadow-[0_0_8px_rgba(0,188,212,0.5)] transition-all duration-300" 
                  style={{ width: `${energyPct}%` }}
                ></div>
              </div>
            </div>

            {/* XP Bar */}
            <div className="mb-5">
              <div className="flex justify-between text-sm mb-1 uppercase font-bold text-gray-300">
                <span>XP ({Math.round(xpPct)}%)</span>
                <span>{player.xp} / {player.level * 100}</span>
              </div>
              <div className="w-full bg-white/10 h-3.5 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-green-800 to-xp-color shadow-[0_0_8px_rgba(139,195,74,0.5)] transition-all duration-300" 
                  style={{ width: `${xpPct}%` }}
                ></div>
              </div>
            </div>

            {/* Attributes */}
            <div className="grid grid-cols-2 gap-4 mt-5">
              <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
                <div className={`text-2xl font-bold transition-all duration-500 ${
                  isShibuya 
                    ? 'text-neon-magenta' 
                    : isSeireitei
                      ? 'text-pink-300'
                      : isHuecoMundo
                        ? 'text-yellow-400'
                        : 'text-neon-cyan'
                }`}>{player.attack_power}</div>
                <div className="text-[10px] uppercase text-gray-500 mt-1">Attack Power</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
                <div className={`text-2xl font-bold transition-all duration-500 ${
                  isShibuya 
                    ? 'text-neon-magenta' 
                    : isSeireitei
                      ? 'text-pink-300'
                      : isHuecoMundo
                        ? 'text-yellow-400'
                        : 'text-neon-cyan'
                }`}>{player.gold}</div>
                <div className="text-[10px] uppercase text-gray-500 mt-1">Gold Coins</div>
              </div>
            </div>

            {/* Summon Seals */}
            <div className="mt-5 text-left">
              <span className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Active Summon Seals</span>
              <div className="flex flex-wrap gap-2.5 mt-2">
                {player.summons.length > 0 ? (
                  player.summons.map((s, idx) => (
                    <span 
                      key={idx} 
                      className={`border rounded px-2 py-1 text-xs capitalize transition-all duration-500 ${
                        isShibuya 
                          ? 'bg-neon-magenta/10 border-neon-magenta/20 text-neon-magenta' 
                          : isSeireitei
                            ? 'bg-pink-500/10 border-pink-500/20 text-pink-300'
                            : isHuecoMundo
                              ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-350'
                              : 'bg-neon-cyan/10 border-neon-cyan/20 text-neon-cyan'
                      }`}
                    >
                      🔮 {s}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-600 italic">No active seals in inventory.</span>
                )}
              </div>
            </div>

            {/* Equipped Gear */}
            <div className="mt-6 border-t border-white/10 pt-5">
              <span className="text-[10px] uppercase text-gray-500 font-bold tracking-wider block text-left mb-2.5">Equipped Gear</span>
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-3 flex items-center gap-3 rounded-lg border transition-all ${
                  player.equipped_weapon 
                    ? isShibuya 
                      ? 'bg-neon-magenta/5 border-neon-magenta/30' 
                      : isSeireitei
                        ? 'bg-pink-500/5 border-pink-500/30'
                        : isHuecoMundo
                          ? 'bg-yellow-550/5 border-yellow-500/30'
                          : 'bg-neon-cyan/5 border-neon-cyan/30' 
                    : 'bg-violet-500/5 border-dashed border-violet-500/30'
                }`}>
                  <div className="text-3xl">⚔️</div>
                  <div className="text-left">
                    <div className="text-[10px] uppercase text-gray-500">Weapon</div>
                    <div className="font-bold text-white text-sm">{player.equipped_weapon ? player.equipped_weapon.name : 'None'}</div>
                    {player.equipped_weapon && <div className={`text-[10px] ${
                      isShibuya 
                        ? 'text-neon-magenta' 
                        : isSeireitei
                          ? 'text-pink-300'
                          : isHuecoMundo
                            ? 'text-yellow-400'
                            : 'text-neon-cyan'
                    }`}>+{player.equipped_weapon.attack_bonus} ATK</div>}
                  </div>
                </div>

                <div className={`p-3 flex items-center gap-3 rounded-lg border transition-all ${
                  player.equipped_armor 
                    ? isShibuya 
                      ? 'bg-neon-magenta/5 border-neon-magenta/30' 
                      : isSeireitei
                        ? 'bg-pink-500/5 border-pink-500/30'
                        : isHuecoMundo
                          ? 'bg-yellow-550/5 border-yellow-500/30'
                          : 'bg-neon-cyan/5 border-neon-cyan/30' 
                    : 'bg-violet-500/5 border-dashed border-violet-500/30'
                }`}>
                  <div className="text-3xl">🛡️</div>
                  <div className="text-left">
                    <div className="text-[10px] uppercase text-gray-500">Armor</div>
                    <div className="font-bold text-white text-sm">{player.equipped_armor ? player.equipped_armor.name : 'None'}</div>
                    {player.equipped_armor && <div className={`text-[10px] ${
                      isShibuya 
                        ? 'text-neon-magenta' 
                        : isSeireitei
                          ? 'text-pink-300'
                          : isHuecoMundo
                            ? 'text-yellow-400'
                            : 'text-neon-cyan'
                    }`}>+{player.equipped_armor.defense_bonus} DEF</div>}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Right Column: Interactive Map & Inventory & Commands */}
          <section className={`backdrop-blur-md border rounded-xl p-5 shadow-2xl flex flex-col justify-between transition-all duration-300 ${
            isShibuya 
              ? 'bg-black/45 border-neon-magenta/20 hover:border-neon-magenta/40 hover:shadow-[0_8px_32px_rgba(255,0,127,0.05)]' 
              : isSeireitei
                ? 'bg-black/45 border-pink-500/20 hover:border-pink-500/40 hover:shadow-[0_8px_32px_rgba(255,183,197,0.05)]'
                : isHuecoMundo
                  ? 'bg-black/45 border-amber-500/20 hover:border-amber-500/40 hover:shadow-[0_8px_32px_rgba(245,158,11,0.05)]'
                  : 'bg-bg-panel/45 border-neon-cyan/20 hover:border-neon-cyan/40 hover:shadow-[0_8px_32px_rgba(102,252,241,0.05)]'
          }`}>
            <div>
              <h2 className="text-xl font-bold text-white border-l-4 border-neon-cyan pl-3 mb-4 uppercase tracking-wider">
                Tactical Hologram Map
              </h2>

              {/* Interactive SVG/CSS Map Layout */}
              <div className={`relative w-full h-[220px] bg-black/45 border rounded-lg overflow-hidden mb-4 shadow-[inset_0_2px_10px_rgba(0,0,0,0.9)] transition-colors ${
                inCombat 
                  ? 'border-red-500/35' 
                  : isShibuya 
                    ? 'border-neon-magenta/15' 
                    : isSeireitei
                      ? 'border-pink-500/15'
                      : isHuecoMundo
                        ? 'border-amber-500/15'
                        : 'border-white/10'
              }`}>
                {/* Grid backdrop */}
                <div className={`absolute inset-0 bg-[linear-gradient(rgba(102,252,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(102,252,241,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none transition-all duration-500 ${
                  isShibuya || isSeireitei || isHuecoMundo ? 'opacity-30' : 'opacity-100'
                }`}></div>

                {isShibuya && (
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,0,127,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,0,127,0.015)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
                )}

                {isSeireitei && (
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(236,72,153,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(236,72,153,0.015)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
                )}

                {isHuecoMundo && (
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(245,158,11,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.015)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
                )}

                {/* Red warning grid overlay when in combat */}
                {inCombat && (
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(239,68,68,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(239,68,68,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none animate-pulse"></div>
                )}

                {/* Connections SVG lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                  {Object.entries(mapData).map(([name, loc]) =>
                    loc.connections.map(conn => {
                      const target = mapData[conn];
                      if (!target) return null;
                      return (
                        <line
                          key={`${name}-${conn}`}
                          x1={`${loc.x}%`}
                          y1={`${loc.y}%`}
                          x2={`${target.x}%`}
                          y2={`${target.y}%`}
                          stroke={
                            inCombat 
                              ? "rgba(239, 68, 68, 0.15)" 
                              : isShibuya 
                                ? "rgba(255, 0, 127, 0.15)" 
                                : isSeireitei
                                  ? "rgba(236, 72, 153, 0.15)"
                                  : isHuecoMundo
                                    ? "rgba(245, 158, 11, 0.15)"
                                    : "rgba(102, 252, 241, 0.2)"
                          }
                          strokeWidth="2"
                          strokeDasharray="4 4"
                        />
                      );
                    })
                  )}
                </svg>

                {/* Location Interactive Nodes */}
                {Object.entries(mapData).map(([name, loc]) => {
                  const isCurrent = player.current_location === name;
                  const isConnected = currentLocDetails?.connections.includes(name);
                  
                  return (
                    <div
                      key={name}
                      className={`absolute z-10 transform -translate-x-1/2 -translate-y-1/2 group ${
                        inCombat ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                      }`}
                      style={{ left: `${loc.x}%`, top: `${loc.y}%` }}
                      onClick={() => !inCombat && (isConnected || isCurrent) && movePlayer(name)}
                    >
                      {/* Glowing effect for current position */}
                      {isCurrent ? (
                        <div className={`w-7 h-7 rounded-full border-2 animate-ping absolute -inset-1 ${
                          inCombat 
                            ? 'bg-red-500/20 border-red-500' 
                            : isShibuya 
                              ? 'bg-neon-magenta/20 border-neon-magenta' 
                              : isSeireitei
                                ? 'bg-pink-500/20 border-pink-500'
                                : isHuecoMundo
                                  ? 'bg-yellow-500/20 border-yellow-500'
                                  : 'bg-neon-cyan/20 border-neon-cyan'
                        }`}></div>
                      ) : null}

                      {/* Node Dot */}
                      <div className={`w-4 h-4 rounded-full border-2 transition-all ${
                        isCurrent 
                          ? inCombat 
                            ? 'bg-red-500 border-white scale-110 shadow-[0_0_10px_#ef4444]'
                            : isShibuya
                              ? 'bg-neon-magenta border-white scale-110 shadow-[0_0_10px_#ff007f]'
                              : isSeireitei
                                ? 'bg-pink-400 border-white scale-110 shadow-[0_0_10px_#f472b6]'
                                : isHuecoMundo
                                  ? 'bg-yellow-400 border-white scale-110 shadow-[0_0_10px_#facc15]'
                                  : 'bg-neon-cyan border-white scale-110 shadow-[0_0_10px_#66fcf1]' 
                          : isConnected 
                            ? isShibuya 
                              ? 'bg-transparent border-neon-magenta hover:bg-neon-magenta/30 hover:scale-110' 
                              : isSeireitei
                                ? 'bg-transparent border-pink-400 hover:bg-pink-400/30 hover:scale-110'
                                : isHuecoMundo
                                  ? 'bg-transparent border-yellow-400 hover:bg-yellow-400/30 hover:scale-110'
                                  : 'bg-transparent border-neon-cyan hover:bg-neon-cyan/30 hover:scale-110' 
                            : 'bg-transparent border-gray-700'
                      }`}></div>

                      {/* Hover Label */}
                      <div className="absolute top-5 left-1/2 transform -translate-x-1/2 bg-black/85 border border-white/10 text-[9px] text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                        {name} {isCurrent && "(Current)"}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Combat Encounter Panel */}
              {inCombat && activeEnemy && (
                <div className="bg-red-950/20 border border-red-500/30 rounded-lg p-4 mb-4 text-left shadow-lg animate-pulse">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] uppercase text-red-500 font-extrabold tracking-widest">⚠️ Combat Encounter</span>
                    <span className="text-[10px] text-gray-500">Gold Reward: {activeEnemy.gold_reward} | XP: {activeEnemy.xp_reward}</span>
                  </div>
                  <div className="flex justify-between items-baseline mb-2">
                    <h3 className="text-base font-black text-white">{activeEnemy.name}</h3>
                    <span className="font-mono text-xs text-red-400">HP: {activeEnemy.hp} / {activeEnemy.max_hp}</span>
                  </div>
                  <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-red-900 to-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)] transition-all duration-355" 
                      style={{ width: `${enemyHpPct}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Current Location Details Banner */}
              {!inCombat && currentLocDetails && (
                <div className={`rounded-lg p-3 mb-4 text-left border transition-all duration-500 ${
                  isShibuya 
                    ? 'bg-neon-magenta/5 border-neon-magenta/15' 
                    : isSeireitei
                      ? 'bg-pink-500/5 border-pink-500/15'
                      : isHuecoMundo
                        ? 'bg-amber-500/5 border-amber-500/15'
                        : 'bg-neon-cyan/5 border-neon-cyan/15'
                }`}>
                  <span className={`text-[10px] uppercase font-bold tracking-wider transition-all duration-500 ${
                    isShibuya 
                      ? 'text-neon-magenta' 
                      : isSeireitei
                        ? 'text-pink-300'
                        : isHuecoMundo
                          ? 'text-yellow-400'
                          : 'text-neon-cyan'
                  }`}>Sector Overview</span>
                  <h3 className="text-sm font-black text-white">{currentLocDetails.name}</h3>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">{currentLocDetails.description}</p>
                </div>
              )}

              {/* Inventory Section */}
              <div className="mb-4">
                <span className="text-[10px] uppercase text-gray-500 font-bold tracking-wider block text-left mb-2">Carried Items</span>
                {player.inventory.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[140px] overflow-y-auto pr-1">
                    {player.inventory.map((item, idx) => (
                      <div 
                        key={idx} 
                        className={`bg-white/5 border border-white/10 rounded-lg p-2.5 text-center flex flex-col justify-between min-h-[90px] cursor-pointer transition-all duration-200 hover:bg-white/10 ${
                          isShibuya 
                            ? 'hover:border-neon-magenta/40' 
                            : isSeireitei
                              ? 'hover:border-pink-500/40'
                              : isHuecoMundo
                                ? 'hover:border-amber-500/40'
                                : 'hover:border-neon-cyan/40'
                        } hover:-translate-y-0.5`} 
                        onClick={() => useItem(item.name, item.item_type)}
                      >
                        <div>
                          <div className="text-xl mb-1">
                            {item.item_type === 'weapon' ? '⚔️' : item.item_type === 'armor' ? '🛡️' : '🧪'}
                          </div>
                          <div className="font-bold text-[11px] text-white truncate">{item.name}</div>
                        </div>
                        <div className="text-[9px] uppercase text-gray-500">
                          {item.item_type === 'weapon' ? `+${item.attack_bonus} ATK` : item.item_type === 'armor' ? `+${item.defense_bonus} DEF` : 'Restore HP'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center border border-dashed border-white/5 rounded-lg text-gray-600 italic text-xs">
                    Inventory is empty. Explore the dungeon to find items!
                  </div>
                )}
              </div>
            </div>

            <div>
              {/* Log Panel */}
              <div className="bg-black/40 border border-white/5 rounded-lg p-4 font-mono text-sm text-cyan-200 h-[140px] overflow-y-auto mb-4 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)] text-left">
                {logs.map((log, idx) => (
                  <div key={idx} className="mb-1.5 leading-relaxed text-xs">
                    <span className="text-neon-cyan mr-1.5">&gt;</span>{log}
                  </div>
                ))}
              </div>

              {/* Control Actions */}
              {inCombat ? (
                <div className="flex gap-4 mb-4">
                  <button 
                    className="flex-1 bg-gradient-to-br from-red-600 to-red-800 text-white border-0 rounded-lg py-3.5 px-5 font-bold uppercase tracking-wider cursor-pointer shadow-[0_4px_15px_rgba(239,68,68,0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(239,68,68,0.5)] transition-all duration-200" 
                    onClick={attackEnemy}
                  >
                    ⚡ Attack Enemy
                  </button>
                  <button 
                    className="bg-white/5 text-red-300 border border-red-500/20 rounded-lg py-2.5 px-5 cursor-pointer hover:bg-red-500/10 hover:text-white hover:border-red-500 transition-all duration-200" 
                    onClick={runAway}
                  >
                    🏃 Escape
                  </button>
                </div>
              ) : (
                <div className="flex gap-4 mb-4">
                  <button 
                    className={`flex-1 text-white border-0 rounded-lg py-3.5 px-5 font-bold uppercase tracking-wider cursor-pointer transition-all duration-200 ${
                      isShibuya
                        ? 'bg-gradient-to-br from-neon-magenta to-neon-purple shadow-[0_4px_15px_rgba(255,0,127,0.3)] hover:shadow-[0_6px_20px_rgba(255,0,127,0.5)]'
                        : isSeireitei
                          ? 'bg-gradient-to-br from-pink-500 to-indigo-600 shadow-[0_4px_15px_rgba(236,72,153,0.3)] hover:shadow-[0_6px_20px_rgba(236,72,153,0.5)]'
                          : isHuecoMundo
                            ? 'bg-gradient-to-br from-yellow-600 to-amber-800 shadow-[0_4px_15px_rgba(234,179,8,0.3)] hover:shadow-[0_6px_20px_rgba(234,179,8,0.5)]'
                            : 'bg-gradient-to-br from-neon-cyan to-blue-600 shadow-[0_4px_15px_rgba(102,252,241,0.2)] hover:shadow-[0_6px_20px_rgba(102,252,241,0.4)]'
                    } hover:-translate-y-0.5`} 
                    onClick={exploreDungeon}
                  >
                    Explore Dungeon
                  </button>
                  <button 
                    className="bg-white/5 text-gray-300 border border-white/10 rounded-lg py-2.5 px-4 cursor-pointer hover:bg-white/10 hover:text-white hover:border-neon-cyan transition-all duration-200" 
                    onClick={resetPlayer}
                  >
                    Reset Character
                  </button>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button 
                  className="bg-white/5 text-gray-300 border border-white/10 rounded-lg py-2 px-3 text-xs cursor-pointer hover:bg-white/10 hover:text-white hover:border-neon-cyan transition-all duration-200" 
                  onClick={saveGame}
                >
                  Save Game
                </button>
                <button 
                  className="bg-white/5 text-gray-300 border border-white/10 rounded-lg py-2 px-3 text-xs cursor-pointer hover:bg-white/10 hover:text-white hover:border-neon-cyan transition-all duration-200" 
                  onClick={loadGame}
                >
                  Load Game
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default App
