'use client';

import { useState, useMemo } from 'react';
import { StrainType, STRAIN_TYPE_COLORS } from '@/types/strain';

interface StrainTypeSliderProps {
  value: StrainType;
  onChange: (strainType: StrainType) => void;
  onComplete?: () => void;
}

// Define the strain type spectrum with positions (0-100)
const TYPE_STOPS = [
  { position: 0, color: '#6366f1', label: 'Indica' as StrainType },
  { position: 25, color: '#8b5cf6', label: 'Indica-Dominant' as StrainType },
  { position: 50, color: '#22c55e', label: 'Balanced Hybrid' as StrainType },
  { position: 75, color: '#eab308', label: 'Sativa-Dominant' as StrainType },
  { position: 100, color: '#f97316', label: 'Sativa' as StrainType },
];

// Get color value at a specific position by interpolating between stops
function getColorAtPosition(position: number): string {
  // Find the two stops we're between
  let lower = TYPE_STOPS[0];
  let upper = TYPE_STOPS[TYPE_STOPS.length - 1];

  for (let i = 0; i < TYPE_STOPS.length - 1; i++) {
    if (position >= TYPE_STOPS[i].position && position <= TYPE_STOPS[i + 1].position) {
      lower = TYPE_STOPS[i];
      upper = TYPE_STOPS[i + 1];
      break;
    }
  }

  // Calculate interpolation factor
  const range = upper.position - lower.position;
  const factor = range === 0 ? 0 : (position - lower.position) / range;

  // Parse hex colors
  const lowerRgb = hexToRgb(lower.color);
  const upperRgb = hexToRgb(upper.color);

  // Interpolate
  const r = Math.round(lowerRgb.r + (upperRgb.r - lowerRgb.r) * factor);
  const g = Math.round(lowerRgb.g + (upperRgb.g - lowerRgb.g) * factor);
  const b = Math.round(lowerRgb.b + (upperRgb.b - lowerRgb.b) * factor);

  return `rgb(${r}, ${g}, ${b})`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

// Get the closest StrainType label for a position
function getTypeLabelAtPosition(position: number): StrainType {
  let closest = TYPE_STOPS[0];
  let closestDist = Math.abs(position - closest.position);

  for (const stop of TYPE_STOPS) {
    const dist = Math.abs(position - stop.position);
    if (dist < closestDist) {
      closest = stop;
      closestDist = dist;
    }
  }

  return closest.label;
}

// Get position for a StrainType
function getPositionForType(strainType: StrainType): number {
  const stop = TYPE_STOPS.find(s => s.label === strainType);
  return stop ? stop.position : 50; // Default to Balanced Hybrid
}

// Get description for strain type
function getTypeDescription(strainType: StrainType): string {
  switch (strainType) {
    case 'Indica':
      return 'Relaxing, sedating, body high';
    case 'Indica-Dominant':
      return 'Mostly relaxing with some mental effects';
    case 'Balanced Hybrid':
      return 'Equal body and mind effects';
    case 'Sativa-Dominant':
      return 'Mostly energizing with some body effects';
    case 'Sativa':
      return 'Energizing, uplifting, cerebral high';
    default:
      return '';
  }
}

export default function StrainTypeSlider({ value, onChange, onComplete }: StrainTypeSliderProps) {
  const [position, setPosition] = useState(() => getPositionForType(value));

  // Generate gradient CSS
  const gradientCss = useMemo(() => {
    return `linear-gradient(to right, ${TYPE_STOPS.map(
      stop => `${stop.color} ${stop.position}%`
    ).join(', ')})`;
  }, []);

  const currentColor = useMemo(() => getColorAtPosition(position), [position]);
  const currentLabel = useMemo(() => getTypeLabelAtPosition(position), [position]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPos = parseInt(e.target.value, 10);
    setPosition(newPos);
    onChange(getTypeLabelAtPosition(newPos));
  };

  const handleConfirm = () => {
    onChange(currentLabel);
    onComplete?.();
  };

  return (
    <div className="w-full max-w-lg mx-auto space-y-6">
      {/* Large type preview with icon */}
      <div className="flex flex-col items-center">
        <div
          className="w-32 h-32 rounded-full border-4 border-[#333] shadow-lg transition-colors duration-150 flex items-center justify-center"
          style={{ backgroundColor: currentColor }}
        >
          {/* Cannabis leaf icon */}
          <svg width="64" height="64" viewBox="0 0 24 24" fill="white" fillOpacity="0.3">
            <path d="M12 2C12 2 9 6 9 9C9 10.5 9.5 11.5 10 12C8.5 11.5 6 11 4 12C4 12 6 14 9 14C7 15.5 5 18 5 18C5 18 8 17 10 15.5C10 17 10 20 12 22C14 20 14 17 14 15.5C16 17 19 18 19 18C19 18 17 15.5 15 14C18 14 20 12 20 12C18 11 15.5 11.5 14 12C14.5 11.5 15 10.5 15 9C15 6 12 2 12 2Z"/>
          </svg>
        </div>
        <p className="mt-3 text-xl font-bold text-white">{currentLabel}</p>
        <p className="text-sm text-gray-400">{getTypeDescription(currentLabel)}</p>
      </div>

      {/* Slider */}
      <div className="space-y-2">
        <div
          className="h-8 rounded-full relative overflow-hidden"
          style={{ background: gradientCss }}
        >
          <input
            type="range"
            min="0"
            max="100"
            value={position}
            onChange={handleSliderChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          {/* Thumb indicator */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border-2 border-gray-800 shadow-lg pointer-events-none transition-all duration-75"
            style={{ left: `calc(${position}% - 12px)` }}
          />
        </div>

        {/* Labels below slider */}
        <div className="flex justify-between text-xs text-gray-500 px-1">
          <span>Indica</span>
          <span>Hybrid</span>
          <span>Sativa</span>
        </div>
      </div>

      {/* Quick select buttons */}
      <div className="flex flex-wrap gap-2 justify-center">
        {TYPE_STOPS.map((stop) => (
          <button
            key={stop.label}
            onClick={() => {
              setPosition(stop.position);
              onChange(stop.label);
            }}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              currentLabel === stop.label
                ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0f0f0f]'
                : 'hover:opacity-80'
            }`}
            style={{ backgroundColor: stop.color, color: 'white' }}
          >
            {stop.label}
          </button>
        ))}
      </div>

      {/* Confirm button */}
      <button
        onClick={handleConfirm}
        className="w-full py-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-500 transition-colors"
      >
        Confirm Type
      </button>
    </div>
  );
}
