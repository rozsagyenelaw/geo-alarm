// Background Keep-Alive for PWA
// Prevents the browser from suspending JavaScript when the screen is off.
// Uses silent audio playback - mobile browsers keep audio processes alive
// even when the app is backgrounded or the screen is locked.

let audioContext = null;
let silentSource = null;
let silentGain = null;
let isActive = false;
let heartbeatInterval = null;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

// Create a silent audio buffer and loop it
function startSilentAudio() {
  try {
    const ctx = getAudioContext();

    // Resume if suspended (needed after user interaction)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // Create a short silent buffer (1 second)
    const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const channelData = buffer.getChannelData(0);
    // Fill with near-silence (true silence may be optimized away by some browsers)
    for (let i = 0; i < channelData.length; i++) {
      channelData[i] = (Math.random() - 0.5) * 0.00001;
    }

    // Create gain node set to near-zero so it's truly inaudible
    silentGain = ctx.createGain();
    silentGain.gain.setValueAtTime(0.001, ctx.currentTime);
    silentGain.connect(ctx.destination);

    // Create and start looping source
    silentSource = ctx.createBufferSource();
    silentSource.buffer = buffer;
    silentSource.loop = true;
    silentSource.connect(silentGain);
    silentSource.start();

    return true;
  } catch (e) {
    console.warn('Failed to start silent audio keep-alive:', e);
    return false;
  }
}

function stopSilentAudio() {
  try {
    if (silentSource) {
      silentSource.stop();
      silentSource.disconnect();
      silentSource = null;
    }
    if (silentGain) {
      silentGain.disconnect();
      silentGain = null;
    }
  } catch (e) {
    // Ignore cleanup errors
  }
}

// Heartbeat: periodically check if audio context is still running
// and restart if needed (some browsers may still suspend it)
function startHeartbeat(onTick) {
  heartbeatInterval = setInterval(() => {
    const ctx = audioContext;
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().then(() => {
        // Restart silent audio if it was stopped
        if (!silentSource) {
          startSilentAudio();
        }
      });
    }

    // Call the tick callback (used for fallback GPS polling)
    if (onTick) {
      onTick();
    }
  }, 10000); // Every 10 seconds
}

function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

/**
 * Start background keep-alive.
 * Call this when the alarm is armed to prevent the browser from sleeping.
 * @param {Function} onTick - Optional callback fired every ~10s (for fallback GPS polling)
 * @returns {boolean} Whether keep-alive was successfully started
 */
export function startBackgroundKeepAlive(onTick) {
  if (isActive) return true;

  const started = startSilentAudio();
  if (started) {
    startHeartbeat(onTick);
    isActive = true;

    // Handle visibility changes - re-ensure audio is running when app comes back
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }

  return started;
}

/**
 * Stop background keep-alive.
 * Call this when the alarm is disarmed or dismissed.
 */
export function stopBackgroundKeepAlive() {
  if (!isActive) return;

  stopSilentAudio();
  stopHeartbeat();
  isActive = false;
  document.removeEventListener('visibilitychange', handleVisibilityChange);
}

function handleVisibilityChange() {
  if (document.visibilityState === 'visible' && isActive) {
    // App came back to foreground - make sure everything is still running
    const ctx = audioContext;
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
    if (!silentSource) {
      startSilentAudio();
    }
  }
}

/**
 * Check if background keep-alive is currently active
 */
export function isBackgroundKeepAliveActive() {
  return isActive;
}
