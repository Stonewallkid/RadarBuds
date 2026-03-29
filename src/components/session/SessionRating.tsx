'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSessionContext } from '@/contexts/SessionContext';
import RadarChart from '@/components/RadarChart';
import StrainTypeSlider from '@/components/StrainTypeSlider';
import ParticipantList from './ParticipantList';
import {
  EFFECT_DIMENSIONS,
  EffectDimension,
  EffectRatings,
  createEmptyRatings,
  StrainType,
  DIMENSION_QUESTIONS,
} from '@/types/strain';

type Step = 'strainType' | 'effect' | 'overall' | 'submitted';

// Helper to parse phase string into step/effectIndex
function parsePhase(phase: string | null): { step: Step; effectIndex: number } {
  if (!phase) return { step: 'strainType', effectIndex: 0 };
  if (phase === 'strainType') return { step: 'strainType', effectIndex: 0 };
  if (phase === 'overall') return { step: 'overall', effectIndex: 0 };
  if (phase.startsWith('effect-')) {
    const idx = parseInt(phase.split('-')[1], 10);
    return { step: 'effect', effectIndex: idx };
  }
  return { step: 'strainType', effectIndex: 0 };
}

export default function SessionRating() {
  const {
    session,
    participants,
    ratingStatus,
    isHost,
    submitRating,
    revealRatings,
    advancePhase,
  } = useSessionContext();

  // Local step/effect tracking (used when not in sync mode)
  const [localStep, setLocalStep] = useState<Step>('strainType');
  const [localEffectIndex, setLocalEffectIndex] = useState(0);
  const [strainType, setStrainType] = useState<StrainType>('Balanced Hybrid');
  const [ratings, setRatings] = useState<EffectRatings>(createEmptyRatings());
  const [overallRating, setOverallRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // Screen sync mode detection
  const isScreenSyncEnabled = session?.screenSyncEnabled || false;

  // In sync mode, non-hosts follow the session's currentPhase
  // Host always uses local state to advance, then updates session
  const { step: syncStep, effectIndex: syncEffectIndex } = parsePhase(session?.currentPhase || null);

  // Effective step/effectIndex based on mode
  const step = isScreenSyncEnabled && !isHost ? syncStep : localStep;
  const effectIndex = isScreenSyncEnabled && !isHost ? syncEffectIndex : localEffectIndex;

  // Setter wrappers for step
  const setStep = (newStep: Step) => {
    setLocalStep(newStep);
  };
  const setEffectIndex = (newIndex: number) => {
    setLocalEffectIndex(newIndex);
  };

  const currentDimension = EFFECT_DIMENSIONS[effectIndex] as EffectDimension;
  const currentQuestion = DIMENSION_QUESTIONS[currentDimension];

  // Chart size
  const [chartSize, setChartSize] = useState(280);
  useEffect(() => {
    const updateSize = () => {
      const width = window.innerWidth;
      setChartSize(Math.min(width - 60, 320));
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Submitted participant IDs
  const submittedIds = useMemo(() => {
    return ratingStatus?.submitted.map((s) => s.participantId) || [];
  }, [ratingStatus]);

  const handleBack = () => {
    // In sync mode, non-hosts can't go back
    if (isScreenSyncEnabled && !isHost) return;

    if (localStep === 'effect') {
      setIsTransitioning(true);
      setTimeout(() => {
        if (localEffectIndex > 0) {
          setLocalEffectIndex(localEffectIndex - 1);
        } else {
          setLocalStep('strainType');
        }
        setTimeout(() => setIsTransitioning(false), 50);
      }, 150);
    } else if (localStep === 'overall') {
      setLocalEffectIndex(EFFECT_DIMENSIONS.length - 1);
      setLocalStep('effect');
    }
  };

  // Can show back button?
  const canGoBack = !isScreenSyncEnabled || isHost;

  const handleEffectRating = (value: number) => {
    setRatings((prev) => ({
      ...prev,
      [currentDimension]: value,
    }));

    // In sync mode, non-hosts don't auto-advance - they wait for host
    // Host (or non-sync mode) auto-advances
    if (!isScreenSyncEnabled || isHost) {
      setIsTransitioning(true);
      setTimeout(() => {
        if (localEffectIndex < EFFECT_DIMENSIONS.length - 1) {
          setLocalEffectIndex(localEffectIndex + 1);
        } else {
          setLocalStep('overall');
        }
        setTimeout(() => setIsTransitioning(false), 50);
      }, 150);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await submitRating({
        effectRatings: ratings,
        strainType,
        overallRating,
      });
      setStep('submitted');
    } catch (err) {
      console.error('Failed to submit rating:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!session?.currentStrain) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <p className="text-gray-400">Loading strain...</p>
      </div>
    );
  }

  // Already submitted - show waiting screen
  if (step === 'submitted') {
    return (
      <div className="min-h-screen bg-[#0f0f0f] pt-16 px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="mb-6">
            <RadarChart
              ratings={ratings}
              size={chartSize}
              interactive={false}
              fillColor="#16a34a"
              fillOpacity={0.4}
            />
          </div>

          <h2 className="text-xl font-bold text-white mb-2">Rating Submitted!</h2>
          <p className="text-gray-400 mb-6">
            Waiting for others to finish...
          </p>

          {/* Progress */}
          <div className="bg-[#1a1a1a] rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400">Progress</span>
              <span className="text-white font-medium">
                {ratingStatus?.submitted.length || 0} / {ratingStatus?.onlineCount || participants.length} online
              </span>
            </div>
            <div className="h-2 bg-[#333] rounded-full overflow-hidden">
              <div
                className="h-full bg-green-600 transition-all duration-300"
                style={{
                  width: `${((ratingStatus?.submitted.length || 0) / (ratingStatus?.onlineCount || participants.length)) * 100}%`,
                }}
              />
            </div>
            {ratingStatus && ratingStatus.onlineCount < participants.length && (
              <p className="text-xs text-gray-500 mt-2">
                {participants.length - ratingStatus.onlineCount} participant{participants.length - ratingStatus.onlineCount !== 1 ? 's' : ''} offline
              </p>
            )}
          </div>

          {/* Participant status */}
          <div className="bg-[#1a1a1a] rounded-xl p-4 mb-6">
            <ParticipantList
              participants={participants}
              hostId={session.hostId}
              submittedIds={submittedIds}
            />
          </div>

          {/* Host reveal button - can reveal anytime, not just when all submitted */}
          {isHost && (
            <div className="space-y-3">
              <button
                onClick={revealRatings}
                className="w-full py-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-500"
              >
                {ratingStatus?.allSubmitted
                  ? 'Reveal Ratings'
                  : `Reveal Ratings (${ratingStatus?.submitted.length || 0}/${participants.length} submitted)`
                }
              </button>
              {!ratingStatus?.allSubmitted && (
                <p className="text-center text-sm text-amber-400">
                  Not everyone has submitted yet, but you can reveal now if needed
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-[#0f0f0f] flex flex-col overflow-hidden">
      {/* Fixed header with back button and strain name */}
      <div className="flex-shrink-0 flex items-center px-2 py-2 border-b border-[#222]">
        {/* Back button - show on effect and overall steps (not in sync mode for non-hosts) */}
        {(step === 'effect' || step === 'overall') && canGoBack ? (
          <button
            onClick={handleBack}
            className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            aria-label="Go back"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        ) : (
          <div className="w-10" />
        )}

        {/* Strain name - centered */}
        <div className="flex-1 text-center px-2">
          <h2 className="text-base font-medium text-white truncate">
            {session.currentStrain.name}
          </h2>
          {session.currentStrain.genetics && (
            <p className="text-xs text-gray-500">{session.currentStrain.genetics}</p>
          )}
        </div>

        {/* Spacer to balance the back button */}
        <div className="w-10" />
      </div>

      <div className="flex-1 flex flex-col px-4 pb-2 overflow-hidden">
        {/* Strain Type Step */}
        {step === 'strainType' && (
          <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full px-2">
            <h2 className="text-xl font-bold text-white text-center mb-6">
              What type is this strain?
            </h2>

            <StrainTypeSlider
              value={strainType}
              onChange={setStrainType}
              onComplete={() => {
                // In sync mode, non-hosts don't auto-advance
                if (!isScreenSyncEnabled || isHost) {
                  setLocalStep('effect');
                }
              }}
            />
          </div>
        )}

        {/* Effect Step */}
        {step === 'effect' && (
          <div
            className={`flex-1 flex flex-col max-w-lg mx-auto w-full transition-all duration-150 ${
              isTransitioning ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
            }`}
          >
            {/* Radar Chart - interactive, smaller for mobile */}
            <div className="flex justify-center py-2">
              <RadarChart
                ratings={ratings}
                onChange={setRatings}
                size={Math.min(chartSize, 220)}
                interactive={true}
                fillColor="#16a34a"
                fillOpacity={0.4}
              />
            </div>

            {/* Question with info button */}
            <div className="text-center mb-2">
              <div className="flex items-center justify-center gap-2">
                <h2 className="text-lg font-bold text-white leading-tight">
                  {currentQuestion.question}
                </h2>
                <button
                  onClick={() => setShowGuide(true)}
                  className="w-6 h-6 rounded-full bg-[#333] text-gray-400 hover:bg-[#444] hover:text-white flex items-center justify-center text-sm font-medium flex-shrink-0"
                  aria-label={`What is ${currentDimension}?`}
                >
                  i
                </button>
              </div>
            </div>

            {/* Labels */}
            <div className="flex justify-between text-xs text-gray-400 mb-2 px-1">
              <span>{currentQuestion.lowLabel}</span>
              <span>{currentQuestion.highLabel}</span>
            </div>

            {/* Quick select buttons - more compact */}
            <div className="space-y-1.5">
              <div className="grid grid-cols-6 gap-1.5">
                {[0, 1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    onClick={() => handleEffectRating(val)}
                    className={`py-2.5 text-base font-bold rounded-lg transition-colors ${
                      ratings[currentDimension] === val
                        ? 'bg-green-600 text-white'
                        : 'bg-[#252525] hover:bg-[#303030] text-gray-200'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {[6, 7, 8, 9, 10].map((val) => (
                  <button
                    key={val}
                    onClick={() => handleEffectRating(val)}
                    className={`py-2.5 text-base font-bold rounded-lg transition-colors ${
                      ratings[currentDimension] === val
                        ? 'bg-green-600 text-white'
                        : 'bg-[#252525] hover:bg-[#303030] text-gray-200'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Overall Step */}
        {step === 'overall' && (
          <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full">
            {/* Radar Chart - still interactive for last-minute adjustments */}
            <div className="flex justify-center mb-4">
              <RadarChart
                ratings={ratings}
                onChange={setRatings}
                size={chartSize}
                interactive={true}
                fillColor="#16a34a"
                fillOpacity={0.4}
              />
            </div>

            <h2 className="text-2xl font-bold text-white text-center mb-6">
              Overall rating?
            </h2>

            {/* Star rating */}
            <div className="space-y-1 mb-6">
              <div className="flex justify-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setOverallRating(star)}
                    className="text-3xl transition-transform active:scale-110 p-1"
                  >
                    <span className={star <= overallRating ? 'text-yellow-500' : 'text-gray-600'}>
                      {star <= overallRating ? '★' : '☆'}
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex justify-center gap-1">
                {[6, 7, 8, 9, 10].map((star) => (
                  <button
                    key={star}
                    onClick={() => setOverallRating(star)}
                    className="text-3xl transition-transform active:scale-110 p-1"
                  >
                    <span className={star <= overallRating ? 'text-yellow-500' : 'text-gray-600'}>
                      {star <= overallRating ? '★' : '☆'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {overallRating > 0 && (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full py-4 bg-green-600 text-white rounded-lg font-bold text-lg hover:bg-green-500 disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Rating'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="flex-shrink-0 px-4 pb-3">
        {/* Sync mode indicator for non-hosts */}
        {isScreenSyncEnabled && !isHost && (
          <div className="flex items-center justify-center gap-2 text-xs text-amber-400 mb-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Host controls the pace
          </div>
        )}
        <div className="h-1 bg-[#333] rounded-full overflow-hidden">
          <div
            className="h-full bg-green-600 transition-all duration-300"
            style={{
              width: `${
                step === 'strainType'
                  ? 5
                  : step === 'effect'
                  ? 10 + (effectIndex / EFFECT_DIMENSIONS.length) * 80
                  : 95
              }%`,
            }}
          />
        </div>
      </div>

      {/* Host Sync Controls - shows when in sync mode and host */}
      {isHost && isScreenSyncEnabled && localStep !== 'submitted' && (
        <div className="fixed bottom-16 left-4 right-4 z-40">
          <div className="bg-[#1a1a1a] border border-amber-800 rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-amber-400 font-medium">LOCK MODE</p>
                <p className="text-sm text-gray-300">
                  Guests see: {localStep === 'strainType' ? 'Strain type selection' : localStep === 'overall' ? 'Overall rating' : `Question ${localEffectIndex + 1}/${EFFECT_DIMENSIONS.length}`}
                </p>
              </div>
              <span className="px-2 py-1 text-xs bg-amber-800/30 text-amber-300 rounded">
                Synced
              </span>
            </div>
            <button
              onClick={() => {
                // Advance phase on server
                advancePhase();
              }}
              disabled={localStep === 'overall'}
              className={`w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                localStep === 'overall'
                  ? 'bg-[#333] text-gray-500 cursor-not-allowed'
                  : 'bg-amber-700 text-white hover:bg-amber-600'
              }`}
            >
              {localStep === 'overall' ? (
                'At final step'
              ) : (
                <>
                  Next Question
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Dimension Info Modal - shows explanation for current dimension */}
      {showGuide && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] rounded-xl max-w-md w-full p-5 max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-1">
              What is {currentDimension}?
            </h3>
            <p className="text-sm text-gray-500 mb-4">{currentQuestion.question}</p>

            {/* Detailed explanation */}
            <div className="bg-[#252525] rounded-lg p-4 mb-4">
              <p className="text-gray-300 text-sm leading-relaxed">
                {currentQuestion.explanation}
              </p>
            </div>

            {/* Scale guide */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-red-400 w-12">0-2</span>
                <span className="text-gray-400 text-sm">{currentQuestion.lowLabel}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-yellow-400 w-12">4-6</span>
                <span className="text-gray-400 text-sm">Moderate / Medium</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-green-400 w-12">8-10</span>
                <span className="text-gray-400 text-sm">{currentQuestion.highLabel}</span>
              </div>
            </div>

            {/* Reminder */}
            <p className="text-xs text-gray-500 italic mb-4">
              Rate how much you experience this effect, not whether you like it. Save preferences for the overall rating!
            </p>

            <button
              onClick={() => setShowGuide(false)}
              className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-500"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
