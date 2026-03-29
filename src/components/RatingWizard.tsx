'use client';

import { useState, useEffect } from 'react';
import RadarChart from './RadarChart';
import StrainTypeSlider from './StrainTypeSlider';
import AppearanceSlider from './AppearanceSlider';
import StrainAutocomplete from './StrainAutocomplete';
import { StrainSearchResult } from '@/lib/cannabis-api';
import {
  EFFECT_DIMENSIONS,
  EffectDimension,
  EffectRatings,
  createEmptyRatings,
  StrainType,
  BudAppearance,
  StrainInfo,
  DIMENSION_QUESTIONS,
  STRAIN_TYPE_COLORS,
} from '@/types/strain';

interface RatingWizardProps {
  onComplete: (data: {
    strain: StrainInfo;
    strainType: StrainType;
    budAppearance?: BudAppearance;
    ratings: EffectRatings;
    overallRating: number;
    displayName?: string;
  }) => void;
  onCancel: () => void;
  prefilledStrain?: string;
  prefilledGenetics?: string;
}

type WizardStep = 'name' | 'strain-info' | 'type' | 'appearance' | 'effects' | 'overall';

export default function RatingWizard({ onComplete, onCancel, prefilledStrain, prefilledGenetics }: RatingWizardProps) {
  // Check if user already has a name saved
  const [needsName, setNeedsName] = useState(false);
  const [step, setStep] = useState<WizardStep>('strain-info');
  const [effectIndex, setEffectIndex] = useState(0);

  // Strain info
  const [strainName, setStrainName] = useState(prefilledStrain || '');
  const [strainGenetics, setStrainGenetics] = useState(prefilledGenetics || '');
  const [thcPercent, setThcPercent] = useState('');
  const [cbdPercent, setCbdPercent] = useState('');

  // Type and ratings
  const [strainType, setStrainType] = useState<StrainType>('Balanced Hybrid');
  const [budAppearance, setBudAppearance] = useState<BudAppearance | null>(null);
  const [ratings, setRatings] = useState<EffectRatings>(createEmptyRatings());
  const [overallRating, setOverallRating] = useState(0);

  // Display name for guest ratings
  const [displayName, setDisplayName] = useState('');

  // Transition state for flash effect
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Rating guide modal
  const [showGuide, setShowGuide] = useState(false);

  // Photo upload
  const [strainImage, setStrainImage] = useState<string | null>(null);
  const [strainImageUploaded, setStrainImageUploaded] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState(false);

  // Chart size based on screen width
  const [chartSize, setChartSize] = useState(300);

  // Calculate chart size
  useEffect(() => {
    const updateSize = () => {
      const width = window.innerWidth;
      setChartSize(Math.min(width - 40, 360));
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Load existing user name from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('radarbuds_user');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        if (user.name && user.name !== 'Anonymous User') {
          setDisplayName(user.name);
        } else {
          setNeedsName(true);
          setStep('name');
        }
      } catch (e) {
        setNeedsName(true);
        setStep('name');
      }
    } else {
      setNeedsName(true);
      setStep('name');
    }
  }, []);

  // Calculate progress
  const totalSteps = (needsName ? 1 : 0) + 3 + EFFECT_DIMENSIONS.length + 1; // name? + strain-info + type + appearance + effects + overall
  const currentStepNumber = step === 'name' ? 1
    : step === 'strain-info' ? (needsName ? 2 : 1)
    : step === 'type' ? (needsName ? 3 : 2)
    : step === 'appearance' ? (needsName ? 4 : 3)
    : step === 'effects' ? (needsName ? 5 : 4) + effectIndex
    : totalSteps;
  const progressPercent = (currentStepNumber / totalSteps) * 100;

  const currentDimension = EFFECT_DIMENSIONS[effectIndex] as EffectDimension;
  const currentQuestion = DIMENSION_QUESTIONS[currentDimension];

  const handleNext = () => {
    if (step === 'name') {
      // Save name to localStorage
      localStorage.setItem('radarbuds_user', JSON.stringify({ name: displayName }));
      setStep('strain-info');
    } else if (step === 'strain-info') {
      setStep('type');
    } else if (step === 'type') {
      setStep('appearance');
    } else if (step === 'appearance') {
      setStep('effects');
    } else if (step === 'effects') {
      setIsTransitioning(true);
      setTimeout(() => {
        if (effectIndex < EFFECT_DIMENSIONS.length - 1) {
          setEffectIndex(effectIndex + 1);
        } else {
          setStep('overall');
        }
        setTimeout(() => setIsTransitioning(false), 50);
      }, 150);
    } else if (step === 'overall') {
      onComplete({
        strain: {
          name: strainName,
          genetics: strainGenetics,
          strainType: strainType,
          thcPercent: thcPercent ? parseFloat(thcPercent) : undefined,
          cbdPercent: cbdPercent ? parseFloat(cbdPercent) : undefined,
          imageUrl: strainImageUploaded ? strainImage || undefined : undefined,
        },
        strainType,
        budAppearance: budAppearance || undefined,
        ratings,
        overallRating,
        displayName: displayName.trim() || undefined,
      });
    }
  };

  const handleBack = () => {
    if (step === 'strain-info' && needsName) {
      setStep('name');
    } else if (step === 'type') {
      setStep('strain-info');
    } else if (step === 'appearance') {
      setStep('type');
    } else if (step === 'effects') {
      setIsTransitioning(true);
      setTimeout(() => {
        if (effectIndex > 0) {
          setEffectIndex(effectIndex - 1);
        } else {
          setStep('appearance');
        }
        setTimeout(() => setIsTransitioning(false), 50);
      }, 150);
    } else if (step === 'overall') {
      setEffectIndex(EFFECT_DIMENSIONS.length - 1);
      setStep('effects');
    }
  };

  const handleEffectRating = (value: number, autoAdvance: boolean = false) => {
    setRatings(prev => ({
      ...prev,
      [currentDimension]: value,
    }));

    if (autoAdvance) {
      setIsTransitioning(true);
      setTimeout(() => {
        if (effectIndex < EFFECT_DIMENSIONS.length - 1) {
          setEffectIndex(effectIndex + 1);
        } else {
          setStep('overall');
        }
        setTimeout(() => setIsTransitioning(false), 50);
      }, 150);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setStrainImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    setUploadError(false);
    setStrainImageUploaded(false);
    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setStrainImage(data.url);
        setStrainImageUploaded(true);
      } else {
        setUploadError(true);
      }
    } catch (error) {
      setUploadError(true);
    } finally {
      setUploadingImage(false);
    }
  };

  const canProceed = () => {
    if (step === 'strain-info') {
      return strainName.trim() !== '' && strainGenetics.trim() !== '';
    }
    if (step === 'overall') {
      return overallRating > 0;
    }
    return true;
  };

  return (
    <div className="fixed inset-0 bg-[#0f0f0f] flex flex-col z-50">
      {/* Back button */}
      {step !== 'name' && (step !== 'strain-info' || needsName) && (
        <button
          onClick={handleBack}
          className="absolute top-4 left-4 z-10 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          aria-label="Go back"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Close button */}
      <button
        onClick={onCancel}
        className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
        aria-label="Close"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto px-4 pt-12 pb-4">
        {/* Username Step */}
        {step === 'name' && (
          <div className="max-w-lg mx-auto space-y-6">
            <div className="text-center">
              <div className="text-5xl mb-4">🌿</div>
              <h2 className="text-2xl font-bold text-white mb-2">Welcome!</h2>
              <p className="text-gray-400">Choose a username for your ratings</p>
            </div>

            <div>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter username..."
                autoFocus
                className="w-full px-4 py-4 border border-[#333] rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent text-white bg-[#252525] placeholder-gray-500 text-center text-lg"
              />
            </div>

            <button
              onClick={handleNext}
              disabled={!displayName.trim()}
              className={`w-full py-4 rounded-lg font-medium transition-colors ${
                displayName.trim()
                  ? 'bg-green-600 text-white hover:bg-green-500'
                  : 'bg-[#333] text-gray-500 cursor-not-allowed'
              }`}
            >
              Continue
            </button>
          </div>
        )}

        {/* Strain Info Step */}
        {step === 'strain-info' && (
          <div className="max-w-lg mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-white text-center">What strain are you rating?</h2>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Strain Name *
              </label>
              <StrainAutocomplete
                value={strainName}
                onChange={setStrainName}
                onSelect={(strain: StrainSearchResult) => {
                  // Auto-fill fields when strain is selected from API
                  if (strain.thcPercent !== undefined) {
                    setThcPercent(strain.thcPercent.toFixed(1));
                  }
                  if (strain.cbdPercent !== undefined && strain.cbdPercent > 0.1) {
                    setCbdPercent(strain.cbdPercent.toFixed(1));
                  }
                  if (strain.strainType) {
                    setStrainType(strain.strainType);
                  }
                  if (strain.description) {
                    setStrainGenetics(strain.description.slice(0, 100));
                  }
                }}
                placeholder="e.g., Blue Dream, OG Kush..."
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                Start typing to search our strain database
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Genetics / Lineage *
              </label>
              <input
                type="text"
                value={strainGenetics}
                onChange={(e) => setStrainGenetics(e.target.value)}
                placeholder="e.g., Blueberry x Haze"
                className="w-full px-4 py-3 border border-[#333] rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent text-white bg-[#252525] placeholder-gray-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  THC % <span className="text-gray-600">(optional)</span>
                </label>
                <input
                  type="number"
                  value={thcPercent}
                  onChange={(e) => setThcPercent(e.target.value)}
                  placeholder="e.g., 22"
                  min="0"
                  max="100"
                  step="0.1"
                  className="w-full px-4 py-3 border border-[#333] rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent text-white bg-[#252525] placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  CBD % <span className="text-gray-600">(optional)</span>
                </label>
                <input
                  type="number"
                  value={cbdPercent}
                  onChange={(e) => setCbdPercent(e.target.value)}
                  placeholder="e.g., 1"
                  min="0"
                  max="100"
                  step="0.1"
                  className="w-full px-4 py-3 border border-[#333] rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent text-white bg-[#252525] placeholder-gray-500"
                />
              </div>
            </div>

            {/* Photo upload */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Bud Photo <span className="text-gray-600">(optional)</span>
              </label>
              {strainImage ? (
                <div className="relative">
                  <img
                    src={strainImage}
                    alt="Strain"
                    className={`w-full h-40 object-contain bg-[#252525] rounded-lg ${uploadError ? 'border-2 border-amber-600' : ''}`}
                  />
                  {uploadingImage && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                      <div className="text-white text-sm">Uploading...</div>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setStrainImage(null);
                      setStrainImageUploaded(false);
                      setUploadError(false);
                    }}
                    className="absolute top-2 right-2 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 bg-[#252525] border-2 border-dashed border-[#444] rounded-lg cursor-pointer hover:border-[#555] transition-colors">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-gray-500 mb-2">
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2v11z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  <span className="text-sm text-gray-500">Tap to add photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`w-full py-4 rounded-lg font-medium transition-colors ${
                canProceed()
                  ? 'bg-green-600 text-white hover:bg-green-500'
                  : 'bg-[#333] text-gray-500 cursor-not-allowed'
              }`}
            >
              Next
            </button>
          </div>
        )}

        {/* Type Step */}
        {step === 'type' && (
          <div className="max-w-lg mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-white text-center">What type of strain is it?</h2>

            <StrainTypeSlider
              value={strainType}
              onChange={setStrainType}
              onComplete={() => setStep('appearance')}
            />
          </div>
        )}

        {/* Appearance Step */}
        {step === 'appearance' && (
          <AppearanceSlider
            value={budAppearance}
            onChange={setBudAppearance}
            onComplete={() => setStep('effects')}
          />
        )}

        {/* Effect Questions Step */}
        {step === 'effects' && (
          <div
            className={`max-w-lg mx-auto transition-all duration-150 flex flex-col h-full ${
              isTransitioning
                ? 'opacity-0 transform translate-y-2'
                : 'opacity-100 transform translate-y-0'
            }`}
          >
            {/* Radar Chart */}
            <div className="flex justify-center mb-6">
              <RadarChart
                ratings={ratings}
                onChange={setRatings}
                size={chartSize}
                interactive={true}
                fillColor={STRAIN_TYPE_COLORS[strainType]}
                fillOpacity={0.4}
                darkMode={true}
              />
            </div>

            {/* Question */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2">
                <h2 className="text-2xl font-bold text-white leading-tight">
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
            <div className="flex justify-between text-sm text-gray-400 mb-3 px-1">
              <span>{currentQuestion.lowLabel}</span>
              <span>{currentQuestion.highLabel}</span>
            </div>

            {/* Quick select buttons - 2 rows */}
            <div className="space-y-2">
              <div className="grid grid-cols-6 gap-2">
                {[0, 1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    onClick={() => handleEffectRating(val, true)}
                    className={`py-4 text-xl font-bold rounded-lg transition-colors ${
                      ratings[currentDimension] === val
                        ? 'bg-green-600 text-white'
                        : 'bg-[#252525] hover:bg-[#303030] text-gray-200'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[6, 7, 8, 9, 10].map((val) => (
                  <button
                    key={val}
                    onClick={() => handleEffectRating(val, true)}
                    className={`py-4 text-xl font-bold rounded-lg transition-colors ${
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

        {/* Overall Rating Step */}
        {step === 'overall' && (
          <div className="max-w-lg mx-auto">
            {/* Radar Chart */}
            <div className="flex justify-center mb-6">
              <RadarChart
                ratings={ratings}
                onChange={setRatings}
                size={chartSize}
                interactive={true}
                fillColor={STRAIN_TYPE_COLORS[strainType]}
                fillOpacity={0.4}
                darkMode={true}
              />
            </div>

            <h2 className="text-2xl font-bold text-white text-center mb-2">
              Overall rating?
            </h2>
            <p className="text-gray-400 text-center mb-6">
              {strainName}
              {thcPercent && ` · ${thcPercent}% THC`}
            </p>

            {/* Star rating - 2 rows */}
            <div className="space-y-1 mb-6">
              <div className="flex justify-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setOverallRating(star)}
                    className="text-4xl transition-transform active:scale-110 p-1"
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
                    className="text-4xl transition-transform active:scale-110 p-1"
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
                onClick={handleNext}
                className="w-full py-4 rounded-lg font-bold text-lg bg-green-600 text-white hover:bg-green-500 transition-colors"
              >
                Complete Rating
              </button>
            )}
          </div>
        )}
      </div>

      {/* Progress bar at bottom */}
      <div className="flex-shrink-0 px-4 pb-4">
        <div className="h-1 bg-[#333] rounded-full overflow-hidden">
          <div
            className="h-full bg-green-600 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Dimension Info Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] rounded-xl max-w-md w-full p-5 max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-1">
              What is {currentDimension}?
            </h3>
            <p className="text-sm text-gray-500 mb-4">{currentQuestion.question}</p>

            <div className="bg-[#252525] rounded-lg p-4 mb-4">
              <p className="text-gray-300 text-sm leading-relaxed">
                {currentQuestion.explanation}
              </p>
            </div>

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
