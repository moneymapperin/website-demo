import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle2 } from 'lucide-react';
import { AuthPageLayout } from '../components/AuthPageLayout';
import { authService } from '../services/authService';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Please enter your email to reset password');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(trimmedEmail);
      setSuccessMessage('Password reset link sent to your email');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageLayout
      title="Reset Password"
      subtitle="Enter your email to receive password reset instructions"
      showBack
      maxWidth="md"
    >
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

          {successMessage && (
            <div
              role="status"
              className="p-4 rounded-[16px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-medium flex items-center gap-3"
            >
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Email Address */}
          <div className="space-y-1.5">
            <label
              htmlFor="forgot-email"
              className="block text-sm font-medium text-white/90"
            >
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40">
                <Mail className="w-5 h-5" />
              </div>
              <input
                id="forgot-email"
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

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3.5 px-4 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold rounded-[16px] transition-all duration-200 shadow-lg shadow-[#4F46E5]/25 disabled:opacity-60 flex items-center justify-center text-sm"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-[#27272A] text-center">
          <Link
            to="/login"
            className="text-sm text-white/80 hover:text-white transition-colors"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </AuthPageLayout>
  );
};

export default ForgotPasswordPage;
