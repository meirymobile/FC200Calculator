/**
 * Screen Wake Lock API Manager
 * Keeps the mobile / tablet / computer display awake while the calculator is ON,
 * and releases the lock when the calculator is turned OFF or the page is hidden.
 */

let wakeLockSentinel: any = null;
let isRequested = false;

export async function requestWakeLock(): Promise<boolean> {
  isRequested = true;
  if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
    return false;
  }

  try {
    // Release existing sentinel before requesting a new one
    if (wakeLockSentinel && !wakeLockSentinel.released) {
      await wakeLockSentinel.release();
    }

    wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
    wakeLockSentinel.addEventListener('release', () => {
      wakeLockSentinel = null;
    });
    return true;
  } catch (err) {
    // Wake Lock can fail if low battery or tab in background
    return false;
  }
}

export async function releaseWakeLock(): Promise<void> {
  isRequested = false;
  if (wakeLockSentinel) {
    try {
      await wakeLockSentinel.release();
    } catch {
      // ignore
    }
    wakeLockSentinel = null;
  }
}

export function isWakeLockActive(): boolean {
  return wakeLockSentinel !== null && !wakeLockSentinel.released;
}

// Automatically re-acquire wake lock if user switches back to the tab while calculator is ON
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible' && isRequested) {
      await requestWakeLock();
    }
  });
}

