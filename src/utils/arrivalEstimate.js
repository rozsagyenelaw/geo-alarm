import { calculateDistance, calculateBearing } from './distance';

const SPEED_HISTORY_SIZE = 10;
const MIN_SPEED_THRESHOLD = 0.5; // m/s - below this we consider stationary

export function createSpeedTracker() {
  const speedHistory = [];
  let lastPosition = null;
  let lastTimestamp = null;

  return {
    update(lat, lon, timestamp) {
      if (lastPosition && lastTimestamp) {
        const distance = calculateDistance(
          lastPosition.lat, lastPosition.lon,
          lat, lon
        );
        const timeDiff = (timestamp - lastTimestamp) / 1000; // seconds

        if (timeDiff > 0) {
          const speed = distance / timeDiff; // m/s
          speedHistory.push(speed);

          if (speedHistory.length > SPEED_HISTORY_SIZE) {
            speedHistory.shift();
          }
        }
      }

      lastPosition = { lat, lon };
      lastTimestamp = timestamp;
    },

    getAverageSpeed() {
      if (speedHistory.length === 0) return 0;
      const sum = speedHistory.reduce((a, b) => a + b, 0);
      return sum / speedHistory.length;
    },

    getCurrentSpeed() {
      if (speedHistory.length === 0) return 0;
      return speedHistory[speedHistory.length - 1];
    },

    isMoving() {
      return this.getAverageSpeed() > MIN_SPEED_THRESHOLD;
    },

    reset() {
      speedHistory.length = 0;
      lastPosition = null;
      lastTimestamp = null;
    }
  };
}

export function calculateETA(currentLat, currentLon, destLat, destLon, speedMps) {
  if (speedMps <= MIN_SPEED_THRESHOLD) {
    return null; // Can't estimate if not moving
  }

  const distance = calculateDistance(currentLat, currentLon, destLat, destLon);
  const seconds = distance / speedMps;

  return {
    seconds,
    distance,
    arrivalTime: new Date(Date.now() + seconds * 1000)
  };
}

export function formatETA(seconds) {
  if (seconds === null || seconds === undefined) {
    return '--:--';
  }

  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}min`;
}

export function calculateWakeDistance(speedMps, wakeMinutesBefore) {
  const wakeSeconds = wakeMinutesBefore * 60;
  return speedMps * wakeSeconds;
}

export function shouldTriggerSmartWake(
  currentLat, currentLon,
  destLat, destLon,
  speedMps,
  wakeMinutesBefore
) {
  if (speedMps <= MIN_SPEED_THRESHOLD) {
    return false;
  }

  const eta = calculateETA(currentLat, currentLon, destLat, destLon, speedMps);
  if (!eta) return false;

  const minutesToArrival = eta.seconds / 60;
  return minutesToArrival <= wakeMinutesBefore;
}

export function isMovingTowardDestination(
  prevLat, prevLon,
  currentLat, currentLon,
  destLat, destLon
) {
  const prevDistance = calculateDistance(prevLat, prevLon, destLat, destLon);
  const currentDistance = calculateDistance(currentLat, currentLon, destLat, destLon);

  return currentDistance < prevDistance;
}

export function getDirectionIndicator(
  currentLat, currentLon,
  destLat, destLon,
  heading
) {
  const bearingToDest = calculateBearing(currentLat, currentLon, destLat, destLon);

  // Calculate the difference between heading and bearing to destination
  let diff = bearingToDest - (heading || 0);

  // Normalize to -180 to 180
  while (diff > 180) diff -= 360;
  while (diff < -180) diff += 360;

  return {
    bearing: bearingToDest,
    relativeBearing: diff,
    isTowardDestination: Math.abs(diff) < 90
  };
}
