import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { v4 as uuidv4 } from 'uuid';
import { RefreshCw, QrCode, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { apiService } from '../services/apiService';
import { setQrAuthInProgress } from '../context/AuthContext';

export type QrSessionStatus = 'ready' | 'authenticated' | 'expired' | 'session_error';

export const QrLoginPanel: React.FC = () => {
  const navigate = useNavigate();

  const [sessionToken, setSessionToken] = useState<string>('');
  const [status, setStatus] = useState<QrSessionStatus>('ready');
  const [secondsRemaining, setSecondsRemaining] = useState<number>(120);

  const activeTokenRef = useRef<string>('');
  const timerIdRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const expiresAtRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);
  const isAuthenticatingRef = useRef<boolean>(false);

  const clearTimers = useCallback(() => {
    if (timerIdRef.current) {
      clearInterval(timerIdRef.current);
      timerIdRef.current = null;
    }
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const initQrSession = useCallback(() => {
    clearTimers();

    const newToken = uuidv4();
    activeTokenRef.current = newToken;
    setSessionToken(newToken);
    setStatus('ready');
    isAuthenticatingRef.current = false;

    const expiresAt = Date.now() + 120000;
    expiresAtRef.current = expiresAt;
    setSecondsRemaining(120);

    // 1. Polling function for atomic claim
    const pollClaim = async () => {
      if (
        !isMountedRef.current ||
        isAuthenticatingRef.current ||
        Date.now() >= expiresAtRef.current ||
        activeTokenRef.current !== newToken
      ) {
        return;
      }

      try {
        const { data, error } = await supabase.rpc('claim_web_session', {
          p_token: newToken,
        });

        if (error || !data || !Array.isArray(data) || data.length === 0) {
          return;
        }

        const sessionRow = data[0];
        if (!sessionRow?.access_token || !sessionRow?.refresh_token) {
          return;
        }

        // Row was claimed and deleted atomically by RPC; stop polling immediately
        clearTimers();

        isAuthenticatingRef.current = true;
        setQrAuthInProgress(true);

        if (isMountedRef.current) {
          setStatus('authenticated');
        }

        // Hydrate session on client
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: sessionRow.access_token,
          refresh_token: sessionRow.refresh_token,
        });

        if (sessionError || !sessionData?.session) {
          throw sessionError || new Error('Failed to set session');
        }

        // Role-based redirect using email from setSession result
        const userEmail = sessionData.user?.email || '';
        let isCorporate = false;
        if (userEmail) {
          try {
            const admin = await apiService.getCorporateAdmin(userEmail);
            if (admin && admin.company_name) {
              isCorporate = true;
            }
          } catch {
            // If getCorporateAdmin throws, fallback to /dashboard
            isCorporate = false;
          }
        }

        navigate(isCorporate ? '/corporate-dashboard' : '/dashboard', { replace: true });
      } catch {
        setQrAuthInProgress(false);
        if (isMountedRef.current) {
          setStatus('session_error');
        }
      } finally {
        isAuthenticatingRef.current = false;
      }
    };

    // Poll every 2 seconds
    pollIntervalRef.current = setInterval(pollClaim, 2000);

    // 2. Countdown and Expiry check every 1 second
    const checkExpiry = () => {
      if (!isMountedRef.current) return;
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((expiresAtRef.current - now) / 1000));
      setSecondsRemaining(remaining);

      if (remaining <= 0) {
        clearTimers();
        setStatus('expired');
      }
    };

    timerIdRef.current = setInterval(checkExpiry, 1000);
  }, [clearTimers, navigate]);

  useEffect(() => {
    isMountedRef.current = true;
    initQrSession();

    // Check expiry when tab visibility changes (handles background tab throttling)
    const handleVisibilityChange = () => {
      if (!document.hidden && status !== 'expired' && status !== 'authenticated') {
        if (Date.now() >= expiresAtRef.current) {
          clearTimers();
          setStatus('expired');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMountedRef.current = false;
      setQrAuthInProgress(false);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearTimers();
      activeTokenRef.current = '';
    };
  }, [initQrSession, clearTimers]);

  return (
    <div
      data-testid="qr-panel-placeholder"
      className="lg:col-span-5 bg-[#0D0E15] border border-[#27272A] rounded-[24px] p-6 sm:p-8 shadow-xl flex flex-col items-center justify-between text-center relative overflow-hidden min-h-[460px]"
    >
      {/* Header */}
      <div>
        <div className="w-12 h-12 mx-auto rounded-2xl bg-[#4F46E5]/10 border border-[#4F46E5]/20 flex items-center justify-center text-[#8B5CF6] mb-3">
          <QrCode className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-white mb-1">Log in with QR Code</h2>
        <p className="text-white/60 text-xs max-w-xs leading-relaxed">
          Open MoneyMapper → Profile (or Corporate Dashboard) → QR scanner icon → scan this code
        </p>
      </div>

      {/* QR Display Area */}
      <div className="my-6 relative flex items-center justify-center">
        <div className="p-4 bg-white rounded-2xl shadow-inner min-w-[216px] min-h-[216px] flex items-center justify-center relative">
          {status === 'authenticated' && (
            <div className="flex flex-col items-center justify-center text-emerald-600 text-xs font-bold gap-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 animate-bounce" />
              <span>Authenticated! Redirecting...</span>
            </div>
          )}

          {(status === 'ready' || status === 'expired' || status === 'session_error') && sessionToken && (
            <QRCodeSVG
              data-testid="qr-code-svg"
              data-token={sessionToken}
              value={sessionToken}
              size={184}
              level="M"
              includeMargin={false}
              className={status === 'expired' ? 'opacity-10 blur-sm' : ''}
            />
          )}

          {/* Expired Overlay */}
          {status === 'expired' && (
            <div className="absolute inset-0 rounded-2xl bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-white">
              <p className="text-xs font-semibold text-white/90 mb-3">QR expired</p>
              <button
                type="button"
                onClick={initQrSession}
                className="inline-flex items-center gap-1.5 py-2 px-3.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl text-xs font-semibold transition-all shadow-md"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh QR</span>
              </button>
            </div>
          )}

          {/* Session Error Overlay */}
          {status === 'session_error' && (
            <div className="absolute inset-0 rounded-2xl bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-white">
              <p className="text-xs font-semibold text-red-400 mb-2">Login session failed</p>
              <button
                type="button"
                onClick={initQrSession}
                className="inline-flex items-center gap-1.5 py-2 px-3.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Try again</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer / Expiry countdown */}
      <div className="w-full">
        {status === 'ready' ? (
          <p className="text-white/40 text-[11px]">
            Code expires in <span className="text-white/75 font-mono">{secondsRemaining}s</span>
          </p>
        ) : (
          <div className="h-4" />
        )}
      </div>
    </div>
  );
};

export default QrLoginPanel;
