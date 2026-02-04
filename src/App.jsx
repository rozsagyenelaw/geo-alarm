import { useState, useEffect, useCallback } from 'react';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { TripProvider, useTrip } from './context/TripContext';
import { useGeolocation } from './hooks/useGeolocation';
import { useAlarm } from './hooks/useAlarm';
import { useOfflineMode, formatCacheSize } from './hooks/useOfflineMode';
import { createSpeedTracker, calculateETA } from './utils/arrivalEstimate';
import { calculateDistance } from './utils/distance';

import Map from './components/Map';
import SearchBar from './components/SearchBar';
import DistanceDisplay from './components/DistanceDisplay';
import AlarmControls from './components/AlarmControls';
import AlarmModal from './components/AlarmModal';
import SavedLocations, { SaveLocationModal } from './components/SavedLocations';
import TripPlanner from './components/TripPlanner';
import ShareTrip from './components/ShareTrip';
import SmartWakeSettings from './components/SmartWakeSettings';
import SettingsPanel from './components/SettingsPanel';
import Onboarding from './components/Onboarding';

// Create a speed tracker instance
const speedTracker = createSpeedTracker();

function AppContent() {
  const { settings, isLoaded } = useSettings();
  const {
    destination,
    setTripDestination,
    savedLocations,
    saveLocation,
    startTrip,
    endTrip,
    isActive: isTripActive
  } = useTrip();

  const {
    position,
    error: geoError,
    isTracking,
    startTracking,
    stopTracking
  } = useGeolocation();

  const alarm = useAlarm({
    defaultRadius: settings.defaultRadius,
    dismissDifficulty: settings.dismissDifficulty,
    enableVibration: settings.enableVibration,
    enableSound: settings.enableSound,
    enableEscalation: settings.enableEscalation,
    soundType: settings.soundType
  });

  const { isOnline, cacheSize, clearTileCache, calculateCacheSize } = useOfflineMode();

  // UI state
  const [view, setView] = useState('map'); // map, locations, trip, share
  const [showSettings, setShowSettings] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [locationToSave, setLocationToSave] = useState(null);
  const [isSelecting, setIsSelecting] = useState(true);

  // Computed values
  const [eta, setEta] = useState(null);
  const [speed, setSpeed] = useState(0);

  // Check if onboarding is needed
  useEffect(() => {
    if (isLoaded && !settings.onboardingComplete) {
      setShowOnboarding(true);
    }
  }, [isLoaded, settings.onboardingComplete]);

  // Start location tracking immediately when app loads
  useEffect(() => {
    if (isLoaded && settings.onboardingComplete && !isTracking) {
      startTracking();
    }
  }, [isLoaded, settings.onboardingComplete, isTracking, startTracking]);

  // Also start tracking when alarm is armed
  useEffect(() => {
    if (alarm.isArmed && !isTracking) {
      startTracking();
    }
  }, [alarm.isArmed, isTracking, startTracking]);

  // Update speed tracker and check alarm
  useEffect(() => {
    if (position) {
      speedTracker.update(position.lat, position.lon, position.timestamp);
      const currentSpeed = position.speed || speedTracker.getCurrentSpeed();
      setSpeed(currentSpeed);

      // Calculate ETA
      if (destination && currentSpeed > 0.5) {
        const etaResult = calculateETA(
          position.lat, position.lon,
          destination.lat, destination.lon,
          currentSpeed
        );
        setEta(etaResult?.seconds || null);
      } else {
        setEta(null);
      }

      // Check alarm
      if (alarm.isArmed) {
        alarm.checkPosition(position.lat, position.lon, currentSpeed);
      }
    }
  }, [position, destination, alarm]);

  // Calculate distance
  const distance = position && destination
    ? calculateDistance(position.lat, position.lon, destination.lat, destination.lon)
    : null;

  // Handle location selection from map
  const handleLocationSelect = useCallback((location) => {
    console.log('App: handleLocationSelect called with:', location);
    setTripDestination(location);
    setIsSelecting(false);
  }, [setTripDestination]);

  // Handle location selection from saved/search
  const handleSavedLocationSelect = (location) => {
    setTripDestination(location);
    setView('map');
    setIsSelecting(false);
  };

  // Handle arm alarm
  const handleArmAlarm = useCallback(() => {
    if (destination) {
      alarm.arm(destination, {
        radius: alarm.radius,
        wakeMinutesBefore: alarm.wakeMinutesBefore
      });
      startTracking();
    }
  }, [destination, alarm, startTracking]);

  // Handle save location
  const handleSaveLocation = () => {
    if (destination) {
      setLocationToSave(destination);
      setShowSaveModal(true);
    }
  };

  // Handle clear destination
  const handleClearDestination = () => {
    if (alarm.isArmed) {
      alarm.disarm();
    }
    setTripDestination(null);
    setIsSelecting(true);
    endTrip();
  };

  // Calculate cache size on mount
  useEffect(() => {
    calculateCacheSize();
  }, [calculateCacheSize]);

  // Show onboarding
  if (showOnboarding) {
    return <Onboarding onComplete={() => setShowOnboarding(false)} />;
  }

  // Show settings
  if (showSettings) {
    return (
      <SettingsPanel
        onClose={() => setShowSettings(false)}
        cacheSize={cacheSize}
        onClearCache={clearTileCache}
      />
    );
  }

  return (
    <div className="h-screen flex flex-col bg-dark-bg">
      {/* Header */}
      <header className="flex-shrink-0 p-4 flex items-center justify-between border-b border-dark-border safe-area-top">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold">GeoWake</h1>
          {!isOnline && (
            <span className="px-2 py-1 bg-warning/20 text-warning text-xs rounded-full">
              Offline
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {alarm.isArmed && (
            <div className="flex items-center gap-2 px-3 py-1 bg-success/20 text-success rounded-full text-sm">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              Active
            </div>
          )}

          <button
            onClick={() => setShowSettings(true)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Map View */}
        {view === 'map' && (
          <>
            {/* Search bar */}
            <div className="p-4 pb-2 relative z-[9999]">
              <SearchBar
                onLocationSelect={handleLocationSelect}
                placeholder="Search destination..."
              />
            </div>

            {/* Map */}
            <div className="flex-1 px-4 pb-2 relative">
              <Map
                userPosition={position}
                destination={destination}
                radius={alarm.radius}
                onLocationSelect={handleLocationSelect}
                isSelecting={isSelecting}
                fitBounds={!!destination}
              />

              {/* Enable location button when no position */}
              {!position && !geoError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
                  <button
                    onClick={() => startTracking()}
                    className="px-6 py-4 bg-primary rounded-xl font-bold text-lg flex items-center gap-3"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Enable Location
                  </button>
                </div>
              )}
            </div>

            {/* Distance display when destination is set */}
            {destination && position && (
              <div className="px-4 pb-2">
                <DistanceDisplay
                  distance={distance}
                  eta={eta}
                  speed={speed}
                  isMoving={speed > 0.5}
                  showSpeed={settings.showSpeed}
                />
              </div>
            )}

            {/* Destination actions */}
            {destination && (
              <div className="px-4 pb-2 flex gap-2">
                <button
                  onClick={handleSaveLocation}
                  className="flex-1 py-2 bg-dark-surface border border-dark-border rounded-xl text-sm flex items-center justify-center gap-2 hover:border-primary transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  Save
                </button>
                <button
                  onClick={() => setView('share')}
                  className="flex-1 py-2 bg-dark-surface border border-dark-border rounded-xl text-sm flex items-center justify-center gap-2 hover:border-primary transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share
                </button>
                <button
                  onClick={handleClearDestination}
                  className="py-2 px-4 bg-dark-surface border border-dark-border rounded-xl text-sm hover:border-danger hover:text-danger transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* Smart wake settings */}
            {destination && (
              <div className="px-4 pb-2">
                <SmartWakeSettings
                  currentValue={alarm.wakeMinutesBefore}
                  currentSpeed={speed}
                  eta={eta}
                  onChange={alarm.setWakeMinutesBefore}
                  disabled={alarm.isArmed}
                />
              </div>
            )}

            {/* Alarm controls */}
            <div className="p-4 border-t border-dark-border safe-area-bottom">
              <AlarmControls
                radius={alarm.radius}
                wakeMinutesBefore={alarm.wakeMinutesBefore}
                isArmed={alarm.isArmed}
                destination={destination}
                onRadiusChange={alarm.setRadius}
                onWakeBeforeChange={alarm.setWakeMinutesBefore}
                onArm={handleArmAlarm}
                onDisarm={alarm.disarm}
              />
            </div>
          </>
        )}

        {/* Locations View */}
        {view === 'locations' && (
          <div className="flex-1 overflow-y-auto p-4">
            <SavedLocations
              onSelect={handleSavedLocationSelect}
              showRecent={true}
            />
          </div>
        )}

        {/* Trip Planner View */}
        {view === 'trip' && (
          <div className="flex-1 overflow-y-auto p-4">
            <TripPlanner
              userPosition={position}
              onClose={() => setView('map')}
            />
          </div>
        )}

        {/* Share Trip View */}
        {view === 'share' && (
          <div className="flex-1 overflow-y-auto p-4">
            <ShareTrip
              destination={destination}
              userPosition={position}
              onClose={() => setView('map')}
            />
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="flex-shrink-0 flex border-t border-dark-border safe-area-bottom">
        {[
          { id: 'map', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7', label: 'Map' },
          { id: 'locations', icon: 'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z', label: 'Saved' },
          { id: 'trip', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6', label: 'Trip' }
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`
              flex-1 py-3 flex flex-col items-center gap-1 transition-colors
              ${view === item.id ? 'text-primary' : 'text-gray-500 hover:text-gray-300'}
            `}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
            </svg>
            <span className="text-xs">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Alarm Modal */}
      <AlarmModal
        isOpen={alarm.isTriggered}
        destination={destination}
        distance={distance}
        difficulty={settings.dismissDifficulty}
        onSnooze={alarm.snooze}
        onDismiss={() => {
          alarm.dismiss();
          endTrip();
        }}
      />

      {/* Save Location Modal */}
      {showSaveModal && locationToSave && (
        <SaveLocationModal
          location={locationToSave}
          onSave={(loc) => {
            saveLocation(loc);
            setShowSaveModal(false);
            setLocationToSave(null);
          }}
          onClose={() => {
            setShowSaveModal(false);
            setLocationToSave(null);
          }}
        />
      )}

      {/* GPS Error */}
      {geoError && (
        <div className="fixed bottom-20 left-4 right-4 bg-danger/90 text-white p-4 rounded-xl z-40">
          <p className="font-medium">Location Error</p>
          <p className="text-sm opacity-80">
            {geoError.PERMISSION_DENIED && 'Location permission denied. Please enable in settings.'}
            {geoError.POSITION_UNAVAILABLE && 'Unable to determine your location.'}
            {geoError.TIMEOUT && 'Location request timed out.'}
          </p>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <TripProvider>
        <AppContent />
      </TripProvider>
    </SettingsProvider>
  );
}
