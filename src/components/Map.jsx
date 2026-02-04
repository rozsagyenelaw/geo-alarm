import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { formatDistance, calculateBearing } from '../utils/distance';

// Custom marker icons
const createIcon = (color, size = 24) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};

const userIcon = L.divIcon({
  className: 'user-marker',
  html: `
    <div style="position: relative;">
      <div style="
        width: 20px;
        height: 20px;
        background: #3b82f6;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        position: relative;
        z-index: 2;
      "></div>
      <div class="location-marker-pulse" style="
        position: absolute;
        top: -5px;
        left: -5px;
        width: 30px;
        height: 30px;
        background: rgba(59, 130, 246, 0.3);
        border-radius: 50%;
        z-index: 1;
      "></div>
    </div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

const destinationIcon = L.divIcon({
  className: 'destination-marker',
  html: `
    <div style="position: relative;">
      <div style="
        width: 36px;
        height: 36px;
        background: #ef4444;
        border: 4px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 3px 10px rgba(0,0,0,0.4);
      "></div>
      <div style="
        position: absolute;
        top: 8px;
        left: 8px;
        width: 20px;
        height: 20px;
        background: white;
        border-radius: 50%;
        transform: rotate(-45deg);
      "></div>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 36]
});

// Component to handle map clicks
function MapClickHandler({ onLocationSelect, isSelecting }) {
  useMapEvents({
    click: (e) => {
      if (isSelecting) {
        onLocationSelect({
          lat: e.latlng.lat,
          lon: e.latlng.lng
        });
      }
    }
  });
  return null;
}

// Component to center map on position
function MapCenterController({ position, shouldCenter }) {
  const map = useMap();

  useEffect(() => {
    if (position && shouldCenter) {
      map.setView([position.lat, position.lon], map.getZoom());
    }
  }, [position, shouldCenter, map]);

  return null;
}

// Component to fit bounds to show both user and destination
function FitBoundsController({ userPosition, destination, trigger }) {
  const map = useMap();

  useEffect(() => {
    if (trigger && userPosition && destination) {
      const bounds = L.latLngBounds(
        [userPosition.lat, userPosition.lon],
        [destination.lat, destination.lon]
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [trigger, userPosition, destination, map]);

  return null;
}

// Component to center map on destination
function CenterOnDestination({ destination, trigger }) {
  const map = useMap();

  useEffect(() => {
    if (trigger && destination) {
      map.setView([destination.lat, destination.lon], 15);
    }
  }, [trigger, destination, map]);

  return null;
}

// Component to center map on user position
function CenterOnUser({ userPosition, trigger }) {
  const map = useMap();

  useEffect(() => {
    if (trigger && userPosition) {
      map.setView([userPosition.lat, userPosition.lon], 15);
    }
  }, [trigger, userPosition, map]);

  return null;
}

export default function Map({
  userPosition,
  destination,
  radius = 500,
  onLocationSelect,
  isSelecting = false,
  showDistance = true,
  centerOnUser = true,
  fitBounds = false
}) {
  const mapRef = useRef(null);
  const [bearing, setBearing] = useState(null);
  const [showBothLocations, setShowBothLocations] = useState(false);
  const [centerDestinationTrigger, setCenterDestinationTrigger] = useState(0);
  const [centerUserTrigger, setCenterUserTrigger] = useState(0);
  const [fitBoundsTrigger, setFitBoundsTrigger] = useState(0);
  const prevDestinationRef = useRef(null);

  // Center on destination when it changes
  useEffect(() => {
    if (destination && destination !== prevDestinationRef.current) {
      prevDestinationRef.current = destination;
      setShowBothLocations(false);
      setCenterDestinationTrigger(t => t + 1);
    }
  }, [destination]);

  // Calculate bearing to destination
  useEffect(() => {
    if (userPosition && destination) {
      const b = calculateBearing(
        userPosition.lat, userPosition.lon,
        destination.lat, destination.lon
      );
      setBearing(b);
    }
  }, [userPosition, destination]);

  const defaultCenter = userPosition
    ? [userPosition.lat, userPosition.lon]
    : [51.505, -0.09]; // London default

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={defaultCenter}
        zoom={15}
        className="w-full h-full rounded-xl"
        ref={mapRef}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler
          onLocationSelect={onLocationSelect}
          isSelecting={isSelecting}
        />

        {centerOnUser && !destination && (
          <MapCenterController
            position={userPosition}
            shouldCenter={!destination}
          />
        )}

        {/* Center on destination when selected */}
        <CenterOnDestination
          destination={destination}
          trigger={centerDestinationTrigger}
        />

        {/* Center on user when button pressed */}
        <CenterOnUser
          userPosition={userPosition}
          trigger={centerUserTrigger}
        />

        {/* Fit bounds when showing both */}
        <FitBoundsController
          userPosition={userPosition}
          destination={destination}
          trigger={fitBoundsTrigger}
        />

        {/* User location marker */}
        {userPosition && (
          <Marker
            position={[userPosition.lat, userPosition.lon]}
            icon={userIcon}
          />
        )}

        {/* Destination marker */}
        {destination && (
          <>
            <Marker
              position={[destination.lat, destination.lon]}
              icon={destinationIcon}
              draggable={isSelecting}
              eventHandlers={{
                dragend: (e) => {
                  const marker = e.target;
                  const position = marker.getLatLng();
                  onLocationSelect({
                    lat: position.lat,
                    lon: position.lng
                  });
                }
              }}
            />
            <Circle
              center={[destination.lat, destination.lon]}
              radius={radius}
              pathOptions={{
                color: '#ef4444',
                fillColor: '#ef4444',
                fillOpacity: 0.15,
                weight: 2
              }}
            />
          </>
        )}
      </MapContainer>

      {/* Direction indicator */}
      {userPosition && destination && bearing !== null && (
        <div className="absolute top-4 right-4 bg-dark-surface/90 backdrop-blur-sm rounded-lg p-3 flex items-center gap-2">
          <div
            className="w-6 h-6 bounce-arrow"
            style={{
              transform: `rotate(${bearing}deg)`
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </div>
          <span className="text-sm font-medium">
            {Math.round(bearing)}°
          </span>
        </div>
      )}

      {/* Map controls */}
      {userPosition && destination && (
        <div className="absolute bottom-4 left-4 flex flex-col gap-2">
          {/* Center on me button */}
          <button
            onClick={() => {
              setShowBothLocations(false);
              setCenterUserTrigger(t => t + 1);
            }}
            className="w-10 h-10 bg-dark-surface/90 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-lg border border-dark-border hover:border-primary transition-colors"
            title="Center on my location"
          >
            <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="currentColor" strokeWidth="2" fill="none" />
            </svg>
          </button>

          {/* Center on destination button */}
          <button
            onClick={() => {
              setShowBothLocations(false);
              setCenterDestinationTrigger(t => t + 1);
            }}
            className="w-10 h-10 bg-dark-surface/90 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-lg border border-dark-border hover:border-primary transition-colors"
            title="Center on destination"
          >
            <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
          </button>

          {/* Show both button */}
          <button
            onClick={() => {
              setShowBothLocations(true);
              setFitBoundsTrigger(t => t + 1);
            }}
            className="w-10 h-10 bg-dark-surface/90 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-lg border border-dark-border hover:border-primary transition-colors"
            title="Show both locations"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>
      )}

      {/* Selection hint */}
      {isSelecting && !destination && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-dark-surface/90 backdrop-blur-sm rounded-lg px-4 py-2 text-sm">
          Tap on the map to set destination
        </div>
      )}
    </div>
  );
}
