import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, AlertCircle } from 'lucide-react';
import { AuthPageLayout } from '../components/AuthPageLayout';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { supabase } from '../lib/supabase';

export const ResetPasswordPage: React.FC = () => {
  const { session, isLoading } = useAuth();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!password || !confirmPassword) {
      setErrorMessage('Please enter and confirm your new password');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      await authService.updatePassword(password);
      // Clean up the recovery session locally so user must log in with their fresh password
      await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
      navigate('/login', {
        replace: true,
        state: {
          message: 'Password updated successfully! Please login with your new password.',
        },
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // 1. Initial auth state check
  if (isLoading) {
    return (
      <AuthPageLayout title="New Password" subtitle="Enter your new password below" maxWidth="md">
        <div className="bg-[#0D0E15] border border-[#27272A] rounded-[24px] p-8 text-center flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-[#4F46E5] rounded-full animate-spin mb-4" />
          <p className="text-white/60 text-sm">Verifying reset link session...</p>
        </div>
      </AuthPageLayout>
    );
  }

  // 2. If no session exists after loading (invalid or expired recovery link)
  if (!session) {
    return (
      <AuthPageLayout title="New Password" subtitle="Enter your new password below" maxWidth="md">
        <div className="bg-[#0D0E15] border border-[#27272A] rounded-[24px] p-6 sm:p-8 shadow-xl text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white">Reset Link Invalid or Expired</h2>
          <p role="alert" className="text-white/70 text-sm leading-relaxed">
            This reset link is invalid or has expired. Please request a new one.
          </p>
          <Link
            to="/forgot-password"
            className="inline-block mt-2 py-3 px-6 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold rounded-[16px] transition-all text-sm shadow-lg shadow-[#4F46E5]/25"
          >
            Request New Reset Link
          </Link>
        </div>
      </AuthPageLayout>
    );
  }

  // 3. Valid recovery session: render form
  return (
    <AuthPageLayout title="New Password" subtitle="Enter your new password below" maxWidth="md">
      <div className="bg-[#0D0E15] border border-[#27272A] rounded-[24px] p-6 sm:p-8 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {errorMessage && (
            <div
              role="alert"
              className="p-4 rounded-[16px] bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium"
            >
              {errorMessage}
            </div>
          )}

          {/* New Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="reset-new-password"
              className="block text-sm font-medium text-white/90"
            >
              New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40">
                <Lock className="w-5 h-5" />
              </div>
              <input
                id="reset-new-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
                placeholder="••••••••"
                autoComplete="new-password"
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

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="reset-confirm-password"
              className="block text-sm font-medium text-white/90"
            >
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40">
                <Lock className="w-5 h-5" />
              </div>
              <input
                id="reset-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={submitting}
                placeholder="••••••••"
                autoComplete="new-password"
                className="w-full pl-11 pr-12 py-3.5 bg-white/[0.04] border border-[#27272A] rounded-[16px] text-white placeholder-white/30 focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-all text-sm disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/40 hover:text-white/80 transition-colors"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-4 py-3.5 px-4 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold rounded-[16px] transition-all duration-200 shadow-lg shadow-[#4F46E5]/25 disabled:opacity-60 flex items-center justify-center text-sm"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Update Password'
            )}
          </button>
        </form>
      </div>
    </AuthPageLayout>
  );
};

export default ResetPasswordPage;
