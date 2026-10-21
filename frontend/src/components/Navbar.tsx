import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function avatarColor(name: string) {
  const colors = [
    'bg-violet-500', 'bg-pink-500', 'bg-indigo-500', 'bg-cyan-600',
    'bg-teal-500', 'bg-orange-500', 'bg-rose-500', 'bg-blue-600',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '?';

  return (
    <nav className="h-12 bg-brand-600 flex items-center px-4 gap-3 shadow-md z-40 relative">
      {/* Logo */}
      <Link
        to="/"
        className="flex items-center gap-2 text-white font-bold text-base hover:opacity-90 transition-opacity mr-2"
      >
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <rect x="2" y="2" width="9" height="14" rx="2.5" />
          <rect x="13" y="2" width="9" height="9" rx="2.5" />
        </svg>
        TaskFlow
      </Link>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User menu */}
      <div className="relative" ref={ref}>
        <button
          className="flex items-center gap-2 rounded-full pl-2 pr-1 py-1 hover:bg-white/10 transition-colors"
          onClick={() => setOpen((p) => !p)}
        >
          <span className="text-white/80 text-sm font-medium hidden sm:block select-none">
            {user?.name}
          </span>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold select-none ${user?.name ? avatarColor(user.name) : 'bg-gray-400'}`}>
            {initials}
          </div>
          <svg
            className={`w-3.5 h-3.5 text-white/70 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-modal border border-gray-100 py-1.5 animate-slide-up z-50">
            <div className="px-3 py-2 border-b border-gray-100 mb-1">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
            <Link
              to="/"
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => setOpen(false)}
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              My boards
            </Link>
            <button
              onClick={() => { logout(); setOpen(false); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
