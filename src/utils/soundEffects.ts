import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { SOUND_DATA } from './soundData';

export type KeySoundType = 'num' | 'func' | 'solve' | 'del';

let soundEnabled = true;
let hapticsEnabled = true;

// Load persisted settings from localStorage if available
try {
  if (typeof localStorage !== 'undefined') {
    const savedSound = localStorage.getItem('fc200v_sound_enabled');
    if (savedSound !== null) soundEnabled = savedSound === 'true';

    const savedHaptics = localStorage.getItem('fc200v_haptics_enabled');
    if (savedHaptics !== null) hapticsEnabled = savedHaptics === 'true';
  }
} catch {
  // ignore
}

export function toggleSound(): boolean {
  soundEnabled = !soundEnabled;
  try {
    localStorage.setItem('fc200v_sound_enabled', String(soundEnabled));
  } catch {
    // ignore
  }
  return soundEnabled;
}

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

export function toggleHaptics(): boolean {
  hapticsEnabled = !hapticsEnabled;
  try {
    localStorage.setItem('fc200v_haptics_enabled', String(hapticsEnabled));
  } catch {
    // ignore
  }
  return hapticsEnabled;
}

export function isHapticsEnabled(): boolean {
  return hapticsEnabled;
}

// ============================================================================
// 1. TACTILE HAPTIC FEEDBACK (Synchronous Web API + Native Capacitor Haptics)
// ============================================================================
export function triggerHaptic(type: KeySoundType = 'num') {
  if (!hapticsEnabled) return;

  // 1. Immediate Synchronous Web Vibration API for Mobile Browsers (Chrome / Firefox on Android)
  // MUST be called synchronously during the user event loop to prevent user activation expiry
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      if (type === 'solve') {
        navigator.vibrate([60, 40, 60]);
      } else if (type === 'del') {
        navigator.vibrate(50);
      } else {
        // 40ms pulse overcomes mobile motor inertia (Samsung, Pixel, Xiaomi, etc.)
        navigator.vibrate(40);
      }
    } catch {
      // ignore
    }
  }

  // 2. Native Capacitor Haptics (for Android APK & iOS Native App)
  if (Capacitor.isNativePlatform()) {
    try {
      if (type === 'solve') {
        Haptics.notification({ type: NotificationType.Success }).catch(() => {
          Haptics.vibrate({ duration: 80 }).catch(() => {});
        });
      } else {
        Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {
          Haptics.vibrate({ duration: 45 }).catch(() => {});
        });
      }
    } catch {
      // ignore
    }
  }
}

// ============================================================================
// 2. DUAL-ENGINE AUDIO SYSTEM (Web Audio API + HTML5 Audio Element Fallback)
// ============================================================================
let audioCtx: AudioContext | null = null;
const decodedBuffers: Record<string, AudioBuffer> = {};
const htmlAudioElements: Record<string, HTMLAudioElement> = {};
let audioInitialized = false;

// Convert base64 data URI to ArrayBuffer for Web Audio decoding
function dataUriToArrayBuffer(dataUri: string): ArrayBuffer {
  const base64 = dataUri.split(',')[1];
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Initialize audio context and pre-load both Web Audio buffers and HTML5 audio elements
export function initAudio() {
  if (typeof window === 'undefined') return;

  try {
    // 1. Initialize HTML5 Audio Elements (synchronous fallback)
    if (Object.keys(htmlAudioElements).length === 0) {
      for (const [key, uri] of Object.entries(SOUND_DATA)) {
        const audio = new Audio(uri);
        audio.preload = 'auto';
        audio.volume = 0.85;
        htmlAudioElements[key] = audio;
      }
    }

    // 2. Initialize Web Audio Context
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass && !audioCtx) {
      audioCtx = new AudioContextClass();
    }

    if (audioCtx) {
      if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }

      // Pre-decode audio buffers if not already decoded
      if (!audioInitialized) {
        audioInitialized = true;
        for (const [key, uri] of Object.entries(SOUND_DATA)) {
          const arrayBuffer = dataUriToArrayBuffer(uri);
          audioCtx.decodeAudioData(
            arrayBuffer.slice(0),
            (buffer) => {
              decodedBuffers[key] = buffer;
            },
            () => {}
          );
        }
      }
    }
  } catch {
    // ignore
  }
}

// Pre-unlock audio on very first user interaction anywhere on screen
if (typeof window !== 'undefined') {
  const unlockListener = () => {
    initAudio();
    window.removeEventListener('pointerdown', unlockListener);
    window.removeEventListener('touchstart', unlockListener);
    window.removeEventListener('click', unlockListener);
    window.removeEventListener('keydown', unlockListener);
  };
  window.addEventListener('pointerdown', unlockListener, { passive: true, once: true });
  window.addEventListener('touchstart', unlockListener, { passive: true, once: true });
  window.addEventListener('click', unlockListener, { passive: true, once: true });
  window.addEventListener('keydown', unlockListener, { passive: true, once: true });
}

// Play sound using Web Audio API buffer or HTML5 Audio fallback
export function playKeyClick(type: KeySoundType = 'num') {
  // Always trigger tactile vibration immediately
  triggerHaptic(type);

  if (!soundEnabled) return;

  try {
    // Ensure audio system is initialized
    initAudio();

    // Strategy A: Web Audio API (if active and buffer is ready)
    if (audioCtx && audioCtx.state === 'running' && decodedBuffers[type]) {
      const source = audioCtx.createBufferSource();
      source.buffer = decodedBuffers[type];
      const gainNode = audioCtx.createGain();
      gainNode.gain.setValueAtTime(0.85, audioCtx.currentTime);
      source.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      source.start(0);
      return;
    }

    // If context is suspended, request resume
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }

    // Strategy B: HTML5 Audio Element Fallback (plays reliably on any browser)
    const existingAudio = htmlAudioElements[type];
    if (existingAudio) {
      // Clone node to allow rapid overlapping clicks
      const clone = existingAudio.cloneNode() as HTMLAudioElement;
      clone.volume = 0.85;
      const playPromise = clone.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    } else if (SOUND_DATA[type]) {
      const audio = new Audio(SOUND_DATA[type]);
      audio.volume = 0.85;
      audio.play().catch(() => {});
    }
  } catch {
    // ignore audio errors
  }
}
