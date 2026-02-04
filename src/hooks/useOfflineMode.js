import { useState, useEffect, useCallback } from 'react';
import { openDB } from 'idb';

const DB_NAME = 'geowake-offline';
const DB_VERSION = 1;

const STORES = {
  TILES: 'map-tiles',
  LOCATIONS: 'saved-locations',
  SETTINGS: 'settings',
  TRIPS: 'trips'
};

async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Map tiles store
      if (!db.objectStoreNames.contains(STORES.TILES)) {
        db.createObjectStore(STORES.TILES);
      }

      // Saved locations store
      if (!db.objectStoreNames.contains(STORES.LOCATIONS)) {
        const locationsStore = db.createObjectStore(STORES.LOCATIONS, {
          keyPath: 'id',
          autoIncrement: true
        });
        locationsStore.createIndex('name', 'name');
      }

      // Settings store
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS);
      }

      // Trips store
      if (!db.objectStoreNames.contains(STORES.TRIPS)) {
        const tripsStore = db.createObjectStore(STORES.TRIPS, {
          keyPath: 'id',
          autoIncrement: true
        });
        tripsStore.createIndex('createdAt', 'createdAt');
      }
    }
  });
}

export function useOfflineMode() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [db, setDb] = useState(null);
  const [cacheSize, setCacheSize] = useState(0);

  // Initialize database
  useEffect(() => {
    initDB().then(database => {
      setDb(database);
    });
  }, []);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Cache a map tile
  const cacheTile = useCallback(async (url, blob) => {
    if (!db) return;
    await db.put(STORES.TILES, blob, url);
  }, [db]);

  // Get cached tile
  const getCachedTile = useCallback(async (url) => {
    if (!db) return null;
    return db.get(STORES.TILES, url);
  }, [db]);

  // Clear tile cache
  const clearTileCache = useCallback(async () => {
    if (!db) return;
    await db.clear(STORES.TILES);
    setCacheSize(0);
  }, [db]);

  // Calculate cache size
  const calculateCacheSize = useCallback(async () => {
    if (!db) return 0;

    const tx = db.transaction(STORES.TILES, 'readonly');
    const store = tx.objectStore(STORES.TILES);
    const keys = await store.getAllKeys();

    let totalSize = 0;
    for (const key of keys) {
      const blob = await store.get(key);
      if (blob) {
        totalSize += blob.size;
      }
    }

    setCacheSize(totalSize);
    return totalSize;
  }, [db]);

  // Save location
  const saveLocation = useCallback(async (location) => {
    if (!db) return;
    return db.add(STORES.LOCATIONS, {
      ...location,
      createdAt: Date.now()
    });
  }, [db]);

  // Get all saved locations
  const getSavedLocations = useCallback(async () => {
    if (!db) return [];
    return db.getAll(STORES.LOCATIONS);
  }, [db]);

  // Delete saved location
  const deleteLocation = useCallback(async (id) => {
    if (!db) return;
    return db.delete(STORES.LOCATIONS, id);
  }, [db]);

  // Update saved location
  const updateLocation = useCallback(async (id, updates) => {
    if (!db) return;
    const location = await db.get(STORES.LOCATIONS, id);
    if (location) {
      return db.put(STORES.LOCATIONS, { ...location, ...updates });
    }
  }, [db]);

  // Save setting
  const saveSetting = useCallback(async (key, value) => {
    if (!db) return;
    return db.put(STORES.SETTINGS, value, key);
  }, [db]);

  // Get setting
  const getSetting = useCallback(async (key, defaultValue = null) => {
    if (!db) return defaultValue;
    const value = await db.get(STORES.SETTINGS, key);
    return value !== undefined ? value : defaultValue;
  }, [db]);

  // Save trip
  const saveTrip = useCallback(async (trip) => {
    if (!db) return;
    return db.add(STORES.TRIPS, {
      ...trip,
      createdAt: Date.now()
    });
  }, [db]);

  // Get recent trips
  const getRecentTrips = useCallback(async (limit = 10) => {
    if (!db) return [];
    const trips = await db.getAllFromIndex(
      STORES.TRIPS,
      'createdAt'
    );
    return trips.slice(-limit).reverse();
  }, [db]);

  return {
    isOnline,
    cacheSize,
    cacheTile,
    getCachedTile,
    clearTileCache,
    calculateCacheSize,
    saveLocation,
    getSavedLocations,
    deleteLocation,
    updateLocation,
    saveSetting,
    getSetting,
    saveTrip,
    getRecentTrips
  };
}

export function formatCacheSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default useOfflineMode;
