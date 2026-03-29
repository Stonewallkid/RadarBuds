'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const { user, loading, signOut, setShowAuthModal } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    setMenuOpen(false);
  };

  const getUserInitial = () => {
    if (user?.user_metadata?.name) {
      return user.user_metadata.name.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'G';
  };

  const getUserName = () => {
    if (user?.user_metadata?.name) {
      return user.user_metadata.name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Guest User';
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0f0f0f] border-b border-[#222]">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            onClick={(e) => {
              e.preventDefault();
              router.push('/');
            }}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            {/* Cannabis leaf radar logo */}
            <svg
              width="28"
              height="28"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Radar grid circles */}
              <circle cx="16" cy="16" r="12" fill="none" stroke="#444" strokeWidth="0.5"/>
              <circle cx="16" cy="16" r="8" fill="none" stroke="#444" strokeWidth="0.5"/>
              {/* Cannabis leaf shape */}
              <path
                d="M16 4C16 4 13 8 13 11C13 12.5 13.5 13.5 14 14C12.5 13.5 10 13 8 14C8 14 10 16 13 16C11 17.5 9 20 9 20C9 20 12 19 14 17.5C14 19 14 22 16 24C18 22 18 19 18 17.5C20 19 23 20 23 20C23 20 21 17.5 19 16C22 16 24 14 24 14C22 13 19.5 13.5 18 14C18.5 13.5 19 12.5 19 11C19 8 16 4 16 4Z"
                fill="#16a34a"
                fillOpacity="0.7"
                stroke="#15803d"
                strokeWidth="1.5"
              />
              {/* Vertex dots */}
              <circle cx="16" cy="4" r="1" fill="#22c55e"/>
              <circle cx="24" cy="14" r="1" fill="#22c55e"/>
              <circle cx="16" cy="24" r="1" fill="#22c55e"/>
              <circle cx="8" cy="14" r="1" fill="#22c55e"/>
            </svg>
            <span className="text-white font-bold text-lg">RadarBuds</span>
          </Link>

          {/* Right side: Sign in button + Hamburger */}
          <div className="flex items-center gap-2">
            {!loading && !user && (
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-4 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-500 rounded-lg transition-colors"
              >
                Sign in
              </button>
            )}

            {/* Hamburger Menu Button */}
            <button
              onClick={() => setMenuOpen(true)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              aria-label="Open menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M3 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Slide-out Menu Overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-50"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Slide-out Menu */}
      <div
        className={`fixed top-0 right-0 h-full w-72 bg-[#1a1a1a] z-50 transform transition-transform duration-300 ease-in-out ${
          menuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Menu Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-[#333]">
          <span className="text-white font-medium">Menu</span>
          <button
            onClick={() => setMenuOpen(false)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            aria-label="Close menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* User Profile Section */}
        <div className="p-4 border-b border-[#333]">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-medium">
                {getUserInitial()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{getUserName()}</p>
                <p className="text-sm text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 font-medium">
                  G
                </div>
                <div>
                  <p className="text-white font-medium">Guest User</p>
                  <p className="text-sm text-gray-500">Sign in for more features</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setShowAuthModal(true);
                }}
                className="w-full py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-500 transition-colors"
              >
                Sign in / Create account
              </button>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="p-4">
          <ul className="space-y-1">
            <li>
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-3 text-gray-300 hover:text-white hover:bg-[#252525] rounded-lg transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 9L12 2L21 9V20C21 20.55 20.55 21 20 21H4C3.45 21 3 20.55 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M9 21V12H15V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Home
              </Link>
            </li>
            <li>
              <Link
                href="/demo"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-3 text-gray-300 hover:text-white hover:bg-[#252525] rounded-lg transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                  <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Explore Strains
              </Link>
            </li>
            <li>
              <Link
                href="/compare"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-3 text-gray-300 hover:text-white hover:bg-[#252525] rounded-lg transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 3H5C3.89 3 3 3.89 3 5V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M15 3H19C20.11 3 21 3.89 21 5V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M9 21H5C3.89 21 3 20.11 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M15 21H19C20.11 21 21 20.11 21 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                </svg>
                Compare Strains
              </Link>
            </li>
            <li>
              <Link
                href="/?rate=1"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-3 text-gray-300 hover:text-white hover:bg-[#252525] rounded-lg transition-colors"
              >
                {/* Cannabis leaf icon */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C12 2 9 6 9 9C9 10.5 9.5 11.5 10 12C8.5 11.5 6 11 4 12C4 12 6 14 9 14C7 15.5 5 18 5 18C5 18 8 17 10 15.5C10 17 10 20 12 22C14 20 14 17 14 15.5C16 17 19 18 19 18C19 18 17 15.5 15 14C18 14 20 12 20 12C18 11 15.5 11.5 14 12C14.5 11.5 15 10.5 15 9C15 6 12 2 12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Rate a Strain
              </Link>
            </li>
            <li>
              <Link
                href="/session/join"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-3 text-gray-300 hover:text-white hover:bg-[#252525] rounded-lg transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
                  <circle cx="17" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
                  <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M17 11a4 4 0 014 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Group Session
              </Link>
            </li>
          </ul>

          <div className="mt-6 pt-4 border-t border-[#333]">
            <ul className="space-y-1">
              <li>
                <Link
                  href="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 text-gray-300 hover:text-white hover:bg-[#252525] rounded-lg transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
                    <path d="M4 20C4 16.69 7.58 14 12 14C16.42 14 20 16.69 20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  My Effect Profile
                </Link>
              </li>
              {user && (
                <li>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-3 py-3 text-gray-300 hover:text-white hover:bg-[#252525] rounded-lg transition-colors"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 21H5C3.89 21 3 20.11 3 19V5C3 3.89 3.89 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Sign out
                  </button>
                </li>
              )}
            </ul>
          </div>
        </nav>
      </div>
    </>
  );
}
