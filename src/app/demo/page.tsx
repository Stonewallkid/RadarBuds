'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import RadarChart from '@/components/RadarChart';
import ComparisonRadarChart from '@/components/ComparisonRadarChart';
import {
  EffectRatings,
  createEmptyRatings,
  StrainType,
  STRAIN_TYPE_COLORS,
} from '@/types/strain';

interface SimilarStrain {
  id: string;
  name: string;
  genetics: string | null;
  strainType: StrainType;
  thcPercent: number | null;
  cbdPercent: number | null;
  similarity: number;
  avgOverall: number;
  ratingCount: number;
  avgProfile: EffectRatings;
}

type StrainTypeFilter = 'all' | 'indica' | 'sativa' | 'hybrid';

export default function DemoPage() {
  const [drawnProfile, setDrawnProfile] = useState<EffectRatings>(createEmptyRatings());
  const [similarStrains, setSimilarStrains] = useState<SimilarStrain[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedStrain, setSelectedStrain] = useState<SimilarStrain | null>(null);
  const [strainTypeFilter, setStrainTypeFilter] = useState<StrainTypeFilter>('all');
  const [chartSize, setChartSize] = useState(280);
  const [chartMinimized, setChartMinimized] = useState(false);

  // Keep a ref to drawnProfile for use in search
  const drawnProfileRef = useRef<EffectRatings>(drawnProfile);
  drawnProfileRef.current = drawnProfile;

  // Responsive chart sizing
  useEffect(() => {
    const updateSize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setChartSize(Math.min(width - 60, 260));
      } else {
        setChartSize(280);
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handleFindSimilar = async (filterType?: StrainTypeFilter) => {
    setIsSearching(true);
    setHasSearched(true);
    setSelectedStrain(null);
    const typeToUse = filterType ?? strainTypeFilter;

    try {
      const response = await fetch('/api/strains/similar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetProfile: drawnProfileRef.current,
          strainType: typeToUse === 'all' ? undefined : typeToUse,
          limit: 10,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSimilarStrains(data.data);
      } else {
        console.error('Failed to find similar strains:', data.error);
        setSimilarStrains([]);
      }
    } catch (error) {
      console.error('Error finding similar strains:', error);
      setSimilarStrains([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleFilterChange = (newFilter: StrainTypeFilter) => {
    setStrainTypeFilter(newFilter);
    if (similarStrains.length > 0 || hasSearched) {
      handleFindSimilar(newFilter);
    }
  };

  const handleReset = () => {
    setDrawnProfile(createEmptyRatings());
    setSimilarStrains([]);
    setHasSearched(false);
    setSelectedStrain(null);
  };

  const getStrainTypeLabel = (type: StrainType): string => {
    switch (type) {
      case 'Indica': return 'IND';
      case 'Indica-Dominant': return 'IND-D';
      case 'Balanced Hybrid': return 'HYB';
      case 'Sativa-Dominant': return 'SAT-D';
      case 'Sativa': return 'SAT';
      default: return 'HYB';
    }
  };

  return (
    <main className="min-h-screen bg-[#0f0f0f]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0f0f0f]/95 backdrop-blur border-b border-[#222]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-600/20 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-green-500">
                <path
                  d="M12 2C12 2 9 6 9 9C9 10.5 9.5 11.5 10 12C8.5 11.5 6 11 4 12C4 12 6 14 9 14C7 15.5 5 18 5 18C5 18 8 17 10 15.5C10 17 10 20 12 22C14 20 14 17 14 15.5C16 17 19 18 19 18C19 18 17 15.5 15 14C18 14 20 12 20 12C18 11 15.5 11.5 14 12C14.5 11.5 15 10.5 15 9C15 6 12 2 12 2Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <span className="font-bold text-white">RadarBuds</span>
          </Link>

          <Link
            href="/?rate=1"
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-500 transition-colors"
          >
            Rate a Strain
          </Link>
        </div>
      </header>

      {/* Full-screen Draw & Search Interface */}
      <div className="pt-4">
        {/* Desktop layout: Side-by-side */}
        <div className="hidden lg:block">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="grid grid-cols-2 gap-6">
              {/* Chart Section - Desktop */}
              <div className="bg-[#1a1a1a] rounded-2xl border-2 border-green-600/50 shadow-[0_0_20px_rgba(22,163,74,0.2),inset_0_0_30px_rgba(22,163,74,0.05)] p-6">
                {selectedStrain ? (
                  <>
                    <h3 className="font-semibold text-white text-center mb-1">{selectedStrain.name}</h3>
                    <p className="text-sm text-gray-400 mb-4 text-center">{selectedStrain.similarity}% match</p>
                    <div className="flex justify-center">
                      <ComparisonRadarChart
                        strainProfile={selectedStrain.avgProfile}
                        userProfile={drawnProfile}
                        size={chartSize}
                        strainColor={STRAIN_TYPE_COLORS[selectedStrain.strainType]}
                      />
                    </div>
                    <div className="mt-4 flex justify-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: STRAIN_TYPE_COLORS[selectedStrain.strainType] }}
                        />
                        <span className="text-gray-400">{selectedStrain.strainType}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg width="20" height="12" className="opacity-80">
                          <line x1="0" y1="6" x2="20" y2="6" stroke="white" strokeWidth="2" strokeDasharray="4,2" />
                        </svg>
                        <span className="text-gray-400">Yours</span>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-center">
                      <button
                        onClick={() => setSelectedStrain(null)}
                        className="px-4 py-2 bg-[#252525] text-gray-300 rounded-lg hover:bg-[#303030] transition-colors"
                      >
                        Back to Drawing
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-400 mb-4 text-center">
                      Drag on the chart to set your preferred effect profile
                    </p>
                    <div className="flex justify-center">
                      <RadarChart
                        ratings={drawnProfile}
                        onChange={setDrawnProfile}
                        size={chartSize}
                        interactive={true}
                        fillColor="#ffffff"
                        fillOpacity={0.1}
                        darkMode={true}
                      />
                    </div>
                    <div className="mt-4 flex justify-center gap-3">
                      <button
                        onClick={handleReset}
                        className="px-4 py-2 bg-[#252525] text-gray-300 rounded-lg hover:bg-[#303030] transition-colors"
                      >
                        Reset
                      </button>
                      <button
                        onClick={() => handleFindSimilar()}
                        disabled={isSearching}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors disabled:opacity-50"
                      >
                        {isSearching ? 'Searching...' : 'Find Similar Strains'}
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Similar strains results - Desktop */}
              <div className="bg-[#1a1a1a] rounded-2xl p-6 border-2 border-green-600/50 shadow-[0_0_20px_rgba(22,163,74,0.2),inset_0_0_30px_rgba(22,163,74,0.05)] max-h-[calc(100vh-140px)] overflow-y-auto">
                <h3 className="font-semibold text-white mb-3">Matching Strains</h3>

                {/* Strain type filter */}
                <div className="flex gap-1 mb-4">
                  {[
                    { value: 'all', label: 'All' },
                    { value: 'indica', label: 'Indica' },
                    { value: 'hybrid', label: 'Hybrid' },
                    { value: 'sativa', label: 'Sativa' },
                  ].map((filter) => (
                    <button
                      key={filter.value}
                      onClick={() => handleFilterChange(filter.value as StrainTypeFilter)}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        strainTypeFilter === filter.value
                          ? filter.value === 'indica' ? 'bg-purple-700 text-white' :
                            filter.value === 'sativa' ? 'bg-orange-600 text-white' :
                            filter.value === 'hybrid' ? 'bg-green-600 text-white' :
                            'bg-green-600 text-white'
                          : 'bg-[#252525] text-gray-400 hover:bg-[#333]'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                {similarStrains.length > 0 && (
                  <p className="text-xs text-gray-500 mb-3">Hover to compare</p>
                )}

                {isSearching ? (
                  <div className="h-32 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : similarStrains.length > 0 ? (
                  <div className="space-y-3">
                    {similarStrains.map((strain) => (
                      <div
                        key={strain.id}
                        className={`bg-[#252525] rounded-xl p-4 transition-colors cursor-pointer ${
                          selectedStrain?.id === strain.id ? 'bg-[#353535] ring-2 ring-green-600' : 'hover:bg-[#303030]'
                        }`}
                        onMouseEnter={() => setSelectedStrain(strain)}
                        onMouseLeave={() => setSelectedStrain(null)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-white">{strain.name}</p>
                              <span
                                className="px-1.5 py-0.5 rounded text-xs text-white"
                                style={{ backgroundColor: STRAIN_TYPE_COLORS[strain.strainType] }}
                              >
                                {getStrainTypeLabel(strain.strainType)}
                              </span>
                            </div>
                            {strain.genetics && (
                              <p className="text-sm text-gray-500 truncate max-w-[200px]">{strain.genetics}</p>
                            )}
                            <p className="text-xs text-gray-500">
                              {strain.ratingCount} ratings • {strain.avgOverall.toFixed(1)}/10
                              {strain.thcPercent && ` • ${strain.thcPercent.toFixed(0)}% THC`}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-400">{strain.similarity}%</p>
                            <p className="text-xs text-gray-500">match</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : hasSearched ? (
                  <div className="h-32 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <p>No strains found matching your profile</p>
                      <p className="text-sm mt-1">Try adjusting your profile or filters</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-32 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <p>Draw your ideal effect profile</p>
                      <p className="text-sm mt-1">then click "Find Similar Strains"</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile layout: Fixed chart at top, scrollable results below */}
        <div className="lg:hidden flex flex-col h-[calc(100vh-60px)]">
          {/* Chart Section - Fixed at top on mobile */}
          <div className="flex-shrink-0 bg-[#1a1a1a] mx-3 mt-2 rounded-2xl border-2 border-green-600/50 shadow-[0_0_20px_rgba(22,163,74,0.2)] overflow-hidden">
            {/* Chart content - collapsible on mobile */}
            {!chartMinimized && (
              <div className="px-2 pt-3 pb-1">
                {selectedStrain ? (
                  <div className="flex justify-center">
                    <ComparisonRadarChart
                      strainProfile={selectedStrain.avgProfile}
                      userProfile={drawnProfile}
                      size={chartSize}
                      strainColor={STRAIN_TYPE_COLORS[selectedStrain.strainType]}
                    />
                  </div>
                ) : (
                  <>
                    <div className="flex justify-center">
                      <RadarChart
                        ratings={drawnProfile}
                        onChange={setDrawnProfile}
                        size={chartSize}
                        interactive={true}
                        fillColor="#ffffff"
                        fillOpacity={0.1}
                        darkMode={true}
                      />
                    </div>
                    <div className="flex justify-center gap-2 mt-1">
                      <button
                        onClick={handleReset}
                        className="px-3 py-1.5 text-sm bg-[#252525] text-gray-300 rounded-lg"
                      >
                        Reset
                      </button>
                      <button
                        onClick={() => handleFindSimilar()}
                        disabled={isSearching}
                        className="px-4 py-1.5 text-sm bg-green-600 text-white rounded-lg disabled:opacity-50"
                      >
                        {isSearching ? 'Searching...' : 'Find Strains'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Collapse button at bottom */}
            <button
              onClick={() => setChartMinimized(!chartMinimized)}
              className="w-full flex items-center justify-center py-2 bg-[#252525]"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                className={`text-gray-400 transition-transform ${chartMinimized ? 'rotate-180' : ''}`}
              >
                <path d="M18 15L12 9L6 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* Similar strains results - Scrollable on mobile */}
          <div className="flex-1 overflow-y-auto mt-2 mx-3 mb-3">
            <div className="bg-[#1a1a1a] rounded-2xl p-3 border-2 border-green-600/50">
              <h3 className="font-semibold text-white mb-2 text-sm">Matching Strains</h3>

              {/* Strain type filter - Mobile */}
              <div className="flex gap-1 mb-3">
                {[
                  { value: 'all', label: 'All' },
                  { value: 'indica', label: 'Indica' },
                  { value: 'hybrid', label: 'Hybrid' },
                  { value: 'sativa', label: 'Sativa' },
                ].map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => handleFilterChange(filter.value as StrainTypeFilter)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      strainTypeFilter === filter.value
                        ? filter.value === 'indica' ? 'bg-purple-700 text-white' :
                          filter.value === 'sativa' ? 'bg-orange-600 text-white' :
                          filter.value === 'hybrid' ? 'bg-green-600 text-white' :
                          'bg-green-600 text-white'
                        : 'bg-[#252525] text-gray-400'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {similarStrains.length > 0 && (
                <p className="text-xs text-gray-500 mb-2">Tap a strain to compare</p>
              )}

              {isSearching ? (
                <div className="h-24 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : similarStrains.length > 0 ? (
                <div className="space-y-3">
                  {similarStrains.map((strain) => (
                    <div
                      key={strain.id}
                      className={`bg-[#252525] rounded-xl p-4 transition-colors cursor-pointer ${
                        selectedStrain?.id === strain.id ? 'bg-[#353535] ring-2 ring-green-600' : ''
                      }`}
                      onClick={() => {
                        setSelectedStrain(selectedStrain?.id === strain.id ? null : strain);
                        if (chartMinimized && selectedStrain?.id !== strain.id) {
                          setChartMinimized(false);
                        }
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-white">{strain.name}</p>
                            <span
                              className="px-1.5 py-0.5 rounded text-xs text-white"
                              style={{ backgroundColor: STRAIN_TYPE_COLORS[strain.strainType] }}
                            >
                              {getStrainTypeLabel(strain.strainType)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            {strain.ratingCount} ratings • {strain.avgOverall.toFixed(1)}/10
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-400">{strain.similarity}%</p>
                          <p className="text-xs text-gray-500">match</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : hasSearched ? (
                <div className="h-24 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <p className="text-sm">No strains found</p>
                    <p className="text-xs mt-1">Try adjusting your profile</p>
                  </div>
                </div>
              ) : (
                <div className="h-24 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <p className="text-sm">Draw your ideal effect profile</p>
                    <p className="text-xs mt-1">then tap "Find Strains"</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
