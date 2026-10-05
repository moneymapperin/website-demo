import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, User, Phone, CheckCircle2 } from 'lucide-react';
import { AuthPageLayout } from '../components/AuthPageLayout';
import { authService } from '../services/authService';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    const trimmedMobile = mobile.trim();

    if (!trimmedName || !trimmedEmail || !trimmedMobile || !password || !confirmPassword) {
      setErrorMessage('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await authService.signUp(trimmedEmail, password, {
        fullName: trimmedName,
        mobile: trimmedMobile,
        plan: 'b2c',
      });
      setShowSuccessDialog(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageLayout showBack maxWidth="lg">
      <div className="bg-[#080E2A]/90 backdrop-blur-xl border border-[#1E3268] rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 shadow-[0_12px_40px_rgba(0,145,255,0.15)]">
        <div className="mb-5 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Create account
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1">
            Join MoneyMapper to track your financial health
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

          {/* Row 1: Full Name & Mobile Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label
                htmlFor="register-fullname"
                className="block text-sm font-medium text-slate-200"
              >
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  id="register-fullname"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={loading}
                  placeholder="John Doe"
                  autoComplete="name"
                  className="w-full pl-12 pr-4 py-3 bg-[#070B1F]/90 border border-[#1E2954] rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-[#0084FF] focus:ring-1 focus:ring-[#0084FF] transition-all text-sm disabled:opacity-50"
                />
              </div>
            </div>

            {/* Mobile Number */}
            <div className="space-y-1.5">
              <label
                htmlFor="register-mobile"
                className="block text-sm font-medium text-slate-200"
              >
                Mobile Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-5 h-5" />
                </div>
                <input
                  id="register-mobile"
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  disabled={loading}
                  placeholder="+91 98765 43210"
                  autoComplete="tel"
                  className="w-full pl-12 pr-4 py-3 bg-[#070B1F]/90 border border-[#1E2954] rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-[#0084FF] focus:ring-1 focus:ring-[#0084FF] transition-all text-sm disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Row 2: Email Address */}
          <div className="space-y-1.5">
            <label
              htmlFor="register-email"
              className="block text-sm font-medium text-slate-200"
            >
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-5 h-5" />
              </div>
              <input
                id="register-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                placeholder="name@example.com"
                autoComplete="email"
                className="w-full pl-12 pr-4 py-3 bg-[#070B1F]/90 border border-[#1E2954] rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-[#0084FF] focus:ring-1 focus:ring-[#0084FF] transition-all text-sm disabled:opacity-50"
              />
            </div>
          </div>

          {/* Row 3: Password & Confirm Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="register-password"
                className="block text-sm font-medium text-slate-200"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full pl-12 pr-12 py-3 bg-[#070B1F]/90 border border-[#1E2954] rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-[#0084FF] focus:ring-1 focus:ring-[#0084FF] transition-all text-sm disabled:opacity-50"
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

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="register-confirm-password"
                className="block text-sm font-medium text-slate-200"
              >
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="register-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full pl-12 pr-12 py-3 bg-[#070B1F]/90 border border-[#1E2954] rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-[#0084FF] focus:ring-1 focus:ring-[#0084FF] transition-all text-sm disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-white transition-colors"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full !mt-5 py-3.5 px-4 bg-[#0091FF] hover:bg-[#007EE5] text-white font-bold rounded-2xl transition-all duration-200 shadow-[0_4px_20px_rgba(0,145,255,0.4)] disabled:opacity-60 flex items-center justify-center text-sm sm:text-base"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Register'
            )}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-[#1C2C5E] text-center">
          <Link
            to="/login"
            className="text-xs sm:text-sm font-semibold text-[#0091FF] hover:text-[#38BDF8] transition-colors"
          >
            Already have an account? Login
          </Link>
        </div>
      </div>

      {/* Success Dialog */}
      {showSuccessDialog && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
        >
          <div className="bg-[#0A0F29] border border-[#1E2954] rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">Registration Successful</h2>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Your account has been created! Please check your email inbox to verify your account before logging in.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/login', { replace: true })}
              className="w-full py-3 px-4 bg-[#0084FF] hover:bg-[#0070DD] text-white font-bold rounded-2xl transition-all text-sm shadow-md"
            >
              Back to Login
            </button>
          </div>
        </div>
      )}
    </AuthPageLayout>
  );
};

export default RegisterPage;
