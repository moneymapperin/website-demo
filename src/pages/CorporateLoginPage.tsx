import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Briefcase, AlertTriangle } from 'lucide-react';
import { AuthPageLayout } from '../components/AuthPageLayout';
import { authService } from '../services/authService';
import { apiService } from '../services/apiService';

export const CorporateLoginPage: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showStandardUserDialog, setShowStandardUserDialog] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMessage('Please enter corporate email and password');
      return;
    }

    setLoading(true);
    try {
      // 1. Authenticate with Supabase
      await authService.signIn(trimmedEmail, password);

      // 2. Verify corporate admin status with normalized lowercase email
      const normalizedEmail = trimmedEmail.toLowerCase();
      let adminRecord: { company_name: string } | null = null;
      try {
        adminRecord = await apiService.getCorporateAdmin(normalizedEmail);
      } catch {
        // Network / RLS / query exception: logout for safety and display verification error
        await authService.logout();
        setErrorMessage('Could not verify corporate access. Please try again.');
        return;
      }

      if (adminRecord && adminRecord.company_name) {
        // Success: Redirect to corporate dashboard
        navigate('/corporate-dashboard', { replace: true });
      } else {
        // Not registered as corporate admin: logout and show standard user dialog
        await authService.logout();
        setShowStandardUserDialog(true);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageLayout showBack maxWidth="md">
      <div className="bg-[#080E2A]/90 backdrop-blur-xl border border-[#1E3268] rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 shadow-[0_12px_40px_rgba(0,145,255,0.15)]">
        <div className="mb-5 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Corporate Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1">
            Enter your admin credentials to access workforce intelligence
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {errorMessage && (
            <div
              role="alert"
              className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs sm:text-sm font-medium"
            >
              {errorMessage}
            </div>
          )}

          {/* Corporate Email */}
          <div className="space-y-1.5">
            <label
              htmlFor="corporate-email"
              className="block text-xs sm:text-sm font-semibold text-slate-200"
            >
              Corporate Email
            </label>
            <div className="relative rounded-2xl bg-[#050A1E] border border-[#1C2C5E] focus-within:border-[#0091FF] focus-within:ring-1 focus-within:ring-[#0091FF] transition-all">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Briefcase className="w-5 h-5" />
              </div>
              <input
                id="corporate-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                placeholder="admin@company.com"
                autoComplete="email"
                className="w-full pl-12 pr-4 py-3.5 bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none disabled:opacity-50"
              />
            </div>
          </div>

          {/* Admin Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="corporate-password"
              className="block text-xs sm:text-sm font-semibold text-slate-200"
            >
              Admin Password
            </label>
            <div className="relative rounded-2xl bg-[#050A1E] border border-[#1C2C5E] focus-within:border-[#0091FF] focus-within:ring-1 focus-within:ring-[#0091FF] transition-all">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                id="corporate-password"
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
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3.5 px-4 bg-[#0091FF] hover:bg-[#007EE5] text-white font-bold rounded-2xl transition-all duration-200 shadow-[0_4px_20px_rgba(0,145,255,0.4)] disabled:opacity-60 flex items-center justify-center text-sm sm:text-base"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Access Intelligence'
            )}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-[#1C2C5E] text-center">
          <Link
            to="/login"
            className="text-xs sm:text-sm font-semibold text-[#0091FF] hover:text-[#38BDF8] transition-colors"
          >
            ← Back to User Login
          </Link>
        </div>
      </div>

      {/* Standard User Dialog mirroring Flutter AlertDialog */}
      {showStandardUserDialog && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
        >
          <div className="bg-[#0A0F29] border border-[#1E2954] rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">Standard Account Detected</h2>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                This email is not registered as a Corporate Admin. Please login as a normal user to access your personal dashboard.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => navigate('/login', { replace: true })}
                className="w-full py-3 px-4 bg-[#0084FF] hover:bg-[#0070DD] text-white font-bold rounded-2xl transition-all text-sm shadow-md"
              >
                Back to Login
              </button>
              <button
                type="button"
                onClick={() => setShowStandardUserDialog(false)}
                className="w-full py-2.5 px-4 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthPageLayout>
  );
};

export default CorporateLoginPage;
