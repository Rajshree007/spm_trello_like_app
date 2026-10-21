import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  if (user) { navigate('/'); return null; }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register(email, name, password);
      navigate('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg ?? 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthLabel = ['', 'Weak', 'Fair', 'Strong'];
  const strengthColor = ['', 'bg-red-400', 'bg-amber-400', 'bg-emerald-500'];

  return (
    <div className="min-h-screen flex bg-auth-gradient">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute top-1/3 -right-24 w-72 h-72 rounded-full bg-white/5" />
        <div className="absolute -bottom-20 left-20 w-80 h-80 rounded-full bg-white/5" />

        <div className="relative z-10 flex items-center gap-3">
          <LogoIcon className="w-9 h-9 text-white" />
          <span className="text-white text-xl font-bold tracking-tight">TaskFlow</span>
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Start organizing<br />in seconds.
          </h1>
          <p className="text-blue-200 text-lg leading-relaxed max-w-xs">
            Free forever for personal use. No credit card required.
          </p>
          <div className="grid grid-cols-2 gap-3 pt-2">
            {[
              { icon: '🗂', label: 'Unlimited boards' },
              { icon: '🏷', label: 'Color labels' },
              { icon: '✅', label: 'Checklists' },
              { icon: '👥', label: 'Team invites' },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                <span className="text-lg">{icon}</span>
                <span className="text-white/80 text-xs font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-blue-300 text-xs">© 2024 TaskFlow</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white lg:rounded-l-3xl">
        <div className="w-full max-w-sm animate-fade-in">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <LogoIcon className="w-8 h-8 text-brand-500" />
            <span className="text-xl font-bold text-gray-900">TaskFlow</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Create your account</h2>
          <p className="text-gray-500 text-sm mb-8">Free, no credit card required</p>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded-lg text-sm mb-5 animate-fade-in">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-9h2v4H9V9zm0-2h2v2H9V7z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
              <input
                type="text"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => setShowPass((p) => !p)}
                  tabIndex={-1}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    {showPass
                      ? <><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></>
                      : <><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
                    }
                  </svg>
                </button>
              </div>

              {/* Password strength */}
              {password.length > 0 && (
                <div className="mt-2 space-y-1 animate-fade-in">
                  <div className="flex gap-1">
                    {[1, 2, 3].map((lvl) => (
                      <div
                        key={lvl}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${strength >= lvl ? strengthColor[strength] : 'bg-gray-200'}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">{strengthLabel[strength]} password</p>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-2.5 text-base mt-2"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account…
                </span>
              ) : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-500 hover:text-brand-600 font-medium transition-colors">
              Sign in
            </Link>
          </p>

          <p className="text-center text-xs text-gray-400 mt-4">
            By creating an account, you agree to our{' '}
            <span className="underline cursor-pointer">Terms of Service</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function LogoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <rect x="2" y="2" width="9" height="14" rx="2.5" />
      <rect x="13" y="2" width="9" height="9" rx="2.5" />
    </svg>
  );
}
