'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import RadarChart from '@/components/RadarChart';
import { EffectRatings, STRAIN_TYPE_COLORS, StrainType } from '@/types/strain';

interface RatingItem {
  ratingId: string;
  strainId: string;
  name: string;
  genetics: string | null;
  strainType: string;
  rating: number;
}

interface EffectProfile {
  hasProfile: boolean;
  message?: string;
  ratingCount?: number;
  avgProfile?: EffectRatings;
  topDimensions?: string[];
  lowDimensions?: string[];
  preferredTypes?: { type: string; count: number }[];
  preferredGenetics?: { genetics: string; count: number; avgRating: number }[];
  avgOverallRating?: number;
  topRatedStrains?: {
    ratingId: string;
    strainId: string;
    name: string;
    genetics: string | null;
    strainType: string;
    rating: number;
  }[];
  allRatings?: RatingItem[];
  profileSummary?: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<EffectProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<RatingItem | null>(null);

  const handleDeleteRating = async (rating: RatingItem) => {
    if (!userId) return;

    setDeletingId(rating.ratingId);
    try {
      const response = await fetch(`/api/ratings/${rating.ratingId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        // Remove from local state
        setProfile(prev => {
          if (!prev) return prev;
          const newAllRatings = prev.allRatings?.filter(r => r.ratingId !== rating.ratingId);
          const newTopRated = prev.topRatedStrains?.filter(r => r.ratingId !== rating.ratingId);
          return {
            ...prev,
            allRatings: newAllRatings,
            topRatedStrains: newTopRated,
            ratingCount: (prev.ratingCount || 1) - 1,
          };
        });
        setConfirmDelete(null);
      } else {
        console.error('Failed to delete rating');
      }
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    // Get user ID from localStorage
    const stored = localStorage.getItem('radarbuds_user');
    if (!stored) {
      setProfile({ hasProfile: false, message: 'Rate some strains to build your effect profile!' });
      setLoading(false);
      return;
    }

    let parsedUserId: string;
    try {
      const user = JSON.parse(stored);
      parsedUserId = user.id;
      setUserId(parsedUserId);
    } catch {
      setProfile({ hasProfile: false, message: 'Rate some strains to build your effect profile!' });
      setLoading(false);
      return;
    }

    // Fetch profile
    fetch(`/api/profile?userId=${parsedUserId}`)
      .then((res) => res.json())
      .then((profileData) => {
        setProfile(profileData);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch profile:', err);
        setProfile({ hasProfile: false, message: 'Failed to load profile.' });
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <p className="text-gray-400">Loading your effect profile...</p>
      </main>
    );
  }

  if (!profile?.hasProfile) {
    return (
      <main className="min-h-screen bg-[#0f0f0f] py-8 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Your Effect Profile</h1>
          <div className="bg-[#1a1a1a] rounded-2xl p-8 border-2 border-green-600/50 shadow-[0_0_20px_rgba(22,163,74,0.2)]">
            <div className="text-6xl mb-4">🌿</div>
            <p className="text-gray-400 mb-6">
              {profile?.message || 'Rate some strains to build your effect profile!'}
            </p>
            <Link
              href="/?rate=1"
              className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
            >
              Rate Your First Strain
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0f0f0f] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Your Effect Profile</h1>
          <p className="text-gray-400">
            Based on {profile.ratingCount} strain{profile.ratingCount !== 1 ? 's' : ''} you've rated
          </p>
        </div>

        {/* Summary Card */}
        <div className="bg-[#1a1a1a] rounded-2xl p-6 border-2 border-green-600/50 shadow-[0_0_20px_rgba(22,163,74,0.2)] mb-6">
          <p className="text-lg text-gray-300 italic">
            "{profile.profileSummary}"
          </p>
        </div>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Radar Chart */}
          <div className="bg-[#1a1a1a] rounded-2xl p-6 border-2 border-green-600/50 shadow-[0_0_20px_rgba(22,163,74,0.2)]">
            <h3 className="text-lg font-semibold text-white mb-4 text-center">
              Your Effect Preferences
            </h3>
            <div className="flex justify-center">
              {profile.avgProfile && (
                <RadarChart
                  ratings={profile.avgProfile}
                  size={300}
                  interactive={false}
                  fillColor="#16a34a"
                  fillOpacity={0.4}
                  darkMode={true}
                />
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-6">
            {/* Average Rating */}
            <div className="bg-[#1a1a1a] rounded-2xl p-6 border-2 border-green-600/50 shadow-[0_0_20px_rgba(22,163,74,0.2)]">
              <h3 className="text-lg font-semibold text-white mb-3">Your Rating Style</h3>
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold text-green-400">
                  {profile.avgOverallRating}
                </div>
                <div className="text-gray-400">
                  <p>Average rating given</p>
                  <p className="text-sm text-gray-500">
                    {profile.avgOverallRating && profile.avgOverallRating >= 7
                      ? 'You tend to rate generously'
                      : profile.avgOverallRating && profile.avgOverallRating <= 5
                      ? 'You have high standards'
                      : 'You rate fairly'}
                  </p>
                </div>
              </div>
            </div>

            {/* Preferred Types */}
            {profile.preferredTypes && profile.preferredTypes.length > 0 && (
              <div className="bg-[#1a1a1a] rounded-2xl p-6 border-2 border-green-600/50 shadow-[0_0_20px_rgba(22,163,74,0.2)]">
                <h3 className="text-lg font-semibold text-white mb-3">
                  Preferred Strain Types
                </h3>
                <div className="space-y-2">
                  {profile.preferredTypes.map((t) => (
                    <div
                      key={t.type}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: STRAIN_TYPE_COLORS[t.type as StrainType] || '#16a34a' }}
                        />
                        <span className="text-gray-300">{t.type}</span>
                      </div>
                      <span className="text-gray-500 text-sm">
                        {t.count} rated
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Preferred Genetics */}
        {profile.preferredGenetics && profile.preferredGenetics.length > 0 && (
          <div className="bg-[#1a1a1a] rounded-2xl p-6 border-2 border-green-600/50 shadow-[0_0_20px_rgba(22,163,74,0.2)] mt-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Genetics You Love
            </h3>
            <div className="flex flex-wrap gap-2">
              {profile.preferredGenetics.map((g) => (
                <span
                  key={g.genetics}
                  className="px-3 py-1.5 bg-green-900/30 text-green-300 rounded-full text-sm"
                >
                  {g.genetics}
                  <span className="ml-1 text-green-400/60">★ {g.avgRating}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Top Rated Strains */}
        {profile.topRatedStrains && profile.topRatedStrains.length > 0 && (
          <div className="bg-[#1a1a1a] rounded-2xl p-6 border-2 border-green-600/50 shadow-[0_0_20px_rgba(22,163,74,0.2)] mt-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Your Top Rated Strains
            </h3>
            <div className="space-y-3">
              {profile.topRatedStrains.map((strain, index) => (
                <div
                  key={strain.strainId}
                  className="flex items-center gap-4 p-3 bg-[#252525] rounded-lg"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0
                        ? 'bg-yellow-500 text-black'
                        : index === 1
                        ? 'bg-gray-400 text-black'
                        : index === 2
                        ? 'bg-amber-700 text-white'
                        : 'bg-[#333] text-gray-400'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-white">{strain.name}</p>
                      <span
                        className="px-1.5 py-0.5 rounded text-xs text-white"
                        style={{ backgroundColor: STRAIN_TYPE_COLORS[strain.strainType as StrainType] || '#16a34a' }}
                      >
                        {strain.strainType}
                      </span>
                    </div>
                    {strain.genetics && (
                      <p className="text-sm text-gray-500">{strain.genetics}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-green-400">★</span>
                    <span className="text-lg font-bold text-white">
                      {strain.rating}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* What You Like / Don't Like */}
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          {/* High Preferences */}
          {profile.topDimensions && (
            <div className="bg-[#1a1a1a] rounded-2xl p-6 border-2 border-green-600/50 shadow-[0_0_20px_rgba(22,163,74,0.2)]">
              <h3 className="text-lg font-semibold text-white mb-3">
                Effects You Enjoy
              </h3>
              <p className="text-sm text-gray-500 mb-3">
                Characteristics you rate highly
              </p>
              <div className="space-y-2">
                {profile.topDimensions.map((dim) => (
                  <div key={dim} className="flex items-center justify-between">
                    <span className="text-gray-300">{dim}</span>
                    <span className="text-green-400 font-medium">
                      {profile.avgProfile
                        ? Math.round(profile.avgProfile[dim as keyof EffectRatings] * 10) / 10
                        : '-'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Low Preferences */}
          {profile.lowDimensions && (
            <div className="bg-[#1a1a1a] rounded-2xl p-6 border-2 border-green-600/50 shadow-[0_0_20px_rgba(22,163,74,0.2)]">
              <h3 className="text-lg font-semibold text-white mb-3">
                Effects You Prefer Less
              </h3>
              <p className="text-sm text-gray-500 mb-3">
                Characteristics you rate lower
              </p>
              <div className="space-y-2">
                {profile.lowDimensions.map((dim) => (
                  <div key={dim} className="flex items-center justify-between">
                    <span className="text-gray-300">{dim}</span>
                    <span className="text-gray-500 font-medium">
                      {profile.avgProfile
                        ? Math.round(profile.avgProfile[dim as keyof EffectRatings] * 10) / 10
                        : '-'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Find Similar Strains CTA */}
        <div className="bg-gradient-to-r from-green-900/50 to-green-800/50 rounded-2xl p-6 mt-6 text-center">
          <h3 className="text-lg font-semibold text-white mb-2">
            Find Strains That Match Your Taste
          </h3>
          <p className="text-gray-300 mb-4">
            Use your effect profile to discover new strains you'll love
          </p>
          <Link
            href="/demo"
            className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
          >
            Explore Matching Strains
          </Link>
        </div>

        {/* My Ratings - with delete option */}
        {profile.allRatings && profile.allRatings.length > 0 && (
          <div className="bg-[#1a1a1a] rounded-2xl p-6 border-2 border-green-600/50 shadow-[0_0_20px_rgba(22,163,74,0.2)] mt-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              All My Ratings
            </h3>
            <div className="space-y-2">
              {profile.allRatings.map((rating) => (
                <div
                  key={rating.ratingId}
                  className="flex items-center gap-3 p-3 bg-[#252525] rounded-lg group hover:bg-[#303030] transition-colors"
                >
                  {/* Strain type indicator */}
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: STRAIN_TYPE_COLORS[rating.strainType as StrainType] || '#16a34a' }}
                  />
                  {/* Strain info */}
                  <div className="flex-grow min-w-0">
                    <p className="font-medium text-white truncate">{rating.name}</p>
                    <p className="text-sm text-gray-500 truncate">
                      {rating.genetics || rating.strainType}
                    </p>
                  </div>
                  {/* Rating */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-green-400">★</span>
                    <span className="font-bold text-white">{rating.rating}</span>
                  </div>
                  {/* Delete button */}
                  <button
                    onClick={() => setConfirmDelete(rating)}
                    className="p-2 text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 md:opacity-100"
                    title="Delete rating"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] rounded-xl max-w-md w-full p-6 border border-[#333]">
            <h3 className="text-xl font-bold text-white mb-2">Delete Rating?</h3>
            <p className="text-gray-400 mb-4">
              Are you sure you want to delete your rating for{' '}
              <span className="text-white font-medium">{confirmDelete.name}</span>?
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-3 bg-[#252525] text-gray-300 rounded-lg hover:bg-[#303030] transition-colors"
                disabled={deletingId !== null}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteRating(confirmDelete)}
                disabled={deletingId !== null}
                className="flex-1 py-3 bg-red-700 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deletingId === confirmDelete.ratingId ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
