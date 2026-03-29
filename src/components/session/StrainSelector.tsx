'use client';

import { useState, useEffect } from 'react';
import StrainAutocomplete from '@/components/StrainAutocomplete';
import GeneticsAutocomplete from '@/components/GeneticsAutocomplete';
import { useSessionContext } from '@/contexts/SessionContext';

interface StrainSelectorProps {
  onSelect: (strain: { strainId?: string; strain?: { name: string; genetics: string; strainType?: string } }) => Promise<void>;
  onClose: () => void;
}

interface RecentStrain {
  id: string;
  name: string;
  genetics: string | null;
  strainType: string | null;
}

export default function StrainSelector({ onSelect, onClose }: StrainSelectorProps) {
  const { sessionStrains } = useSessionContext();

  const [strainName, setStrainName] = useState('');
  const [strainGenetics, setStrainGenetics] = useState('');
  const [recentStrains, setRecentStrains] = useState<RecentStrain[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch recent strains from the database (not just this session)
  useEffect(() => {
    fetch('/api/strains/search?recent=true')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          // Filter out strains already in this session
          const sessionStrainIds = new Set(sessionStrains.map((ss) => ss.strainId));
          setRecentStrains(data.filter((s: RecentStrain) => !sessionStrainIds.has(s.id)));
        }
      })
      .catch(() => {});
  }, [sessionStrains]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!strainName.trim() || !strainGenetics.trim()) return;

    setIsSubmitting(true);
    try {
      await onSelect({
        strain: {
          name: strainName.trim(),
          genetics: strainGenetics.trim(),
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickSelect = async (strain: RecentStrain) => {
    setIsSubmitting(true);
    try {
      await onSelect({ strainId: strain.id });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center">
      <div className="bg-[#1a1a1a] w-full max-w-lg sm:rounded-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#1a1a1a] p-4 border-b border-[#333] flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Select Strain</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Previously rated in this session */}
          {sessionStrains.length > 0 && (
            <div>
              <p className="text-sm text-gray-400 mb-2">Already rated in this session:</p>
              <div className="flex flex-wrap gap-2">
                {sessionStrains.map((ss) => (
                  <div
                    key={ss.id}
                    className="px-3 py-2 bg-[#252525] border border-[#444] rounded-lg text-sm text-gray-400"
                  >
                    {ss.strain.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick select from recent */}
          {recentStrains.length > 0 && (
            <div>
              <p className="text-sm text-gray-400 mb-2">Quick pick from recent:</p>
              <div className="flex flex-wrap gap-2">
                {recentStrains.slice(0, 6).map((strain) => (
                  <button
                    key={strain.id}
                    onClick={() => handleQuickSelect(strain)}
                    disabled={isSubmitting}
                    className="px-3 py-2 bg-[#252525] border border-[#444] rounded-lg text-sm text-white hover:border-green-600 hover:bg-green-900/20 transition-colors text-left disabled:opacity-50"
                  >
                    <div className="font-medium truncate max-w-[200px]">{strain.name}</div>
                    <div className="text-xs text-gray-500">
                      {strain.genetics || strain.strainType || 'Unknown'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#333]" />
            <span className="text-gray-500 text-sm">or search / enter manually</span>
            <div className="flex-1 h-px bg-[#333]" />
          </div>

          {/* Manual entry form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Strain Name *
              </label>
              <StrainAutocomplete
                value={strainName}
                onChange={setStrainName}
                onSelect={(strain) => {
                  setStrainName(strain.name);
                  // strainType can be used as a fallback for genetics if needed
                  if (strain.strainType && !strainGenetics) {
                    setStrainGenetics(strain.strainType);
                  }
                }}
                placeholder="Search or type strain name..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Genetics *
              </label>
              <GeneticsAutocomplete
                value={strainGenetics}
                onChange={setStrainGenetics}
                placeholder="Select or type genetics..."
              />
            </div>

            <button
              type="submit"
              disabled={!strainName.trim() || !strainGenetics.trim() || isSubmitting}
              className={`w-full py-4 rounded-lg font-medium transition-colors ${
                strainName.trim() && strainGenetics.trim() && !isSubmitting
                  ? 'bg-green-600 text-white hover:bg-green-500'
                  : 'bg-[#333] text-gray-500 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? 'Starting...' : 'Start Rating This Strain'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
