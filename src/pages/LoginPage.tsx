import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, Briefcase } from 'lucide-react';
import { AuthPageLayout } from '../components/AuthPageLayout';
import { authService } from '../services/authService';
import { QrLoginPanel } from '../components/QrLoginPanel';

export const LoginPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Status message passed via location state (e.g. post password reset)
  const statusMessage = (location.state as any)?.message as string | undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMessage('Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      await authService.signIn(trimmedEmail, password);
      const destination = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(destination, { replace: true });
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageLayout
      title="Welcome back"
      subtitle="Sign in to view your financial fitness score"
      maxWidth="4xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Column: Login Form */}
        <div className="lg:col-span-7 bg-[#0D0E15] border border-[#27272A] rounded-[24px] p-6 sm:p-8 shadow-xl flex flex-col justify-between">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Status Message (e.g. from Reset Password) */}
            {statusMessage && (
              <div
                role="status"
                className="p-4 rounded-[16px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-medium"
              >
                {statusMessage}
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div
                role="alert"
                className="p-4 rounded-[16px] bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium"
              >
                {errorMessage}
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-email"
                className="block text-sm font-medium text-white/90"
              >
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40">
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
                  className="w-full pl-11 pr-4 py-3.5 bg-white/[0.04] border border-[#27272A] rounded-[16px] text-white placeholder-white/30 focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-all text-sm disabled:opacity-50"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="block text-sm font-medium text-white/90"
                >
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-[#8B5CF6] hover:text-[#A78BFA] transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40">
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
                  className="w-full pl-11 pr-12 py-3.5 bg-white/[0.04] border border-[#27272A] rounded-[16px] text-white placeholder-white/30 focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-all text-sm disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/40 hover:text-white/80 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold rounded-[16px] transition-all duration-200 shadow-lg shadow-[#4F46E5]/25 disabled:opacity-60 flex items-center justify-center text-sm"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Login'
              )}
            </button>
          </form>

          {/* Links Footer */}
          <div className="mt-6 pt-6 border-t border-[#27272A] flex flex-col items-center gap-3 text-center">
            <Link
              to="/register"
              className="text-sm text-white/80 hover:text-white transition-colors"
            >
              New user? Register
            </Link>

            <Link
              to="/corporate-login"
              className="w-full py-2.5 px-4 rounded-[16px] border border-[#27272A] hover:bg-white/[0.03] text-white/80 hover:text-white text-xs font-medium inline-flex items-center justify-center gap-2 transition-all"
            >
              <Briefcase className="w-4 h-4 text-[#8B5CF6]" />
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
