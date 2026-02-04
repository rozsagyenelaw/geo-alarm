import { useState, useEffect, useCallback, useRef } from 'react';

export function useBatteryOptimization() {
  const [batteryLevel, setBatteryLevel] = useState(null);
  const [isCharging, setIsCharging] = useState(null);
  const [lowPowerMode, setLowPowerMode] = useState(false);
  const [estimatedUsage, setEstimatedUsage] = useState(null);

  // Get battery status
  useEffect(() => {
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        setBatteryLevel(battery.level);
        setIsCharging(battery.charging);

        battery.addEventListener('levelchange', () => {
          setBatteryLevel(battery.level);
        });

        battery.addEventListener('chargingchange', () => {
          setIsCharging(battery.charging);
        });
      });
    }
  }, []);

  // Auto-enable low power mode at low battery
  useEffect(() => {
    if (batteryLevel !== null && batteryLevel < 0.2 && !isCharging) {
      setLowPowerMode(true);
    }
  }, [batteryLevel, isCharging]);

  const getPollingInterval = useCallback((distance, isLowPower = lowPowerMode) => {
    if (isLowPower) {
      // Low power mode: less frequent updates
      if (distance > 5000) return 120000;  // >5km: every 2 min
      if (distance > 1000) return 60000;   // 1-5km: every 1 min
      if (distance > 500) return 30000;    // 500m-1km: every 30s
      return 15000;                        // <500m: every 15s
    }

    // Normal mode
    if (distance > 5000) return 60000;   // >5km: every 60s
    if (distance > 1000) return 30000;   // 1-5km: every 30s
    if (distance > 500) return 10000;    // 500m-1km: every 10s
    return 5000;                         // <500m: every 5s
  }, [lowPowerMode]);

  const estimateBatteryUsage = useCallback((distanceKm, averageSpeedKmh) => {
    // Rough estimation based on tracking duration
    // GPS tracking uses roughly 5-10% battery per hour on most phones

    if (!averageSpeedKmh || averageSpeedKmh === 0) {
      return null;
    }

    const estimatedHours = distanceKm / averageSpeedKmh;
    const baseUsagePerHour = lowPowerMode ? 3 : 7; // percentage
    const estimatedUsagePercent = estimatedHours * baseUsagePerHour;

    setEstimatedUsage({
      percent: Math.round(estimatedUsagePercent),
      duration: estimatedHours,
      enoughBattery: batteryLevel === null ||
                     (batteryLevel * 100) > estimatedUsagePercent + 10
    });

    return estimatedUsage;
  }, [lowPowerMode, batteryLevel, estimatedUsage]);

  const toggleLowPowerMode = useCallback(() => {
    setLowPowerMode(prev => !prev);
  }, []);

  return {
    batteryLevel,
    isCharging,
    lowPowerMode,
    estimatedUsage,
    getPollingInterval,
    estimateBatteryUsage,
    toggleLowPowerMode,
    setLowPowerMode
  };
}

export function useWakeLock() {
  const wakeLockRef = useRef(null);
  const [isLocked, setIsLocked] = useState(false);

  const request = useCallback(async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        setIsLocked(true);

        wakeLockRef.current.addEventListener('release', () => {
          setIsLocked(false);
        });

        return true;
      } catch (e) {
        console.warn('Wake lock request failed:', e);
        return false;
      }
    }
    return false;
  }, []);

  const release = useCallback(() => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
      setIsLocked(false);
    }
  }, []);

  // Re-request wake lock when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isLocked) {
        request();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isLocked, request]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
      }
    };
  }, []);

  return {
    isLocked,
    request,
    release
  };
}

export default useBatteryOptimization;
