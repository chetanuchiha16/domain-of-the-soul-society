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
        duration: 800,
        className: 'bg-black/95 flex flex-col items-center justify-center border-t-2 border-b-2 border-sky-500/30',
        content: (
          <div className="flex flex-col items-center justify-center gap-4">
            <span className="text-cyan-400 font-mono text-[9px] uppercase tracking-widest animate-pulse">
              🟦 LAPSE: BLUE
            </span>
            <span className="text-red-500 font-mono text-[9px] uppercase tracking-widest animate-pulse [animation-delay:0.3s]">
              🟥 REVERSION: RED
            </span>
            <span className="text-[10px] text-gray-400 tracking-widest mt-2 uppercase">COMBINING SINGULARITIES...</span>
          </div>
        ),
        onEnter: () => playAnimSound('purple_charge')
      },
      {
        duration: 850,
        className: 'bg-white text-black flex items-center justify-center transition-all duration-300',
        content: (
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            {/* Speed lines */}
            <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_2px,#e2e8f0_2px,#e2e8f0_4px)] opacity-30"></div>
            <span className="text-2xl font-extrabold uppercase italic tracking-widest text-black z-10 [text-shadow:2px_2px_0_#94a3b8]">
              BANKAI expansion? NO...
            </span>
          </div>
        )
      },
      {
        duration: 1200,
        className: 'bg-purple-950/90 border-2 border-purple-500 shadow-[inset_0_0_100px_rgba(168,85,247,0.8)] flex flex-col items-center justify-center',
        content: (
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="w-24 h-24 rounded-full bg-purple-500 shadow-[0_0_50px_rgba(168,85,247,1)] border border-purple-300 animate-ping opacity-60"></div>
            <span className="text-xl font-black uppercase text-purple-400 tracking-widest [text-shadow:0_0_15px_rgba(168,85,247,0.8)]">
              🟣 HOLLOW PURPLE
            </span>
          </div>
        ),
        onEnter: () => playAnimSound('purple_release')
      },
      {
        duration: 400,
        className: 'bg-white flex items-center justify-center',
        content: (
          <span className="text-[12px] font-bold text-black uppercase tracking-widest">
            ERADICATING THE THREAT...
          </span>
        )
      }
    ],
    karamatsu_shinju: [
      {
        duration: 1000,
        className: 'bg-black/95 flex flex-col items-center justify-center',
        content: (
          <div className="flex flex-col items-center justify-center gap-2">
            <span className="text-rose-500 font-mono text-[12px] uppercase tracking-widest animate-pulse">
              🌸 BANKAI
            </span>
            <span className="text-gray-400 font-mono text-[9px] uppercase tracking-widest">
              Karamatsu Shinju
            </span>
          </div>
        ),
        onEnter: () => playAnimSound('bankai_start')
      },
      {
        duration: 1000,
        className: 'bg-indigo-950/90 border-2 border-indigo-950 shadow-[inset_0_0_60px_rgba(49,46,129,0.9)] flex items-center justify-center',
        content: (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Thread overlay */}
            <div className="absolute inset-0 opacity-20 bg-[linear-gradient(45deg,#312e81_1px,transparent_1px),linear-gradient(-45deg,#312e81_1px,transparent_1px)] bg-[size:10px_10px]"></div>
            <span className="text-[11px] font-black uppercase tracking-wider text-indigo-300 animate-bounce">
              ACT I: The Sharing of Pain
            </span>
          </div>
        )
      },
      {
        duration: 1200,
        className: 'bg-slate-950/95 flex flex-col items-center justify-center',
        content: (
          <div className="flex flex-col items-center justify-center gap-2">
            <span className="text-sky-400 font-mono text-[10px] uppercase tracking-widest animate-pulse">
              ACT III: The Abyss of Water
            </span>
            <span className="text-gray-500 text-[8px] max-w-[80%] text-center italic">
              "Those who drown here shall know only cold despair."
            </span>
          </div>
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
