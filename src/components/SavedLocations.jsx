import { useState } from 'react';
import { useTrip } from '../context/TripContext';

const LOCATION_ICONS = [
  { id: 'home', emoji: '🏠', label: 'Home' },
  { id: 'work', emoji: '💼', label: 'Work' },
  { id: 'gym', emoji: '💪', label: 'Gym' },
  { id: 'school', emoji: '🎓', label: 'School' },
  { id: 'store', emoji: '🛒', label: 'Store' },
  { id: 'restaurant', emoji: '🍽️', label: 'Restaurant' },
  { id: 'hospital', emoji: '🏥', label: 'Hospital' },
  { id: 'train', emoji: '🚉', label: 'Station' },
  { id: 'airport', emoji: '✈️', label: 'Airport' },
  { id: 'star', emoji: '⭐', label: 'Favorite' }
];

export default function SavedLocations({
  onSelect,
  showRecent = true,
  compact = false
}) {
  const {
    savedLocations,
    recentLocations,
    saveLocation,
    deleteSavedLocation,
    updateSavedLocation,
    clearRecentLocations
  } = useTrip();

  const [isEditing, setIsEditing] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('star');

  const handleSaveEdit = () => {
    if (editingLocation && newName.trim()) {
      updateSavedLocation(editingLocation.id, {
        name: newName.trim(),
        icon: newIcon
      });
      setEditingLocation(null);
      setNewName('');
      setNewIcon('star');
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this saved location?')) {
      deleteSavedLocation(id);
    }
  };

  const startEdit = (location) => {
    setEditingLocation(location);
    setNewName(location.name || '');
    setNewIcon(location.icon || 'star');
  };

  const getIconEmoji = (iconId) => {
    const icon = LOCATION_ICONS.find(i => i.id === iconId);
    return icon ? icon.emoji : '📍';
  };

  if (compact) {
    return (
      <div className="space-y-2">
        {/* Quick access buttons for top 3 saved locations */}
        {savedLocations.slice(0, 3).map(location => (
          <button
            key={location.id}
            onClick={() => onSelect(location)}
            className="w-full flex items-center gap-3 p-3 bg-dark-surface rounded-xl hover:bg-dark-border/50 transition-colors"
          >
            <span className="text-2xl">{getIconEmoji(location.icon)}</span>
            <span className="font-medium truncate">{location.name}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Saved Locations */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Saved Places</h3>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-sm text-primary hover:text-primary-dark"
          >
            {isEditing ? 'Done' : 'Edit'}
          </button>
        </div>

        {savedLocations.length === 0 ? (
          <p className="text-gray-400 text-sm py-4 text-center">
            No saved locations yet
          </p>
        ) : (
          <div className="space-y-2">
            {savedLocations.map(location => (
              <div
                key={location.id}
                className="flex items-center gap-3 p-3 bg-dark-surface rounded-xl"
              >
                {isEditing ? (
                  <>
                    <span className="text-2xl">{getIconEmoji(location.icon)}</span>
                    <span className="flex-1 truncate">{location.name}</span>
                    <button
                      onClick={() => startEdit(location)}
                      className="p-2 text-gray-400 hover:text-white"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(location.id)}
                      className="p-2 text-danger hover:text-danger/80"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => onSelect(location)}
                    className="flex-1 flex items-center gap-3 text-left"
                  >
                    <span className="text-2xl">{getIconEmoji(location.icon)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{location.name}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {location.lat.toFixed(4)}, {location.lon.toFixed(4)}
                      </p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Locations */}
      {showRecent && recentLocations.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Recent</h3>
            <button
              onClick={clearRecentLocations}
              className="text-sm text-gray-400 hover:text-white"
            >
              Clear
            </button>
          </div>

          <div className="space-y-2">
            {recentLocations.slice(0, 5).map((location, index) => (
              <button
                key={index}
                onClick={() => onSelect(location)}
                className="w-full flex items-center gap-3 p-3 bg-dark-surface/50 rounded-xl hover:bg-dark-surface transition-colors"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="flex-1 truncate text-left">
                  {location.name || `${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}`}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingLocation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-surface rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4">Edit Location</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Location name"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Icon</label>
                <div className="grid grid-cols-5 gap-2">
                  {LOCATION_ICONS.map(icon => (
                    <button
                      key={icon.id}
                      onClick={() => setNewIcon(icon.id)}
                      className={`
                        p-3 rounded-lg text-2xl transition-colors
                        ${newIcon === icon.id
                          ? 'bg-primary'
                          : 'bg-dark-bg hover:bg-dark-border'
                        }
                      `}
                    >
                      {icon.emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingLocation(null)}
                className="flex-1 py-3 bg-dark-bg rounded-xl font-medium hover:bg-dark-border transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 py-3 bg-primary rounded-xl font-medium hover:bg-primary-dark transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Component for saving a new location
export function SaveLocationModal({ location, onSave, onClose }) {
  const [name, setName] = useState(location?.name || '');
  const [icon, setIcon] = useState('star');

  const handleSave = () => {
    if (name.trim()) {
      onSave({
        ...location,
        name: name.trim(),
        icon
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-surface rounded-xl p-6 w-full max-w-sm">
        <h3 className="text-lg font-semibold mb-4">Save Location</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g., Home, Work, Gym"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Icon</label>
            <div className="grid grid-cols-5 gap-2">
              {LOCATION_ICONS.map(i => (
                <button
                  key={i.id}
                  onClick={() => setIcon(i.id)}
                  className={`
                    p-3 rounded-lg text-2xl transition-colors
                    ${icon === i.id
                      ? 'bg-primary'
                      : 'bg-dark-bg hover:bg-dark-border'
                    }
                  `}
                  title={i.label}
                >
                  {i.emoji}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-dark-bg rounded-xl font-medium hover:bg-dark-border transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="flex-1 py-3 bg-primary rounded-xl font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
