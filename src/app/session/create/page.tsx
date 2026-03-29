'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateSessionPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [sessionName, setSessionName] = useState('');
  const [screenSyncEnabled, setScreenSyncEnabled] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    setIsCreating(true);
    setError('');

    try {
      // Generate a participant ID for this session
      const participantId = `host_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostId: participantId,
          hostName: displayName.trim(),
          name: sessionName.trim() || null,
          screenSyncEnabled,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to create session');
      }

      const data = await res.json();

      // Store session info in localStorage
      localStorage.setItem(`radarbuds_session_${data.session.id}`, JSON.stringify({
        participantId,
        displayName: displayName.trim(),
        isHost: true,
        passcode: data.session.passcode,
      }));

      // Navigate to the session
      router.push(`/session/${data.session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] pt-16 px-4">
      <div className="max-w-md mx-auto">
        {/* Back link */}
        <Link
          href="/session/join"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 text-sm"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to Join
        </Link>

        <h1 className="text-2xl font-bold text-white mb-2">
          Host a Session
        </h1>
        <p className="text-gray-400 mb-8">
          Create a session and share the code with your friends
        </p>

        <form onSubmit={handleCreate} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Your Name *
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="How should others see you?"
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-green-600 focus:border-transparent"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Session Name <span className="text-gray-600">(optional)</span>
            </label>
            <input
              type="text"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="e.g., Friday Night Sesh"
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-green-600 focus:border-transparent"
            />
          </div>

          {/* Lock Mode Toggle */}
          <div className="p-4 bg-[#1a1a1a] border border-[#333] rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">Lock Mode</p>
                <p className="text-sm text-gray-500 mt-1">
                  Control which question all guests see
                </p>
              </div>
              <button
                type="button"
                onClick={() => setScreenSyncEnabled(!screenSyncEnabled)}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  screenSyncEnabled ? 'bg-green-600' : 'bg-[#333]'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                    screenSyncEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            {screenSyncEnabled && (
              <p className="text-xs text-amber-400 mt-3">
                Guests will stay on the same question as you. Use this for guided sessions.
              </p>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!displayName.trim() || isCreating}
            className={`w-full py-4 rounded-lg font-medium text-lg transition-colors ${
              displayName.trim() && !isCreating
                ? 'bg-green-600 text-white hover:bg-green-500'
                : 'bg-[#333] text-gray-500 cursor-not-allowed'
            }`}
          >
            {isCreating ? 'Creating...' : 'Create Session'}
          </button>
        </form>

        <div className="mt-8 p-4 bg-[#1a1a1a] rounded-lg border border-[#252525]">
          <h3 className="text-sm font-medium text-white mb-2">As the host, you can:</h3>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• Pre-load multiple strains in a queue</li>
            <li>• Control the rating pace with Lock Mode</li>
            <li>• Reveal ratings when everyone has submitted</li>
            <li>• Compare all strains side-by-side at the end</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
