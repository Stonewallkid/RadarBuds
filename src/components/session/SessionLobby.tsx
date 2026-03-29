'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useSessionContext } from '@/contexts/SessionContext';
import SessionChat from './SessionChat';
import ParticipantList from './ParticipantList';
import StrainSelector from './StrainSelector';
import DraggableStrainList from './DraggableStrainList';

export default function SessionLobby() {
  const {
    session,
    participants,
    sessionStrains,
    isHost,
    selectStrain,
    addToQueue,
    removeFromQueue,
    reorderQueue,
    startStrain,
    endSession,
  } = useSessionContext();

  const [showStrainSelector, setShowStrainSelector] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [selectorMode, setSelectorMode] = useState<'queue' | 'start'>('queue');
  const [showQR, setShowQR] = useState(false);

  if (!session) return null;

  // Get next unrated strain from queue
  const nextUnratedStrain = sessionStrains.find(ss => !ss.revealedAt);

  const handleSelectStrain = async (strain: { strainId?: string; strain?: { name: string; genetics: string; strainType?: string } }) => {
    if (selectorMode === 'queue') {
      await addToQueue(strain);
    } else {
      await selectStrain(strain);
    }
    setShowStrainSelector(false);
  };

  const handleStartNextStrain = async () => {
    if (nextUnratedStrain) {
      await startStrain(nextUnratedStrain.strainId);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] pt-16 pb-20">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            {session.name || 'Group Session'}
          </h1>
          <p className="text-gray-400">
            Waiting for host to select a strain...
          </p>
        </div>

        {/* Passcode Display */}
        <div className="bg-[#1a1a1a] rounded-xl p-6 mb-6 text-center">
          <p className="text-gray-400 text-sm mb-2">Share this code to invite others</p>

          {showQR ? (
            <>
              {/* QR Code */}
              <div className="flex justify-center mb-4">
                <div className="bg-white p-4 rounded-xl">
                  <QRCodeSVG
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/session/join?code=${session.passcode}`}
                    size={180}
                    level="M"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-3">Scan to join the session</p>
            </>
          ) : (
            <>
              {/* Passcode digits */}
              <div className="flex justify-center gap-2 mb-3">
                {session.passcode.split('').map((digit, i) => (
                  <div
                    key={i}
                    className="w-12 h-14 bg-[#252525] border-2 border-[#444] rounded-lg flex items-center justify-center text-2xl font-bold text-white"
                  >
                    {digit}
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="flex justify-center gap-4">
            <button
              onClick={() => setShowQR(!showQR)}
              className="text-sm text-green-400 hover:text-green-300 flex items-center gap-1"
            >
              {showQR ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                  Show Code
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  Show QR
                </>
              )}
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  showQR
                    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/session/join?code=${session.passcode}`
                    : session.passcode
                );
              }}
              className="text-sm text-green-400 hover:text-green-300"
            >
              {showQR ? 'Copy Link' : 'Copy Code'}
            </button>
          </div>
        </div>

        {/* Strain Queue */}
        {sessionStrains.length > 0 && (
          <div className="bg-[#1a1a1a] rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-white">
                Strain Queue ({sessionStrains.length})
              </h3>
              {session.screenSyncEnabled && (
                <span className="px-2 py-1 text-xs bg-amber-800 text-amber-100 rounded">
                  Lock Mode
                </span>
              )}
            </div>
            <DraggableStrainList
              strains={sessionStrains}
              isHost={isHost}
              currentStrainId={session.currentStrainId}
              onReorder={reorderQueue}
              onRemove={removeFromQueue}
            />
          </div>
        )}

        {/* Participants */}
        <div className="bg-[#1a1a1a] rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-white">
              Participants ({participants.filter(p => p.isOnline).length})
            </h3>
          </div>
          <ParticipantList participants={participants} hostId={session.hostId} />
        </div>

        {/* Host Controls */}
        {isHost && (
          <div className="space-y-3 mb-6">
            {/* Start next strain button (if there are queued strains) */}
            {nextUnratedStrain && (
              <button
                onClick={handleStartNextStrain}
                className="w-full py-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-500 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Start: {nextUnratedStrain.strain.name}
              </button>
            )}

            {/* Add to queue button */}
            <button
              onClick={() => {
                setSelectorMode('queue');
                setShowStrainSelector(true);
              }}
              className="w-full py-3 bg-[#252525] text-white rounded-lg font-medium hover:bg-[#333] transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Strain to Queue
            </button>

            {/* Quick start (no queue) */}
            {sessionStrains.length === 0 && (
              <button
                onClick={() => {
                  setSelectorMode('start');
                  setShowStrainSelector(true);
                }}
                className="w-full py-3 bg-[#333] text-gray-300 rounded-lg font-medium hover:bg-[#404040] transition-colors"
              >
                Or select strain to start immediately
              </button>
            )}

            <button
              onClick={() => {
                if (confirm('Are you sure you want to end this session?')) {
                  endSession();
                }
              }}
              className="w-full py-3 bg-[#1a1a1a] text-gray-500 rounded-lg font-medium hover:bg-[#252525] transition-colors border border-[#333]"
            >
              End Session
            </button>
          </div>
        )}

        {/* Chat Toggle (Mobile) */}
        <button
          onClick={() => setShowChat(!showChat)}
          className="fixed bottom-4 right-4 w-14 h-14 bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-green-500 transition-colors z-40"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>

        {/* Chat Panel */}
        {showChat && (
          <div className="fixed inset-0 z-50 bg-[#0f0f0f]">
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-[#333]">
                <h3 className="font-medium text-white">Chat</h3>
                <button
                  onClick={() => setShowChat(false)}
                  className="p-2 text-gray-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <SessionChat />
            </div>
          </div>
        )}

        {/* Strain Selector Modal */}
        {showStrainSelector && (
          <StrainSelector
            onSelect={handleSelectStrain}
            onClose={() => setShowStrainSelector(false)}
          />
        )}
      </div>
    </div>
  );
}
