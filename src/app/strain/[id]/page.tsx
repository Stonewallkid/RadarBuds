'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import RadarChart from '@/components/RadarChart';
import {
  EffectRatings,
  createEmptyRatings,
  EFFECT_DIMENSIONS,
  StrainType,
  STRAIN_TYPE_COLORS,
} from '@/types/strain';

interface Rating {
  id: string;
  effectRatings: EffectRatings;
  strainType: string;
  budAppearance: string | null;
  overallRating: number;
  notes: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
  } | null;
}

interface Strain {
  id: string;
  name: string;
  genetics: string | null;
  strainType: StrainType;
  thcPercent: number | null;
  cbdPercent: number | null;
  grower: string | null;
  imageUrl: string | null;
  ratings: Rating[];
}

// Single color for ghost overlay - light green
const GHOST_COLOR = '#22c55e';

// Stroke colors based on strain type
const STROKE_COLORS: Record<string, string> = {
  'Indica': '#a855f7',           // Purple
  'Indica-Dominant': '#a855f7',  // Purple
  'Balanced Hybrid': '#22c55e',  // Green
  'Sativa-Dominant': '#f97316',  // Orange (like orange hairs)
  'Sativa': '#f97316',           // Orange
};

const getStrokeColor = (strainType: string): string => {
  return STROKE_COLORS[strainType] || GHOST_COLOR;
};

export default function StrainDetailPage() {
  const params = useParams();
  const strainId = params.id as string;

  const [strain, setStrain] = useState<Strain | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [avgProfile, setAvgProfile] = useState<EffectRatings>(createEmptyRatings());

  // Toggle states
  const [visibleReviews, setVisibleReviews] = useState<Set<string>>(new Set());
  const [showAverage, setShowAverage] = useState(true);
  const [chartSize, setChartSize] = useState(320);

  // Responsive chart sizing
  useEffect(() => {
    const updateSize = () => {
      const width = window.innerWidth;
      setChartSize(Math.min(width - 60, 360));
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    if (!strainId) return;

    const fetchStrain = async () => {
      try {
        const response = await fetch(`/api/strains/${strainId}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('Strain not found');
          } else {
            setError('Failed to load strain');
          }
          return;
        }

        const data = await response.json();
        setStrain(data);

        // Initialize all reviews as visible
        setVisibleReviews(new Set(data.ratings.map((r: Rating) => r.id)));

        // Calculate average profile from all ratings
        if (data.ratings && data.ratings.length > 0) {
          const avgRatings = createEmptyRatings();
          const counts: Record<string, number> = {};

          for (const rating of data.ratings) {
            if (rating.effectRatings) {
              for (const dim of EFFECT_DIMENSIONS) {
                const value = rating.effectRatings[dim];
                if (typeof value === 'number') {
                  avgRatings[dim] = (avgRatings[dim] || 0) + value;
                  counts[dim] = (counts[dim] || 0) + 1;
                }
              }
            }
          }

          // Calculate averages
          for (const dim of EFFECT_DIMENSIONS) {
            if (counts[dim] && counts[dim] > 0) {
              avgRatings[dim] = avgRatings[dim] / counts[dim];
            }
          }

          setAvgProfile(avgRatings);
        }
      } catch (err) {
        console.error('Error fetching strain:', err);
        setError('Failed to load strain');
      } finally {
        setLoading(false);
      }
    };

    fetchStrain();
  }, [strainId]);

  const getAverageOverall = () => {
    if (!strain?.ratings || strain.ratings.length === 0) return 0;
    const sum = strain.ratings.reduce((acc, r) => acc + r.overallRating, 0);
    return sum / strain.ratings.length;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStrainTypeColor = (type: StrainType) => {
    return STRAIN_TYPE_COLORS[type] || STRAIN_TYPE_COLORS['Balanced Hybrid'];
  };

  const toggleReview = (id: string) => {
    setVisibleReviews(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAllReviews = () => {
    if (!strain) return;
    if (visibleReviews.size === strain.ratings.length) {
      setVisibleReviews(new Set());
    } else {
      setVisibleReviews(new Set(strain.ratings.map(r => r.id)));
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (error || !strain) {
    return (
      <main className="min-h-screen bg-[#0f0f0f]">
        <header className="sticky top-0 z-40 bg-[#0f0f0f]/95 backdrop-blur border-b border-[#222]">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
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
          </div>
        </header>
        <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
          <p className="text-xl mb-4">{error || 'Strain not found'}</p>
          <Link href="/" className="text-green-500 hover:text-green-400">
            Go back home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0f0f0f]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0f0f0f]/95 backdrop-blur border-b border-[#222]">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
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
            href={`/?rate=1&strainId=${strain.id}`}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-500 transition-colors"
          >
            Rate This Strain
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Strain Info Card */}
        <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#333] mb-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Strain Details */}
            <div className="flex-1">
              <div className="flex items-start gap-3 mb-4">
                <h1 className="text-2xl md:text-3xl font-bold text-white">{strain.name}</h1>
                <span
                  className="px-3 py-1 rounded-full text-sm font-medium text-white mt-1"
                  style={{ backgroundColor: getStrainTypeColor(strain.strainType) }}
                >
                  {strain.strainType}
                </span>
              </div>

              {strain.genetics && (
                <p className="text-gray-400 mb-3">
                  <span className="text-gray-500">Genetics:</span> {strain.genetics}
                </p>
              )}

              {strain.grower && (
                <p className="text-gray-400 mb-3">
                  <span className="text-gray-500">Grower:</span> {strain.grower}
                </p>
              )}

              <div className="flex flex-wrap gap-4 mt-4">
                {strain.thcPercent !== null && (
                  <div className="bg-[#252525] px-4 py-2 rounded-lg">
                    <span className="text-gray-500 text-sm">THC</span>
                    <p className="text-white font-bold">{strain.thcPercent.toFixed(1)}%</p>
                  </div>
                )}
                {strain.cbdPercent !== null && (
                  <div className="bg-[#252525] px-4 py-2 rounded-lg">
                    <span className="text-gray-500 text-sm">CBD</span>
                    <p className="text-white font-bold">{strain.cbdPercent.toFixed(1)}%</p>
                  </div>
                )}
                <div className="bg-[#252525] px-4 py-2 rounded-lg">
                  <span className="text-gray-500 text-sm">Avg Rating</span>
                  <p className="text-white font-bold">{getAverageOverall().toFixed(1)}/10</p>
                </div>
                <div className="bg-[#252525] px-4 py-2 rounded-lg">
                  <span className="text-gray-500 text-sm">Reviews</span>
                  <p className="text-white font-bold">{strain.ratings.length}</p>
                </div>
              </div>
            </div>

            {/* Ghost Overlay Chart */}
            {strain.ratings.length > 0 && (
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-between w-full mb-2">
                  <p className="text-sm text-gray-500">Effect Profiles</p>
                  <button
                    onClick={toggleAllReviews}
                    className="text-xs text-green-400 hover:text-green-300"
                  >
                    {visibleReviews.size === strain.ratings.length ? 'Hide All' : 'Show All'}
                  </button>
                </div>

                {/* Stacked overlay charts */}
                <div className="relative" style={{ width: chartSize, height: chartSize }}>
                  {/* Base grid (empty chart) */}
                  <div className="absolute inset-0">
                    <RadarChart
                      ratings={createEmptyRatings()}
                      size={chartSize}
                      interactive={false}
                      fillColor="transparent"
                      fillOpacity={0}
                      darkMode={true}
                    />
                  </div>

                  {/* Average profile (toggleable) */}
                  {showAverage && (
                    <div
                      className="absolute inset-0 transition-opacity duration-200"
                      style={{ opacity: 0.9, pointerEvents: 'none' }}
                    >
                      <RadarChart
                        ratings={avgProfile}
                        size={chartSize}
                        interactive={false}
                        fillColor="#fbbf24"
                        fillOpacity={0.15}
                        darkMode={true}
                      />
                    </div>
                  )}

                  {/* Individual review overlays - same color, low opacity for natural consensus */}
                  {strain.ratings.map((rating) => {
                    const isVisible = visibleReviews.has(rating.id);

                    return (
                      <div
                        key={rating.id}
                        className="absolute inset-0 transition-opacity duration-200"
                        style={{ opacity: isVisible ? 1 : 0, pointerEvents: 'none' }}
                      >
                        <RadarChart
                          ratings={rating.effectRatings}
                          size={chartSize}
                          interactive={false}
                          fillColor={GHOST_COLOR}
                          fillOpacity={0.08}
                          strokeColor={getStrokeColor(strain.strainType)}
                          strokeOpacity={0.2}
                          showDots={false}
                          darkMode={true}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Legend - simplified */}
                <div className="flex flex-wrap justify-center gap-3 mt-3">
                  {/* Average toggle */}
                  <button
                    onClick={() => setShowAverage(!showAverage)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${
                      showAverage ? 'bg-amber-900/30 ring-1 ring-amber-500/50' : 'bg-[#252525] opacity-50'
                    }`}
                  >
                    <div
                      className={`w-3 h-3 rounded-full bg-amber-400 transition-opacity ${showAverage ? '' : 'opacity-30'}`}
                    />
                    <span className={`text-xs ${showAverage ? 'text-amber-300' : 'text-gray-500'}`}>
                      Average
                    </span>
                  </button>

                  {/* All reviews toggle */}
                  <button
                    onClick={toggleAllReviews}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${
                      visibleReviews.size > 0 ? 'bg-green-900/30 ring-1 ring-green-500/50' : 'bg-[#252525] opacity-50'
                    }`}
                  >
                    <div
                      className={`w-3 h-3 rounded-full transition-opacity ${visibleReviews.size > 0 ? '' : 'opacity-30'}`}
                      style={{ backgroundColor: GHOST_COLOR }}
                    />
                    <span className={`text-xs ${visibleReviews.size > 0 ? 'text-green-300' : 'text-gray-500'}`}>
                      {strain.ratings.length} Reviews
                    </span>
                  </button>
                </div>

                {strain.ratings.length > 1 && (
                  <p className="text-xs text-gray-600 mt-2">
                    Darker areas = more consensus
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#333]">
          <h2 className="text-xl font-bold text-white mb-4">
            Reviews ({strain.ratings.length})
          </h2>

          {strain.ratings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-4">No reviews yet. Be the first to rate this strain!</p>
              <Link
                href={`/?rate=1&strainId=${strain.id}`}
                className="inline-block px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-500 transition-colors"
              >
                Rate This Strain
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {strain.ratings.map((rating) => (
                  <div
                    key={rating.id}
                    className="bg-[#252525] rounded-xl p-4 border border-[#333]"
                  >
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Rating Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center font-medium text-white bg-green-600"
                          >
                            {rating.user?.name?.[0]?.toUpperCase() || 'A'}
                          </div>
                          <div>
                            <p className="text-white font-medium">
                              {rating.user?.name || 'Anonymous'}
                            </p>
                            <p className="text-gray-500 text-xs">
                              {formatDate(rating.createdAt)}
                            </p>
                          </div>
                          <div className="ml-auto flex items-center gap-1">
                            <span className="text-2xl font-bold text-green-400">
                              {rating.overallRating}
                            </span>
                            <span className="text-gray-500">/10</span>
                          </div>
                        </div>

                        {rating.budAppearance && (
                          <p className="text-sm text-gray-400 mb-2">
                            <span className="text-gray-500">Appearance:</span> {rating.budAppearance}
                          </p>
                        )}

                        {rating.notes && (
                          <p className="text-gray-300 text-sm mt-3 p-3 bg-[#1a1a1a] rounded-lg">
                            "{rating.notes}"
                          </p>
                        )}
                      </div>

                      {/* Rating Radar Chart - Larger */}
                      <div className="flex justify-center md:justify-end flex-shrink-0">
                        <RadarChart
                          ratings={rating.effectRatings}
                          size={220}
                          interactive={false}
                          fillColor={GHOST_COLOR}
                          fillOpacity={0.25}
                          strokeColor={getStrokeColor(strain.strainType)}
                          strokeOpacity={0.6}
                          darkMode={true}
                        />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
