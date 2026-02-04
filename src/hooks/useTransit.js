import { useState, useCallback } from 'react';

// This is a stub for transit API integration
// Full implementation would require specific transit API keys
// (e.g., Google Transit, GTFS feeds, local transit APIs)

export function useTransit() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [currentLine, setCurrentLine] = useState(null);
  const [stopsAway, setStopsAway] = useState(null);
  const [delay, setDelay] = useState(null);
  const [nextStops, setNextStops] = useState([]);

  // Check if transit data is available for current location
  const checkAvailability = useCallback(async (lat, lon) => {
    // Stub: In production, this would query transit APIs
    // to see if the user is on a transit route
    setIsAvailable(false);
    return false;
  }, []);

  // Get transit information for current position
  const getTransitInfo = useCallback(async (lat, lon) => {
    if (!isAvailable) {
      return null;
    }

    // Stub: Would return transit-specific data
    return {
      line: currentLine,
      stopsAway: stopsAway,
      delay: delay,
      nextStops: nextStops
    };
  }, [isAvailable, currentLine, stopsAway, delay, nextStops]);

  // Calculate stops until destination
  const getStopsToDestination = useCallback(async (destLat, destLon) => {
    if (!isAvailable) {
      return null;
    }

    // Stub: Would calculate number of stops
    return null;
  }, [isAvailable]);

  // Check for delays on current line
  const checkDelays = useCallback(async () => {
    if (!currentLine) {
      return null;
    }

    // Stub: Would check real-time delay info
    return null;
  }, [currentLine]);

  // Get nearby transit stops
  const getNearbyStops = useCallback(async (lat, lon, radiusMeters = 500) => {
    // Stub: Would query for nearby stops
    // Could use OpenStreetMap Overpass API for basic stop data
    return [];
  }, []);

  return {
    isAvailable,
    currentLine,
    stopsAway,
    delay,
    nextStops,
    checkAvailability,
    getTransitInfo,
    getStopsToDestination,
    checkDelays,
    getNearbyStops
  };
}

// Helper to format stops display
export function formatStopsAway(stops) {
  if (stops === null || stops === undefined) {
    return null;
  }
  if (stops === 0) {
    return 'Arriving';
  }
  if (stops === 1) {
    return '1 stop away';
  }
  return `${stops} stops away`;
}

// Helper to format delay display
export function formatDelay(delayMinutes) {
  if (delayMinutes === null || delayMinutes === undefined) {
    return null;
  }
  if (delayMinutes === 0) {
    return 'On time';
  }
  if (delayMinutes > 0) {
    return `${delayMinutes} min late`;
  }
  return `${Math.abs(delayMinutes)} min early`;
}

export default useTransit;
