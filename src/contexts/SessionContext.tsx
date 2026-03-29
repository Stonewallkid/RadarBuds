'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useSession, UseSessionReturn } from '@/hooks/useSession';

interface SessionContextType extends UseSessionReturn {
  participantId: string;
  displayName: string;
  isHost: boolean;
}

const SessionContext = createContext<SessionContextType | null>(null);

interface SessionProviderProps {
  children: ReactNode;
  sessionId: string;
  participantId: string;
  displayName: string;
  isHost: boolean;
}

export function SessionProvider({
  children,
  sessionId,
  participantId,
  displayName,
  isHost,
}: SessionProviderProps) {
  const sessionData = useSession({
    sessionId,
    participantId,
    displayName,
    isHost,
  });

  return (
    <SessionContext.Provider
      value={{
        ...sessionData,
        participantId,
        displayName,
        isHost,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSessionContext() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSessionContext must be used within SessionProvider');
  }
  return context;
}

export { SessionContext };
