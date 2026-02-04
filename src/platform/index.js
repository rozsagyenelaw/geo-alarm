// Platform abstraction layer
// Provides a unified interface for platform-specific functionality
// When converting to native app with Capacitor, replace web.js imports with native.js

import * as web from './web';

// Detect platform
export const isNative = typeof window !== 'undefined' &&
  window.Capacitor !== undefined;

export const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
export const isAndroid = /Android/.test(navigator.userAgent);
export const isMobile = isIOS || isAndroid;

// Export platform-specific implementations
// In native mode, these would come from native.js instead
export const {
  vibrate,
  stopVibration,
  playSound,
  stopSound,
  showNotification,
  requestWakeLock,
  releaseWakeLock,
  toggleFlashlight,
  getCurrentPosition,
  watchPosition,
  clearWatch,
  saveToStorage,
  loadFromStorage,
  removeFromStorage
} = web;

// Check feature availability
export function checkFeatureSupport() {
  return {
    geolocation: 'geolocation' in navigator,
    notifications: 'Notification' in window,
    vibration: 'vibrate' in navigator,
    wakeLock: 'wakeLock' in navigator,
    audioContext: 'AudioContext' in window || 'webkitAudioContext' in window,
    deviceMotion: 'DeviceMotionEvent' in window,
    share: 'share' in navigator,
    clipboard: 'clipboard' in navigator,
    serviceWorker: 'serviceWorker' in navigator,
    indexedDB: 'indexedDB' in window,
    localStorage: 'localStorage' in window
  };
}

// Check if running as PWA
export function isPWA() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true;
}

// Request all permissions
export async function requestAllPermissions() {
  const results = {
    geolocation: false,
    notifications: false,
    deviceMotion: false
  };

  // Geolocation
  try {
    await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });
    results.geolocation = true;
  } catch (e) {
    results.geolocation = false;
  }

  // Notifications
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    results.notifications = permission === 'granted';
  }

  // Device Motion (iOS 13+ requires permission)
  if (typeof DeviceMotionEvent !== 'undefined' &&
      typeof DeviceMotionEvent.requestPermission === 'function') {
    try {
      const permission = await DeviceMotionEvent.requestPermission();
      results.deviceMotion = permission === 'granted';
    } catch (e) {
      results.deviceMotion = false;
    }
  } else {
    results.deviceMotion = 'DeviceMotionEvent' in window;
  }

  return results;
}
