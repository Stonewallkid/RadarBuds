'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import CompareRadarChart from '@/components/CompareRadarChart';
import RadarChart from '@/components/RadarChart';
import { EffectRatings, EFFECT_DIMENSIONS } from '@/types/strain';

// Colors for overlay visualization
const COMPARE_COLORS = [
  '#22c55e', // green
  '#3b82f6', // blue
  '#ef4444', // red
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

interface StrainSummary {
  orderIndex: number;
  strain: {
    id: string;
    name: string;
    genetics: string | null;
    strainType: string | null;
    imageUrl: string | null;
  };
  avgRatings: EffectRatings;
  avgOverall: number;
  ratingCount: number;
  participantRatings: Array<{
    participantId: string;
    participantName: string;
    effectRatings: EffectRatings;
    overallRating: number;
    strainType: string;
  }>;
  revealedAt: string | null;
}

interface SessionSummaryData {
  session: {
    id: string;
    name: string | null;
    status: string;
    createdAt: string;
    endedAt: string | null;
    hostName: string;
    screenSyncEnabled: boolean;
  };
  strains: StrainSummary[];
  participants: Array<{
    id: string;
    displayName: string;
    isHost: boolean;
    ratingCount: number;
  }>;
  totalStrains: number;
  completedStrains: number;
}

export default function SessionSummaryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: sessionId } = use(params);
  const router = useRouter();
  const [summary, setSummary] = useState<SessionSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'overlay' | 'sideBySide'>('overlay');
  const [chartSize, setChartSize] = useState(320);

  // Calculate responsive chart size
  useEffect(() => {
    const updateSize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setChartSize(Math.min(width - 60, 300));
      } else {
        setChartSize(350);
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Fetch summary data
  useEffect(() => {
    fetch(`/api/sessions/${sessionId}/summary`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load summary');
        return res.json();
      })
      .then((data) => {
        setSummary(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <p className="text-gray-400">Loading summary...</p>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Failed to load summary'}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-green-600 text-white rounded-lg"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // Prepare data for overlay chart
  const overlayStrains = summary.strains.map((s, i) => ({
    id: s.strain.id,
    name: `#${s.orderIndex + 1} ${s.strain.name}`,
    color: COMPARE_COLORS[i % COMPARE_COLORS.length],
    ratings: s.avgRatings,
  }));

  return (
    <div className="min-h-screen bg-[#0f0f0f] pt-16 pb-24 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            {summary.session.name || 'Group Session'} - Summary
          </h1>
          <p className="text-gray-400">
            {summary.strains.length} strain{summary.strains.length !== 1 ? 's' : ''} rated by {summary.participants.length} participants
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex justify-center gap-2 mb-6">
          <button
            onClick={() => setViewMode('overlay')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'overlay'
                ? 'bg-green-600 text-white'
                : 'bg-[#252525] text-gray-400 hover:bg-[#333]'
            }`}
          >
            Overlay
          </button>
          <button
            onClick={() => setViewMode('sideBySide')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'sideBySide'
                ? 'bg-green-600 text-white'
                : 'bg-[#252525] text-gray-400 hover:bg-[#333]'
            }`}
          >
            Side by Side
          </button>
        </div>

        {/* Overlay View */}
        {viewMode === 'overlay' && summary.strains.length > 0 && (
          <div className="bg-[#1a1a1a] rounded-2xl p-6 mb-8 border border-[#333]">
            <div className="flex justify-center mb-4">
              <CompareRadarChart strains={overlayStrains} size={chartSize} />
            </div>

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-3">
              {overlayStrains.map((strain, i) => (
                <div key={strain.id} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: strain.color }}
                  />
                  <span className="text-sm text-gray-300">
                    #{summary.strains[i].orderIndex + 1} {summary.strains[i].strain.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Side by Side View */}
        {viewMode === 'sideBySide' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {summary.strains
              .sort((a, b) => a.orderIndex - b.orderIndex)
              .map((strain, i) => (
                <div
                  key={strain.strain.id}
                  className="bg-[#1a1a1a] rounded-xl p-4 border border-[#333]"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                      style={{ backgroundColor: COMPARE_COLORS[i % COMPARE_COLORS.length] }}
                    >
                      {strain.orderIndex + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{strain.strain.name}</p>
                      <p className="text-sm text-gray-500">
                        {strain.strain.genetics || strain.strain.strainType || 'Unknown'}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-center mb-3">
                    <RadarChart
                      ratings={strain.avgRatings}
                      size={180}
                      interactive={false}
                      fillColor={COMPARE_COLORS[i % COMPARE_COLORS.length]}
                      fillOpacity={0.3}
                    />
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    <span className="text-yellow-500 text-lg">★</span>
                    <span className="text-xl font-bold text-white">{strain.avgOverall.toFixed(1)}</span>
                    <span className="text-sm text-gray-500">avg</span>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Strains in Order */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Strains in Order</h2>
          <div className="space-y-3">
            {summary.strains
              .sort((a, b) => a.orderIndex - b.orderIndex)
              .map((strain, i) => (
                <div
                  key={strain.strain.id}
                  className="bg-[#1a1a1a] rounded-xl p-4 border border-[#333] flex items-center gap-4"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: COMPARE_COLORS[i % COMPARE_COLORS.length] }}
                  >
                    {strain.orderIndex + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white">{strain.strain.name}</p>
                    <p className="text-sm text-gray-500">
                      {strain.strain.genetics || strain.strain.strainType || 'Unknown'}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500">★</span>
                      <span className="text-lg font-bold text-white">{strain.avgOverall.toFixed(1)}</span>
                    </div>
                    <p className="text-xs text-gray-500">{strain.ratingCount} ratings</p>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Participants */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Participants</h2>
          <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#333]">
            <div className="flex flex-wrap gap-3">
              {summary.participants.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 px-3 py-2 bg-[#252525] rounded-lg"
                >
                  <div className="w-8 h-8 rounded-full bg-[#333] flex items-center justify-center text-sm font-medium text-white">
                    {p.displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-white">{p.displayName}</span>
                  {p.isHost && (
                    <span className="text-xs text-amber-400">(Host)</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => router.push('/')}
            className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-500 transition-colors"
          >
            Back to Home
          </button>
          <button
            onClick={() => router.push('/compare')}
            className="flex-1 py-3 bg-[#252525] text-white rounded-lg font-medium hover:bg-[#333] transition-colors"
          >
            Compare More Strains
          </button>
        </div>
      </div>
    </div>
  );
}
