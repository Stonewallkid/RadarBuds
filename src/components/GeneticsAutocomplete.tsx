'use client';

import { useState, useRef, useEffect } from 'react';

// Common cannabis genetics/lineages
const COMMON_GENETICS = [
  // Classic strains
  'OG Kush',
  'Blue Dream',
  'Girl Scout Cookies',
  'Gorilla Glue',
  'Gelato',
  'Wedding Cake',
  'Runtz',
  'Zkittlez',
  'Sour Diesel',
  'Jack Herer',
  'Northern Lights',
  'White Widow',
  'Granddaddy Purple',
  'Purple Haze',
  'AK-47',
  'Durban Poison',
  'Green Crack',
  'Trainwreck',
  'Bubba Kush',
  'Skywalker OG',
  // Modern strains
  'Ice Cream Cake',
  'Apple Fritter',
  'Gary Payton',
  'London Pound Cake',
  'Sunset Sherbet',
  'Mimosa',
  'Pineapple Express',
  'Mac 1',
  'Cereal Milk',
  'Biscotti',
  // Indica-leaning
  'Hindu Kush',
  'Afghan Kush',
  'Blueberry',
  'Grape Ape',
  'Master Kush',
  // Sativa-leaning
  'Maui Wowie',
  'Super Lemon Haze',
  'Strawberry Cough',
  'Tangie',
  'Amnesia Haze',
];

interface GeneticsAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function GeneticsAutocomplete({
  value,
  onChange,
  placeholder = 'Select or type genetics...',
}: GeneticsAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter options based on input
  useEffect(() => {
    if (!value.trim()) {
      setFilteredOptions(COMMON_GENETICS.slice(0, 10));
    } else {
      const filtered = COMMON_GENETICS.filter((g) =>
        g.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 10);
      setFilteredOptions(filtered);
    }
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (genetics: string) => {
    onChange(genetics);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-[#252525] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-green-600 focus:border-transparent"
      />

      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-[#252525] border border-[#333] rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.map((genetics, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelect(genetics)}
              className="w-full px-4 py-3 text-left text-white hover:bg-[#333] transition-colors first:rounded-t-lg last:rounded-b-lg"
            >
              {genetics}
            </button>
          ))}
        </div>
      )}

      {isOpen && filteredOptions.length === 0 && value.trim() && (
        <div className="absolute z-50 w-full mt-1 bg-[#252525] border border-[#333] rounded-lg shadow-lg p-3">
          <p className="text-gray-400 text-sm">
            No matches found. Press Enter to use &quot;{value}&quot;
          </p>
        </div>
      )}
    </div>
  );
}
