import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'geowake-trip';
const RECENT_KEY = 'geowake-recent-locations';
const SAVED_KEY = 'geowake-saved-locations';

const TripContext = createContext(null);

export function TripProvider({ children }) {
  const [destination, setDestination] = useState(null);
  const [stops, setStops] = useState([]); // For multi-stop trips
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [savedLocations, setSavedLocations] = useState([]);
  const [recentLocations, setRecentLocations] = useState([]);
  const [sharedWith, setSharedWith] = useState(null);

  // Load saved and recent locations on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVED_KEY);
      if (saved) {
        setSavedLocations(JSON.parse(saved));
      }

      const recent = localStorage.getItem(RECENT_KEY);
      if (recent) {
        setRecentLocations(JSON.parse(recent));
      }

      // Restore active trip if any
      const trip = localStorage.getItem(STORAGE_KEY);
      if (trip) {
        const parsed = JSON.parse(trip);
        if (parsed.isActive) {
          setDestination(parsed.destination);
          setStops(parsed.stops || []);
          setCurrentStopIndex(parsed.currentStopIndex || 0);
          setIsActive(true);
        }
      }
    } catch (e) {
      console.warn('Failed to load trip data:', e);
    }
  }, []);

  // Persist trip state
  useEffect(() => {
    if (isActive) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        destination,
        stops,
        currentStopIndex,
        isActive
      }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [destination, stops, currentStopIndex, isActive]);

  // Persist saved locations
  useEffect(() => {
    localStorage.setItem(SAVED_KEY, JSON.stringify(savedLocations));
  }, [savedLocations]);

  // Persist recent locations
  useEffect(() => {
    localStorage.setItem(RECENT_KEY, JSON.stringify(recentLocations));
  }, [recentLocations]);

  const setTripDestination = useCallback((dest) => {
    setDestination(dest);

    // Add to recent locations
    if (dest) {
      setRecentLocations(prev => {
        const filtered = prev.filter(
          l => l.lat !== dest.lat || l.lon !== dest.lon
        );
        return [dest, ...filtered].slice(0, 10);
      });
    }
  }, []);

  const startTrip = useCallback((dest) => {
    setTripDestination(dest);
    setIsActive(true);
    setCurrentStopIndex(0);
  }, [setTripDestination]);

  const endTrip = useCallback(() => {
    setIsActive(false);
    setDestination(null);
    setStops([]);
    setCurrentStopIndex(0);
    setSharedWith(null);
  }, []);

  // Multi-stop trip functions
  const addStop = useCallback((stop) => {
    setStops(prev => [...prev, {
      ...stop,
      id: Date.now(),
      type: 'wake', // 'wake' or 'remind'
      completed: false
    }]);
  }, []);

  const removeStop = useCallback((stopId) => {
    setStops(prev => prev.filter(s => s.id !== stopId));
  }, []);

  const reorderStops = useCallback((fromIndex, toIndex) => {
    setStops(prev => {
      const result = [...prev];
      const [removed] = result.splice(fromIndex, 1);
      result.splice(toIndex, 0, removed);
      return result;
    });
  }, []);

  const completeCurrentStop = useCallback(() => {
    setStops(prev => prev.map((stop, i) =>
      i === currentStopIndex ? { ...stop, completed: true } : stop
    ));

    if (currentStopIndex < stops.length - 1) {
      setCurrentStopIndex(prev => prev + 1);
      setDestination(stops[currentStopIndex + 1]);
    } else {
      endTrip();
    }
  }, [currentStopIndex, stops, endTrip]);

  const updateStopType = useCallback((stopId, type) => {
    setStops(prev => prev.map(stop =>
      stop.id === stopId ? { ...stop, type } : stop
    ));
  }, []);

  // Saved locations functions
  const saveLocation = useCallback((location) => {
    const newLocation = {
      ...location,
      id: Date.now(),
      createdAt: Date.now()
    };
    setSavedLocations(prev => [...prev, newLocation]);
    return newLocation;
  }, []);

  const updateSavedLocation = useCallback((id, updates) => {
    setSavedLocations(prev => prev.map(loc =>
      loc.id === id ? { ...loc, ...updates } : loc
    ));
  }, []);

  const deleteSavedLocation = useCallback((id) => {
    setSavedLocations(prev => prev.filter(loc => loc.id !== id));
  }, []);

  const clearRecentLocations = useCallback(() => {
    setRecentLocations([]);
  }, []);

  // Share trip
  const shareTrip = useCallback((contact) => {
    setSharedWith(contact);
    // In production, would send notification to contact
  }, []);

  const getCurrentStop = useCallback(() => {
    if (stops.length === 0) return destination;
    return stops[currentStopIndex];
  }, [stops, currentStopIndex, destination]);

  return (
    <TripContext.Provider
      value={{
        destination,
        stops,
        currentStopIndex,
        isActive,
        savedLocations,
        recentLocations,
        sharedWith,
        setTripDestination,
        startTrip,
        endTrip,
        addStop,
        removeStop,
        reorderStops,
        completeCurrentStop,
        updateStopType,
        saveLocation,
        updateSavedLocation,
        deleteSavedLocation,
        clearRecentLocations,
        shareTrip,
        getCurrentStop
      }}
    >
      {children}
    </TripContext.Provider>
  );
}

export function useTrip() {
  const context = useContext(TripContext);
  if (!context) {
    throw new Error('useTrip must be used within a TripProvider');
  }
  return context;
}

export default TripContext;
