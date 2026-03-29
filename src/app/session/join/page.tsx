'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function JoinSessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCode = searchParams.get('code') || '';

  const [displayName, setDisplayName] = useState('');
  const [passcode, setPasscode] = useState(initialCode.split(''));
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first input
  useEffect(() => {
    if (!initialCode) {
      inputRefs.current[0]?.focus();
    }
  }, [initialCode]);

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newPasscode = [...passcode];
    newPasscode[index] = value.slice(-1);
    setPasscode(newPasscode);

    // Auto-advance to next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !passcode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (text.length === 4) {
      setPasscode(text.split(''));
      inputRefs.current[3]?.focus();
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = passcode.join('');
    if (code.length !== 4 || !displayName.trim()) return;

    setIsJoining(true);
    setError('');

    try {
      // Generate a participant ID
      const participantId = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      const res = await fetch('/api/sessions/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passcode: code,
          participantId,
          displayName: displayName.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to join session');
      }

      const data = await res.json();

      // Store session info in localStorage
      localStorage.setItem(`radarbuds_session_${data.session.id}`, JSON.stringify({
        participantId,
        displayName: displayName.trim(),
        isHost: false,
        passcode: code,
      }));

      // Navigate to the session
      router.push(`/session/${data.session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join session');
      setIsJoining(false);
    }
  };

  const isPasscodeComplete = passcode.join('').length === 4;

  return (
    <div className="min-h-screen bg-[#0f0f0f] pt-16 px-4">
      <div className="max-w-md mx-auto">
        {/* Cannabis icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-700 to-green-600 flex items-center justify-center shadow-lg shadow-green-900/30">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-white">
              <path
                d="M12 2C12 2 9 6 9 9C9 10.5 9.5 11.5 10 12C8.5 11.5 6 11 4 12C4 12 6 14 9 14C7 15.5 5 18 5 18C5 18 8 17 10 15.5C10 17 10 20 12 22C14 20 14 17 14 15.5C16 17 19 18 19 18C19 18 17 15.5 15 14C18 14 20 12 20 12C18 11 15.5 11.5 14 12C14.5 11.5 15 10.5 15 9C15 6 12 2 12 2Z"
                fill="currentColor"
                fillOpacity="0.3"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white text-center mb-2">
          Group Session
        </h1>
        <p className="text-gray-400 text-center mb-8">
          Enter the 4-digit code from your host to join
        </p>

        <form onSubmit={handleJoin} className="space-y-6">
          {/* Passcode input */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-3 text-center">
              Session Code
            </label>
            <div className="flex justify-center gap-3" onPaste={handlePaste}>
              {[0, 1, 2, 3].map((index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={passcode[index] || ''}
                  onChange={(e) => handleDigitChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-16 h-20 text-center text-3xl font-bold bg-[#1a1a1a] border-2 border-[#333] rounded-xl text-white focus:ring-2 focus:ring-green-600 focus:border-green-600 transition-all"
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Your Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="How should others see you?"
              className="w-full px-4 py-4 bg-[#1a1a1a] border border-[#333] rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-green-600 focus:border-transparent text-lg"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!isPasscodeComplete || !displayName.trim() || isJoining}
            className={`w-full py-4 rounded-xl font-medium text-lg transition-all ${
              isPasscodeComplete && displayName.trim() && !isJoining
                ? 'bg-green-600 text-white hover:bg-green-500 shadow-lg shadow-green-900/30'
                : 'bg-[#333] text-gray-500 cursor-not-allowed'
            }`}
          >
            {isJoining ? 'Joining...' : 'Join Session'}
          </button>
        </form>

        {/* Host section - secondary */}
        <div className="mt-12 pt-8 border-t border-[#252525]">
          <p className="text-gray-500 text-sm text-center mb-3">
            Want to host your own session?
          </p>
          <Link
            href="/session/create"
            className="block w-full py-3 text-center text-gray-400 hover:text-white border border-[#333] hover:border-[#444] rounded-lg transition-colors text-sm"
          >
            Host a Session
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function JoinSessionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <JoinSessionContent />
    </Suspense>
  );
}
