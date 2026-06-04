import React, { useState, useEffect, useRef } from 'react';

export interface DialogueLine {
  speaker: string;
  avatar: 'aizen' | 'gojo' | 'shunsui' | 'narrator';
  text: string;
  speed?: number; // ms per character
}

interface DialogueBoxProps {
  lines: DialogueLine[];
  onComplete: () => void;
}

// Synthesize retro type-ticks using the Web Audio API (cross-browser)
let audioCtx: AudioContext | null = null;

const playTick = (type: 'aizen' | 'gojo' | 'shunsui' | 'narrator') => {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'aizen') {
      // Deep, resonating, slow spiritual pressure pulse
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, audioCtx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.025, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.12);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } else if (type === 'gojo') {
      // High-pitched, ultra-precise energy tick (Six Eyes)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1300, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.035);
      gain.gain.setValueAtTime(0.008, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.035);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.035);
    } else if (type === 'shunsui') {
      // Smooth, warm, wood-like hollow click
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(450, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.015, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.06);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.06);
    } else {
      // Standard narrative typewriter tick
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(650, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(220, audioCtx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.012, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.04);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.04);
    }
  } catch (err) {
    console.error("Web Audio Tick Failed:", err);
  }
};

// Render Avatar SVG based on speaker type
const AvatarSVG = ({ type }: { type: 'aizen' | 'gojo' | 'shunsui' | 'narrator' }) => {
  if (type === 'aizen') {
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <radialGradient id="aizenGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#4c1d95" />
            <stop offset="70%" stopColor="#1e1b4b" />
            <stop offset="100%" stopColor="#030712" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#aizenGrad)" stroke="#ec4899" strokeWidth="2" />
        {/* Abstract Aizen hair/silhouette */}
        <path d="M25 40 Q40 10 75 40 Q60 50 50 65 Q40 50 25 40 Z" fill="#451a03" opacity="0.9" />
        <path d="M48 30 Q50 35 52 30 Q54 45 46 45 Z" fill="#6b21a8" /> {/* Hyougoku purple eye sparkle */}
        <circle cx="50" cy="52" r="3" fill="#ffffff" />
        <rect x="38" y="48" width="24" height="2" fill="#d1d5db" opacity="0.7" /> {/* Eyeglasses wire */}
        {/* Spiritual pressure sparks */}
        <path d="M15 80 L25 70 M85 80 L75 70" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === 'gojo') {
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <radialGradient id="gojoGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#082f49" />
            <stop offset="65%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#020617" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#gojoGrad)" stroke="#06b6d4" strokeWidth="2" />
        {/* Infinite Void Domain sparks */}
        <circle cx="50" cy="50" r="38" fill="none" stroke="#22d3ee" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.3" />
        {/* White Hair */}
        <path d="M25 50 L30 30 L40 35 L50 22 L60 35 L70 30 L75 50 Q50 42 25 50 Z" fill="#f8fafc" />
        <path d="M30 45 L35 25 L45 32 L55 25 L65 30 L70 45" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
        {/* Blindfold */}
        <rect x="25" y="48" width="50" height="15" rx="3" fill="#0f172a" stroke="#1e293b" strokeWidth="1" />
        {/* Glowing Six Eyes peeking */}
        <path d="M46 56 Q50 51 54 56" stroke="#22d3ee" strokeWidth="2.5" fill="none" className="animate-pulse" />
        <circle cx="50" cy="56" r="1.5" fill="#e0f7fa" className="animate-pulse" />
      </svg>
    );
  }

  if (type === 'shunsui') {
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <radialGradient id="shunsuiGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f472b6" />
            <stop offset="70%" stopColor="#831843" />
            <stop offset="100%" stopColor="#090507" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#shunsuiGrad)" stroke="#f43f5e" strokeWidth="2" />
        {/* Shunsui Straw Hat */}
        <path d="M12 48 Q50 28 88 48 Q50 54 12 48 Z" fill="#d97706" stroke="#78350f" strokeWidth="1" />
        <path d="M20 48 Q50 38 80 48" stroke="#f59e0b" strokeWidth="1" />
        {/* Hair and eyepatch */}
        <path d="M35 52 L35 70 M65 52 L65 70" stroke="#451a03" strokeWidth="4" strokeLinecap="round" />
        <polygon points="42,50 48,58 40,58" fill="#18181b" /> {/* Eyepatch */}
        {/* Pink Flower details */}
        <circle cx="28" cy="72" r="3" fill="#f43f5e" />
        <circle cx="72" cy="72" r="3" fill="#f43f5e" />
      </svg>
    );
  }

  // Default: Narrator
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <radialGradient id="narratorGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#111827" />
          <stop offset="80%" stopColor="#030712" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#narratorGrad)" stroke="#14b8a6" strokeWidth="2" />
      {/* Tech Grid compass */}
      <circle cx="50" cy="50" r="30" fill="none" stroke="#0d9488" strokeWidth="1" strokeDasharray="5 5" />
      <path d="M50 15 L50 85 M15 50 L85 50" stroke="#0f766e" strokeWidth="0.5" />
      <polygon points="50,28 55,50 50,55 45,50" fill="#2fd1c5" opacity="0.8" />
      <polygon points="50,72 55,50 50,45 45,50" fill="#0d9488" opacity="0.8" />
    </svg>
  );
};

export const DialogueBox: React.FC<DialogueBoxProps> = ({ lines, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const currentLine = lines[currentIndex];
  
  const textRef = useRef('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Restart typewriter whenever the dialogue line index changes
  useEffect(() => {
    if (!currentLine) return;
    
    // Clear any active typing timer
    if (timerRef.current) clearInterval(timerRef.current);
    
    setDisplayedText('');
    textRef.current = '';
    setIsTyping(true);
    
    let charIdx = 0;
    const speed = currentLine.speed || 30; // 30ms standard speed
    
    timerRef.current = setInterval(() => {
      if (charIdx < currentLine.text.length) {
        const char = currentLine.text[charIdx];
        textRef.current += char;
        setDisplayedText(textRef.current);
        
        // Synchronized type-tick sound synthesis
        // Avoid play-spamming ticks on spaces
        if (char !== ' ') {
          playTick(currentLine.avatar);
        }
        
        charIdx++;
      } else {
        if (timerRef.current) clearInterval(timerRef.current);
        setIsTyping(false);
      }
    }, speed);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, currentLine]);

  // Skip or advance dialogue
  const handleInteraction = () => {
    if (isTyping) {
      // Instant autocomplete: show full text
      if (timerRef.current) clearInterval(timerRef.current);
      setDisplayedText(currentLine.text);
      setIsTyping(false);
    } else {
      // Go to next line or exit
      if (currentIndex < lines.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        onComplete();
      }
    }
  };

  // Space/Enter keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleInteraction();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTyping, currentIndex, lines]);

  if (!currentLine) return null;

  // Speaker name color themes
  const getSpeakerColor = (avatar: string) => {
    switch (avatar) {
      case 'aizen': return 'text-pink-400 [text-shadow:0_0_8px_rgba(244,114,182,0.6)]';
      case 'gojo': return 'text-cyan-400 [text-shadow:0_0_8px_rgba(34,211,238,0.6)]';
      case 'shunsui': return 'text-rose-400 [text-shadow:0_0_8px_rgba(251,113,133,0.6)]';
      default: return 'text-teal-400 [text-shadow:0_0_8px_rgba(20,184,166,0.6)]';
    }
  };

  // Box border glow theme
  const getBorderColor = (avatar: string) => {
    switch (avatar) {
      case 'aizen': return 'border-pink-500/50 shadow-[0_0_20px_rgba(236,72,153,0.15)]';
      case 'gojo': return 'border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.15)]';
      case 'shunsui': return 'border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.15)]';
      default: return 'border-teal-500/50 shadow-[0_0_20px_rgba(20,184,166,0.15)]';
    }
  };

  return (
    <div 
      className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-[92%] max-w-[850px] z-50 animate-slide-up cursor-pointer"
      onClick={handleInteraction}
    >
      <div className={`flex gap-5 bg-black/90 backdrop-blur-md border-2 rounded-xl p-5 ${getBorderColor(currentLine.avatar)} transition-all duration-300`}>
        {/* Avatar Portrait */}
        <div className="w-[80px] h-[80px] md:w-[100px] md:h-[100px] flex-shrink-0 bg-black/60 rounded-lg p-1 border border-white/10 flex items-center justify-center">
          <AvatarSVG type={currentLine.avatar} />
        </div>

        {/* Text Area */}
        <div className="flex-1 flex flex-col justify-between text-left">
          <div>
            {/* Speaker name */}
            <div className={`font-mono text-sm uppercase tracking-widest font-extrabold mb-1.5 ${getSpeakerColor(currentLine.avatar)}`}>
              {currentLine.speaker}
            </div>
            {/* Dialog contents */}
            <p className="font-mono text-sm md:text-base text-gray-200 leading-relaxed min-h-[50px] m-0">
              {displayedText}
              {isTyping && <span className="inline-block w-1.5 h-4 bg-white/70 ml-1 animate-pulse">|</span>}
            </p>
          </div>

          {/* Skip/Continue Helper Prompt */}
          <div className="flex justify-end mt-2">
            <span className="font-mono text-[9px] uppercase tracking-widest text-gray-500 animate-pulse">
              {isTyping ? 'Click / Space to autocomplete' : 'Click / Space to continue ▾'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
