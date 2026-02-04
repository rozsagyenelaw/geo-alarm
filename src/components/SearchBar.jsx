import { useState, useCallback, useRef, useEffect } from 'react';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

export default function SearchBar({ onLocationSelect, placeholder = 'Search address or place...' }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const justOpenedRef = useRef(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      // Skip if we just opened the dropdown
      if (justOpenedRef.current) {
        console.log('Skipping close - just opened');
        justOpenedRef.current = false;
        return;
      }
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        console.log('Click outside detected, closing dropdown');
        setIsOpen(false);
      }
    }

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const searchPlaces = useCallback(async (searchQuery) => {
    console.log('searchPlaces called with:', searchQuery);

    if (!searchQuery || searchQuery.length < 2) {
      console.log('Query too short, skipping');
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    console.log('Starting search...');

    try {
      // Using format=jsonv2 and no custom headers for better iOS compatibility
      const url = `${NOMINATIM_URL}?format=jsonv2&q=${encodeURIComponent(searchQuery)}&limit=5&addressdetails=1`;
      console.log('Fetching URL:', url);

      const response = await fetch(url);
      console.log('Response status:', response.status);

      if (!response.ok) throw new Error('Search failed with status: ' + response.status);

      const data = await response.json();
      console.log('Search results:', data);

      if (data.length === 0) {
        setResults([{ id: 'no-results', name: 'No results found. Try a different search or tap on the map.', noResult: true }]);
      } else {
        const mappedResults = data.map(item => ({
          id: item.place_id,
          name: item.display_name,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          type: item.type
        }));
        console.log('Setting results:', mappedResults);
        setResults(mappedResults);
      }

      console.log('Setting isOpen to true');
      justOpenedRef.current = true;
      setIsOpen(true);
    } catch (error) {
      console.error('Search error:', error);
      setResults([{ id: 'error', name: 'Search failed. Tap on the map to set destination.', noResult: true }]);
      setIsOpen(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
  };

  const handleSearch = () => {
    console.log('handleSearch called, query:', query, 'length:', query.length);
    if (query.length >= 2) {
      searchPlaces(query);
    } else {
      console.log('Query too short for search');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleSelect = (result) => {
    console.log('handleSelect called with:', result);
    const location = {
      lat: result.lat,
      lon: result.lon,
      name: result.name.split(',')[0]
    };
    console.log('Calling onLocationSelect with:', location);
    onLocationSelect(location);
    setQuery(result.name.split(',')[0]);
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => results.length > 0 && setIsOpen(true)}
            placeholder={placeholder}
            className="w-full bg-dark-surface border border-dark-border rounded-xl px-4 py-3 pl-10 pr-10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />

          {/* Search icon */}
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>

          {/* Loading spinner or clear button */}
          {isLoading ? (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : query && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Search button */}
        <button
          onClick={handleSearch}
          disabled={query.length < 2 || isLoading}
          className="px-4 bg-primary hover:bg-primary-dark disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>

      {/* Results dropdown */}
      {console.log('Render check - isOpen:', isOpen, 'results.length:', results.length)}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-dark-surface border border-dark-border rounded-xl overflow-hidden shadow-xl z-[9999]">
          {results.map((result) => (
            result.noResult ? (
              <div key={result.id} className="px-4 py-3 text-gray-400 text-center">
                {result.name}
              </div>
            ) : (
              <button
                key={result.id}
                onClick={() => handleSelect(result)}
                className="w-full px-4 py-3 text-left hover:bg-dark-border/50 transition-colors border-b border-dark-border last:border-b-0"
              >
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">
                      {result.name.split(',')[0]}
                    </p>
                    <p className="text-gray-400 text-sm truncate">
                      {result.name.split(',').slice(1).join(',')}
                    </p>
                  </div>
                </div>
              </button>
            )
          ))}
        </div>
      )}
    </div>
  );
}
