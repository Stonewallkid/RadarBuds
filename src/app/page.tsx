'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import RatingWizard from '@/components/RatingWizard';
import RadarChart from '@/components/RadarChart';
import { useBeverageConfig } from '@/hooks/useBeverageConfig';
import {
  EffectRatings,
  createEmptyRatings,
  StrainType,
  StrainInfo,
  STRAIN_TYPE_COLORS,
} from '@/types/strain';
import { createRating } from '@/lib/api';

interface TopStrain {
  id: string;
  name: string;
  genetics: string | null;
  strainType: string | null;
  avgRating: number;
  ratingCount: number;
}

interface RecentStrain {
  id: string;
  name: string;
  genetics: string | null;
  strainType: string | null;
  imageUrl: string | null;
  ratedBy: string;
  ratedAt: string;
  overallRating: number;
}

type AppState = 'landing' | 'rating' | 'breakdown' | 'editing';

interface CompletedRating {
  strain: StrainInfo;
  strainType: StrainType;
  ratings: EffectRatings;
  overallRating: number;
  displayName?: string;
  notes?: string;
  tasteTags?: string[];
  savedToDb?: boolean;
  ratingId?: string;
  strainId?: string;
}

interface HomeContentProps {
  startWithRating: boolean;
  prefilledStrain?: string;
  prefilledGenetics?: string;
}

function HomeContent({ startWithRating, prefilledStrain, prefilledGenetics }: HomeContentProps) {
  const config = useBeverageConfig();
  const router = useRouter();
  const [appState, setAppState] = useState<AppState>(startWithRating ? 'rating' : 'landing');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/demo?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const [completedRating, setCompletedRating] = useState<CompletedRating | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [topStrains, setTopStrains] = useState<TopStrain[]>([]);
  const [loadingTopStrains, setLoadingTopStrains] = useState(true);
  const [recentStrains, setRecentStrains] = useState<RecentStrain[]>([]);
  const [loadingRecentStrains, setLoadingRecentStrains] = useState(true);

  // For editing mode
  const [editRatings, setEditRatings] = useState<EffectRatings>(createEmptyRatings());

  // For interactive draw on landing page
  const [drawRatings, setDrawRatings] = useState<EffectRatings>(createEmptyRatings());
  const [hasDrawn, setHasDrawn] = useState(false);

  // Chart size
  const [chartSize, setChartSize] = useState(280);
  useEffect(() => {
    const updateSize = () => {
      const width = window.innerWidth;
      setChartSize(Math.min(width - 80, 320));
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handleDrawChange = (newRatings: EffectRatings) => {
    setDrawRatings(newRatings);
    const hasValues = Object.values(newRatings).some(v => v > 0);
    setHasDrawn(hasValues);
  };

  const handleFindStrains = () => {
    sessionStorage.setItem('drawnRatings', JSON.stringify(drawRatings));
    window.location.href = '/demo?draw=1';
  };

  // Fetch top strains and recent strains on mount
  useEffect(() => {
    fetch('/api/strains/top?limit=10')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTopStrains(data);
        }
        setLoadingTopStrains(false);
      })
      .catch(err => {
        console.error('Failed to fetch top strains:', err);
        setLoadingTopStrains(false);
      });

    fetch('/api/strains/recent?limit=5')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setRecentStrains(data);
        }
        setLoadingRecentStrains(false);
      })
      .catch(err => {
        console.error('Failed to fetch recent strains:', err);
        setLoadingRecentStrains(false);
      });
  }, []);

  const handleComplete = async (data: CompletedRating) => {
    setCompletedRating(data);
    setAppState('breakdown');
    setIsSaving(true);
    setSaveError(null);

    try {
      const result = await createRating({
        strain: data.strain,
        strainType: data.strainType,
        effectRatings: data.ratings,
        overallRating: data.overallRating,
        displayName: data.displayName,
        notes: data.notes,
        tasteTags: data.tasteTags,
      });

      setCompletedRating({
        ...data,
        savedToDb: true,
        ratingId: result.id,
        strainId: result.strainId,
      });
    } catch (error) {
      console.error('Failed to save rating:', error);
      setSaveError('Failed to save rating to database');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = () => {
    if (completedRating) {
      setEditRatings(completedRating.ratings);
      setAppState('editing');
    }
  };

  const handleSaveEdit = () => {
    if (completedRating) {
      setCompletedRating({
        ...completedRating,
        ratings: editRatings,
      });
      setAppState('breakdown');
    }
  };

  const handleNewRating = () => {
    setCompletedRating(null);
    setAppState('rating');
  };

  const getStrainTypeColor = (type: string | null) => {
    if (!type) return '#16a34a';
    return STRAIN_TYPE_COLORS[type as StrainType] || '#16a34a';
  };

  return (
    <main className="min-h-screen bg-[#0f0f0f]">
      {/* Landing Page */}
      {appState === 'landing' && (
        <div className="min-h-screen py-8 px-4">
          {/* Hero Section */}
          <div className="text-center max-w-2xl mx-auto mb-6">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3">
              {config.brandName}
            </h1>
            <p className="text-lg text-gray-400">
              {config.tagline}
            </p>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-md mx-auto mb-6">
            <div className="relative">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search strains by name or genetics..."
                className="w-full pl-12 pr-4 py-3 bg-[#1a1a1a] border border-[#333] rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-green-600 focus:border-transparent focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-14 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              )}
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-500 transition-colors"
              >
                Search
              </button>
            </div>
          </form>

          {/* Interactive Draw Section */}
          <div className="max-w-md mx-auto mb-8">
            <div className="bg-[#1a1a1a] rounded-2xl p-6 border-2 border-green-600 shadow-[0_0_20px_rgba(22,163,74,0.3),inset_0_0_30px_rgba(22,163,74,0.1)]">
              <p className="text-center text-gray-300 mb-4">
                {hasDrawn ? 'Looking good! Tap below to find matching strains.' : 'Draw your ideal effect profile'}
              </p>

              <div className="flex justify-center mb-4">
                <RadarChart
                  ratings={drawRatings}
                  onChange={handleDrawChange}
                  size={chartSize}
                  interactive={true}
                  fillColor="#16a34a"
                  fillOpacity={0.4}
                />
              </div>

              <p className="text-center text-sm text-gray-500 mb-4">
                {hasDrawn ? '' : 'Drag on the chart to set your preferences'}
              </p>

              {/* Action buttons */}
              <div className="space-y-3">
                {hasDrawn && (
                  <button
                    onClick={handleFindStrains}
                    className="w-full py-4 bg-gradient-to-r from-green-700 to-green-600 text-white text-lg font-semibold rounded-xl hover:from-green-600 hover:to-green-500 transition-all shadow-lg"
                  >
                    Find Matching Strains
                  </button>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setAppState('rating')}
                    className={`flex-1 py-3 text-white font-medium rounded-xl transition-colors ${
                      hasDrawn
                        ? 'bg-[#252525] hover:bg-[#303030]'
                        : 'bg-green-600 hover:bg-green-500'
                    }`}
                  >
                    Rate a Strain
                  </button>
                  <a
                    href="/demo"
                    className="flex-1 py-3 bg-[#252525] text-white font-medium rounded-xl hover:bg-[#303030] transition-colors text-center"
                  >
                    Browse All
                  </a>
                </div>

                {/* Group Session Buttons */}
                <div className="flex gap-3">
                  <a
                    href="/session/create"
                    className="flex-1 py-3 bg-[#252525] text-white font-medium rounded-xl hover:bg-[#303030] transition-colors text-center border border-[#444]"
                  >
                    Host Session
                  </a>
                  <a
                    href="/session/join"
                    className="flex-1 py-3 bg-[#252525] text-white font-medium rounded-xl hover:bg-[#303030] transition-colors text-center border border-[#444]"
                  >
                    Join Session
                  </a>
                </div>

                {hasDrawn && (
                  <button
                    onClick={() => {
                      setDrawRatings(createEmptyRatings());
                      setHasDrawn(false);
                    }}
                    className="w-full py-2 text-gray-500 text-sm hover:text-gray-300 transition-colors"
                  >
                    Reset drawing
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Latest Rated Strains Section */}
          {recentStrains.length > 0 && (
            <div className="max-w-md mx-auto mb-8">
              <h2 className="text-xl font-bold text-white mb-4 text-center">
                Latest Rated
              </h2>

              <div className="bg-[#1a1a1a] rounded-2xl border border-[#333] overflow-hidden">
                {recentStrains.map((strain, index) => (
                  <a
                    key={strain.id}
                    href={`/strain/${strain.id}`}
                    className={`flex items-center gap-3 p-3 hover:bg-[#252525] transition-colors ${
                      index !== recentStrains.length - 1 ? 'border-b border-[#2a2a2a]' : ''
                    }`}
                  >
                    {/* Strain image or placeholder */}
                    <div className="w-10 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-[#252525] flex items-center justify-center">
                      {strain.imageUrl ? (
                        <img
                          src={strain.imageUrl}
                          alt={strain.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-green-500">
                          <path
                            d="M12 2C12 2 9 6 9 9C9 10.5 9.5 11.5 10 12C8.5 11.5 6 11 4 12C4 12 6 14 9 14C7 15.5 5 18 5 18C5 18 8 17 10 15.5C10 17 10 20 12 22C14 20 14 17 14 15.5C16 17 19 18 19 18C19 18 17 15.5 15 14C18 14 20 12 20 12C18 11 15.5 11.5 14 12C14.5 11.5 15 10.5 15 9C15 6 12 2 12 2Z"
                            fill="currentColor"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white text-sm truncate">{strain.name}</p>
                      <p className="text-xs text-gray-500">
                        {strain.genetics || strain.strainType || 'Unknown'} · by {strain.ratedBy}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-yellow-500 text-sm">★</span>
                      <span className="font-bold text-white text-sm">{strain.overallRating}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Top 10 Strains Section */}
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
              Top Rated Strains
            </h2>

            {loadingTopStrains ? (
              <div className="text-center text-gray-500 py-8">Loading top strains...</div>
            ) : topStrains.length > 0 ? (
              <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden border-2 border-green-600 shadow-[0_0_20px_rgba(22,163,74,0.3),inset_0_0_30px_rgba(22,163,74,0.1)]">
                {topStrains.map((strain, index) => (
                  <a
                    key={strain.id}
                    href={`/strain/${strain.id}`}
                    className={`flex items-center gap-4 p-4 hover:bg-[#252525] transition-colors ${
                      index !== topStrains.length - 1 ? 'border-b border-[#2a2a2a]' : ''
                    }`}
                  >
                    {/* Rank */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-500 text-black' :
                      index === 1 ? 'bg-gray-400 text-black' :
                      index === 2 ? 'bg-amber-700 text-white' :
                      'bg-[#333] text-gray-400'
                    }`}>
                      {index + 1}
                    </div>

                    {/* Strain Info */}
                    <div className="flex-grow min-w-0">
                      <p className="font-medium text-white truncate">{strain.name}</p>
                      <p className="text-sm text-gray-500">
                        {strain.genetics || strain.strainType || 'Unknown'}
                      </p>
                    </div>

                    {/* Strain Type Badge */}
                    {strain.strainType && (
                      <span
                        className="px-2 py-1 rounded text-xs text-white flex-shrink-0"
                        style={{ backgroundColor: getStrainTypeColor(strain.strainType) }}
                      >
                        {strain.strainType}
                      </span>
                    )}

                    {/* Rating */}
                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500">★</span>
                        <span className="text-lg font-bold text-white">{strain.avgRating}</span>
                      </div>
                      <p className="text-xs text-gray-500">{strain.ratingCount} ratings</p>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                No strains rated yet. Be the first to rate a strain!
              </div>
            )}

            <p className="text-center text-sm text-gray-500 mt-4">
              Click any strain to see its full effect profile
            </p>
          </div>
        </div>
      )}

      {/* Rating Wizard */}
      {appState === 'rating' && (
        <RatingWizard
          onComplete={handleComplete}
          onCancel={() => setAppState('landing')}
          prefilledStrain={prefilledStrain}
          prefilledGenetics={prefilledGenetics}
        />
      )}

      {/* Breakdown View */}
      {appState === 'breakdown' && completedRating && (
        <div className="py-8 px-4">
          {/* Save status indicator */}
          <div className="max-w-4xl mx-auto mb-4">
            {isSaving && (
              <div className="text-center text-gray-400 text-sm">
                Saving to database...
              </div>
            )}
            {saveError && (
              <div className="text-center text-red-400 text-sm">
                {saveError} (rating saved locally)
              </div>
            )}
            {completedRating.savedToDb && !isSaving && (
              <div className="text-center text-green-400 text-sm">
                Saved to database
              </div>
            )}
          </div>

          {/* Strain Breakdown */}
          <div className="max-w-md mx-auto">
            <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#333]">
              <h2 className="text-xl font-bold text-white text-center mb-2">
                {completedRating.strain.name}
              </h2>
              <p className="text-gray-400 text-center mb-4">
                {completedRating.strain.genetics || completedRating.strainType}
              </p>

              <div className="flex justify-center mb-4">
                <RadarChart
                  ratings={completedRating.ratings}
                  size={chartSize}
                  interactive={false}
                  fillColor={STRAIN_TYPE_COLORS[completedRating.strainType]}
                  fillOpacity={0.4}
                />
              </div>

              <div className="flex justify-center items-center gap-4 mb-6">
                <span
                  className="px-3 py-1 rounded-full text-sm text-white"
                  style={{ backgroundColor: STRAIN_TYPE_COLORS[completedRating.strainType] }}
                >
                  {completedRating.strainType}
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-yellow-500 text-lg">★</span>
                  <span className="text-xl font-bold text-white">{completedRating.overallRating}</span>
                  <span className="text-gray-500">/10</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleEdit}
                  className="flex-1 py-3 bg-[#252525] text-white rounded-lg font-medium hover:bg-[#303030] transition-colors"
                >
                  Edit Rating
                </button>
                <button
                  onClick={handleNewRating}
                  className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-500 transition-colors"
                >
                  Rate Another
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Mode */}
      {appState === 'editing' && completedRating && (
        <div className="py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-center text-white mb-2">
              Edit Rating
            </h1>
            <p className="text-center text-gray-400 mb-8">
              {completedRating.strain.name}
            </p>
            <p className="text-center text-sm text-gray-500 mb-4">
              Click and drag on the wheel to adjust ratings
            </p>

            <div className="bg-[#1a1a1a] rounded-2xl p-6 border-2 border-green-600 shadow-[0_0_20px_rgba(22,163,74,0.3),inset_0_0_30px_rgba(22,163,74,0.1)] md:p-8">
              <div className="flex justify-center mb-6">
                <RadarChart
                  ratings={editRatings}
                  onChange={setEditRatings}
                  size={350}
                  interactive={true}
                  fillColor={STRAIN_TYPE_COLORS[completedRating.strainType]}
                  fillOpacity={0.4}
                />
              </div>

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setAppState('breakdown')}
                  className="px-6 py-3 bg-[#252525] text-gray-300 rounded-lg hover:bg-[#303030] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function HomeWrapper() {
  const searchParams = useSearchParams();
  const startWithRating = searchParams.get('rate') === '1';
  const prefilledStrain = searchParams.get('strain') || undefined;
  const prefilledGenetics = searchParams.get('genetics') || undefined;
  return (
    <HomeContent
      startWithRating={startWithRating}
      prefilledStrain={prefilledStrain}
      prefilledGenetics={prefilledGenetics}
    />
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0f0f0f]" />}>
      <HomeWrapper />
    </Suspense>
  );
}
