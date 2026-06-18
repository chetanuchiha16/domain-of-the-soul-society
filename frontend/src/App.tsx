import { useState, useEffect, useRef } from 'react'
import { DialogueBox, DialogueLine } from './DialogueBox'
import { FrameAnimationPlayer } from './FrameAnimationPlayer'
import { SoundManager } from './SoundManager'

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

interface VictoryRewards {
  enemy_name: string;
  xp_reward: number;
  gold_reward: number;
  item_reward: {
    name: string;
    description: string;
    item_type: string;
    value: number;
    attack_bonus?: number;
    defense_bonus?: number;
  } | null;
  player_level_up: boolean;
}

interface GameStateData {
  player: PlayerState;
  combat: {
    enemies: EnemyState[];
    active_summon?: {
      name: string;
      hp: number;
      max_hp: number;
      turns_left: number;
      status_effects: any[];
    } | null;
    log: string[];
  };
  victory_rewards?: VictoryRewards | null;
}

interface MapLocation {
  name: string;
  description: string;
  region: string;
  x: number;
  y: number;
  connections: string[];
}

const SummonAvatar = ({ name }: { name: string }) => {
  const lowercaseName = name.toLowerCase();
  if (lowercaseName.includes("gojo")) {
    return (
      <svg viewBox="0 0 100 100" className="w-10 h-10">
        <circle cx="50" cy="50" r="45" fill="#082f49" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 3" />
        <path d="M25 45 L75 45 L70 58 L30 58 Z" fill="#ffffff" stroke="#0284c7" strokeWidth="1.5" />
        <circle cx="50" cy="51" r="5" fill="#38bdf8" className="animate-ping" />
        <path d="M20 30 Q50 5 80 30" fill="none" stroke="#f8fafc" strokeWidth="3" />
        <path d="M35 68 Q50 85 65 68" fill="none" stroke="#38bdf8" strokeWidth="2" />
      </svg>
    );
  } else {
    // Shunsui
    return (
      <svg viewBox="0 0 100 100" className="w-10 h-10">
        <circle cx="50" cy="50" r="45" fill="#500725" stroke="#f472b6" strokeWidth="2" />
        <path d="M15 45 Q50 15 85 45 Z" fill="#b91c1c" opacity="0.8" />
        <path d="M30 50 Q50 32 70 50 Z" fill="#fbcfe8" />
        <circle cx="50" cy="58" r="4" fill="#fbcfe8" />
        {/* Two crossed swords representation */}
        <line x1="30" y1="75" x2="70" y2="35" stroke="#db2777" strokeWidth="2.5" />
        <line x1="70" y1="75" x2="30" y2="35" stroke="#db2777" strokeWidth="2.5" />
      </svg>
    );
  }
};

const EnemyAvatar = ({ name }: { name: string }) => {
  const lowercaseName = name.toLowerCase();
  
  if (lowercaseName.includes("hollow") || lowercaseName.includes("menos") || lowercaseName.includes("adjuchas")) {
    return (
      <svg viewBox="0 0 100 100" className="w-10 h-10">
        <ellipse cx="50" cy="45" rx="20" ry="24" fill="#f8fafc" stroke="#374151" strokeWidth="2" />
        <polygon points="38,42 46,45 38,48" fill="#ef4444" />
        <polygon points="62,42 54,45 62,48" fill="#ef4444" />
        <path d="M42 55 L42 62 M50 54 L50 63 M58 55 L58 62" stroke="#1f2937" strokeWidth="2" />
        <circle cx="50" cy="78" r="7" fill="#000000" stroke="#f8fafc" strokeWidth="1" />
      </svg>
    );
  }

  if (lowercaseName.includes("curse") || lowercaseName.includes("fly head") || lowercaseName.includes("finger")) {
    return (
      <svg viewBox="0 0 100 100" className="w-10 h-10">
        <defs>
          <radialGradient id="curseEye" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="60%" stopColor="#9f1239" />
            <stop offset="100%" stopColor="#000000" />
          </radialGradient>
        </defs>
        <path d="M25 50 C25 20 75 20 75 50 C75 80 25 80 25 50 Z" fill="#1e1b4b" opacity="0.9" />
        <circle cx="50" cy="50" r="14" fill="url(#curseEye)" className="animate-pulse" />
        <circle cx="50" cy="50" r="4" fill="#ffffff" />
        <path d="M35 65 L40 58 L45 65 L50 58 L55 65 L60 58 L65 65" stroke="#9f1239" strokeWidth="1.5" fill="none" />
      </svg>
    );
  }

  if (lowercaseName.includes("sukuna")) {
    return (
      <svg viewBox="0 0 100 100" className="w-10 h-10">
        <defs>
          <radialGradient id="sukunaAura" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#sukunaAura)" />
        {/* Tattoos on face */}
        <path d="M40 25 L45 28 L35 32 Z" fill="#000000" />
        <path d="M60 25 L55 28 L65 32 Z" fill="#000000" />
        <line x1="50" y1="18" x2="50" y2="28" stroke="#000000" strokeWidth="2.5" />
        <line x1="45" y1="23" x2="55" y2="23" stroke="#000000" strokeWidth="1.5" />
        {/* 4 eyes */}
        <polygon points="35,40 45,43 36,46" fill="#ef4444" stroke="#7f1d1d" strokeWidth="1" />
        <polygon points="65,40 55,43 64,46" fill="#ef4444" stroke="#7f1d1d" strokeWidth="1" />
        <polygon points="37,48 46,50 38,53" fill="#ef4444" stroke="#7f1d1d" strokeWidth="0.8" />
        <polygon points="63,48 54,50 62,53" fill="#ef4444" stroke="#7f1d1d" strokeWidth="0.8" />
        {/* Wicked mouth */}
        <path d="M38 65 Q50 78 62 65 Q50 62 38 65" fill="#1e1b4b" stroke="#ef4444" strokeWidth="1.5" />
        <path d="M44 67 L46 71 M56 67 L54 71" stroke="#ffffff" strokeWidth="1" />
      </svg>
    );
  }

  if (lowercaseName.includes("aizen")) {
    return (
      <svg viewBox="0 0 100 100" className="w-10 h-10">
        <defs>
          <radialGradient id="hogyokuGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#0f172a" />
          </radialGradient>
        </defs>
        {/* Hōgyoku sphere at center-bottom */}
        <circle cx="50" cy="70" r="18" fill="url(#hogyokuGlow)" className="animate-pulse" />
        <circle cx="50" cy="70" r="6" fill="#ffffff" />
        
        {/* Hair and Face contour */}
        <path d="M30 35 C30 15 70 15 70 35 C70 50 65 60 50 62 C35 60 30 50 30 35 Z" fill="#1e293b" stroke="#64748b" strokeWidth="1" />
        {/* Hypnotic single front strand */}
        <path d="M50 20 Q46 38 52 48" fill="none" stroke="#0f172a" strokeWidth="3.5" />
        <path d="M50 20 Q46 38 52 48" fill="none" stroke="#64748b" strokeWidth="1.5" />
        
        {/* Glowing eyes */}
        <circle cx="43" cy="40" r="2" fill="#c084fc" className="animate-ping" />
        <circle cx="43" cy="40" r="1.5" fill="#e9d5ff" />
        <circle cx="57" cy="40" r="2" fill="#c084fc" className="animate-ping" />
        <circle cx="57" cy="40" r="1.5" fill="#e9d5ff" />
        
        {/* Shattered Mirror overlay shards */}
        <line x1="20" y1="20" x2="80" y2="80" stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="6 3" opacity="0.6" />
        <line x1="80" y1="15" x2="15" y2="75" stroke="#a855f7" strokeWidth="0.8" opacity="0.6" />
      </svg>
    );
  }

  if (lowercaseName.includes("replica") || lowercaseName.includes("sentinel")) {
    return (
      <svg viewBox="0 0 100 100" className="w-10 h-10">
        <polygon points="50,12 85,85 15,85" fill="#581c87" opacity="0.4" stroke="#a855f7" strokeWidth="1" />
        <path d="M35 50 Q42 45 46 50" stroke="#ef4444" strokeWidth="3.5" fill="none" />
        <path d="M65 50 Q58 45 54 50" stroke="#ef4444" strokeWidth="3.5" fill="none" />
        <path d="M42 55 L42 62 M58 55 L58 62" stroke="#000000" strokeWidth="2.5" />
        <circle cx="50" cy="65" r="3" fill="#ffffff" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 100 100" className="w-10 h-10">
      <path d="M20 35 L35 48 L65 48 L80 35 L70 65 L30 65 Z" fill="#3f3f46" stroke="#a1a1aa" strokeWidth="1.5" />
      <circle cx="40" cy="54" r="3" fill="#ef4444" />
      <circle cx="60" cy="54" r="3" fill="#ef4444" />
      <path d="M15 75 L30 85 M25 75 L40 85" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};

function App() {
  const [gameState, setGameState] = useState<GameStateData | null>(null)
  const [mapData, setMapData] = useState<Record<string, MapLocation>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>(["Connecting to Soul Society backend..."])
  const [dialogueQueue, setDialogueQueue] = useState<DialogueLine[] | null>(null)
  const [shopOpen, setShopOpen] = useState(false)
  const [shopItems, setShopItems] = useState<ItemInfo[]>([])
  const [combatMenu, setCombatMenu] = useState<'main' | 'kido' | 'items' | 'summons'>('main')
  const [activeAnimation, setActiveAnimation] = useState<string | null>(null)
  const [combatShake, setCombatShake] = useState(false)
  const [chromaticEffect, setChromaticEffect] = useState(false)
  const [invertFlash, setInvertFlash] = useState(false)

  const triggerLocationDialogue = (dest: string, enemyName?: string) => {
    const desc = mapData[dest]?.description || `You have traveled to ${dest}.`;
    const lines: DialogueLine[] = [];

    if (dest === "Senkaimon") {
      lines.push({
        speaker: "Sosuke Aizen",
        avatar: "aizen",
        text: "Yokoso watashi no Soul Society ye... Welcome to my Soul Society. You stand at the threshold of real power."
      });
    } else if (dest === "Execution Hill") {
      lines.push({
        speaker: "Shunsui Kyoraku",
        avatar: "shunsui",
        text: "Bankai Katen Kyōkotsu: Karamatsu Shinjū. It seems you have ventured too close to the Sokyoku Hill, traveler. Be careful of the high winds."
      });
    } else {
      lines.push({
        speaker: "Narrator",
        avatar: "narrator",
        text: `${desc}`
      });
    }

    if (enemyName) {
      lines.push({
        speaker: "System Alert",
        avatar: "narrator",
        text: `⚠️ WARNING: A hostile ${enemyName} has emerged! Prepare for battle.`
      });
    }

    setDialogueQueue(lines);
  };

  const triggerExploreDialogue = (found: string, logMsg?: string) => {
    const lines: DialogueLine[] = [];
    if (found === "gojo") {
      lines.push({
        speaker: "Satoru Gojo",
        avatar: "gojo",
        text: "Daijoubu desho datte kimi yowai mo. Don't worry, you're weak after all! Feel free to invoke my Infinite Void in combat."
      });
    } else if (found === "shunsui") {
      lines.push({
        speaker: "Shunsui Kyoraku",
        avatar: "shunsui",
        text: "Bankai Katen Kyōkotsu: Karamatsu Shinjū. My shadow hides many secrets, traveler. Call upon me when you need a drink... or a blade."
      });
    } else if (found === "⚔") {
      lines.push({
        speaker: "Narrator",
        avatar: "narrator",
        text: `You search the dust and discover a Zanpakuto! An aura of cold spirit energy surrounds the blade.`
      });
    } else if (found === "🛡") {
      lines.push({
        speaker: "Narrator",
        avatar: "narrator",
        text: `Hidden beneath a layer of cursed stones, you find the Shinobi Shozoku armor. It feels lighter than air.`
      });
    } else if (found === "health_potion") {
      lines.push({
        speaker: "Narrator",
        avatar: "narrator",
        text: `You find a Health Potion. Its bubbling green liquid hums with positive energy.`
      });
    } else {
      lines.push({
        speaker: "Narrator",
        avatar: "narrator",
        text: logMsg || "You search the area but find nothing of interest."
      });
    }
    setDialogueQueue(lines);
  };

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
      const data = await res.json() as { state?: GameStateData; log?: string; message?: string; found?: string }
      if (data.state) {
        setGameState(data.state)
      } else {
        await fetchState()
      }

      if (endpoint === 'player/move') {
        const dest = (body as any).destination
        const enemyName = data.state?.combat?.enemies?.[0]?.name
        triggerLocationDialogue(dest, enemyName)
      } else if (endpoint === 'explore/dungeon') {
        triggerExploreDialogue(data.found || '', data.log)
      } else {
        if (successMsg) addLog(successMsg)
        else if (data.log) addLog(data.log)
        else if (data.message) addLog(data.message)
      }
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
        setDialogueQueue([
          {
            speaker: "Sosuke Aizen",
            avatar: "aizen",
            text: `Yokoso watashi no Soul Society ye, ${name}... Welcome to my Soul Society. Let us see if your soul is strong enough to survive the spiritual pressures here.`
          }
        ])
      } catch (err) {
        if (err instanceof Error) {
          addLog(`Reset failed: ${err.message}`)
        }
      }
    }
  }

  const openShop = async () => {
    try {
      const res = await fetch(`${API_BASE}/shop/items`)
      if (res.ok) {
        const data = await res.json() as ItemInfo[]
        setShopItems(data)
        setShopOpen(true)
        setDialogueQueue([
          {
            speaker: "Kisuke Urahara",
            avatar: "urahara",
            text: "Oh my, welcome to Urahara Shop! Look around, look around! I have some special spiritual goods that might catch your eye."
          }
        ])
      }
    } catch (err) {
      console.error("Error opening shop:", err)
    }
  }

  const closeShop = () => {
    setShopOpen(false)
    setDialogueQueue([
      {
        speaker: "Kisuke Urahara",
        avatar: "urahara",
        text: "Thank you for your patronage! Do drop by again if you manage to stay alive."
      }
    ])
  }

  const buyItem = async (itemName: string) => {
    try {
      const res = await fetch(`${API_BASE}/shop/buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_name: itemName })
      })
      if (!res.ok) {
        const errData = await res.json() as { detail?: string }
        throw new Error(errData.detail || "Purchase failed")
      }
      const data = await res.json() as { state?: GameStateData; message?: string }
      if (data.state) {
        setGameState(data.state)
      }
      setDialogueQueue([
        {
          speaker: "Kisuke Urahara",
          avatar: "urahara",
          text: `A fine choice! That ${itemName} will serve you well in battle.`
        }
      ])
    } catch (err) {
      if (err instanceof Error) {
        setDialogueQueue([
          {
            speaker: "Kisuke Urahara",
            avatar: "urahara",
            text: "Oh dear... it seems you don't have enough gold for that!"
          }
        ])
        addLog(`Purchase failed: ${err.message}`)
      }
    }
  }

  const sellItem = async (itemName: string) => {
    try {
      const res = await fetch(`${API_BASE}/shop/sell`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_name: itemName })
      })
      if (!res.ok) {
        const errData = await res.json() as { detail?: string }
        throw new Error(errData.detail || "Sell failed")
      }
      const data = await res.json() as { state?: GameStateData; message?: string }
      if (data.state) {
        setGameState(data.state)
      }
      setDialogueQueue([
        {
          speaker: "Kisuke Urahara",
          avatar: "urahara",
          text: `Thank you! I'll put this ${itemName} to good use in my research.`
        }
      ])
    } catch (err) {
      if (err instanceof Error) {
        addLog(`Sell failed: ${err.message}`)
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

  const attackEnemy = () => {
    setActiveAnimation('slash')
    handleAction('combat/attack')
  }
  const runAway = () => handleAction('combat/run')

  const claimVictoryRewards = async () => {
    try {
      const res = await fetch(`${API_BASE}/combat/claim_rewards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      if (!res.ok) throw new Error("Failed to claim rewards")
      const data = await res.json() as { state?: GameStateData }
      if (data.state) {
        setGameState(data.state)
        // Reset combat menu view
        setCombatMenu('main')
      }
    } catch (err) {
      console.error(err)
    }
  }

  const castKido = async (spellName: string) => {
    try {
      if (spellName.toLowerCase().includes("shakkaho")) {
        setActiveAnimation('blast')
      }
      const res = await fetch(`${API_BASE}/combat/kido`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spell_name: spellName })
      })
      if (!res.ok) {
        const errData = await res.json() as { detail?: string }
        throw new Error(errData.detail || "Spell failed")
      }
      const data = await res.json() as { state?: GameStateData }
      if (data.state) {
        setGameState(data.state)
        if (data.state.combat.log.length > 0) {
          addLog(data.state.combat.log[0])
          if (data.state.combat.log.length > 1) {
            addLog(data.state.combat.log[1])
          }
        }
      }
      setCombatMenu('main')
    } catch (err) {
      if (err instanceof Error) {
        addLog(`Kidō failed: ${err.message}`)
      }
    }
  }

  const executeSummon = async (summonName: string) => {
    try {
      if (summonName.toLowerCase().includes("gojo")) {
        setActiveAnimation('hollow_purple')
      } else if (summonName.toLowerCase().includes("shunsui")) {
        setActiveAnimation('karamatsu_shinju')
      }
      const res = await fetch(`${API_BASE}/combat/summon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summon_name: summonName })
      })
      if (!res.ok) {
        const errData = await res.json() as { detail?: string }
        throw new Error(errData.detail || "Summon failed")
      }
      const data = await res.json() as { state?: GameStateData }
      if (data.state) {
        setGameState(data.state)
        if (data.state.combat.log.length > 0) {
          addLog(data.state.combat.log[0])
          if (data.state.combat.log.length > 1) {
            addLog(data.state.combat.log[1])
          }
        }
      }
      setCombatMenu('main')
    } catch (err) {
      if (err instanceof Error) {
        addLog(`Summon failed: ${err.message}`)
      }
    }
  }

  const useCombatItem = async (itemName: string) => {
    try {
      const res = await fetch(`${API_BASE}/combat/item`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_name: itemName })
      })
      if (!res.ok) {
        const errData = await res.json() as { detail?: string }
        throw new Error(errData.detail || "Item failed")
      }
      const data = await res.json() as { state?: GameStateData }
      if (data.state) {
        setGameState(data.state)
        if (data.state.combat.log.length > 0) {
          addLog(data.state.combat.log[0])
          if (data.state.combat.log.length > 1) {
            addLog(data.state.combat.log[1])
          }
        }
      }
      setCombatMenu('main')
    } catch (err) {
      if (err instanceof Error) {
        addLog(`Item use failed: ${err.message}`)
      }
    }
  }

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
  const activeSummon = inCombat ? (combat as any).active_summon : null
  const enemyHpPct = activeEnemy ? (activeEnemy.hp / activeEnemy.max_hp) * 100 : 0
  const victoryRewards = gameState?.victory_rewards
  
  const isPlayerTargeted = !!(activeEnemy && (activeEnemy as any).next_intent && (activeEnemy as any).next_intent !== 'HEAL' && (activeEnemy as any).target !== 'summon')
  const isSummonTargeted = !!(activeEnemy && (activeEnemy as any).next_intent && (activeEnemy as any).next_intent !== 'HEAL' && (activeEnemy as any).target === 'summon')
  
  const isSukuna = !!(activeEnemy && activeEnemy.name.toLowerCase().includes("sukuna"))
  const isAizen = !!(activeEnemy && activeEnemy.name.toLowerCase().includes("aizen"))
  const isBoss = isSukuna || isAizen

  useEffect(() => {
    if (!inCombat) {
      setCombatMenu('main')
    }
  }, [inCombat])

  // Track previous HP and rewards to trigger screen shake, critical flashes, and sound effects
  const prevPlayerHpRef = useRef<number>(0)
  const prevEnemyHpRef = useRef<number>(0)
  const prevCombatActiveRef = useRef<boolean>(false)
  const prevVictoryRewardsRef = useRef<any>(null)

  useEffect(() => {
    if (!gameState) return

    const inCombatActive = !!(gameState.combat && gameState.combat.active && gameState.combat.enemies && gameState.combat.enemies.length > 0)
    const currentHp = gameState.player?.hp || 0
    const maxHp = gameState.player?.max_hp || 100
    const currentEnemyHp = inCombatActive ? gameState.combat.enemies[0].hp : 0
    const currentVictoryRewards = gameState.victory_rewards

    // 1. Procedural BGM synchronization
    if (inCombatActive) {
      const activeEnemyName = gameState.combat.enemies[0]?.name || ''
      const isBossFight = activeEnemyName.toLowerCase().includes('sukuna') || activeEnemyName.toLowerCase().includes('aizen')
      if (isBossFight) {
        SoundManager.startBGM('boss')
      } else {
        SoundManager.startBGM('combat')
      }
    } else {
      SoundManager.startBGM('map')
    }

    // 2. Victory and level up sound effects
    if (currentVictoryRewards && !prevVictoryRewardsRef.current) {
      SoundManager.playUI('victory')
      if (currentVictoryRewards.player_level_up) {
        setTimeout(() => {
          SoundManager.playUI('levelUp')
        }, 600)
      }
    }

    // 3. Screen shake and critical invert flash
    if (inCombatActive) {
      const hpChanged = (currentHp !== prevPlayerHpRef.current && prevPlayerHpRef.current !== 0) ||
                        (currentEnemyHp !== prevEnemyHpRef.current && prevEnemyHpRef.current !== 0)

      if (hpChanged) {
        setCombatShake(true)
        setTimeout(() => setCombatShake(false), 400)

        // Parse log for critical hit or heavy strike
        const logs = gameState.combat.log || []
        const latestLog = logs[0] || ''
        const secondLatestLog = logs[1] || ''
        const combined = (latestLog + ' ' + secondLatestLog).toLowerCase()

        if (combined.includes('critical') || combined.includes('black flash') || combined.includes('heavy strike') || combined.includes('cleave') || combined.includes('dismantle')) {
          setInvertFlash(true)
          setTimeout(() => setInvertFlash(false), 350)
        }
      }

      // Chromatic effect under 30% player health
      if (currentHp > 0 && currentHp / maxHp < 0.3) {
        setChromaticEffect(true)
      } else {
        setChromaticEffect(false)
      }
    } else {
      setChromaticEffect(false)
    }

    prevPlayerHpRef.current = currentHp
    prevEnemyHpRef.current = currentEnemyHp
    prevCombatActiveRef.current = inCombatActive
    prevVictoryRewardsRef.current = currentVictoryRewards
  }, [gameState])

  // Global tactile UI sound effect hooks
  useEffect(() => {
    let lastHovered: HTMLElement | null = null
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'BUTTON' || target.closest('button') || target.classList.contains('cursor-pointer') || target.closest('.cursor-pointer')) {
        SoundManager.playUI('click')
      }
    }
    
    const handleGlobalMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const clickable = target.tagName === 'BUTTON' || target.closest('button') || target.classList.contains('cursor-pointer') || target.closest('.cursor-pointer')
      if (clickable && target !== lastHovered) {
        SoundManager.playUI('hover')
        lastHovered = target
      }
    }

    window.addEventListener('click', handleGlobalClick)
    window.addEventListener('mouseover', handleGlobalMouseOver)
    return () => {
      window.removeEventListener('click', handleGlobalClick)
      window.removeEventListener('mouseover', handleGlobalMouseOver)
      SoundManager.stopBGM()
    }
  }, [])

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
              <h2 className={`text-xl font-bold border-l-4 pl-3 mb-4 uppercase tracking-wider transition-all duration-300 ${
                victoryRewards
                  ? 'text-yellow-500 border-yellow-500 [text-shadow:0_0_8px_rgba(234,179,8,0.4)]'
                  : inCombat 
                    ? 'text-red-500 border-red-500 [text-shadow:0_0_8px_rgba(239,68,68,0.4)]'
                    : 'text-white border-neon-cyan'
              }`}>
                {victoryRewards ? 'Purification Rewards' : inCombat ? 'Spiritual Combat Arena' : 'Tactical Hologram Map'}
              </h2>

              {victoryRewards ? (
                <div className="relative w-full h-[220px] bg-gradient-to-b from-[#120f06] to-[#050401] border border-yellow-500/30 rounded-lg overflow-hidden mb-4 shadow-[0_0_25px_rgba(234,179,8,0.2)] flex flex-col justify-between p-4 animate-fade-in text-center">
                  {/* Grid backdrop */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(234,179,8,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(234,179,8,0.015)_1px,transparent_1px)] bg-[size:15px_15px] pointer-events-none"></div>
                  
                  {/* Top Header */}
                  <div className="relative z-10">
                    <span className="text-[10px] uppercase font-black tracking-widest text-yellow-500 [text-shadow:0_0_10px_rgba(234,179,8,0.8)] animate-pulse">
                      ✨ Purified Hollow ✨
                    </span>
                    <h3 className="text-xl font-black text-white italic tracking-wider mt-1 [text-shadow:0_0_12px_rgba(255,255,255,0.4)]">
                      VICTORY
                    </h3>
                    <p className="text-[9px] uppercase tracking-wider text-yellow-400/80 -mt-0.5">
                      {victoryRewards.enemy_name} Purified
                    </p>
                  </div>

                  {/* Mid Rewards Panel */}
                  <div className="relative z-10 flex gap-4 my-1 items-center justify-center">
                    {/* XP & Gold Container */}
                    <div className="flex flex-col gap-2 items-center flex-1 max-w-[150px]">
                      {/* XP Bar */}
                      <div className="w-full text-left">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <span className="text-[8px] uppercase font-extrabold text-yellow-500">Exp Earned</span>
                          <span className="font-mono text-[9px] text-white">+{victoryRewards.xp_reward} XP</span>
                        </div>
                        <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5 relative">
                          <div 
                            className="h-full rounded-full bg-gradient-to-r from-yellow-600 to-yellow-400 shadow-[0_0_6px_rgba(234,179,8,0.5)] transition-all duration-1000 ease-out"
                            style={{ width: `${Math.min(100, (player.xp / (player.level * 100)) * 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Gold Reward */}
                      <div className="flex items-center gap-2 bg-yellow-950/20 border border-yellow-500/20 px-3 py-1 rounded-lg w-full justify-center">
                        <span className="text-sm animate-bounce [animation-duration:2s]">🪙</span>
                        <span className="text-[11px] font-black text-yellow-400 animate-pulse">+{victoryRewards.gold_reward} GOLD</span>
                      </div>
                    </div>

                    {/* Item Drop Panel */}
                    {victoryRewards.item_reward ? (
                      <div className="flex items-center gap-2 bg-purple-950/20 border border-purple-500/30 p-2 rounded-lg flex-1 text-left shadow-[0_0_12px_rgba(168,85,247,0.15)] animate-reward-item max-w-[160px]">
                        <div className="text-xl p-1.5 bg-purple-950/40 border border-purple-500/30 rounded-lg">
                          {victoryRewards.item_reward.item_type === 'weapon' ? '⚔️' : victoryRewards.item_reward.item_type === 'armor' ? '🛡️' : '📜'}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[7px] uppercase font-black tracking-widest text-purple-400">Rare Drop</span>
                          <span className="text-[9px] font-bold text-white truncate">{victoryRewards.item_reward.name}</span>
                          <span className="text-[7px] text-gray-400 truncate leading-tight">{victoryRewards.item_reward.description}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center bg-white/5 border border-white/10 p-2 rounded-lg flex-1 text-center max-w-[160px] h-[52px]">
                        <span className="text-xs text-gray-500">❌</span>
                        <span className="text-[7px] uppercase tracking-widest text-gray-500 mt-1">No Item Dropped</span>
                      </div>
                    )}
                  </div>

                  {/* Level Up Banner Overlay */}
                  {victoryRewards.player_level_up && (
                    <div className="absolute inset-0 bg-yellow-500/10 flex items-center justify-center z-20 pointer-events-none animate-pulse">
                      <div className="bg-yellow-500 text-black font-black uppercase text-[10px] tracking-widest px-4 py-1.5 transform -rotate-12 shadow-[0_0_15px_rgba(234,179,8,0.8)] border-2 border-black">
                        🎉 LEVEL UP! reached lvl {player.level} 🎉
                      </div>
                    </div>
                  )}

                  {/* Claim Button */}
                  <div className="relative z-10 mt-1">
                    <button 
                      onClick={claimVictoryRewards}
                      className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black border border-yellow-400/40 rounded-lg py-2 px-4 font-black text-[10px] uppercase tracking-widest cursor-pointer shadow-[0_4px_12px_rgba(234,179,8,0.3)] transition-all duration-150 active:translate-y-0.5"
                    >
                      CLAIM REWARDS & CONTINUE
                    </button>
                  </div>
                </div>
              ) : inCombat && activeEnemy ? (
                <div className={`relative w-full h-[220px] rounded-lg overflow-hidden mb-4 flex flex-col justify-between p-4 transition-all duration-500 ${
                  isSukuna 
                    ? 'bg-[#150303] border-2 border-red-600 shadow-[0_0_35px_rgba(220,38,38,0.4)]' 
                    : isAizen 
                      ? 'bg-[#06030c] border-2 border-purple-600 shadow-[0_0_35px_rgba(168,85,247,0.4)]' 
                      : 'bg-[#0c0505] border border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.15)]'
                } ${combatShake ? 'animate-violent-shake' : ''} ${chromaticEffect ? 'animate-chromatic' : ''} ${invertFlash ? 'animate-invert-flash' : ''}`}>
                  <FrameAnimationPlayer animationType={activeAnimation} onComplete={() => setActiveAnimation(null)} />
                  {invertFlash && (
                    <div className="absolute inset-0 bg-white pointer-events-none z-50 mix-blend-difference"></div>
                  )}
                  {/* Grid / Sparks Background */}
                  {isSukuna ? (
                    <>
                      <div className="absolute inset-0 bg-[linear-gradient(rgba(220,38,38,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(220,38,38,0.04)_1px,transparent_1px)] bg-[size:12px_12px] pointer-events-none"></div>
                      <div className="absolute inset-0 bg-gradient-to-t from-red-950/40 via-red-950/10 to-transparent pointer-events-none"></div>
                      {/* Cursed slash lines */}
                      <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                        <div className="absolute top-1/4 left-0 w-full h-0.5 bg-red-500 transform -rotate-12 animate-pulse"></div>
                        <div className="absolute top-2/3 left-0 w-full h-0.5 bg-red-500 transform rotate-6 animate-pulse [animation-delay:1s]"></div>
                      </div>
                    </>
                  ) : isAizen ? (
                    <>
                      <div className="absolute inset-0 bg-[linear-gradient(rgba(168,85,247,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.04)_1px,transparent_1px)] bg-[size:18px_18px] pointer-events-none"></div>
                      <div className="absolute inset-0 bg-gradient-to-t from-purple-950/30 via-purple-950/5 to-transparent pointer-events-none"></div>
                      {/* Shattered glass particles / Kyoka Suigetsu shards */}
                      <div className="absolute inset-0 opacity-15 pointer-events-none overflow-hidden">
                        <div className="absolute top-1/3 left-1/4 w-12 h-12 bg-gradient-to-tr from-sky-400/20 to-purple-500/25 transform rotate-45 animate-pulse"></div>
                        <div className="absolute top-1/2 right-1/4 w-16 h-8 bg-gradient-to-tr from-purple-400/25 to-pink-500/20 transform -rotate-12 animate-pulse [animation-delay:1.5s]"></div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-[linear-gradient(rgba(239,68,68,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(239,68,68,0.02)_1px,transparent_1px)] bg-[size:15px_15px] pointer-events-none"></div>
                      <div className="absolute inset-0 bg-gradient-to-t from-red-950/20 via-transparent to-transparent pointer-events-none"></div>
                    </>
                  )}
                  
                  {/* Top Battle Metadata */}
                  <div className="relative z-10 flex justify-between items-center text-left">
                    {isSukuna ? (
                      <span className="text-[10px] uppercase font-black tracking-widest text-red-500 [text-shadow:0_0_12px_rgba(239,68,68,0.9)] animate-pulse flex items-center gap-1.5">
                        <span className="animate-spin [animation-duration:3s]">💀</span> THREAT LEVEL: APOCALYPTIC - RYOMEN SUKUNA
                      </span>
                    ) : isAizen ? (
                      <span className="text-[10px] uppercase font-black tracking-widest text-purple-400 [text-shadow:0_0_12px_rgba(168,85,247,0.9)] animate-pulse flex items-center gap-1.5">
                        <span className="animate-bounce">🔮</span> THREAT LEVEL: TRANSCENDENT - SŌSUKE AIZEN
                      </span>
                    ) : (
                      <span className="text-[9px] uppercase font-black tracking-widest text-red-500 [text-shadow:0_0_8px_rgba(239,68,68,0.6)] animate-pulse">
                        ⚡ ACTIVE COMBAT Arena
                      </span>
                    )}
                    <div className="flex gap-2">
                      <span className="text-[9px] font-bold text-gray-500 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">
                        XP +{activeEnemy.xp_reward}
                      </span>
                      <span className="text-[9px] font-bold text-gray-500 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">
                        🪙 +{activeEnemy.gold_reward}
                      </span>
                    </div>
                  </div>

                  {/* VS Layout */}
                  <div className="relative z-10 flex items-center justify-between flex-1 py-2">
                    {/* Player Slot (Left) */}
                    <div className="flex flex-col items-center w-[38%]" style={{ width: activeSummon ? '28%' : '38%' }}>
                      <div className={`w-14 h-14 bg-gradient-to-br from-indigo-950 to-indigo-900 rounded-full p-0.5 border flex items-center justify-center relative transition-all duration-300 ${
                        (player as any).status_effects?.some((eff: any) => eff.name === 'Shielded')
                          ? 'border-indigo-400 shadow-[0_0_15px_rgba(129,140,248,0.6)]'
                          : (player as any).status_effects?.some((eff: any) => eff.name === 'Frozen')
                            ? 'border-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.6)]'
                            : (player as any).status_effects?.some((eff: any) => eff.name === 'Burned')
                              ? 'border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.6)] animate-pulse'
                              : 'border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.2)]'
                      }`}>
                        <svg viewBox="0 0 100 100" className="w-10 h-10">
                          <circle cx="50" cy="50" r="48" fill="none" stroke="#6366f1" strokeWidth="2" strokeDasharray="5 3" />
                          <path d="M30 75 Q50 35 70 75 Z" fill="#6366f1" opacity="0.8" />
                          <circle cx="50" cy="35" r="12" fill="#818cf8" />
                        </svg>
                        
                        {/* Targeted crosshair scope overlay */}
                        {isPlayerTargeted && (
                          <>
                            <div className="absolute inset-0 border-2 border-red-500 rounded-full animate-ping pointer-events-none opacity-60"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <svg className="w-14 h-14 text-red-500 animate-spin bg-transparent pointer-events-none [animation-duration:8s]" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 8" />
                                <line x1="50" y1="0" x2="50" y2="100" stroke="currentColor" strokeWidth="1" />
                                <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeWidth="1" />
                              </svg>
                            </div>
                          </>
                        )}
                      </div>
                      <span className="text-[11px] font-bold text-white mt-1.5 truncate max-w-full">{player.name}</span>
                      <span className="text-[8px] uppercase tracking-wider text-indigo-400">LVL {player.level}</span>
                      
                      {/* Status Effects List */}
                      {(player as any).status_effects && (player as any).status_effects.length > 0 && (
                        <div className="flex flex-wrap gap-1 justify-center mt-1 max-w-full">
                          {(player as any).status_effects.map((eff: any, i: number) => (
                            <span 
                              key={i} 
                              className={`text-[7px] font-black uppercase px-1 py-0.2 rounded border flex items-center gap-0.5 shadow-[0_0_6px_rgba(255,255,255,0.05)] transition-all ${
                                eff.name === 'Burned' 
                                  ? 'bg-orange-950/40 border-orange-500/50 text-orange-400 animate-pulse'
                                  : eff.name === 'Frozen'
                                    ? 'bg-sky-950/40 border-sky-500/50 text-sky-300 animate-pulse'
                                    : eff.name === 'Shielded'
                                      ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-300'
                                      : 'bg-red-950/40 border-red-500/50 text-red-400'
                              }`}
                              title={`${eff.name} (${eff.turns} turns left)`}
                            >
                              <span>{eff.icon}</span>
                              <span>{eff.turns}T</span>
                              {eff.name === 'Shielded' && <span className="font-mono text-[6px] text-indigo-300/80">({eff.value})</span>}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Targeting Alert Tag */}
                      {isPlayerTargeted ? (
                        <span className="text-[7px] uppercase font-black tracking-widest text-red-500 bg-red-950/50 px-1 py-0.5 rounded border border-red-500/20 mt-1 animate-pulse">
                          ⚠️ TARGETED
                        </span>
                      ) : (
                        <span className="text-[7px] uppercase font-bold tracking-widest text-gray-500 mt-1">
                          SAFE
                        </span>
                      )}
                    </div>

                    {/* Active Summon Slot */}
                    {activeSummon && (
                      <div className="flex flex-col items-center w-[28%] animate-fade-in">
                        <div className={`w-14 h-14 bg-gradient-to-br from-slate-950 to-slate-900 rounded-full p-0.5 border flex items-center justify-center relative transition-all duration-300 ${
                          activeSummon.name.toLowerCase().includes("gojo")
                            ? 'border-sky-450 shadow-[0_0_12px_rgba(56,189,248,0.3)]'
                            : 'border-pink-450 shadow-[0_0_12px_rgba(244,114,182,0.3)]'
                        }`}>
                          <SummonAvatar name={activeSummon.name} />

                          {/* Targeted crosshair scope overlay */}
                          {isSummonTargeted && (
                            <>
                              <div className="absolute inset-0 border-2 border-red-500 rounded-full animate-ping pointer-events-none opacity-60"></div>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <svg className="w-14 h-14 text-red-500 animate-spin bg-transparent pointer-events-none [animation-duration:8s]" viewBox="0 0 100 100">
                                  <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 8" />
                                  <line x1="50" y1="0" x2="50" y2="100" stroke="currentColor" strokeWidth="1" />
                                  <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeWidth="1" />
                                </svg>
                              </div>
                            </>
                          )}
                        </div>
                        <span className="text-[11px] font-bold text-white mt-1.5 truncate max-w-full text-center">
                          {activeSummon.name.split(" ")[0]}
                        </span>
                        <span className="text-[7px] uppercase font-bold tracking-wider text-slate-400">
                          ⏳ {activeSummon.turns_left} TURNS
                        </span>

                        {/* Status Effects List */}
                        {activeSummon.status_effects && activeSummon.status_effects.length > 0 && (
                          <div className="flex flex-wrap gap-1 justify-center mt-1 max-w-full">
                            {activeSummon.status_effects.map((eff: any, i: number) => (
                              <span 
                                key={i} 
                                className={`text-[7px] font-black uppercase px-1 py-0.2 rounded border flex items-center gap-0.5 shadow-[0_0_6px_rgba(255,255,255,0.05)] transition-all ${
                                  eff.name === 'Burned' 
                                    ? 'bg-orange-950/40 border-orange-500/50 text-orange-400 animate-pulse'
                                    : eff.name === 'Frozen'
                                      ? 'bg-sky-950/40 border-sky-500/50 text-sky-300 animate-pulse'
                                      : eff.name === 'Shielded'
                                        ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-300'
                                        : 'bg-red-950/40 border-red-500/50 text-red-400'
                                }`}
                                title={`${eff.name} (${eff.turns} turns left)`}
                              >
                                <span>{eff.icon}</span>
                                <span>{eff.turns}T</span>
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Targeting Alert Tag */}
                        {isSummonTargeted ? (
                          <span className="text-[7px] uppercase font-black tracking-widest text-red-500 bg-red-950/50 px-1 py-0.5 rounded border border-red-500/20 mt-1 animate-pulse">
                            ⚠️ TARGETED
                          </span>
                        ) : (
                          <span className="text-[7px] uppercase font-bold tracking-widest text-gray-500 mt-1">
                            SAFE
                          </span>
                        )}
                      </div>
                    )}

                    {/* VS Emblem (Center) */}
                    <div className="flex flex-col items-center justify-center select-none" style={{ width: activeSummon ? '14%' : '20%' }}>
                      <span className="text-2xl font-black text-red-500 italic [text-shadow:0_0_12px_rgba(239,68,68,0.8)] animate-bounce">
                        VS
                      </span>
                      <div className="w-0.5 h-8 bg-gradient-to-b from-transparent via-red-500/50 to-transparent"></div>
                    </div>

                    {/* Enemy Slot (Right) */}
                    <div className="flex flex-col items-center w-[38%]" style={{ width: activeSummon ? '30%' : '38%' }}>
                      <div className={`w-14 h-14 bg-gradient-to-br rounded-full p-0.5 border flex items-center justify-center relative transition-all duration-500 ${
                        (activeEnemy as any).status_effects?.some((eff: any) => eff.name === 'Shielded')
                          ? 'border-indigo-400 shadow-[0_0_15px_rgba(129,140,248,0.6)]'
                          : (activeEnemy as any).status_effects?.some((eff: any) => eff.name === 'Frozen')
                            ? 'border-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.6)]'
                            : (activeEnemy as any).status_effects?.some((eff: any) => eff.name === 'Burned')
                              ? 'border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.6)] animate-pulse'
                              : isSukuna
                                ? 'from-red-950 to-red-900 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.7)] animate-pulse'
                                : isAizen
                                  ? 'from-purple-950 to-purple-900 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.7)]'
                                  : 'from-red-950 to-red-900 border-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                      }`}>
                        <EnemyAvatar name={activeEnemy.name} />

                        {/* If healing, show healing glow ring */}
                        {(activeEnemy as any).next_intent === 'HEAL' && (
                          <div className="absolute inset-0 border-2 border-emerald-500 rounded-full animate-pulse pointer-events-none opacity-60"></div>
                        )}
                      </div>
                      <span className="text-[11px] font-bold text-white mt-1.5 truncate max-w-full">{activeEnemy.name}</span>
                      {isSukuna ? (
                        <span className="text-[7px] uppercase font-black tracking-widest text-red-500 animate-pulse">
                          👹 THE KING OF CURSES
                        </span>
                      ) : isAizen ? (
                        <span className="text-[7px] uppercase font-black tracking-widest text-purple-400">
                          🔮 THE MASTERMIND
                        </span>
                      ) : (
                        <span className="text-[8px] uppercase tracking-wider text-red-400">HOSTILE</span>
                      )}

                      {/* Status Effects List */}
                      {(activeEnemy as any).status_effects && (activeEnemy as any).status_effects.length > 0 && (
                        <div className="flex flex-wrap gap-1 justify-center mt-1 max-w-full">
                          {(activeEnemy as any).status_effects.map((eff: any, i: number) => (
                            <span 
                              key={i} 
                              className={`text-[7px] font-black uppercase px-1 py-0.2 rounded border flex items-center gap-0.5 shadow-[0_0_6px_rgba(255,255,255,0.05)] transition-all ${
                                eff.name === 'Burned' 
                                  ? 'bg-orange-950/40 border-orange-500/50 text-orange-400 animate-pulse'
                                  : eff.name === 'Frozen'
                                    ? 'bg-sky-950/40 border-sky-500/50 text-sky-300 animate-pulse'
                                    : eff.name === 'Shielded'
                                      ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-300'
                                      : 'bg-red-950/40 border-red-500/50 text-red-400'
                              }`}
                              title={`${eff.name} (${eff.turns} turns left)`}
                            >
                              <span>{eff.icon}</span>
                              <span>{eff.turns}T</span>
                              {eff.name === 'Shielded' && <span className="font-mono text-[6px] text-indigo-300/80">({eff.value})</span>}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Intent Warning Badges */}
                      {(activeEnemy as any).next_intent && (
                        <div className={`mt-1 text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border transition-all duration-300 ${
                          (activeEnemy as any).next_intent === 'HEAVY_ATTACK'
                            ? 'bg-red-950/40 border-red-500 text-red-400 animate-pulse shadow-[0_0_6px_rgba(239,68,68,0.3)]'
                            : (activeEnemy as any).next_intent === 'HEAL'
                              ? 'bg-emerald-950/40 border-emerald-500 text-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.3)]'
                              : (activeEnemy as any).next_intent === 'CURSE'
                                ? 'bg-purple-950/40 border-purple-500 text-purple-400 shadow-[0_0_6px_rgba(168,85,247,0.3)]'
                                : 'bg-white/5 border-white/10 text-gray-400'
                        }`}>
                          {(activeEnemy as any).next_intent === 'HEAVY_ATTACK' && (isSukuna ? '💥 CLEAVE & DISMANTLE' : isAizen ? '🔮 HADŌ #90: KUROHITSUGI' : '💥 HEAVY')}
                          {(activeEnemy as any).next_intent === 'HEAL' && '💚 RESTORE'}
                          {(activeEnemy as any).next_intent === 'CURSE' && (isSukuna ? '🔥 MALEVOLENT SHRINE' : isAizen ? '✨ ILLUSION' : '⚡ CURSE')}
                          {(activeEnemy as any).next_intent === 'ATTACK' && (isSukuna ? '⚔️ DISMANTLE' : isAizen ? '⚔️ KYŌKA SUIGETSU' : '⚔️ SLASH')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Health Bars */}
                  <div className="relative z-10 flex gap-4 mt-2">
                    {/* Player Health Bar (Left) */}
                    <div className="flex-1">
                      <div className="flex justify-between items-baseline mb-0.5 text-left">
                        <span className="text-[9px] uppercase font-bold text-indigo-300">Player HP</span>
                        <span className="font-mono text-[9px] text-white">{player.hp}/{player.max_hp}</span>
                      </div>
                      <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-indigo-750 to-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.5)] transition-all duration-300"
                          style={{ width: `${(player.hp / player.max_hp) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Active Summon Health Bar */}
                    {activeSummon && (
                      <div className="flex-1 animate-fade-in">
                        <div className="flex justify-between items-baseline mb-0.5 text-left">
                          <span className={`text-[9px] uppercase font-bold ${activeSummon.name.toLowerCase().includes("gojo") ? 'text-sky-300' : 'text-pink-300'}`}>
                            {activeSummon.name.split(" ")[0]} HP
                          </span>
                          <span className="font-mono text-[9px] text-white">{activeSummon.hp}/{activeSummon.max_hp}</span>
                        </div>
                        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/5">
                          <div 
                            className={`h-full rounded-full bg-gradient-to-r ${
                              activeSummon.name.toLowerCase().includes("gojo")
                                ? 'from-sky-700 to-sky-500 shadow-[0_0_6px_rgba(56,189,248,0.5)]'
                                : 'from-pink-700 to-pink-500 shadow-[0_0_6px_rgba(244,114,182,0.5)]'
                            } transition-all duration-300`}
                            style={{ width: `${(activeSummon.hp / activeSummon.max_hp) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Enemy Health Bar (Right) */}
                    <div className="flex-1">
                      <div className="flex justify-between items-baseline mb-0.5 text-left">
                        <span className="text-[9px] uppercase font-bold text-red-400">Enemy HP</span>
                        <span className="font-mono text-[9px] text-white">{activeEnemy.hp}/{activeEnemy.max_hp}</span>
                      </div>
                      <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-red-750 to-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)] transition-all duration-300"
                          style={{ width: `${enemyHpPct}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`relative w-full h-[220px] bg-black/45 border rounded-lg overflow-hidden mb-4 shadow-[inset_0_2px_10px_rgba(0,0,0,0.9)] transition-colors ${
                  isShibuya 
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
                              isShibuya 
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
                        className="absolute z-10 transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                        style={{ left: `${loc.x}%`, top: `${loc.y}%` }}
                        onClick={() => (isConnected || isCurrent) && movePlayer(name)}
                      >
                        {/* Glowing effect for current position */}
                        {isCurrent ? (
                          <div className={`w-7 h-7 rounded-full border-2 animate-ping absolute -inset-1 ${
                            isShibuya 
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
                            ? isShibuya
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
                  {!inCombat && (currentLocDetails.name === "Rukongai District" || currentLocDetails.name === "Shibuya Station") && (
                    <button 
                      className="mt-3.5 w-full bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 text-white font-bold py-2 px-3 rounded-lg text-xs uppercase tracking-wider hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(34,197,94,0.3)] transition-all duration-200 cursor-pointer border-0"
                      onClick={openShop}
                    >
                      🏪 Visit Urahara Shop
                    </button>
                  )}
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
              {victoryRewards ? (
                <div className="mb-4 text-center py-4 bg-yellow-950/10 border border-yellow-500/10 rounded-lg shadow-[inset_0_2px_8px_rgba(0,0,0,0.6)]">
                  <span className="text-[10px] uppercase font-black tracking-widest text-yellow-500/80 animate-pulse">Claim Victory Rewards Above</span>
                </div>
              ) : inCombat ? (
                <div className="mb-4">
                  {combatMenu === 'main' && (
                    <div className="flex flex-col gap-3">
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          className="bg-gradient-to-br from-red-600 to-red-800 text-white border-0 rounded-lg py-3 px-4 font-bold text-xs uppercase tracking-wider cursor-pointer shadow-[0_4px_10px_rgba(239,68,68,0.2)] hover:-translate-y-0.5 hover:shadow-[0_6px_15px_rgba(239,68,68,0.4)] transition-all duration-150 flex flex-col items-center gap-1" 
                          onClick={attackEnemy}
                        >
                          <span className="text-lg">⚔️</span>
                          <span>Zanjutsu (Slash)</span>
                        </button>
                        <button 
                          className="bg-gradient-to-br from-purple-700 to-purple-900 text-white border-0 rounded-lg py-3 px-4 font-bold text-xs uppercase tracking-wider cursor-pointer shadow-[0_4px_10px_rgba(147,51,234,0.2)] hover:-translate-y-0.5 hover:shadow-[0_6px_15px_rgba(147,51,234,0.4)] transition-all duration-150 flex flex-col items-center gap-1" 
                          onClick={() => setCombatMenu('kido')}
                        >
                          <span className="text-lg">🔮</span>
                          <span>Kidō Spells</span>
                        </button>
                        <button 
                          className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white border-0 rounded-lg py-3 px-4 font-bold text-xs uppercase tracking-wider cursor-pointer shadow-[0_4px_10px_rgba(16,185,129,0.2)] hover:-translate-y-0.5 hover:shadow-[0_6px_15px_rgba(16,185,129,0.4)] transition-all duration-150 flex flex-col items-center gap-1" 
                          onClick={() => setCombatMenu('items')}
                        >
                          <span className="text-lg">📦</span>
                          <span>Items (Potions)</span>
                        </button>
                        <button 
                          className="bg-gradient-to-br from-amber-600 to-amber-800 text-white border-0 rounded-lg py-3 px-4 font-bold text-xs uppercase tracking-wider cursor-pointer shadow-[0_4px_10px_rgba(245,158,11,0.2)] hover:-translate-y-0.5 hover:shadow-[0_6px_15px_rgba(245,158,11,0.4)] transition-all duration-150 flex flex-col items-center gap-1" 
                          onClick={() => setCombatMenu('summons')}
                        >
                          <span className="text-lg">🦊</span>
                          <span>Summon Seals</span>
                        </button>
                      </div>
                      <button 
                        className="w-full bg-white/5 text-red-300 border border-red-500/20 rounded-lg py-2.5 px-4 text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-red-500/10 hover:text-white hover:border-red-500 transition-all duration-150" 
                        onClick={runAway}
                      >
                        🏃 Escape Combat
                      </button>
                    </div>
                  )}

                  {combatMenu === 'kido' && (
                    <div className="bg-purple-950/10 border border-purple-500/20 rounded-xl p-3.5 flex flex-col gap-3">
                      <div className="flex justify-between items-center border-b border-purple-500/10 pb-2 mb-1">
                        <span className="text-[10px] uppercase font-black text-purple-400 tracking-widest">🔮 Kidō Spellbook</span>
                        <span className="text-[10px] text-gray-500">Reiryoku: {player.energy}</span>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          className="w-full bg-purple-900/40 hover:bg-purple-900 border border-purple-500/30 text-white font-bold py-2 px-3 rounded-lg text-xs transition-all duration-150 flex justify-between items-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          disabled={player.energy < 15}
                          onClick={() => castKido('shakkaho')}
                        >
                          <span className="text-left flex flex-col">
                            <span className="text-white">🔥 Hadō #31: Shakkahō</span>
                            <span className="text-[9px] text-purple-300 font-normal">Burst of red flames (1.5x ATK dmg)</span>
                          </span>
                          <span className="bg-purple-950 px-2 py-0.5 rounded text-[10px] text-purple-300">15 Energy</span>
                        </button>
                        <button
                          className="w-full bg-purple-900/40 hover:bg-purple-900 border border-purple-500/30 text-white font-bold py-2 px-3 rounded-lg text-xs transition-all duration-150 flex justify-between items-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          disabled={player.energy < 20}
                          onClick={() => castKido('kaido')}
                        >
                          <span className="text-left flex flex-col">
                            <span className="text-white">💚 Kaidō (Restoration)</span>
                            <span className="text-[9px] text-purple-300 font-normal">Heals substantial soul HP</span>
                          </span>
                          <span className="bg-purple-950 px-2 py-0.5 rounded text-[10px] text-purple-300">20 Energy</span>
                        </button>
                      </div>
                      <button
                        className="w-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 py-1.5 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                        onClick={() => setCombatMenu('main')}
                      >
                        ⬅️ Back to Tactics
                      </button>
                    </div>
                  )}

                  {combatMenu === 'items' && (
                    <div className="bg-emerald-950/10 border border-emerald-500/20 rounded-xl p-3.5 flex flex-col gap-3">
                      <div className="flex justify-between items-center border-b border-emerald-500/10 pb-2 mb-1">
                        <span className="text-[10px] uppercase font-black text-emerald-400 tracking-widest">📦 Combat Satchel</span>
                        <span className="text-[10px] text-gray-500">Usable Items</span>
                      </div>
                      <div className="flex flex-col gap-2 max-h-[120px] overflow-y-auto pr-1">
                        {player.inventory.filter(i => i.item_type === 'consumable').length > 0 ? (
                          player.inventory.filter(i => i.item_type === 'consumable').map((item, idx) => (
                            <button
                              key={idx}
                              className="w-full bg-emerald-900/40 hover:bg-emerald-900 border border-emerald-500/30 text-white font-bold py-2 px-3 rounded-lg text-xs transition-all duration-150 flex justify-between items-center cursor-pointer"
                              onClick={() => useCombatItem(item.name)}
                            >
                              <span className="text-left flex flex-col">
                                <span className="text-white">🧪 {item.name}</span>
                                <span className="text-[9px] text-emerald-300 font-normal">{item.description}</span>
                              </span>
                              <span className="bg-emerald-950 px-2 py-0.5 rounded text-[10px] text-emerald-300">Use</span>
                            </button>
                          ))
                        ) : (
                          <div className="py-4 text-center text-gray-500 italic text-[11px]">
                            No consumable items in inventory.
                          </div>
                        )}
                      </div>
                      <button
                        className="w-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 py-1.5 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                        onClick={() => setCombatMenu('main')}
                      >
                        ⬅️ Back to Tactics
                      </button>
                    </div>
                  )}

                  {combatMenu === 'summons' && (
                    <div className="bg-amber-950/10 border border-amber-500/20 rounded-xl p-3.5 flex flex-col gap-3">
                      <div className="flex justify-between items-center border-b border-amber-500/10 pb-2 mb-1">
                        <span className="text-[10px] uppercase font-black text-amber-400 tracking-widest">🔮 Summoning Rituals</span>
                        <span className="text-[10px] text-gray-500">Reiryoku: {player.energy}</span>
                      </div>
                      <div className="flex flex-col gap-2 max-h-[120px] overflow-y-auto pr-1">
                        {player.summons.length > 0 ? (
                          player.summons.map((summon, idx) => (
                            <button
                              key={idx}
                              className="w-full bg-amber-900/40 hover:bg-amber-900 border border-amber-500/30 text-white font-bold py-2 px-3 rounded-lg text-xs transition-all duration-150 flex justify-between items-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                              disabled={player.energy < 40}
                              onClick={() => executeSummon(summon)}
                            >
                              <span className="text-left flex flex-col">
                                <span className="text-white capitalize">🔮 {summon} Summon</span>
                                <span className="text-[9px] text-amber-300 font-normal">
                                  {summon.toLowerCase() === 'gojo' ? 'Domain Expansion: 100 Absolute Dmg' : 'Kageoni shadow strike: 70 Shadow Dmg'}
                                </span>
                              </span>
                              <span className="bg-amber-950 px-2 py-0.5 rounded text-[10px] text-amber-300">40 Energy</span>
                            </button>
                          ))
                        ) : (
                          <div className="py-4 text-center text-gray-500 italic text-[11px]">
                            No summon seals in inventory. Find them in dungeons!
                          </div>
                        )}
                      </div>
                      <button
                        className="w-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 py-1.5 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                        onClick={() => setCombatMenu('main')}
                      >
                        ⬅️ Back to Tactics
                      </button>
                    </div>
                  )}
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
      {shopOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#0b130e]/95 border-2 border-emerald-500/30 rounded-2xl w-full max-w-[850px] max-h-[85vh] overflow-hidden flex flex-col shadow-[0_0_30px_rgba(16,185,129,0.15)] animate-slide-up">
            {/* Header */}
            <div className="border-b border-emerald-500/10 p-5 flex items-center justify-between bg-emerald-950/20">
              <div className="flex items-center gap-3">
                <div className="w-[50px] h-[50px] bg-black/40 rounded-lg p-0.5 border border-emerald-500/20">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <circle cx="50" cy="50" r="48" fill="#14532d" stroke="#4ade80" strokeWidth="2" />
                    <path d="M25 45 Q50 20 75 45 Z" fill="#166534" />
                    <path d="M30 45 Q50 23 70 45 Z" fill="#ffffff" />
                    <ellipse cx="50" cy="48" rx="32" ry="6" fill="#166534" />
                  </svg>
                </div>
                <div className="text-left">
                  <h2 className="text-lg font-black text-green-400 [text-shadow:0_0_10px_rgba(74,222,128,0.4)] tracking-wide m-0">URAHARA SHOP</h2>
                  <p className="text-[10px] text-gray-400 m-0">"Spiritual weapons, armor, and custom remedies."</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase text-gray-500 font-bold block">Your Funds</span>
                <div className="flex items-center gap-1.5 justify-end">
                  <span className="text-yellow-400 font-black text-lg">🪙 {player.gold}</span>
                  <span className="text-[10px] text-yellow-500 uppercase font-black tracking-wider">Gold</span>
                </div>
              </div>
            </div>

            {/* Catalog Body */}
            <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
              {/* Left Column: BUY */}
              <div className="flex flex-col">
                <h3 className="text-xs uppercase text-green-400 font-black tracking-wider border-b border-emerald-500/10 pb-2 mb-3 text-left">Items For Sale</h3>
                <div className="flex flex-col gap-3 overflow-y-auto pr-1">
                  {shopItems.map((item, idx) => (
                    <div key={idx} className="bg-emerald-950/5 border border-emerald-500/10 rounded-xl p-3.5 flex justify-between items-center transition-all duration-200 hover:bg-emerald-950/10 hover:border-emerald-500/30">
                      <div className="text-left flex-1 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{item.name}</span>
                          <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold ${
                            item.item_type === 'weapon' ? 'bg-red-950/40 text-red-400 border border-red-500/20' :
                            item.item_type === 'armor' ? 'bg-blue-950/40 text-blue-400 border border-blue-500/20' :
                            'bg-green-950/40 text-green-400 border border-green-500/20'
                          }`}>
                            {item.item_type === 'weapon' ? `+${item.attack_bonus} ATK` :
                             item.item_type === 'armor' ? `+${item.defense_bonus} DEF` :
                             `HP Restore`}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1 mb-0 leading-relaxed">{item.description}</p>
                      </div>
                      <button
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition-all duration-150 flex items-center gap-1.5 cursor-pointer border-0"
                        onClick={() => buyItem(item.name)}
                      >
                        <span>Buy</span>
                        <span className="text-[10px] text-yellow-300">🪙{item.value}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: SELL */}
              <div className="flex flex-col">
                <h3 className="text-xs uppercase text-yellow-500 font-black tracking-wider border-b border-yellow-500/10 pb-2 mb-3 text-left">Your Inventory</h3>
                <div className="flex flex-col gap-3 overflow-y-auto pr-1">
                  {player.inventory.length > 0 ? (
                    player.inventory.map((item, idx) => {
                      const sellValue = Math.max(1, Math.floor(item.value * 0.5));
                      return (
                        <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-3.5 flex justify-between items-center transition-all duration-200 hover:bg-white/10 hover:border-yellow-500/20">
                          <div className="text-left flex-1 pr-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white">{item.name}</span>
                              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-white/10 text-gray-400 border border-white/20 font-bold">
                                {item.item_type}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-400 mt-1 mb-0 leading-relaxed">{item.description}</p>
                          </div>
                          <button
                            className="bg-yellow-600/20 hover:bg-yellow-600 border border-yellow-500/30 hover:border-yellow-500 text-yellow-400 hover:text-white font-bold py-1.5 px-3 rounded-lg text-xs transition-all duration-150 flex items-center gap-1.5 cursor-pointer"
                            onClick={() => sellItem(item.name)}
                          >
                            <span>Sell</span>
                            <span className="text-[10px]">🪙{sellValue}</span>
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex-1 flex items-center justify-center border border-dashed border-white/5 rounded-xl p-8 text-center text-gray-500 italic text-xs">
                      Inventory is empty. Nothing to sell.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-emerald-500/10 p-4 flex justify-end bg-black/40">
              <button
                className="bg-white/5 text-gray-300 hover:text-white border border-white/10 hover:border-emerald-500/50 rounded-lg py-2 px-5 text-xs font-bold cursor-pointer transition-all duration-150"
                onClick={closeShop}
              >
                Exit Urahara Shop
              </button>
            </div>
          </div>
        </div>
      )}
      {dialogueQueue && (
        <DialogueBox 
          lines={dialogueQueue} 
          onComplete={() => setDialogueQueue(null)} 
        />
      )}
    </div>
  )
}

export default App
