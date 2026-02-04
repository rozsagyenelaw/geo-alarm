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

const destinationIcon = createIcon('#ef4444', 28);

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
function FitBoundsController({ userPosition, destination }) {
  const map = useMap();

  useEffect(() => {
    if (userPosition && destination) {
      const bounds = L.latLngBounds(
        [userPosition.lat, userPosition.lon],
        [destination.lat, destination.lon]
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [userPosition, destination, map]);

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

        {centerOnUser && !fitBounds && (
          <MapCenterController
            position={userPosition}
            shouldCenter={!destination}
          />
        )}

        {fitBounds && (
          <FitBoundsController
            userPosition={userPosition}
            destination={destination}
          />
        )}

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

      {/* Selection hint */}
      {isSelecting && !destination && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-dark-surface/90 backdrop-blur-sm rounded-lg px-4 py-2 text-sm">
          Tap on the map to set destination
        </div>
      )}
    </div>
  );
}
