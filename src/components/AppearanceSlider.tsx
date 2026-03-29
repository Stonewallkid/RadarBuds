'use client';

import { useState } from 'react';
import { BudAppearance, BUD_APPEARANCE_COLORS } from '@/types/strain';

interface AppearanceSliderProps {
  value: BudAppearance | null;
  onChange: (appearance: BudAppearance | null) => void;
  onComplete?: () => void;
}

const APPEARANCES: { label: BudAppearance; description: string }[] = [
  { label: 'Light Green', description: 'Bright, fresh green buds' },
  { label: 'Forest Green', description: 'Deep, dark green color' },
  { label: 'Purple', description: 'Purple or violet hues' },
  { label: 'Orange-Tinged', description: 'Lots of orange pistils' },
  { label: 'Frosty', description: 'Heavy trichome coverage' },
  { label: 'Dark', description: 'Dark, well-cured buds' },
];

export default function AppearanceSlider({ value, onChange, onComplete }: AppearanceSliderProps) {
  const [selected, setSelected] = useState<BudAppearance | null>(value);

  const handleSelect = (appearance: BudAppearance) => {
    setSelected(appearance);
    onChange(appearance);
  };

  const handleSkip = () => {
    onChange(null);
    onComplete?.();
  };

  const handleConfirm = () => {
    onChange(selected);
    onComplete?.();
  };

  return (
    <div className="w-full max-w-lg mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-white mb-2">Bud Appearance</h2>
        <p className="text-sm text-gray-400">Optional - describe how the buds look</p>
      </div>

      {/* Appearance grid */}
      <div className="grid grid-cols-2 gap-3">
        {APPEARANCES.map(({ label, description }) => (
          <button
            key={label}
            onClick={() => handleSelect(label)}
            className={`p-4 rounded-xl border-2 transition-all text-left ${
              selected === label
                ? 'border-green-500 bg-green-500/10'
                : 'border-[#333] hover:border-[#444] bg-[#1a1a1a]'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-8 h-8 rounded-full border-2 border-[#444]"
                style={{ backgroundColor: BUD_APPEARANCE_COLORS[label] }}
              />
              <span className="font-medium text-white">{label}</span>
            </div>
            <p className="text-xs text-gray-500">{description}</p>
          </button>
        ))}
      </div>

      {/* Selected preview */}
      {selected && (
        <div className="flex items-center justify-center gap-3 p-4 bg-[#1a1a1a] rounded-lg">
          <div
            className="w-12 h-12 rounded-full border-2 border-[#444]"
            style={{ backgroundColor: BUD_APPEARANCE_COLORS[selected] }}
          />
          <div>
            <p className="font-medium text-white">{selected}</p>
            <p className="text-sm text-gray-400">
              {APPEARANCES.find(a => a.label === selected)?.description}
            </p>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="space-y-3">
        <button
          onClick={handleConfirm}
          disabled={!selected}
          className={`w-full py-4 rounded-lg font-medium transition-colors ${
            selected
              ? 'bg-green-600 text-white hover:bg-green-500'
              : 'bg-[#333] text-gray-500 cursor-not-allowed'
          }`}
        >
          Confirm Appearance
        </button>

        <button
          onClick={handleSkip}
          className="w-full py-3 text-gray-400 hover:text-white transition-colors"
        >
          Skip this step
        </button>
      </div>
    </div>
  );
}
