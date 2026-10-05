import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, Briefcase } from 'lucide-react';
import { AuthPageLayout } from '../components/AuthPageLayout';
import { authService } from '../services/authService';
import { QrLoginPanel } from '../components/QrLoginPanel';
import { supabase } from '../lib/supabase';

const LOGIN_COOLDOWN_KEY = 'mm_login_cooldown_until';
const LOGIN_COOLDOWN_SECONDS = 30;

export const LoginPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    try {
      const until = Number(localStorage.getItem(LOGIN_COOLDOWN_KEY));
      if (until > Date.now()) {
        setCooldown(Math.ceil((until - Date.now()) / 1000));
      }
    } catch {
      return;
    }
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;

    const interval = window.setInterval(() => {
      try {
        const until = Number(localStorage.getItem(LOGIN_COOLDOWN_KEY));
        const remaining = Math.max(0, Math.ceil((until - Date.now()) / 1000));
        setCooldown(remaining);
        if (remaining === 0) {
          localStorage.removeItem(LOGIN_COOLDOWN_KEY);
          setErrorMessage((message) =>
            message === 'Incorrect email or password' ? null : message,
          );
        }
      } catch {
        setCooldown(0);
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [cooldown]);

  // Status message passed via location state (e.g. post password reset)
  const statusMessage = (location.state as any)?.message as string | undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0) return;
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMessage('Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      await authService.signIn(trimmedEmail, password);
      try {
        localStorage.removeItem(LOGIN_COOLDOWN_KEY);
      } catch {}
      const destination = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(destination, { replace: true });
    } catch (err: any) {
      if (typeof err.message === 'string' && err.message.startsWith('Incorrect email or password')) {
        try {
          localStorage.setItem(
            LOGIN_COOLDOWN_KEY,
            String(Date.now() + LOGIN_COOLDOWN_SECONDS * 1000),
          );
        } catch {}
        setCooldown(LOGIN_COOLDOWN_SECONDS);
      }
      setErrorMessage(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Google sign in could not be initiated.');
    }
  };

  return (
    <AuthPageLayout maxWidth="5xl">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
        {/* Left Column: Login Form Card */}
        <div className="lg:col-span-7 bg-[#080E2A]/90 backdrop-blur-xl border border-[#1E3268] rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 shadow-[0_12px_40px_rgba(0,145,255,0.15)] flex flex-col justify-between">
          <div>
            <div className="mb-5 sm:mb-6">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Welcome back
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1">
                Sign in to view your financial fitness score
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Status Message (e.g. from Reset Password) */}
              {statusMessage && (
                <div
                  role="status"
                  className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm font-medium"
                >
                  {statusMessage}
                </div>
              )}

              {/* Error Message */}
              {errorMessage && (
                <div
                  role="alert"
                  className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs sm:text-sm font-medium"
                >
                  {errorMessage}
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="login-email"
                  className="block text-xs sm:text-sm font-semibold text-slate-200"
                >
                  Email
                </label>
                <div className="relative rounded-2xl bg-[#050A1E] border border-[#1C2C5E] focus-within:border-[#0091FF] focus-within:ring-1 focus-within:ring-[#0091FF] transition-all">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    placeholder="name@example.com"
                    autoComplete="email"
                    className="w-full pl-12 pr-4 py-3.5 bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="login-password"
                  className="block text-xs sm:text-sm font-semibold text-slate-200"
                >
                  Password
                </label>
                <div className="relative rounded-2xl bg-[#050A1E] border border-[#1C2C5E] focus-within:border-[#0091FF] focus-within:ring-1 focus-within:ring-[#0091FF] transition-all">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full pl-12 pr-12 py-3.5 bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-white transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <div className="flex justify-end pt-1">
                  <Link
                    to="/forgot-password"
                    className="text-xs sm:text-sm font-semibold text-[#0091FF] hover:text-[#38BDF8] transition-colors"
                  >
                    Forgot Password?
                  </Link>
                </div>
              </div>

              {/* Submit Button (Bright Cyan-Blue matching photo with rate limit cooldown) */}
              <button
                type="submit"
                disabled={loading || cooldown > 0}
                className="w-full mt-2 py-3.5 px-4 bg-[#0091FF] hover:bg-[#007EE5] text-white font-bold rounded-2xl transition-all duration-200 shadow-[0_4px_20px_rgba(0,145,255,0.4)] disabled:opacity-60 flex items-center justify-center text-sm sm:text-base"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : cooldown > 0 ? (
                  `Try again in ${cooldown}s`
                ) : (
                  'Login'
                )}
              </button>
            </form>

            {/* OR Divider */}
            <div className="relative flex items-center justify-center my-4 sm:my-5 select-none">
              <div className="border-t border-[#1C2C5E] w-full" />
              <span className="bg-[#080E2A] px-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest absolute">
                OR
              </span>
            </div>

            {/* Sign in with Google */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full py-3.5 px-4 rounded-2xl border border-[#1C2C5E] bg-[#050A1E]/80 hover:bg-[#0E163B] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2.5 transition-all shadow-sm"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Sign In with Google</span>
            </button>
          </div>

          {/* Links Footer */}
          <div className="mt-5 pt-4 border-t border-[#1C2C5E] flex flex-col items-center gap-3 text-center">
            <Link
              to="/register"
              className="text-xs sm:text-sm font-semibold text-[#0091FF] hover:text-[#38BDF8] transition-colors"
            >
              New user? Register
            </Link>

            <Link
              to="/corporate-login"
              className="w-full py-3 px-4 rounded-2xl border border-[#1C2C5E] hover:border-[#0091FF]/50 bg-[#050A1E]/50 hover:bg-[#0E163B] text-slate-200 hover:text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <Briefcase className="w-4 h-4 text-[#0091FF]" />
              <span>Access Corporate Portal</span>
            </Link>
          </div>
        </div>

        {/* Right Column: Active QR Login Panel */}
        <QrLoginPanel />
      </div>
    </AuthPageLayout>
  );
};

export default LoginPage;
