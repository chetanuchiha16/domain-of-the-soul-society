import React, { useState, useEffect, useRef } from 'react';

export interface FrameAnimationPlayerProps {
  animationType: string | null;
  onComplete: () => void;
}

// Sound synthesizer using Web Audio API
let animAudioCtx: AudioContext | null = null;

const playAnimSound = (type: string) => {
  try {
    if (!animAudioCtx) {
      animAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (animAudioCtx.state === 'suspended') {
      animAudioCtx.resume();
    }

    const dest = animAudioCtx.destination;

    if (type === 'slash') {
      // Metallic slice sound
      const osc = animAudioCtx.createOscillator();
      const gain = animAudioCtx.createGain();
      osc.connect(gain);
      gain.connect(dest);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, animAudioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, animAudioCtx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.04, animAudioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, animAudioCtx.currentTime + 0.25);

      osc.start();
      osc.stop(animAudioCtx.currentTime + 0.25);
    } else if (type === 'blast' || type === 'fire') {
      // Exploding blast sound
      const osc = animAudioCtx.createOscillator();
      const gain = animAudioCtx.createGain();
      osc.connect(gain);
      gain.connect(dest);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, animAudioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, animAudioCtx.currentTime + 0.45);

      gain.gain.setValueAtTime(0.08, animAudioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, animAudioCtx.currentTime + 0.45);

      osc.start();
      osc.stop(animAudioCtx.currentTime + 0.45);
    } else if (type === 'purple_charge') {
      // Rising energy hum
      const osc1 = animAudioCtx.createOscillator();
      const osc2 = animAudioCtx.createOscillator();
      const gain = animAudioCtx.createGain();
      
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(dest);

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(150, animAudioCtx.currentTime);
      osc1.frequency.linearRampToValueAtTime(600, animAudioCtx.currentTime + 0.8);

      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(155, animAudioCtx.currentTime);
      osc2.frequency.linearRampToValueAtTime(605, animAudioCtx.currentTime + 0.8);

      gain.gain.setValueAtTime(0.02, animAudioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.05, animAudioCtx.currentTime + 0.8);
      gain.gain.exponentialRampToValueAtTime(0.0001, animAudioCtx.currentTime + 0.82);

      osc1.start();
      osc2.start();
      osc1.stop(animAudioCtx.currentTime + 0.82);
      osc2.stop(animAudioCtx.currentTime + 0.82);
    } else if (type === 'purple_release') {
      // Hollow Purple catastrophic release explosion
      const osc = animAudioCtx.createOscillator();
      const gain = animAudioCtx.createGain();
      osc.connect(gain);
      gain.connect(dest);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, animAudioCtx.currentTime);
      osc.frequency.linearRampToValueAtTime(20, animAudioCtx.currentTime + 1.2);

      gain.gain.setValueAtTime(0.12, animAudioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, animAudioCtx.currentTime + 1.2);

      osc.start();
      osc.stop(animAudioCtx.currentTime + 1.2);
    } else if (type === 'bankai_start') {
      // Eerie low shadow sweep
      const osc = animAudioCtx.createOscillator();
      const gain = animAudioCtx.createGain();
      osc.connect(gain);
      gain.connect(dest);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(90, animAudioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, animAudioCtx.currentTime + 1.0);

      gain.gain.setValueAtTime(0.05, animAudioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, animAudioCtx.currentTime + 1.0);

      osc.start();
      osc.stop(animAudioCtx.currentTime + 1.0);
    } else if (type === 'thread_tension') {
      // High pitch wood block / string creak
      const osc = animAudioCtx.createOscillator();
      const gain = animAudioCtx.createGain();
      osc.connect(gain);
      gain.connect(dest);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(350, animAudioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, animAudioCtx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.015, animAudioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, animAudioCtx.currentTime + 0.35);

      osc.start();
      osc.stop(animAudioCtx.currentTime + 0.35);
    } else if (type === 'water_gurgle') {
      // Low underwater resonance
      const osc = animAudioCtx.createOscillator();
      const gain = animAudioCtx.createGain();
      osc.connect(gain);
      gain.connect(dest);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(65, animAudioCtx.currentTime);
      osc.frequency.linearRampToValueAtTime(50, animAudioCtx.currentTime + 0.9);

      gain.gain.setValueAtTime(0.07, animAudioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, animAudioCtx.currentTime + 0.9);

      osc.start();
      osc.stop(animAudioCtx.currentTime + 0.9);
    }
  } catch (err) {
    console.error("Failed to synthesize animation sound:", err);
  }
};

export const FrameAnimationPlayer: React.FC<FrameAnimationPlayerProps> = ({ animationType, onComplete }) => {
  const [frameIndex, setFrameIndex] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Define animations frame timelines
  const animations: Record<string, { duration: number; className: string; content: React.ReactNode; onEnter?: () => void }[]> = {
    slash: [
      {
        duration: 180,
        className: 'bg-white/80 flex items-center justify-center',
        content: (
          <div className="absolute w-full h-[6px] bg-sky-200 shadow-[0_0_20px_#ffffff] transform -rotate-12 scale-x-125 origin-center animate-pulse"></div>
        ),
        onEnter: () => playAnimSound('slash')
      },
      {
        duration: 220,
        className: 'bg-red-900/20 flex items-center justify-center',
        content: (
          <div className="text-[14px] font-black uppercase text-red-500 tracking-wider animate-bounce">
            💥 IMPACT
          </div>
        ),
        onEnter: () => playAnimSound('slash')
      }
    ],
    blast: [
      {
        duration: 400,
        className: 'bg-orange-950/40 flex items-center justify-center',
        content: (
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-yellow-500 to-red-600 border border-yellow-400 animate-ping opacity-75"></div>
        ),
        onEnter: () => playAnimSound('blast')
      },
      {
        duration: 450,
        className: 'bg-red-500/20 flex items-center justify-center',
        content: (
          <div className="text-[14px] font-black uppercase text-yellow-400 tracking-widest animate-pulse">
            🔥 Hadō #31: Shakkahō!
          </div>
        ),
        onEnter: () => playAnimSound('blast')
      }
    ],
    hollow_purple: [
      {
        duration: 650,
        className: 'bg-black/95 flex items-center justify-between px-8 border-t-2 border-b-2 border-cyan-500/20',
        content: (
          <div className="relative w-full h-full flex items-center justify-between">
            <div className="flex flex-col items-start gap-1">
              <span className="text-[7px] text-gray-500 font-mono tracking-widest">⚠️ LIMITLESS INVERSION</span>
              <span className="text-cyan-400 font-black text-[12px] uppercase tracking-widest [text-shadow:0_0_8px_rgba(34,211,238,0.7)] animate-pulse">
                🟦 LAPSE: BLUE
              </span>
            </div>
            {/* Spinning blue vortex */}
            <div className="w-10 h-10 rounded-full border-2 border-dashed border-cyan-400 animate-spin flex items-center justify-center [animation-duration:1s]">
              <div className="w-6 h-6 rounded-full bg-cyan-900/60 border border-cyan-300"></div>
            </div>
          </div>
        ),
        onEnter: () => playAnimSound('purple_charge')
      },
      {
        duration: 650,
        className: 'bg-black/95 flex items-center justify-between px-8 border-t-2 border-b-2 border-red-500/20',
        content: (
          <div className="relative w-full h-full flex items-center justify-between">
            {/* Spinning red vortex */}
            <div className="w-10 h-10 rounded-full border-2 border-dashed border-red-500 animate-spin flex items-center justify-center [animation-duration:1.5s]">
              <div className="w-6 h-6 rounded-full bg-red-950/60 border border-red-400"></div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-[7px] text-gray-500 font-mono tracking-widest">⚠️ REVERSE CURSED TECHNIQUE</span>
              <span className="text-red-500 font-black text-[12px] uppercase tracking-widest [text-shadow:0_0_8px_rgba(239,68,68,0.7)] animate-pulse">
                🟥 REVERSION: RED
              </span>
            </div>
          </div>
        ),
        onEnter: () => playAnimSound('purple_charge')
      },
      {
        duration: 450,
        className: 'bg-white text-black flex items-center justify-center transition-all duration-300',
        content: (
          <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
            {/* Manga Sketch style background */}
            <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,#000,#000_1px,#fff_1px,#fff_4px)] opacity-20"></div>
            <div className="absolute w-[120%] h-[120%] border-[2px] border-black/35 rotate-12 scale-95 animate-pulse"></div>
            <span className="text-xl font-extrabold uppercase italic tracking-widest text-black z-10 [text-shadow:1px_1px_0_rgba(0,0,0,0.2)] animate-pulse">
              ⚠️ COLLIDING SINGULARITIES
            </span>
            <span className="text-[8px] font-black uppercase text-gray-700 tracking-widest z-10 mt-1">
              "Nine Ropes. Polarized Light. Crow and Declaration."
            </span>
          </div>
        )
      },
      {
        duration: 1000,
        className: 'bg-[#05020a] border-2 border-purple-600 shadow-[inset_0_0_120px_rgba(168,85,247,0.9)] flex flex-col items-center justify-center overflow-hidden',
        content: (
          <div className="relative w-full h-full flex flex-col items-center justify-center gap-2">
            {/* Expanding purple black hole with electricity/lightning */}
            <svg viewBox="0 0 100 100" className="absolute w-24 h-24 animate-pulse">
              <defs>
                <radialGradient id="purpleCore" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="25%" stopColor="#d8b4fe" />
                  <stop offset="60%" stopColor="#a855f7" />
                  <stop offset="95%" stopColor="#581c87" />
                  <stop offset="100%" stopColor="transparent" />
                </radialGradient>
              </defs>
              <circle cx="50" cy="50" r="42" fill="url(#purpleCore)" className="animate-ping" style={{ animationDuration: '2.5s' }} />
              <circle cx="50" cy="50" r="28" fill="url(#purpleCore)" />
              {/* Lightning vectors */}
              <path d="M50 20 L48 40 L54 42 L50 80" stroke="#f3e8ff" strokeWidth="1" fill="none" opacity="0.8" />
              <path d="M25 50 L45 48 L48 54 L75 50" stroke="#f3e8ff" strokeWidth="1" fill="none" opacity="0.8" />
            </svg>
            <span className="text-lg font-black uppercase text-purple-300 tracking-widest [text-shadow:0_0_12px_rgba(168,85,247,0.95)] z-10 animate-bounce mt-24">
              🟣 HOLLOW PURPLE
            </span>
          </div>
        ),
        onEnter: () => playAnimSound('purple_release')
      },
      {
        duration: 160,
        className: 'bg-black text-white flex items-center justify-center',
        content: (
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            {/* High-Contrast Impact Frame (Inverted Gojo eye zoom) */}
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_45%,#fff_45%,#fff_55%,transparent_55%)] opacity-85"></div>
            <svg viewBox="0 0 100 100" className="absolute w-full h-full opacity-90">
              <path d="M10 50 Q50 25 90 50 Q50 75 10 50 Z" fill="none" stroke="#ffffff" strokeWidth="4" />
              <circle cx="50" cy="50" r="16" fill="#ffffff" />
              <circle cx="50" cy="50" r="8" fill="#000000" />
            </svg>
            <span className="text-3xl font-black italic tracking-tighter text-white z-10 scale-125 [text-shadow:3px_3px_0_#000]">
              IMPACT
            </span>
          </div>
        ),
        onEnter: () => playAnimSound('slash')
      },
      {
        duration: 160,
        className: 'bg-white text-black flex items-center justify-center',
        content: (
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            {/* Inverted secondary impact frame */}
            <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,#fff,#fff_2px,#000_2px,#000_4px)] opacity-35"></div>
            <span className="text-3xl font-black italic tracking-tighter text-black z-10 scale-110 [text-shadow:2px_2px_0_#fff]">
              CRITICAL BURST
            </span>
          </div>
        ),
        onEnter: () => playAnimSound('slash')
      },
      {
        duration: 350,
        className: 'bg-neutral-900/40 flex items-center justify-center',
        content: (
          <div className="flex flex-col items-center justify-center">
            {/* Dissolving smoke/dust block */}
            <div className="w-16 h-8 bg-white/20 rounded-full blur-md animate-pulse"></div>
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mt-1">
              🌫️ ERADICATING THE AREA...
            </span>
          </div>
        )
      }
    ],
    karamatsu_shinju: [
      {
        duration: 850,
        className: 'bg-black/95 flex flex-col items-center justify-center border-t-2 border-b-2 border-rose-950',
        content: (
          <div className="flex flex-col items-center justify-center gap-2 relative w-full h-full overflow-hidden">
            {/* Cherry Blossom SVG particles */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <path d="M20 30 Q25 20 30 30 Q25 40 20 30 Z" fill="#f43f5e" className="animate-spin" style={{ animationDuration: '4s' }} />
                <path d="M70 60 Q75 50 80 60 Q75 70 70 60 Z" fill="#f43f5e" className="animate-spin" style={{ animationDuration: '6s' }} />
              </svg>
            </div>
            <span className="text-rose-500 font-mono text-[13px] uppercase tracking-widest font-black [text-shadow:0_0_10px_rgba(244,63,94,0.7)] animate-pulse">
              🌸 BANKAI
            </span>
            <span className="text-gray-400 font-mono text-[8px] uppercase tracking-widest">
              Katen Kyōkotsu: Karamatsu Shinjū
            </span>
          </div>
        ),
        onEnter: () => playAnimSound('bankai_start')
      },
      {
        duration: 850,
        className: 'bg-[#0f0a12]/95 border-2 border-indigo-950 shadow-[inset_0_0_80px_rgba(49,46,129,0.75)] flex items-center justify-center',
        content: (
          <div className="relative w-full h-full flex flex-col items-center justify-center gap-1.5 overflow-hidden">
            {/* Fine Thread Crossings */}
            <div className="absolute inset-0 opacity-40">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <line x1="0" y1="10" x2="100" y2="90" stroke="#818cf8" strokeWidth="0.5" />
                <line x1="0" y1="80" x2="100" y2="20" stroke="#818cf8" strokeWidth="0.5" />
                <line x1="30" y1="0" x2="70" y2="100" stroke="#818cf8" strokeWidth="0.5" />
              </svg>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300 z-10 [text-shadow:0_0_8px_rgba(129,140,248,0.7)]">
              ACT I: The Sharing of Pain
            </span>
            <span className="text-[7px] text-gray-500 max-w-[85%] text-center italic font-mono z-10">
              "Wounds inflicted on your body will appear on mine."
            </span>
          </div>
        ),
        onEnter: () => playAnimSound('thread_tension')
      },
      {
        duration: 850,
        className: 'bg-black/95 flex items-center justify-center border-t-2 border-b-2 border-red-950',
        content: (
          <div className="relative w-full h-full flex flex-col items-center justify-center gap-1.5 overflow-hidden">
            {/* Bubbling spots */}
            <div className="absolute inset-0 opacity-30">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <circle cx="20" cy="30" r="4" fill="#ef4444" className="animate-ping" />
                <circle cx="80" cy="40" r="5" fill="#ef4444" className="animate-ping" style={{ animationDelay: '0.2s' }} />
                <circle cx="45" cy="75" r="3" fill="#ef4444" className="animate-ping" style={{ animationDelay: '0.4s' }} />
              </svg>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-red-500 z-10 [text-shadow:0_0_8px_rgba(239,68,68,0.7)]">
              ACT II: The Pillow of Shame
            </span>
            <span className="text-[7px] text-gray-500 max-w-[85%] text-center italic font-mono z-10">
              "A cruel disease path, causing you to bleed profusely."
            </span>
          </div>
        ),
        onEnter: () => playAnimSound('blast')
      },
      {
        duration: 1200,
        className: 'bg-sky-950/90 border-2 border-sky-800 shadow-[inset_0_0_100px_rgba(14,165,233,0.85)] flex flex-col items-center justify-center',
        content: (
          <div className="flex flex-col items-center justify-center gap-2 relative w-full h-full overflow-hidden">
            {/* Undulating water ripples */}
            <div className="absolute inset-0 opacity-25">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <ellipse cx="50" cy="50" rx="35" ry="10" fill="none" stroke="#38bdf8" strokeWidth="1" className="animate-pulse" />
                <ellipse cx="50" cy="50" rx="45" ry="15" fill="none" stroke="#38bdf8" strokeWidth="0.5" className="animate-pulse" />
              </svg>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-sky-300 z-10 [text-shadow:0_0_10px_rgba(56,189,248,0.8)]">
              ACT III: The Abyss of Water
            </span>
            <span className="text-[7px] text-sky-400 max-w-[85%] text-center italic font-mono z-10">
              "We drown together until one's spiritual pressure expires."
            </span>
          </div>
        ),
        onEnter: () => playAnimSound('water_gurgle')
      },
      {
        duration: 900,
        className: 'bg-black text-white flex items-center justify-center transition-all duration-300',
        content: (
          <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
            {/* White cutting thread flashing and then blood red flash */}
            <div className="absolute w-full h-0.5 bg-white shadow-[0_0_15px_#ffffff] scale-y-150 animate-pulse"></div>
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-500 z-10 [text-shadow:0_0_10px_rgba(244,63,94,0.8)] mt-6 animate-ping">
              ACT IV: Thread-Cut Throat-Bleed
            </span>
          </div>
        ),
        onEnter: () => playAnimSound('slash')
      },
      {
        duration: 400,
        className: 'bg-neutral-900/60 flex items-center justify-center',
        content: (
          <span className="text-[8px] font-mono uppercase tracking-widest text-rose-400/80 animate-pulse">
            🌸 Cherry blossoms dissolve...
          </span>
        )
      }
    ]
  };

  const activeTimeline = animationType ? animations[animationType] : null;

  useEffect(() => {
    if (!activeTimeline) {
      setFrameIndex(0);
      return;
    }

    setFrameIndex(0);
    
    // Trigger first frame sound if present
    if (activeTimeline[0]?.onEnter) {
      activeTimeline[0].onEnter();
    }

    const runTimeline = (idx: number) => {
      if (idx >= activeTimeline.length - 1) {
        // Timeline finished
        timerRef.current = setTimeout(() => {
          onComplete();
        }, activeTimeline[idx].duration);
      } else {
        timerRef.current = setTimeout(() => {
          setFrameIndex(idx + 1);
          if (activeTimeline[idx + 1]?.onEnter) {
            activeTimeline[idx + 1].onEnter();
          }
          runTimeline(idx + 1);
        }, activeTimeline[idx].duration);
      }
    };

    runTimeline(0);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [animationType]);

  if (!animationType || !activeTimeline) return null;

  const currentFrame = activeTimeline[frameIndex] || activeTimeline[0];

  return (
    <div className={`absolute inset-0 z-50 pointer-events-none transition-all duration-200 ${currentFrame.className}`}>
      {currentFrame.content}
    </div>
  );
};
