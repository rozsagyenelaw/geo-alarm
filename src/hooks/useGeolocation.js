import { useState, useEffect, useCallback, useRef } from 'react';

const PERMISSION_STATES = {
  UNKNOWN: 'unknown',
  GRANTED: 'granted',
  DENIED: 'denied',
  PROMPT: 'prompt'
};

const DEFAULT_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0
};

export function useGeolocation(options = {}) {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const [permissionState, setPermissionState] = useState(PERMISSION_STATES.UNKNOWN);
  const [isTracking, setIsTracking] = useState(false);

  const watchIdRef = useRef(null);
  const optionsRef = useRef({ ...DEFAULT_OPTIONS, ...options });

  // Check permission state
  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' })
        .then(result => {
          setPermissionState(result.state);
          result.addEventListener('change', () => {
            setPermissionState(result.state);
          });
        })
        .catch(() => {
          setPermissionState(PERMISSION_STATES.UNKNOWN);
        });
    }
  }, []);

  const handleSuccess = useCallback((pos) => {
    setPosition({
      lat: pos.coords.latitude,
      lon: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      altitude: pos.coords.altitude,
      altitudeAccuracy: pos.coords.altitudeAccuracy,
      heading: pos.coords.heading,
      speed: pos.coords.speed,
      timestamp: pos.timestamp
    });
    setError(null);
  }, []);

  const handleError = useCallback((err) => {
    setError({
      code: err.code,
      message: err.message,
      PERMISSION_DENIED: err.code === 1,
      POSITION_UNAVAILABLE: err.code === 2,
      TIMEOUT: err.code === 3
    });
  }, []);

  const startTracking = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setError({
        code: 0,
        message: 'Geolocation is not supported by this browser',
        PERMISSION_DENIED: false,
        POSITION_UNAVAILABLE: true,
        TIMEOUT: false
      });
      return;
    }

    if (watchIdRef.current !== null) {
      return; // Already tracking
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      optionsRef.current
    );

    setIsTracking(true);
  }, [handleSuccess, handleError]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setIsTracking(false);
    }
  }, []);

  const getCurrentPosition = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const position = {
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            altitude: pos.coords.altitude,
            altitudeAccuracy: pos.coords.altitudeAccuracy,
            heading: pos.coords.heading,
            speed: pos.coords.speed,
            timestamp: pos.timestamp
          };
          setPosition(position);
          resolve(position);
        },
        (err) => {
          handleError(err);
          reject(err);
        },
        optionsRef.current
      );
    });
  }, [handleError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    position,
    error,
    permissionState,
    isTracking,
    isSupported: 'geolocation' in navigator,
    startTracking,
    stopTracking,
    getCurrentPosition,
    PERMISSION_STATES
  };
}

export function useAdaptiveGeolocation(destination, options = {}) {
  const {
    position,
    error,
    permissionState,
    isTracking,
    isSupported,
    startTracking: baseStartTracking,
    stopTracking,
    getCurrentPosition,
    PERMISSION_STATES
  } = useGeolocation(options);

  const [pollingInterval, setPollingInterval] = useState(null);
  const intervalRef = useRef(null);

  const getOptimalInterval = useCallback((distance) => {
    if (distance > 5000) return 60000;  // >5km: every 60s
    if (distance > 1000) return 30000;  // 1-5km: every 30s
    if (distance > 500) return 10000;   // 500m-1km: every 10s
    return null; // <500m: continuous (use watchPosition)
  }, []);

  const startTracking = useCallback(() => {
    baseStartTracking();
  }, [baseStartTracking]);

  // Adjust polling based on distance to destination
  useEffect(() => {
    if (!destination || !position || !isTracking) {
      return;
    }

    const { calculateDistance } = require('../utils/distance');
    const distance = calculateDistance(
      position.lat, position.lon,
      destination.lat, destination.lon
    );

    const optimalInterval = getOptimalInterval(distance);
    setPollingInterval(optimalInterval);

    // For very close distances, we use continuous tracking (watchPosition handles this)
    // For farther distances, we could implement polling, but watchPosition is generally fine
  }, [position, destination, isTracking, getOptimalInterval]);

  return {
    position,
    error,
    permissionState,
    isTracking,
    isSupported,
    pollingInterval,
    startTracking,
    stopTracking,
    getCurrentPosition,
    PERMISSION_STATES
  };
}

export default useGeolocation;
