'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import RatingWizard from '@/components/RatingWizard';
import RadarChart from '@/components/RadarChart';
import { createEmptyRatings, StrainInfo, StrainType, BudAppearance, EffectRatings, STRAIN_TYPE_COLORS } from '@/types/strain';

interface RatingResult {
  strain: StrainInfo;
  strainType: StrainType;
  budAppearance?: BudAppearance;
  ratings: EffectRatings;
  overallRating: number;
  displayName?: string;
}

function HomeContent() {
  const searchParams = useSearchParams();
  const [showWizard, setShowWizard] = useState(false);
  const [completedRating, setCompletedRating] = useState<RatingResult | null>(null);
  const [chartSize, setChartSize] = useState(300);

  // Check for ?rate=1 in URL to auto-open wizard
  useEffect(() => {
    if (searchParams.get('rate') === '1') {
      setShowWizard(true);
    }
  }, [searchParams]);

  // Calculate chart size
  useEffect(() => {
    const updateSize = () => {
      const width = window.innerWidth;
      setChartSize(Math.min(width - 80, 320));
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handleRatingComplete = async (data: RatingResult) => {
    setCompletedRating(data);
    setShowWizard(false);

    // TODO: Save to database via API
    console.log('Rating completed:', data);
  };

  return (
    <main className="min-h-screen bg-[#0f0f0f]">
      {/* Hero Section */}
      <section className="px-4 py-12 text-center">
        <div className="max-w-2xl mx-auto">
          {/* Cannabis leaf icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-600/20 flex items-center justify-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-green-500">
              <path
                d="M12 2C12 2 9 6 9 9C9 10.5 9.5 11.5 10 12C8.5 11.5 6 11 4 12C4 12 6 14 9 14C7 15.5 5 18 5 18C5 18 8 17 10 15.5C10 17 10 20 12 22C14 20 14 17 14 15.5C16 17 19 18 19 18C19 18 17 15.5 15 14C18 14 20 12 20 12C18 11 15.5 11.5 14 12C14.5 11.5 15 10.5 15 9C15 6 12 2 12 2Z"
                fill="currentColor"
              />
            </svg>
          </div>

          <h1 className="text-4xl font-bold text-white mb-4">
            Rate Cannabis Strains
          </h1>
          <p className="text-gray-400 text-lg mb-8">
            Build your effect profile with our interactive 13-dimension radar chart.
            Discover strains that match your preferences.
          </p>

          <button
            onClick={() => setShowWizard(true)}
            className="px-8 py-4 bg-green-600 text-white text-lg font-medium rounded-xl hover:bg-green-500 transition-colors"
          >
            Rate a Strain
          </button>
        </div>
      </section>

      {/* Demo Radar Chart */}
      <section className="px-4 py-8">
        <div className="max-w-md mx-auto">
          <div className="bg-[#1a1a1a] rounded-xl p-6">
            <h2 className="text-lg font-medium text-white text-center mb-4">
              Interactive Effect Radar
            </h2>
            <div className="flex justify-center">
              <RadarChart
                ratings={createEmptyRatings()}
                size={chartSize}
                interactive={false}
                fillColor="#22c55e"
                fillOpacity={0.2}
                darkMode={true}
              />
            </div>
            <p className="text-sm text-gray-500 text-center mt-4">
              13 dimensions capture the full experience
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-12">
        <div className="max-w-4xl mx-auto grid gap-6 md:grid-cols-3">
          <div className="bg-[#1a1a1a] rounded-xl p-6">
            <div className="w-12 h-12 rounded-full bg-green-600/20 flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-green-500">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Rate Strains</h3>
            <p className="text-gray-400 text-sm">
              Rate effects like euphoria, relaxation, creativity, and more on a 0-10 scale.
            </p>
          </div>

          <div className="bg-[#1a1a1a] rounded-xl p-6">
            <div className="w-12 h-12 rounded-full bg-green-600/20 flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-green-500">
                <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
                <path d="M4 20C4 16.69 7.58 14 12 14C16.42 14 20 16.69 20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Build Your Profile</h3>
            <p className="text-gray-400 text-sm">
              Your ratings create a personal effect profile showing what you prefer.
            </p>
          </div>

          <div className="bg-[#1a1a1a] rounded-xl p-6">
            <div className="w-12 h-12 rounded-full bg-green-600/20 flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-green-500">
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                <circle cx="17" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M17 11a4 4 0 014 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Group Sessions</h3>
            <p className="text-gray-400 text-sm">
              Rate strains together with friends in real-time group sessions.
            </p>
          </div>
        </div>
      </section>

      {/* Completed Rating Display */}
      {completedRating && (
        <section className="px-4 py-8">
          <div className="max-w-md mx-auto bg-[#1a1a1a] rounded-xl p-6">
            <h2 className="text-lg font-medium text-white text-center mb-2">
              Rating Complete!
            </h2>
            <p className="text-gray-400 text-center mb-4">
              {completedRating.strain.name} - {completedRating.overallRating}/10
            </p>
            <div className="flex justify-center mb-4">
              <RadarChart
                ratings={completedRating.ratings}
                size={chartSize}
                interactive={false}
                fillColor={STRAIN_TYPE_COLORS[completedRating.strainType]}
                fillOpacity={0.4}
                darkMode={true}
              />
            </div>
            <div className="flex justify-center gap-2">
              <span
                className="px-3 py-1 rounded-full text-sm text-white"
                style={{ backgroundColor: STRAIN_TYPE_COLORS[completedRating.strainType] }}
              >
                {completedRating.strainType}
              </span>
              {completedRating.strain.thcPercent && (
                <span className="px-3 py-1 rounded-full text-sm bg-[#333] text-gray-300">
                  {completedRating.strain.thcPercent}% THC
                </span>
              )}
            </div>
            <button
              onClick={() => {
                setCompletedRating(null);
                setShowWizard(true);
              }}
              className="w-full mt-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-500 transition-colors"
            >
              Rate Another Strain
            </button>
          </div>
        </section>
      )}

      {/* Rating Wizard Modal */}
      {showWizard && (
        <RatingWizard
          onComplete={handleRatingComplete}
          onCancel={() => setShowWizard(false)}
        />
      )}
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </main>
    }>
      <HomeContent />
    </Suspense>
  );
}
