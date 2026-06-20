import { useState, useEffect } from 'react'
import { SoundManager } from './SoundManager'

interface CinematicIntroProps {
  onComplete: () => void;
}

export const CinematicIntro = ({ onComplete }: CinematicIntroProps) => {
  const [scene, setScene] = useState(0)

  const scenes = [
    {
      title: "I. The Collapse",
      text: "In the year 2026, the boundaries between the living world and the Soul Society have collapsed...",
      bgClass: "bg-[#090a0f] text-gray-400 border-gray-900",
      accentClass: "text-zinc-500",
      flashClass: "bg-zinc-500/10"
    },
    {
      title: "II. The Malevolence",
      text: "The King of Curses, Ryomen Sukuna, has broken free from his seals in Shibuya, bringing ruin to the mortal realm.",
      bgClass: "bg-[#0f0707] text-red-400/90 border-red-950/30 Shibuya-crimson-vortex",
      accentClass: "text-red-500 font-bold",
      flashClass: "bg-red-500/25"
    },
    {
      title: "III. The Treachery",
      text: "From the shadows of Las Noches, Sosuke Aizen orchestrates a divine conspiracy to claim the throne of the heavens.",
      bgClass: "bg-[#0b0612] text-purple-400/90 border-purple-950/30",
      accentClass: "text-purple-500 font-bold",
      flashClass: "bg-purple-500/25"
    },
    {
      title: "IV. The Awakening",
      text: "Only a Soul Reaper, wielding the ultimate Bankai, can banish the corruption and restore balance.",
      bgClass: "bg-[#060b14] text-pink-300/95 border-pink-950/20",
      accentClass: "text-pink-400 font-black",
      flashClass: "bg-pink-400/20"
    },
    {
      title: "DOMAIN OF THE SOUL SOCIETY",
      text: "Wield your Zanpakuto. Unleash your Domain.",
      bgClass: "bg-black text-white",
      accentClass: "text-neon-cyan font-black tracking-[0.3em] [text-shadow:0_0_15px_rgba(102,252,241,0.6)]",
      flashClass: "bg-neon-cyan/35"
    }
  ]

  useEffect(() => {
    // Play initial sound
    SoundManager.playCinematicSweep(scene)

    const timer = setInterval(() => {
      setScene((prev) => {
        if (prev >= scenes.length - 1) {
          clearInterval(timer)
          return prev
        }
        const next = prev + 1
        SoundManager.playCinematicSweep(next)
        return next
      })
    }, 4500)

    return () => clearInterval(timer)
  }, [scene])

  // Skip keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        onComplete()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onComplete])

  const current = scenes[scene]

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center transition-all duration-1000 p-6 select-none overflow-hidden ${current.bgClass}`}>
      
      {/* Cinematic Flash Overlay on scene entry */}
      <div 
        key={scene} 
        className={`absolute inset-0 pointer-events-none animate-flash-overlay z-10 ${current.flashClass}`} 
      />

      {/* Decorative Anime Grid/Scanline effects */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-scanlines mix-blend-overlay z-0" />

      {/* Floating Cherry Blossom Petals for Scene 3 */}
      {scene === 3 && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="sakura-petal" style={{ left: '15%', animationDelay: '0s', width: '12px', height: '16px' }}></div>
          <div className="sakura-petal" style={{ left: '35%', animationDelay: '2.5s', width: '10px', height: '14px' }}></div>
          <div className="sakura-petal" style={{ left: '55%', animationDelay: '5s', width: '14px', height: '18px' }}></div>
          <div className="sakura-petal" style={{ left: '75%', animationDelay: '1.2s', width: '11px', height: '15px' }}></div>
        </div>
      )}

      {/* Hollow Portal ripples for Scene 2 */}
      {scene === 2 && (
        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none z-0">
          <div className="w-[450px] h-[450px] border border-dashed border-purple-500 rounded-full animate-spin-slow"></div>
        </div>
      )}

      {/* Shibuya warning patterns for Scene 1 */}
      {scene === 1 && (
        <div className="absolute inset-0 flex flex-col justify-between p-10 opacity-[0.03] pointer-events-none font-mono text-[9px] text-red-500 z-0 select-none">
          <div>WARNING // SYSTEM COMPROMISED // SPIRITUAL SHIELD FAILURE</div>
          <div className="text-right">DANGER // SHIBUYA BARRIER BROKEN // CURSE DETECTED</div>
        </div>
      )}

      <div className="max-w-2xl text-center relative z-20 flex flex-col items-center">
        
        {/* Title Sequence */}
        <h2 
          className={`text-xs md:text-[11px] font-mono uppercase tracking-[0.4em] mb-8 transition-all duration-1000 ${
            scene === 4 ? 'text-4xl md:text-5xl font-black' : current.accentClass
          }`}
        >
          {current.title}
        </h2>

        {/* Narrative text block */}
        <p className="text-sm md:text-base leading-relaxed tracking-wider font-medium text-gray-300 transition-all duration-700 font-sans min-h-[4.5rem] px-4">
          {current.text}
        </p>

        {/* Scene progress indicators */}
        <div className="flex gap-2.5 mt-16">
          {scenes.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-0.5 rounded transition-all duration-700 ${
                idx === scene 
                  ? 'w-8 bg-neon-cyan' 
                  : idx < scene 
                    ? 'w-2 bg-neon-cyan/40' 
                    : 'w-2 bg-white/10'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Tactile interaction button */}
      <div className="absolute bottom-10 left-0 right-0 flex justify-center z-30">
        {scene === scenes.length - 1 ? (
          <button 
            onClick={onComplete}
            className="px-8 py-3 rounded-lg border-2 border-neon-cyan bg-neon-cyan/10 hover:bg-neon-cyan text-neon-cyan hover:text-black font-black uppercase text-xs tracking-widest cursor-pointer transition-all duration-300 shadow-[0_0_20px_rgba(102,252,241,0.2)] hover:shadow-[0_0_35px_rgba(102,252,241,0.5)] active:scale-95"
          >
            Enter the Domain
          </button>
        ) : (
          <button 
            onClick={onComplete}
            className="text-[9px] uppercase tracking-widest text-gray-500 hover:text-white cursor-pointer px-4 py-2 hover:bg-white/5 rounded transition-all duration-200 border border-transparent hover:border-white/10"
          >
            Skip Intro [ESC / Space]
          </button>
        )}
      </div>
    </div>
  )
}
