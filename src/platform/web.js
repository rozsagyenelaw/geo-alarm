// Web platform implementations

let audioContext = null;
let currentOscillators = [];
let wakeLock = null;

// Vibration
export function vibrate(pattern) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

export function stopVibration() {
  if ('vibrate' in navigator) {
    navigator.vibrate(0);
  }
}

// Audio
export function playSound(type = 'alarm', volume = 1.0) {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();

  const configs = {
    alarm: { freq: 880, type: 'sawtooth' },
    notification: { freq: 800, type: 'sine' },
    gentle: { freq: 440, type: 'sine' }
  };

  const config = configs[type] || configs.alarm;

  osc.type = config.type;
  osc.frequency.setValueAtTime(config.freq, audioContext.currentTime);
  gain.gain.setValueAtTime(volume, audioContext.currentTime);

  osc.connect(gain);
  gain.connect(audioContext.destination);
  osc.start();

  currentOscillators.push({ osc, gain });

  return { osc, gain };
}

export function stopSound() {
  currentOscillators.forEach(({ osc, gain }) => {
    try {
      osc.stop();
      osc.disconnect();
      gain.disconnect();
    } catch (e) {}
  });
  currentOscillators = [];
}

// Notifications
export async function showNotification(title, options = {}) {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported');
    return null;
  }

  if (Notification.permission !== 'granted') {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return null;
    }
  }

  return new Notification(title, {
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    ...options
  });
}

// Wake Lock
export async function requestWakeLock() {
  if ('wakeLock' in navigator) {
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      return true;
    } catch (e) {
      console.warn('Wake lock failed:', e);
      return false;
    }
  }
  return false;
}

export function releaseWakeLock() {
  if (wakeLock) {
    wakeLock.release();
    wakeLock = null;
  }
}

// Flashlight (Torch API - limited support)
export async function toggleFlashlight(on) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }
    });

    const track = stream.getVideoTracks()[0];
    const capabilities = track.getCapabilities();

    if (capabilities.torch) {
      await track.applyConstraints({
        advanced: [{ torch: on }]
      });
      return true;
    }

    stream.getTracks().forEach(t => t.stop());
    return false;
  } catch (e) {
    console.warn('Flashlight not available:', e);
    return false;
  }
}

// Geolocation
export function getCurrentPosition(options = {}) {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp
        });
      },
      reject,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
        ...options
      }
    );
  });
}

export function watchPosition(callback, errorCallback, options = {}) {
  return navigator.geolocation.watchPosition(
    (position) => {
      callback({
        lat: position.coords.latitude,
        lon: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        heading: position.coords.heading,
        speed: position.coords.speed,
        timestamp: position.timestamp
      });
    },
    errorCallback,
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
      ...options
    }
  );
}

export function clearWatch(watchId) {
  navigator.geolocation.clearWatch(watchId);
}

// Storage
export function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.warn('Storage save failed:', e);
    return false;
  }
}

export function loadFromStorage(key, defaultValue = null) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : defaultValue;
  } catch (e) {
    console.warn('Storage load failed:', e);
    return defaultValue;
  }
}

export function removeFromStorage(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    return false;
  }
}
