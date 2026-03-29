'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface Participant {
  id: string;
  participantId: string;
  displayName: string;
  isHost: boolean;
  isOnline: boolean;
  lastSeen: string;
}

export interface SessionStrain {
  id: string;
  strainId: string;
  strain: {
    id: string;
    name: string;
    genetics: string | null;
    strainType: string;
  };
  orderIndex: number;
  revealedAt: string | null;
}

export interface Session {
  id: string;
  passcode: string;
  name: string | null;
  status: 'waiting' | 'rating' | 'reviewing' | 'ended';
  hostId: string;
  hostName: string;
  currentStrainId: string | null;
  currentStrain: {
    id: string;
    name: string;
    genetics: string | null;
    strainType: string;
  } | null;
  screenSyncEnabled: boolean;
  currentPhase: string | null;
  createdAt: string;
}

export interface SessionMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  type: 'chat' | 'system';
  createdAt: string;
}

export interface RatingStatus {
  sessionStrainId: string;
  submitted: Array<{
    participantId: string;
    participantName: string;
    submittedAt: string;
  }>;
  total: number;
  onlineCount: number;
  allSubmitted: boolean;
}

export interface UseSessionOptions {
  sessionId: string;
  participantId: string;
  displayName: string;
  isHost: boolean;
}

export interface UseSessionReturn {
  // Data
  session: Session | null;
  participants: Participant[];
  messages: SessionMessage[];
  sessionStrains: SessionStrain[];
  ratingStatus: RatingStatus | null;

  // State
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  sendMessage: (message: string) => Promise<void>;
  selectStrain: (strain: { strainId?: string; strain?: { name: string; genetics?: string; strainType?: string } }) => Promise<void>;
  submitRating: (rating: {
    effectRatings: Record<string, number>;
    strainType: string;
    budAppearance?: string;
    overallRating: number;
    notes?: string;
  }) => Promise<{ allSubmitted: boolean }>;
  revealRatings: () => Promise<void>;
  nextStrain: () => Promise<void>;
  endSession: () => Promise<void>;
  leaveSession: () => Promise<void>;
  refetch: () => Promise<void>;

  // Strain Queue Actions
  addToQueue: (strain: { strainId?: string; strain?: { name: string; genetics?: string; strainType?: string } }) => Promise<void>;
  removeFromQueue: (sessionStrainId: string) => Promise<void>;
  reorderQueue: (reorder: Array<{ sessionStrainId: string; newOrderIndex: number }>) => Promise<void>;
  startStrain: (strainId: string) => Promise<void>;

  // Screen Sync Actions
  advancePhase: () => Promise<void>;
}

// Polling interval in milliseconds
const POLL_INTERVAL = 2000; // Poll every 2 seconds

export function useSession({
  sessionId,
  participantId,
  displayName,
  isHost,
}: UseSessionOptions): UseSessionReturn {
  const [session, setSession] = useState<Session | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<SessionMessage[]>([]);
  const [sessionStrains, setSessionStrains] = useState<SessionStrain[]>([]);
  const [ratingStatus, setRatingStatus] = useState<RatingStatus | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageIdRef = useRef<string | null>(null);

  // Fetch session data
  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError('Session not found');
          return false;
        }
        throw new Error('Failed to fetch session');
      }
      const data = await res.json();

      setSession({
        id: data.id,
        passcode: data.passcode,
        name: data.name,
        status: data.status,
        hostId: data.hostId,
        hostName: data.hostName,
        currentStrainId: data.currentStrainId,
        currentStrain: data.currentStrain,
        screenSyncEnabled: data.screenSyncEnabled || false,
        currentPhase: data.currentPhase || null,
        createdAt: data.createdAt,
      });

      setParticipants(data.participants || []);
      setSessionStrains(data.sessionStrains || []);
      return true;
    } catch (err) {
      console.error('Error fetching session:', err);
      return false;
    }
  }, [sessionId]);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/messages?limit=100`);
      if (!res.ok) throw new Error('Failed to fetch messages');
      const data = await res.json();

      // Only update if we have new messages
      if (data.length > 0) {
        const latestId = data[data.length - 1].id;
        if (latestId !== lastMessageIdRef.current) {
          setMessages(data);
          lastMessageIdRef.current = latestId;
        }
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  }, [sessionId]);

  // Fetch rating status
  const fetchRatingStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/ratings`);
      if (!res.ok) throw new Error('Failed to fetch rating status');
      const data = await res.json();
      setRatingStatus(data);
    } catch (err) {
      console.error('Failed to fetch rating status:', err);
    }
  }, [sessionId]);

  // Update participant presence (heartbeat)
  const updatePresence = useCallback(async () => {
    try {
      await fetch(`/api/sessions/${sessionId}/presence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId }),
      });
    } catch {
      // Silently fail - presence is not critical
    }
  }, [sessionId, participantId]);

  // Poll for updates
  const poll = useCallback(async () => {
    await fetchSession();
    await fetchMessages();

    // Only fetch rating status if we're in rating mode
    if (session?.status === 'rating' && session?.currentStrainId) {
      await fetchRatingStatus();
    }

    // Update our presence
    await updatePresence();
  }, [fetchSession, fetchMessages, fetchRatingStatus, updatePresence, session?.status, session?.currentStrainId]);

  // Initialize and start polling
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Initial fetch
        const success = await fetchSession();
        if (!success) {
          setIsLoading(false);
          return;
        }

        await fetchMessages();
        await updatePresence();

        if (mounted) {
          setIsConnected(true);
          setIsLoading(false);

          // Start polling
          pollingRef.current = setInterval(() => {
            if (mounted) {
              poll();
            }
          }, POLL_INTERVAL);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Connection failed');
          setIsLoading(false);
        }
      }
    };

    init();

    return () => {
      mounted = false;
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [sessionId, participantId, displayName, isHost, fetchSession, fetchMessages, updatePresence, poll]);

  // Fetch rating status when session changes to rating
  useEffect(() => {
    if (session?.status === 'rating' && session?.currentStrainId) {
      fetchRatingStatus();
    }
  }, [session?.status, session?.currentStrainId, fetchRatingStatus]);

  // Actions
  const sendMessage = useCallback(async (message: string) => {
    const res = await fetch(`/api/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderId: participantId, senderName: displayName, message }),
    });

    if (!res.ok) throw new Error('Failed to send message');

    // Immediately fetch messages to show the new one
    await fetchMessages();
  }, [sessionId, participantId, displayName, fetchMessages]);

  const selectStrain = useCallback(async (strain: { strainId?: string; strain?: { name: string; genetics?: string; strainType?: string } }) => {
    const res = await fetch(`/api/sessions/${sessionId}/strains`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...strain, hostId: participantId }),
    });

    if (!res.ok) throw new Error('Failed to select strain');

    // Immediately refetch session to get updated state
    await fetchSession();
  }, [sessionId, participantId, fetchSession]);

  const submitRating = useCallback(async (rating: {
    effectRatings: Record<string, number>;
    strainType: string;
    budAppearance?: string;
    overallRating: number;
    notes?: string;
  }) => {
    const res = await fetch(`/api/sessions/${sessionId}/ratings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...rating,
        participantId,
        participantName: displayName,
      }),
    });

    if (!res.ok) throw new Error('Failed to submit rating');

    const data = await res.json();

    // Immediately fetch rating status
    await fetchRatingStatus();

    return { allSubmitted: data.allSubmitted };
  }, [sessionId, participantId, displayName, fetchRatingStatus]);

  const revealRatings = useCallback(async () => {
    const res = await fetch(`/api/sessions/${sessionId}/reveal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hostId: participantId }),
    });

    if (!res.ok) throw new Error('Failed to reveal ratings');

    // Immediately refetch session
    await fetchSession();
  }, [sessionId, participantId, fetchSession]);

  const nextStrain = useCallback(async () => {
    const res = await fetch(`/api/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'waiting', hostId: participantId }),
    });

    if (!res.ok) throw new Error('Failed to go to next strain');

    // Refetch and clear rating status
    await fetchSession();
    setRatingStatus(null);
  }, [sessionId, participantId, fetchSession]);

  const endSession = useCallback(async () => {
    const res = await fetch(`/api/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endSession: true, hostId: participantId }),
    });

    if (!res.ok) throw new Error('Failed to end session');

    await fetchSession();
  }, [sessionId, participantId, fetchSession]);

  const leaveSession = useCallback(async () => {
    await fetch(`/api/sessions/${sessionId}/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId }),
    });

    // Stop polling when leaving
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, [sessionId, participantId]);

  const refetch = useCallback(async () => {
    await fetchSession();
    await fetchMessages();
    if (session?.currentStrainId) {
      await fetchRatingStatus();
    }
  }, [fetchSession, fetchMessages, fetchRatingStatus, session?.currentStrainId]);

  // Strain Queue Actions
  const addToQueue = useCallback(async (strain: { strainId?: string; strain?: { name: string; genetics?: string; strainType?: string } }) => {
    const res = await fetch(`/api/sessions/${sessionId}/strains`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...strain, hostId: participantId, addToQueue: true }),
    });

    if (!res.ok) throw new Error('Failed to add strain to queue');

    // Immediately refetch session to get updated strain list
    await fetchSession();
  }, [sessionId, participantId, fetchSession]);

  const removeFromQueue = useCallback(async (sessionStrainId: string) => {
    const res = await fetch(`/api/sessions/${sessionId}/strains`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionStrainId, hostId: participantId }),
    });

    if (!res.ok) throw new Error('Failed to remove strain from queue');

    await fetchSession();
  }, [sessionId, participantId, fetchSession]);

  const reorderQueue = useCallback(async (reorder: Array<{ sessionStrainId: string; newOrderIndex: number }>) => {
    const res = await fetch(`/api/sessions/${sessionId}/strains`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reorder, hostId: participantId }),
    });

    if (!res.ok) throw new Error('Failed to reorder strains');

    await fetchSession();
  }, [sessionId, participantId, fetchSession]);

  const startStrain = useCallback(async (strainId: string) => {
    const res = await fetch(`/api/sessions/${sessionId}/strains`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ strainId, hostId: participantId, startRating: true }),
    });

    if (!res.ok) throw new Error('Failed to start strain');

    await fetchSession();
  }, [sessionId, participantId, fetchSession]);

  // Screen Sync Actions
  const advancePhase = useCallback(async () => {
    if (!session?.screenSyncEnabled) return;

    // Calculate next phase
    const currentPhase = session.currentPhase;
    let nextPhase = 'type';

    if (currentPhase) {
      if (currentPhase === 'type') {
        nextPhase = 'effect-0';
      } else if (currentPhase.startsWith('effect-')) {
        const idx = parseInt(currentPhase.split('-')[1], 10);
        if (idx < 12) {
          nextPhase = `effect-${idx + 1}`;
        } else {
          nextPhase = 'overall';
        }
      }
      // If already at 'overall', stay there
      else if (currentPhase === 'overall') {
        nextPhase = 'overall';
      }
    }

    const res = await fetch(`/api/sessions/${sessionId}/phase`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hostId: participantId, phase: nextPhase }),
    });

    if (!res.ok) throw new Error('Failed to advance phase');

    await fetchSession();
  }, [sessionId, participantId, session?.screenSyncEnabled, session?.currentPhase, fetchSession]);

  return {
    session,
    participants,
    messages,
    sessionStrains,
    ratingStatus,
    isConnected,
    isLoading,
    error,
    sendMessage,
    selectStrain,
    submitRating,
    revealRatings,
    nextStrain,
    endSession,
    leaveSession,
    refetch,
    addToQueue,
    removeFromQueue,
    reorderQueue,
    startStrain,
    advancePhase,
  };
}
