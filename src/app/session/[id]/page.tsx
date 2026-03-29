'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SessionProvider, useSessionContext } from '@/contexts/SessionContext';
import SessionLobby from '@/components/session/SessionLobby';
import SessionRating from '@/components/session/SessionRating';
import SessionResults from '@/components/session/SessionResults';

interface SessionInfo {
  participantId: string;
  displayName: string;
  isHost: boolean;
  passcode: string;
}

function SessionContent() {
  const { session, isLoading, error } = useSessionContext();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Connecting to session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">😔</div>
          <h2 className="text-xl font-bold text-white mb-2">Connection Error</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <Link
            href="/session/join"
            className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500"
          >
            Try Again
          </Link>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">🌿</div>
          <h2 className="text-xl font-bold text-white mb-2">Session Not Found</h2>
          <p className="text-gray-400 mb-6">This session may have ended or doesn&apos;t exist.</p>
          <Link
            href="/session/join"
            className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500"
          >
            Join Another Session
          </Link>
        </div>
      </div>
    );
  }

  if (session.status === 'ended') {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">🎉</div>
          <h2 className="text-xl font-bold text-white mb-2">Session Complete!</h2>
          <p className="text-gray-400 mb-6">
            Thanks for participating in {session.name || 'this session'}!
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // Render based on session status
  switch (session.status) {
    case 'waiting':
      return <SessionLobby />;
    case 'rating':
      return <SessionRating />;
    case 'reviewing':
      return <SessionResults />;
    default:
      return <SessionLobby />;
  }
}

export default function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check for stored session info
    const stored = localStorage.getItem(`radarbuds_session_${id}`);
    if (stored) {
      try {
        const info = JSON.parse(stored);
        setSessionInfo(info);
      } catch {
        // Invalid stored data, redirect to join
        router.push(`/session/join?code=`);
      }
    } else {
      // No stored info, redirect to join
      router.push(`/session/join`);
    }
    setIsChecking(false);
  }, [id, router]);

  if (isChecking || !sessionInfo) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <SessionProvider
      sessionId={id}
      participantId={sessionInfo.participantId}
      displayName={sessionInfo.displayName}
      isHost={sessionInfo.isHost}
    >
      <SessionContent />
    </SessionProvider>
  );
}
