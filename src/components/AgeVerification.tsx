'use client';

import { useState, useEffect } from 'react';

export default function AgeVerification() {
  const [showModal, setShowModal] = useState(false);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    // Check if already verified
    const isVerified = localStorage.getItem('radarbuds_age_verified');
    if (isVerified === 'true') {
      setVerified(true);
    } else {
      setShowModal(true);
    }
  }, []);

  const handleVerify = () => {
    localStorage.setItem('radarbuds_age_verified', 'true');
    setVerified(true);
    setShowModal(false);
  };

  const handleDeny = () => {
    window.location.href = 'https://www.google.com';
  };

  if (!showModal || verified) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] rounded-xl max-w-md w-full p-8 text-center">
        {/* Cannabis leaf icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-600/20 flex items-center justify-center">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-green-500">
            <path
              d="M12 2C12 2 9 6 9 9C9 10.5 9.5 11.5 10 12C8.5 11.5 6 11 4 12C4 12 6 14 9 14C7 15.5 5 18 5 18C5 18 8 17 10 15.5C10 17 10 20 12 22C14 20 14 17 14 15.5C16 17 19 18 19 18C19 18 17 15.5 15 14C18 14 20 12 20 12C18 11 15.5 11.5 14 12C14.5 11.5 15 10.5 15 9C15 6 12 2 12 2Z"
              fill="currentColor"
            />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">Age Verification Required</h2>
        <p className="text-gray-400 mb-6">
          You must be 21 years or older to access RadarBuds. Please verify your age to continue.
        </p>

        <div className="space-y-3">
          <button
            onClick={handleVerify}
            className="w-full py-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-500 transition-colors"
          >
            I am 21 or older
          </button>

          <button
            onClick={handleDeny}
            className="w-full py-3 text-gray-400 hover:text-white transition-colors"
          >
            I am under 21
          </button>
        </div>

        <p className="mt-6 text-xs text-gray-600">
          By entering this site, you agree that you are of legal age to consume cannabis in your jurisdiction.
          Cannabis use is only legal in certain states and countries.
        </p>
      </div>
    </div>
  );
}
