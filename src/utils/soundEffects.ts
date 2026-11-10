import { Haptics, ImpactStyle } from '@capacitor/haptics';

/**
 * Web Audio API synthesizer for tactile mechanical calculator key clicks
 * and ultra-responsive mobile haptic feedback
 */
let audioCtx: AudioContext | null = null;
let soundEnabled = true;
let hapticsEnabled = true;

export function toggleSound(): boolean {
  soundEnabled = !soundEnabled;
  return soundEnabled;
}

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

export function toggleHaptics(): boolean {
  hapticsEnabled = !hapticsEnabled;
  return hapticsEnabled;
}

export function isHapticsEnabled(): boolean {
  return hapticsEnabled;
}

/**
 * Trigger immediate short tactile vibration on mobile devices
 */
export async function triggerHaptic(type: 'num' | 'func' | 'solve' | 'del' = 'num') {
  if (!hapticsEnabled) return;

  // 1. Try Capacitor Native Haptics (for APK and iOS Native)
  try {
    if (type === 'solve') {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } else {
      await Haptics.impact({ style: ImpactStyle.Light });
    }
    return;
  } catch {
    // fallback to navigator.vibrate
  }

  // 2. Web Vibration API for Mobile Browsers (Chrome/Safari/Firefox mobile)
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      const ms = type === 'solve' ? 25 : 15;
      navigator.vibrate(ms);
    } catch {
      // ignore
    }
  }
}

export function playKeyClick(type: 'num' | 'func' | 'solve' | 'del' = 'num') {
  // Trigger short tactile vibration immediately
  triggerHaptic(type);

  if (!soundEnabled) return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    const now = audioCtx.currentTime;

    if (type === 'solve') {
      // Deeper confirmation click
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.05);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'del') {
      // Subtle lower click
      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.03);
    } else {
      // Standard tactile key click
      osc.type = 'sine';
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.025);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.025);
    }
  } catch {
    // ignore audio errors
  }
}
