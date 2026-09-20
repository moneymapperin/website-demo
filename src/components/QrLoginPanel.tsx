import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { v4 as uuidv4 } from 'uuid';
import { RefreshCw, QrCode, CheckCircle2 } from 'lucide-react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { apiService } from '../services/apiService';
import { setQrAuthInProgress } from '../context/AuthContext';

export type QrSessionStatus = 'loading' | 'ready' | 'authenticated' | 'expired' | 'session_error' | 'generate_error';

export const QrLoginPanel: React.FC = () => {
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  const [sessionToken, setSessionToken] = useState<string>('');
  const [status, setStatus] = useState<QrSessionStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('Login failed, please retry');
  const [secondsRemaining, setSecondsRemaining] = useState<number>(120);

  const statusRef = useRef<QrSessionStatus>('loading');
  statusRef.current = status;

  const activeTokenRef = useRef<string>('');
  const activeChannelRef = useRef<RealtimeChannel | null>(null);
  const timerIdRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const expiresAtRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);
  const isAuthenticatingRef = useRef<boolean>(false);

  // StrictMode dev-mode lifecycle guard refs
  const isFirstMountCleanupRef = useRef<boolean>(true);
  const hasInitializedRef = useRef<boolean>(false);
  const hasSubscribedRef = useRef<boolean>(false);

  // Best-effort session cleanup helper
  const cleanupSession = useCallback((tokenToClean?: string) => {
    if (timerIdRef.current) {
      try {
        clearInterval(timerIdRef.current);
      } catch {
        // Safe catch
      }
      timerIdRef.current = null;
    }

    if (activeChannelRef.current) {
      try {
        supabase.removeChannel(activeChannelRef.current);
      } catch {
        // Safe catch
      }
      activeChannelRef.current = null;
    }

    const token = tokenToClean || activeTokenRef.current;
    if (token) {
      try {
        supabase
          .from('web_sessions')
          .delete()
          .eq('session_token', token)
          .then(
            () => {},
            () => {}
          );
      } catch {
        // Safe catch
      }
    }
  }, []);

  const checkExpiry = useCallback(() => {
    if (!isMountedRef.current) return;
    const now = Date.now();
    const remaining = Math.max(0, Math.ceil((expiresAtRef.current - now) / 1000));
    setSecondsRemaining(remaining);

    if (remaining <= 0) {
      if (timerIdRef.current) {
        try {
          clearInterval(timerIdRef.current);
        } catch {
          // Safe catch
        }
        timerIdRef.current = null;
      }
      if (activeChannelRef.current) {
        try {
          supabase.removeChannel(activeChannelRef.current);
        } catch {
          // Safe catch
        }
        activeChannelRef.current = null;
      }
      const token = activeTokenRef.current;
      if (token) {
        try {
          supabase
            .from('web_sessions')
            .delete()
            .eq('session_token', token)
            .then(
              () => {},
              () => {}
            );
        } catch {
          // Safe catch
        }
      }
      setStatus('expired');
    }
  }, []);

  const initQrSession = useCallback(() => {
    // 1. Clean up prior session if existing
    const oldToken = activeTokenRef.current;
    cleanupSession(oldToken);

    hasSubscribedRef.current = false;

    // Sequence Step 1: Generate fresh UUID token
    const token = uuidv4();
    activeTokenRef.current = token;
    setSessionToken(token);
    setStatus('loading');
    isAuthenticatingRef.current = false;

    // Sequence Step 6 & 7: Realtime UPDATE handler
    const handleUpdate = async (payload: { new?: any }) => {
      const newRow = payload?.new;
      console.log('[QR_DEBUG] handleUpdate received raw payload.new:', newRow);

      const isTokenMatch = newRow?.session_token === token;
      const isStatusAuthenticated = newRow?.status === 'AUTHENTICATED';
      const isAccessTokenPresent = Boolean(newRow?.access_token);
      const isRefreshTokenPresent = Boolean(newRow?.refresh_token);

      console.log('[QR_DEBUG] Validation checks:', {
        'session_token match': isTokenMatch,
        "status === 'AUTHENTICATED'": isStatusAuthenticated,
        'access_token present': isAccessTokenPresent,
        'refresh_token present': isRefreshTokenPresent,
        isMounted: isMountedRef.current,
        isAuthenticating: isAuthenticatingRef.current,
        activeTokenMatches: activeTokenRef.current === token,
      });

      // Defensive checks per step 6:
      // Check session_token match, status === 'AUTHENTICATED', and truthy tokens.
      // If any check fails, ignore and keep waiting (do not error out).
      if (
        !isMountedRef.current ||
        isAuthenticatingRef.current ||
        activeTokenRef.current !== token ||
        !newRow ||
        !isTokenMatch ||
        !isStatusAuthenticated ||
        !isAccessTokenPresent ||
        !isRefreshTokenPresent
      ) {
        return;
      }

      // Fully valid AUTHENTICATED payload
      isAuthenticatingRef.current = true;
      setQrAuthInProgress(true);

      // Stop expiry timer & channel
      if (timerIdRef.current) {
        try {
          clearInterval(timerIdRef.current);
        } catch {
          // Safe catch
        }
        timerIdRef.current = null;
      }
      if (activeChannelRef.current) {
        try {
          supabase.removeChannel(activeChannelRef.current);
        } catch {
          // Safe catch
        }
        activeChannelRef.current = null;
      }

      if (isMountedRef.current) {
        setStatus('authenticated');
      }

      try {
        console.log('[QR_DEBUG] Right before supabase.auth.setSession(...) with tokens:', {
          hasAccessToken: Boolean(newRow.access_token),
          hasRefreshToken: Boolean(newRow.refresh_token),
        });

        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: newRow.access_token,
          refresh_token: newRow.refresh_token,
        });

        console.log('[QR_DEBUG] Right after supabase.auth.setSession(...) response:', {
          data: sessionData,
          error: sessionError,
        });

        if (sessionError || !sessionData?.session) {
          throw sessionError || new Error('Failed to set session');
        }

        // On success: best-effort delete row (never block navigation on failure)
        try {
          supabase
            .from('web_sessions')
            .delete()
            .eq('session_token', token)
            .then(
              () => {},
              () => {}
            );
        } catch {
          // Safe catch
        }

        // Corporate admin check + navigation
        const userEmail = sessionData.user?.email || '';
        let isCorporate = false;
        if (userEmail) {
          try {
            const admin = await apiService.getCorporateAdmin(userEmail);
            if (admin && admin.company_name) {
              isCorporate = true;
            }
          } catch {
            isCorporate = false;
          }
        }

        const targetPath = isCorporate ? '/corporate-dashboard' : '/dashboard';
        console.log('[QR_DEBUG] Right before navigate(...) called with path:', targetPath);
        navigateRef.current(targetPath, { replace: true });
      } catch {
        setQrAuthInProgress(false);
        isAuthenticatingRef.current = false;
        if (isMountedRef.current) {
          setErrorMessage('Login failed, please retry');
          setStatus('session_error');
        }
      }
    };

    // Sequence Step 2: Create the realtime channel
    const channel = supabase
      .channel(`qr-login-${token}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'web_sessions',
          filter: `session_token=eq.${token}`,
        },
        handleUpdate
      );

    activeChannelRef.current = channel;

    // Sequence Step 3: Subscribe and ONLY proceed to step 4 once subStatus === 'SUBSCRIBED'
    channel.subscribe(async (subStatus) => {
      console.log('[QR_DEBUG] channel.subscribe callback fired, subStatus:', subStatus);
      if (!isMountedRef.current || activeTokenRef.current !== token) return;

      if (subStatus === 'SUBSCRIBED') {
        hasSubscribedRef.current = true;
        // Sequence Step 4: After SUBSCRIBED confirmed, insert PENDING row
        try {
          console.log('[QR_DEBUG] Right before insert() call for PENDING row, token:', token);
          const { error: insertError } = await supabase.from('web_sessions').insert({
            session_token: token,
            status: 'PENDING',
          });

          if (insertError) {
            console.log('[QR_DEBUG] insert() call for PENDING row failed with error:', insertError);
            if (isMountedRef.current && activeTokenRef.current === token) {
              setErrorMessage('Could not generate QR, retry');
              setStatus('generate_error');
            }
            return;
          }

          console.log('[QR_DEBUG] insert() call for PENDING row succeeded, token:', token);

          if (!isMountedRef.current || activeTokenRef.current !== token) return;

          // Sequence Step 5: Render QR code and start 120s timer
          setStatus('ready');
          const expiresAt = Date.now() + 120000;
          expiresAtRef.current = expiresAt;
          setSecondsRemaining(120);

          if (timerIdRef.current) clearInterval(timerIdRef.current);
          timerIdRef.current = setInterval(checkExpiry, 1000);
        } catch (insertCatchErr) {
          console.log('[QR_DEBUG] insert() call for PENDING row caught exception:', insertCatchErr);
          if (isMountedRef.current && activeTokenRef.current === token) {
            setErrorMessage('Could not generate QR, retry');
            setStatus('generate_error');
          }
        }
      } else if (subStatus === 'CHANNEL_ERROR' || subStatus === 'TIMED_OUT') {
        if (isMountedRef.current && activeTokenRef.current === token) {
          setErrorMessage('Login failed, please retry');
          setStatus('session_error');
        }
      }
    });
  }, [cleanupSession, checkExpiry]);

  const initQrSessionRef = useRef(initQrSession);
  useEffect(() => {
    initQrSessionRef.current = initQrSession;
  }, [initQrSession]);

  const cleanupSessionRef = useRef(cleanupSession);
  useEffect(() => {
    cleanupSessionRef.current = cleanupSession;
  }, [cleanupSession]);

  useEffect(() => {
    console.log('[QR_DEBUG] Component mounted at:', new Date().toISOString(), 'Timestamp:', Date.now());
    isMountedRef.current = true;

    if (import.meta.env.DEV) {
      if (!hasInitializedRef.current) {
        hasInitializedRef.current = true;
        initQrSessionRef.current();
      }
    } else {
      initQrSessionRef.current();
    }

    const handleVisibilityChange = () => {
      if (
        !document.hidden &&
        statusRef.current !== 'expired' &&
        statusRef.current !== 'authenticated' &&
        statusRef.current !== 'loading'
      ) {
        if (Date.now() >= expiresAtRef.current) {
          if (timerIdRef.current) {
            try {
              clearInterval(timerIdRef.current);
            } catch {
              // Safe catch
            }
            timerIdRef.current = null;
          }
          setStatus('expired');
        }
      }
    };

    try {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    } catch {
      // Safe catch
    }

    return () => {
      console.log('[QR_DEBUG] Component effect cleanup at:', new Date().toISOString(), 'Timestamp:', Date.now());
      try {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      } catch {
        // Safe catch
      }

      // StrictMode dev-mode guard:
      // In development mode, React 18 invokes setup -> cleanup -> setup on initial mount.
      // If this is the first cleanup in DEV and the subscription hasn't yet settled,
      // skip the destructive removeChannel and delete row operations to survive the synthetic unmount.
      if (import.meta.env.DEV && isFirstMountCleanupRef.current && !hasSubscribedRef.current) {
        isFirstMountCleanupRef.current = false;
        console.log('[QR_DEBUG] Skipping synthetic dev-mode StrictMode cleanup');
        return;
      }

      isMountedRef.current = false;
      try {
        setQrAuthInProgress(false);
      } catch {
        // Safe catch
      }
      cleanupSessionRef.current();
      activeTokenRef.current = '';
    };
  }, []); // Empty dependency array: runs strictly once on real mount

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
          {status === 'loading' && (
            <div data-testid="qr-loading" className="flex flex-col items-center justify-center text-slate-500 gap-2">
              <RefreshCw className="w-8 h-8 text-[#4F46E5] animate-spin" />
              <span className="text-xs font-semibold text-slate-600">Generating secure QR...</span>
            </div>
          )}

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
              data-value={sessionToken}
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

          {/* Error Overlay (session or generate failure) */}
          {(status === 'session_error' || status === 'generate_error') && (
            <div className="absolute inset-0 rounded-2xl bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-white">
              <p className="text-xs font-semibold text-red-400 mb-2">{errorMessage}</p>
              <button
                type="button"
                onClick={initQrSession}
                className="inline-flex items-center gap-1.5 py-2 px-3.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{status === 'generate_error' ? 'Retry' : 'Try again'}</span>
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
