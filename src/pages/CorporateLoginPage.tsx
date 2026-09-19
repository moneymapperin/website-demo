import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    <AuthPageLayout
      title="Corporate Portal"
      subtitle="Enter your admin credentials to access workforce intelligence"
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

          {/* Corporate Email */}
          <div className="space-y-1.5">
            <label
              htmlFor="corporate-email"
              className="block text-sm font-medium text-white/90"
            >
              Corporate Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40">
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
                className="w-full pl-11 pr-4 py-3.5 bg-white/[0.04] border border-[#27272A] rounded-[16px] text-white placeholder-white/30 focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-all text-sm disabled:opacity-50"
              />
            </div>
          </div>

          {/* Admin Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="corporate-password"
              className="block text-sm font-medium text-white/90"
            >
              Admin Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40">
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

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3.5 px-4 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold rounded-[16px] transition-all duration-200 shadow-lg shadow-[#4F46E5]/25 disabled:opacity-60 flex items-center justify-center text-sm"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Access Intelligence'
            )}
          </button>
        </form>
      </div>

      {/* Standard User Dialog mirroring Flutter AlertDialog */}
      {showStandardUserDialog && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="standard-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="w-full max-w-md bg-[#0D0E15] border border-[#27272A] rounded-[24px] p-6 sm:p-8 shadow-2xl text-left">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-7 h-7 text-amber-400 shrink-0" />
              <h2
                id="standard-dialog-title"
                className="text-lg font-bold text-white tracking-wide"
              >
                Standard Account Detected
              </h2>
            </div>
            <p className="text-white/70 text-sm leading-relaxed mb-6">
              This email is not registered as a Corporate Admin. Please login as a normal user to access your personal dashboard.
            </p>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full py-3.5 px-4 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold rounded-[16px] transition-colors text-sm"
            >
              Back to Login
            </button>
          </div>
        </div>
      )}
    </AuthPageLayout>
  );
};

export default CorporateLoginPage;
