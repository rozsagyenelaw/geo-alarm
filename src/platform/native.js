// Native platform implementations (Capacitor stubs)
// Replace these with actual Capacitor plugin calls when converting to native app

/*
Required Capacitor plugins:
- @capacitor/geolocation
- @capacitor/local-notifications
- @capacitor/push-notifications
- @capacitor/haptics
- @capacitor/preferences
- @capacitor-community/flashlight (community plugin)
*/

// Vibration - would use @capacitor/haptics
export function vibrate(pattern) {
  // import { Haptics, ImpactStyle } from '@capacitor/haptics';
  // await Haptics.vibrate({ duration: pattern[0] });
  console.log('Native vibrate:', pattern);
}

export function stopVibration() {
  console.log('Native stop vibration');
}

// Audio - would use native audio APIs
export function playSound(type = 'alarm', volume = 1.0) {
  // Use native audio player for better reliability
  console.log('Native play sound:', type, volume);
  return {};
}

export function stopSound() {
  console.log('Native stop sound');
}

// Notifications - would use @capacitor/local-notifications
export async function showNotification(title, options = {}) {
  // import { LocalNotifications } from '@capacitor/local-notifications';
  // await LocalNotifications.schedule({
  //   notifications: [{
  //     title,
  //     body: options.body,
  //     id: Date.now(),
  //     ...options
  //   }]
  // });
  console.log('Native notification:', title, options);
  return null;
}

// Wake Lock - handled differently on native
export async function requestWakeLock() {
  // On native, use KeepAwake plugin or similar
  // import { KeepAwake } from '@capacitor-community/keep-awake';
  // await KeepAwake.keepAwake();
  console.log('Native wake lock request');
  return true;
}

export function releaseWakeLock() {
  // await KeepAwake.allowSleep();
  console.log('Native wake lock release');
}

// Flashlight - would use @capacitor-community/flashlight
export async function toggleFlashlight(on) {
  // import { Flashlight } from '@capacitor-community/flashlight';
  // if (on) {
  //   await Flashlight.switchOn();
  // } else {
  //   await Flashlight.switchOff();
  // }
  console.log('Native flashlight:', on);
  return true;
}

// Geolocation - would use @capacitor/geolocation
export async function getCurrentPosition(options = {}) {
  // import { Geolocation } from '@capacitor/geolocation';
  // const position = await Geolocation.getCurrentPosition(options);
  // return {
  //   lat: position.coords.latitude,
  //   lon: position.coords.longitude,
  //   accuracy: position.coords.accuracy,
  //   ...
  // };
  console.log('Native get position');
  return null;
}

export function watchPosition(callback, errorCallback, options = {}) {
  // const watchId = await Geolocation.watchPosition(options, (position, err) => {
  //   if (err) {
  //     errorCallback(err);
  //   } else {
  //     callback({...});
  //   }
  // });
  // return watchId;
  console.log('Native watch position');
  return 0;
}

export function clearWatch(watchId) {
  // await Geolocation.clearWatch({ id: watchId });
  console.log('Native clear watch:', watchId);
}

// Storage - would use @capacitor/preferences
export async function saveToStorage(key, value) {
  // import { Preferences } from '@capacitor/preferences';
  // await Preferences.set({ key, value: JSON.stringify(value) });
  console.log('Native save:', key);
  return true;
}

export async function loadFromStorage(key, defaultValue = null) {
  // const { value } = await Preferences.get({ key });
  // return value ? JSON.parse(value) : defaultValue;
  console.log('Native load:', key);
  return defaultValue;
}

export async function removeFromStorage(key) {
  // await Preferences.remove({ key });
  console.log('Native remove:', key);
  return true;
}
