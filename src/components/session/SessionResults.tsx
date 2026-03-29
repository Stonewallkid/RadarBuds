'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionContext } from '@/contexts/SessionContext';
import RadarChart from '@/components/RadarChart';
import { EffectRatings, createEmptyRatings } from '@/types/strain';

interface RevealedRating {
  participantId: string;
  participantName: string;
  effectRatings: EffectRatings;
  strainType: string;
  overallRating: number;
}

interface RevealedData {
  strain: {
    id: string;
    name: string;
    genetics: string | null;
    strainType: string | null;
  };
  ratings: RevealedRating[];
  summary: {
    participantCount: number;
    avgOverallRating: number;
    avgEffectRatings: EffectRatings;
  };
}

// Colors for different participants
const participantColors = [
  '#22c55e', // green
  '#3b82f6', // blue
  '#ef4444', // red
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
];

interface StrainStats {
  avgProfile: EffectRatings;
  ratingCount: number;
  avgOverallRating: number;
}

export default function SessionResults() {
  const router = useRouter();
  const {
    session,
    sessionStrains,
    isHost,
    nextStrain,
    endSession,
    participantId,
  } = useSessionContext();

  const [revealedData, setRevealedData] = useState<RevealedData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleParticipants, setVisibleParticipants] = useState<Set<string>>(new Set());
  const [allInitialized, setAllInitialized] = useState(false);
  const [strainStats, setStrainStats] = useState<StrainStats | null>(null);
  const [showAllReviews, setShowAllReviews] = useState(false);

  // Fetch revealed ratings
  useEffect(() => {
    const fetchRevealed = async () => {
      if (!session?.id) return;

      // Find the current session strain
      const currentSessionStrain = sessionStrains.find(
        (ss) => ss.strainId === session.currentStrainId && ss.revealedAt
      );

      if (!currentSessionStrain) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `/api/sessions/${session.id}/reveal?sessionStrainId=${currentSessionStrain.id}`
        );
        if (res.ok) {
          const data = await res.json();
          setRevealedData(data);
        }
      } catch (err) {
        console.error('Failed to fetch revealed ratings:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRevealed();
  }, [session?.id, session?.currentStrainId, sessionStrains]);

  // Initialize visible participants when data loads
  useEffect(() => {
    if (revealedData && !allInitialized) {
      // Show all participants by default
      setVisibleParticipants(new Set(revealedData.ratings.map(r => r.participantId)));
      setAllInitialized(true);
    }
  }, [revealedData, allInitialized]);

  // Fetch overall strain stats (all reviews, not just this session)
  useEffect(() => {
    const fetchStrainStats = async () => {
      if (!revealedData?.strain?.id) return;

      try {
        const res = await fetch(`/api/strains/${revealedData.strain.id}/stats`);
        if (res.ok) {
          const stats = await res.json();
          if (stats.avgProfile && stats.ratingCount > 0) {
            setStrainStats(stats);
          }
        }
      } catch (err) {
        console.error('Failed to fetch strain stats:', err);
      }
    };

    fetchStrainStats();
  }, [revealedData?.strain?.id]);

  // Chart size
  const [chartSize, setChartSize] = useState(300);
  useEffect(() => {
    const updateSize = () => {
      const width = window.innerWidth;
      setChartSize(Math.min(width - 40, 360));
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);


  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!revealedData) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-400">No results available yet.</p>
        </div>
      </div>
    );
  }

  // Find current user's rating
  const myRating = revealedData.ratings.find((r) => r.participantId === participantId);

  // Toggle individual participant visibility
  const toggleParticipant = (id: string) => {
    setVisibleParticipants(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Toggle all participants
  const toggleAll = () => {
    if (visibleParticipants.size === revealedData.ratings.length) {
      // All visible -> hide all
      setVisibleParticipants(new Set());
    } else {
      // Some or none visible -> show all
      setVisibleParticipants(new Set(revealedData.ratings.map(r => r.participantId)));
    }
  };

  // Get color for a participant (use their assigned color, current user gets dashed outline)
  const getParticipantColor = (index: number) => {
    return participantColors[index % participantColors.length];
  };

  // Render stars with half-star support
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.25 && rating - fullStars < 0.75;
    const roundUp = rating - fullStars >= 0.75;

    for (let i = 0; i < 10; i++) {
      if (i < fullStars || (roundUp && i === fullStars)) {
        // Full star
        stars.push(<span key={i}>★</span>);
      } else if (hasHalfStar && i === fullStars) {
        // Half star using CSS clip
        stars.push(
          <span key={i} className="relative inline-block">
            <span className="text-gray-600">☆</span>
            <span className="absolute left-0 top-0 overflow-hidden" style={{ width: '50%' }}>★</span>
          </span>
        );
      } else {
        // Empty star
        stars.push(<span key={i} className="text-gray-600">☆</span>);
      }
    }
    return stars;
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] pt-16 pb-24 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Strain Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">
            {revealedData.strain.name}
          </h1>
          <p className="text-gray-400">
            {revealedData.strain.genetics || revealedData.strain.strainType || 'Unknown'}
          </p>
        </div>

        {/* Average Rating */}
        <div className="bg-[#1a1a1a] rounded-xl p-4 mb-6 text-center">
          <div className="text-3xl font-bold text-yellow-500 mb-1 flex justify-center">
            {renderStars(revealedData.summary.avgOverallRating)}
          </div>
          <p className="text-white font-medium">
            {revealedData.summary.avgOverallRating.toFixed(1)} / 10
          </p>
          <p className="text-gray-500 text-sm">
            Average from {revealedData.summary.participantCount} raters
          </p>
        </div>

        {/* Overlay Chart */}
        <div className="bg-[#1a1a1a] rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-white">Effect Profiles</h3>
            <button
              onClick={toggleAll}
              className="text-sm text-green-400 hover:text-green-300"
            >
              {visibleParticipants.size === revealedData.ratings.length ? 'Hide All' : 'Show All'}
            </button>
          </div>

          {/* Toggle for all reviews heatmap */}
          {strainStats && strainStats.ratingCount > revealedData.ratings.length && (
            <div className="flex items-center justify-center gap-2 mb-4 pb-4 border-b border-[#333]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showAllReviews}
                  onChange={(e) => setShowAllReviews(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-600 bg-[#252525] text-amber-500 focus:ring-amber-500"
                />
                <span className="text-sm text-gray-300">
                  Show all reviews average
                  <span className="text-gray-500 ml-1">
                    ({strainStats.ratingCount} total ratings)
                  </span>
                </span>
              </label>
            </div>
          )}

          {/* Overlaid charts */}
          <div className="flex justify-center">
            <div className="relative" style={{ width: chartSize, height: chartSize }}>
              {/* Base chart (just the grid, no data) */}
              <div className="absolute inset-0">
                <RadarChart
                  ratings={createEmptyRatings()}
                  size={chartSize}
                  interactive={false}
                  fillColor="transparent"
                  fillOpacity={0}
                />
              </div>

              {/* All reviews average (gold/amber, behind participant charts) */}
              {showAllReviews && strainStats && (
                <div
                  className="absolute inset-0 transition-opacity duration-200"
                  style={{ opacity: 0.8, pointerEvents: 'none' }}
                >
                  <RadarChart
                    ratings={strainStats.avgProfile}
                    size={chartSize}
                    interactive={false}
                    fillColor="#f59e0b"
                    fillOpacity={0.25}
                  />
                </div>
              )}

              {/* Each participant's chart overlaid */}
              {revealedData.ratings.map((rating, i) => {
                const isVisible = visibleParticipants.has(rating.participantId);
                const isMe = rating.participantId === participantId;
                const color = getParticipantColor(i);

                return (
                  <div
                    key={rating.participantId}
                    className="absolute inset-0 transition-opacity duration-200"
                    style={{ opacity: isVisible ? 1 : 0, pointerEvents: 'none' }}
                  >
                    <RadarChart
                      ratings={rating.effectRatings}
                      size={chartSize}
                      interactive={false}
                      fillColor={color}
                      fillOpacity={0.2}
                      strokeDashed={isMe}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend - clickable to toggle visibility */}
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {/* All reviews legend item */}
            {showAllReviews && strainStats && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-900/30 ring-1 ring-amber-500/50">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-xs text-amber-300">
                  All Reviews Avg ({strainStats.ratingCount})
                </span>
              </div>
            )}
            {revealedData.ratings.map((rating, i) => {
              const isVisible = visibleParticipants.has(rating.participantId);
              const isMe = rating.participantId === participantId;
              const color = getParticipantColor(i);

              return (
                <button
                  key={rating.participantId}
                  onClick={() => toggleParticipant(rating.participantId)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-full transition-all ${
                    isVisible
                      ? 'bg-[#333]'
                      : 'bg-[#1a1a1a] opacity-50'
                  } ${isMe ? 'ring-1 ring-white/50' : ''}`}
                >
                  <div
                    className={`w-3 h-3 rounded-full transition-opacity ${isVisible ? '' : 'opacity-30'} ${isMe ? 'ring-1 ring-white' : ''}`}
                    style={{ backgroundColor: color, borderStyle: isMe ? 'dashed' : 'solid' }}
                  />
                  <span className={`text-xs ${isVisible ? 'text-gray-300' : 'text-gray-500'}`}>
                    {rating.participantName}
                    {isMe && ' (You)'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Individual Scores */}
        <div className="bg-[#1a1a1a] rounded-xl p-4 mb-6">
          <h3 className="font-medium text-white mb-3">Individual Ratings</h3>
          <div className="space-y-3">
            {revealedData.ratings.map((rating, i) => {
              const isMe = rating.participantId === participantId;
              const color = getParticipantColor(i);

              return (
                <div
                  key={rating.participantId}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    isMe
                      ? 'bg-white/10 border border-dashed border-white/50'
                      : 'bg-[#252525]'
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-medium"
                    style={{
                      backgroundColor: color,
                      color: '#ffffff',
                    }}
                  >
                    {rating.participantName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">
                      {rating.participantName}
                      {isMe && (
                        <span className="text-xs text-white/60 ml-2">(You)</span>
                      )}
                    </p>
                    <p className="text-sm text-gray-500">
                      Type: {rating.strainType}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-white">{rating.overallRating}</p>
                    <p className="text-xs text-gray-500">/ 10</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Host Controls */}
        {isHost && (
          <div className="space-y-3">
            {/* Check if all strains in the queue have been rated */}
            {sessionStrains.length > 0 && sessionStrains.every(ss => ss.revealedAt) ? (
              <>
                <button
                  onClick={() => router.push(`/session/${session?.id}/summary`)}
                  className="w-full py-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-500 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  View Final Summary
                </button>
                <button
                  onClick={nextStrain}
                  className="w-full py-3 bg-[#252525] text-white rounded-lg font-medium hover:bg-[#333]"
                >
                  Rate Another Strain
                </button>
              </>
            ) : (
              <button
                onClick={nextStrain}
                className="w-full py-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-500"
              >
                Rate Another Strain
              </button>
            )}
            <button
              onClick={() => {
                if (confirm('End this session?')) {
                  endSession();
                }
              }}
              className="w-full py-3 bg-[#252525] text-gray-400 rounded-lg font-medium hover:bg-[#333]"
            >
              End Session
            </button>
          </div>
        )}

        {/* Non-host message/actions */}
        {!isHost && (
          <div className="space-y-3">
            {/* Show View Summary button if all strains are done */}
            {sessionStrains.length > 0 && sessionStrains.every(ss => ss.revealedAt) && (
              <button
                onClick={() => router.push(`/session/${session?.id}/summary`)}
                className="w-full py-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-500 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                View Final Summary
              </button>
            )}
            <div className="text-center text-gray-500">
              Waiting for host to continue...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
