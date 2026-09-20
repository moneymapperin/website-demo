import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiService } from '../../services/apiService';

export interface CorporateGuardProps {
  children: React.ReactNode;
}

export type CorporateGuardStatus = 'checking' | 'authorized' | 'unauthorized' | 'error';

export const CorporateGuard: React.FC<CorporateGuardProps> = ({ children }) => {
  const { user, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [status, setStatus] = useState<CorporateGuardStatus>('checking');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const verifyAdmin = useCallback(async () => {
    if (authLoading) return;

    if (!user || !user.email) {
      showToast(
        'Standard Account Detected: Corporate intelligence is restricted to authorized corporate administrators.'
      );
      setStatus('unauthorized');
      navigate('/dashboard', { replace: true });
      return;
    }

    setStatus('checking');
    setErrorMessage(null);

    try {
      const adminRecord = await apiService.getCorporateAdmin(user.email);
      if (!adminRecord) {
        showToast(
          'Standard Account Detected: Corporate intelligence is restricted to authorized corporate administrators.'
        );
        setStatus('unauthorized');
        navigate('/dashboard', { replace: true });
        return;
      }

      setStatus('authorized');
    } catch (err: any) {
      // Network or RLS error: display error state with retry, do NOT redirect
      setStatus('error');
      setErrorMessage(
        err?.message ||
          'Failed to verify corporate administrator privileges. Please check your connection and try again.'
      );
    }
  }, [authLoading, user, showToast, navigate]);

  useEffect(() => {
    verifyAdmin();
  }, [verifyAdmin]);

  if (status === 'checking' || authLoading) {
    return (
      <div
        data-testid="corporate-guard-loading"
        className="min-h-screen w-full flex flex-col items-center justify-center bg-[#07110F] text-white p-6"
      >
        <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin mb-4" />
        <p className="text-sm font-bold text-emerald-400 tracking-wider uppercase">
          Verifying Corporate Credentials...
        </p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div
        data-testid="corporate-guard-error"
        role="alert"
        className="min-h-screen w-full flex flex-col items-center justify-center bg-[#07110F] text-white p-6"
      >
        <div className="max-w-md w-full bg-[#0D1B18] border border-red-500/30 rounded-2xl p-6 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 mx-auto rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-red-400">Verification Error</h2>
          <p className="text-xs text-zinc-300 leading-relaxed">
            {errorMessage || 'Unable to connect to workforce security service.'}
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              data-testid="retry-corporate-verification-btn"
              onClick={verifyAdmin}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md active:scale-95"
            >
              Retry Verification
            </button>
            <button
              onClick={() => navigate('/dashboard', { replace: true })}
              className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-all"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'authorized') {
    return <>{children}</>;
  }

  return null;
};
