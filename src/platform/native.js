// Native platform implementations (Capacitor)
// Only imported when running inside Capacitor (lazy-loaded from index.js)

import { BackgroundGeolocation } from '@capgo/background-geolocation';
import { Haptics } from '@capacitor/haptics';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Preferences } from '@capacitor/preferences';

// Background Geolocation
export async function startBackgroundGeolocation(callback, errorCallback, options = {}) {
  await BackgroundGeolocation.start(
    {
      backgroundTitle: options.backgroundTitle || 'GeoWake Active',
      backgroundMessage: options.backgroundMessage || 'Tracking your location for alarm',
      requestPermissions: true,
      stale: false,
      distanceFilter: options.distanceFilter ?? 10,
    },
    (location, error) => {
      if (error) {
        errorCallback?.({
          code: error.code || 'UNKNOWN',
          message: error.message || 'Background location error',
        });
        return;
      }
      if (location) {
        callback({
          lat: location.latitude,
          lon: location.longitude,
          accuracy: location.accuracy,
          altitude: location.altitude,
          altitudeAccuracy: location.altitudeAccuracy,
          heading: location.bearing,
          speed: location.speed,
          timestamp: location.time || Date.now(),
        });
      }
    }
  );
}

export async function stopBackgroundGeolocation() {
  await BackgroundGeolocation.stop();
}

// Vibration
export async function vibrate(pattern) {
  try {
    for (let i = 0; i < pattern.length; i++) {
      if (i % 2 === 0) {
        await Haptics.vibrate({ duration: pattern[i] });
      } else {
        await new Promise(r => setTimeout(r, pattern[i]));
      }
    }
  } catch (e) {
    // Fall back to web vibration
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }
}

export function stopVibration() {
  if ('vibrate' in navigator) {
    navigator.vibrate(0);
  }
}

// Notifications
export async function showNotification(title, options = {}) {
  try {
    const perms = await LocalNotifications.requestPermissions();
    if (perms.display !== 'granted') return null;

    await LocalNotifications.schedule({
      notifications: [{
        title,
        body: options.body || '',
        id: options.id || Date.now(),
        sound: options.sound || undefined,
        smallIcon: options.smallIcon || undefined,
      }]
    });
    return true;
  } catch (e) {
    console.warn('Native notification failed:', e);
    return null;
  }
}

// Storage
export async function saveToStorage(key, value) {
  try {
    await Preferences.set({ key, value: JSON.stringify(value) });
    return true;
  } catch (e) {
    console.warn('Native storage save failed:', e);
    return false;
  }
}

export async function loadFromStorage(key, defaultValue = null) {
  try {
    const { value } = await Preferences.get({ key });
    return value ? JSON.parse(value) : defaultValue;
  } catch (e) {
    console.warn('Native storage load failed:', e);
    return defaultValue;
  }
}

export async function removeFromStorage(key) {
  try {
    await Preferences.remove({ key });
    return true;
  } catch (e) {
    return false;
  }
}
