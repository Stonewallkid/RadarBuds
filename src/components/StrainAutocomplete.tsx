'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { StrainSearchResult } from '@/lib/cannabis-api';

interface StrainAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (strain: StrainSearchResult) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

export default function StrainAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Search strains...',
  autoFocus = false,
  className = '',
}: StrainAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<StrainSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch suggestions
  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/strains/search?q=${encodeURIComponent(query)}&limit=8`);
      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        setSuggestions(data.data);
        setIsOpen(data.data.length > 0);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value, fetchSuggestions]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (strain: StrainSearchResult) => {
    onChange(strain.name);
    setIsOpen(false);
    setHighlightedIndex(-1);
    if (onSelect) {
      onSelect(strain);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSelect(suggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const getStrainTypeColor = (type?: string) => {
    switch (type) {
      case 'Indica':
        return 'bg-purple-600';
      case 'Indica-Dominant':
        return 'bg-purple-500';
      case 'Balanced Hybrid':
        return 'bg-green-600';
      case 'Sativa-Dominant':
        return 'bg-orange-500';
      case 'Sativa':
        return 'bg-orange-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => value.length >= 2 && suggestions.length > 0 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={`w-full px-4 py-3 pr-10 border border-[#333] rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent text-white bg-[#252525] placeholder-gray-500 ${className}`}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Suggestions dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-xl max-h-80 overflow-y-auto">
          {suggestions.map((strain, index) => (
            <button
              key={strain.id}
              onClick={() => handleSelect(strain)}
              className={`w-full px-4 py-3 text-left transition-colors flex items-start gap-3 ${
                index === highlightedIndex
                  ? 'bg-[#333]'
                  : 'hover:bg-[#252525]'
              } ${index === 0 ? 'rounded-t-lg' : ''} ${
                index === suggestions.length - 1 ? 'rounded-b-lg' : ''
              }`}
            >
              {/* Strain image or placeholder */}
              {strain.imageUrl ? (
                <img
                  src={strain.imageUrl}
                  alt={strain.name}
                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-[#333] flex items-center justify-center flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-gray-500">
                    <path
                      d="M12 2C12 2 9 6 9 9C9 10.5 9.5 11.5 10 12C8.5 11.5 6 11 4 12C4 12 6 14 9 14C7 15.5 5 18 5 18C5 18 8 17 10 15.5C10 17 10 20 12 22C14 20 14 17 14 15.5C16 17 19 18 19 18C19 18 17 15.5 15 14C18 14 20 12 20 12C18 11 15.5 11.5 14 12C14.5 11.5 15 10.5 15 9C15 6 12 2 12 2Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium truncate">{strain.name}</span>
                  {strain.strainType && (
                    <span className={`px-1.5 py-0.5 rounded text-xs text-white ${getStrainTypeColor(strain.strainType)}`}>
                      {strain.strainType.replace('-', ' ')}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-0.5">
                  {strain.thcPercent !== undefined && (
                    <span className="text-xs text-gray-400">
                      {strain.thcPercent.toFixed(1)}% THC
                    </span>
                  )}
                  {strain.cbdPercent !== undefined && strain.cbdPercent > 0.1 && (
                    <span className="text-xs text-gray-400">
                      {strain.cbdPercent.toFixed(1)}% CBD
                    </span>
                  )}
                </div>

                {strain.effects && strain.effects.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {strain.effects.slice(0, 3).map(effect => (
                      <span key={effect} className="text-xs text-green-400">
                        {effect}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
