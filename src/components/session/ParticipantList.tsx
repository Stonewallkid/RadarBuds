'use client';

interface Participant {
  id: string;
  participantId: string;
  displayName: string;
  isHost: boolean;
  isOnline: boolean;
}

interface ParticipantListProps {
  participants: Participant[];
  hostId: string;
  submittedIds?: string[];
}

export default function ParticipantList({
  participants,
  hostId,
  submittedIds = [],
}: ParticipantListProps) {
  // Sort: host first, then online, then offline
  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.participantId === hostId) return -1;
    if (b.participantId === hostId) return 1;
    if (a.isOnline && !b.isOnline) return -1;
    if (!a.isOnline && b.isOnline) return 1;
    return 0;
  });

  return (
    <div className="space-y-2">
      {sortedParticipants.map((p) => {
        const hasSubmitted = submittedIds.includes(p.participantId);

        return (
          <div
            key={p.id}
            className={`flex items-center gap-3 p-2 rounded-lg ${
              p.isOnline ? 'bg-[#252525]' : 'bg-[#1a1a1a] opacity-60'
            }`}
          >
            {/* Avatar */}
            <div className="relative">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                  p.participantId === hostId
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                {p.displayName.charAt(0).toUpperCase()}
              </div>
              {/* Online indicator */}
              <div
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#252525] ${
                  p.isOnline ? 'bg-green-500' : 'bg-gray-500'
                }`}
              />
            </div>

            {/* Name and badges */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-white font-medium truncate">
                  {p.displayName}
                </span>
                {p.participantId === hostId && (
                  <span className="text-xs bg-green-600 text-white px-1.5 py-0.5 rounded">
                    Host
                  </span>
                )}
              </div>
              {!p.isOnline && (
                <p className="text-xs text-gray-500">Offline</p>
              )}
            </div>

            {/* Submitted check */}
            {submittedIds.length > 0 && (
              <div className="flex-shrink-0">
                {hasSubmitted ? (
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <div className="w-5 h-5 border-2 border-gray-600 rounded-full" />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
