import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'geowake-settings';

const DEFAULT_SETTINGS = {
  // Alarm settings
  defaultRadius: 500,
  defaultWakeMinutesBefore: 0,
  dismissDifficulty: 'easy', // easy, medium, hard
  soundType: 'loud', // soft, loud, gentle
  enableVibration: true,
  enableSound: true,
  enableEscalation: true,
  escalationDuration: 30,

  // Safety settings
  missedStopThreshold: 1000, // meters
  emergencyContact: null,
  shareTripsDefault: false,
  autoCheckIn: false,

  // Battery settings
  lowPowerMode: false,

  // Display settings
  darkMode: true,
  showETA: true,
  showSpeed: true,

  // Notification settings
  persistentNotification: true,

  // Onboarding
  onboardingComplete: false,
  hasLocationPermission: false,
  hasNotificationPermission: false
};

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings(prev => ({ ...prev, ...parsed }));
      }
    } catch (e) {
      console.warn('Failed to load settings:', e);
    }
    setIsLoaded(true);
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      } catch (e) {
        console.warn('Failed to save settings:', e);
      }
    }
  }, [settings, isLoaded]);

  const updateSettings = useCallback((updates) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const getSetting = useCallback((key) => {
    return settings[key];
  }, [settings]);

  const setSetting = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoaded,
        updateSettings,
        resetSettings,
        getSetting,
        setSetting
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

export default SettingsContext;
