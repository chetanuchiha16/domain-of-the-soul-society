// Web Audio API Procedural Sound Manager for Domain of the Soul Society
let audioCtx: AudioContext | null = null;
let bgmInterval: number | null = null;
let currentTheme: 'map' | 'combat' | 'boss' | null = null;
let stepCounter = 0;

const isBGMEnabled = (): boolean => {
  return localStorage.getItem('bgm_enabled') !== 'false';
};

const isSFXEnabled = (): boolean => {
  return localStorage.getItem('sfx_enabled') !== 'false';
};

const getAudioContext = (): AudioContext => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

// Play a single note with custom oscillator, volume, attack, and release
const playSynthNote = (
  freq: number,
  type: OscillatorType,
  volume: number,
  duration: number,
  attack = 0.1,
  decay = 0.2
) => {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    // Envelope
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + attack);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration - decay);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn("Audio note play failed:", e);
  }
};

export const SoundManager = {
  // Start dynamic background procedural track
  startBGM(theme: 'map' | 'combat' | 'boss') {
    if (!isBGMEnabled()) {
      this.stopBGM();
      return;
    }
    if (currentTheme === theme) return;
    this.stopBGM();
    currentTheme = theme;
    stepCounter = 0;

    const ctx = getAudioContext();

    if (theme === 'map') {
      // Calm, mystical ambient arpeggio (Minor pentatonic in A minor: A, C, D, E, G)
      const scale = [220.00, 261.63, 293.66, 329.63, 392.00, 440.00];
      const playStep = () => {
        // Drone chord roots
        if (stepCounter % 8 === 0) {
          // Soft A minor drone (A2 + E3)
          playSynthNote(110.00, 'sine', 0.015, 3.5, 0.8, 1.0);
          playSynthNote(164.81, 'sine', 0.01, 3.5, 1.0, 1.0);
        } else if (stepCounter % 8 === 4) {
          // Soft F major drone (F2 + C3)
          playSynthNote(87.31, 'sine', 0.015, 3.5, 0.8, 1.0);
          playSynthNote(130.81, 'sine', 0.01, 3.5, 1.0, 1.0);
        }

        // Random melody note
        if (Math.random() > 0.3) {
          const noteIndex = Math.floor(Math.random() * scale.length);
          const note = scale[noteIndex];
          // High octave soft bell note
          playSynthNote(note * 2, 'sine', 0.008, 1.8, 0.2, 0.5);
        }

        stepCounter++;
      };

      // Run map theme loop every 2.0 seconds
      bgmInterval = window.setInterval(playStep, 2000);
      playStep(); // Play immediately

    } else if (theme === 'combat') {
      // Faster, tense alternating tactical bassline (120 BPM -> 0.5s per step)
      const baseNote = 55.00; // A1
      const playStep = () => {
        // Alternating tense pattern
        let pitch = baseNote;
        if (stepCounter % 4 === 1) pitch = baseNote * 1.2; // C2 (approx)
        if (stepCounter % 4 === 2) pitch = baseNote * 1.5; // E2 (approx)
        if (stepCounter % 4 === 3) pitch = baseNote * 1.33; // D2 (approx)

        // Bass heartbeat pulse
        playSynthNote(pitch, 'triangle', 0.02, 0.4, 0.02, 0.1);

        // Occasional tense metallic click on offbeats
        if (stepCounter % 4 === 2 || stepCounter % 8 === 7) {
          playSynthNote(1200, 'sine', 0.002, 0.08, 0.01, 0.02);
        }

        stepCounter++;
      };

      bgmInterval = window.setInterval(playStep, 500);
      playStep();

    } else if (theme === 'boss') {
      // Apocalyptic boss theme (140 BPM -> 428ms steps)
      const roots = [55.00, 48.99, 41.20, 36.71]; // A1, G1, E1, D1
      const playStep = () => {
        const rootIndex = Math.floor(stepCounter / 8) % roots.length;
        const currentRoot = roots[rootIndex];

        // Double heartbeat pattern
        if (stepCounter % 4 === 0 || stepCounter % 4 === 1) {
          playSynthNote(currentRoot, 'sawtooth', 0.025, 0.3, 0.01, 0.1);
        }

        // Tense rising resonance sweep on root changes
        if (stepCounter % 8 === 0) {
          const sweepOsc = ctx.createOscillator();
          const sweepGain = ctx.createGain();

          sweepOsc.type = 'sawtooth';
          sweepOsc.frequency.setValueAtTime(currentRoot * 4, ctx.currentTime);
          sweepOsc.frequency.linearRampToValueAtTime(currentRoot * 12, ctx.currentTime + 3.0);

          sweepGain.gain.setValueAtTime(0, ctx.currentTime);
          sweepGain.gain.linearRampToValueAtTime(0.006, ctx.currentTime + 1.5);
          sweepGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 3.0);

          sweepOsc.connect(sweepGain);
          sweepGain.connect(ctx.destination);

          sweepOsc.start();
          sweepOsc.stop(ctx.currentTime + 3.0);
        }

        stepCounter++;
      };

      bgmInterval = window.setInterval(playStep, 428);
      playStep();
    }
  },

  // Stop dynamic background procedural track
  stopBGM() {
    if (bgmInterval !== null) {
      clearInterval(bgmInterval);
      bgmInterval = null;
    }
    currentTheme = null;
  },

  // Play general sound effects on demand
  playUI(type: 'click' | 'hover' | 'levelUp' | 'victory') {
    if (!isSFXEnabled()) return;
    try {
      const ctx = getAudioContext();
      if (type === 'click') {
        playSynthNote(600, 'sine', 0.02, 0.08, 0.01, 0.03);
      } else if (type === 'hover') {
        playSynthNote(400, 'sine', 0.01, 0.05, 0.01, 0.02);
      } else if (type === 'levelUp') {
        // Rising arpeggio
        const now = ctx.currentTime;
        const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
        notes.forEach((freq, idx) => {
          setTimeout(() => {
            playSynthNote(freq, 'triangle', 0.03, 0.4, 0.05, 0.1);
          }, idx * 120);
        });
      } else if (type === 'victory') {
        // Victorious fanfare
        const now = ctx.currentTime;
        const notes = [392.00, 392.00, 392.00, 523.25]; // G4, G4, G4, C5
        notes.forEach((freq, idx) => {
          setTimeout(() => {
            playSynthNote(freq, 'triangle', 0.025, 0.5, 0.05, 0.15);
          }, idx * 150);
        });
      }
    } catch (e) {
      console.warn("SoundManager playUI failed:", e);
    }
  }
};
