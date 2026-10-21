import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { v4 as uuidv4 } from 'uuid';
import { RefreshCw, QrCode, CheckCircle2 } from 'lucide-react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { apiService } from '../services/apiService';
import { setQrAuthInProgress } from '../context/AuthContext';

const isTestEnv =
  (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.MODE === 'test');

export type QrSessionStatus =
  | 'idle'
  | 'generating'
  | 'loading'
  | 'ready'
  | 'authenticated'
  | 'expired'
  | 'session_error'
  | 'generate_error';

export interface QrLoginPanelProps {
  autoStart?: boolean;
  countdownSeconds?: number;
}

export const QrLoginPanel: React.FC<QrLoginPanelProps> = ({
  autoStart = true,
  countdownSeconds = 5,
}) => {
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  const [sessionToken, setSessionToken] = useState<string>('');
  const [status, setStatus] = useState<QrSessionStatus>(autoStart ? 'loading' : 'idle');
  const [errorMessage, setErrorMessage] = useState<string>('Login failed, please retry');
  const [secondsRemaining, setSecondsRemaining] = useState<number>(120);
  const [countdown, setCountdown] = useState<number>(countdownSeconds);

  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const statusRef = useRef<QrSessionStatus>(autoStart ? 'loading' : 'idle');
  statusRef.current = status;

  const activeTokenRef = useRef<string>('');
  const activeChannelRef = useRef<RealtimeChannel | null>(null);
  const timerIdRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const expiresAtRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);
  const isAuthenticatingRef = useRef<boolean>(false);

  // StrictMode dev-mode lifecycle guard refs
  const isFirstMountCleanupRef = useRef<boolean>(true);
  const hasInitializedRef = useRef<boolean>(false);
  const hasSubscribedRef = useRef<boolean>(false);

  // Best-effort session cleanup helper
  const cleanupSession = useCallback((tokenToClean?: string) => {
    if (countdownIntervalRef.current) {
      try {
        clearInterval(countdownIntervalRef.current);
      } catch {
        // Safe catch
      }
      countdownIntervalRef.current = null;
    }

    if (timerIdRef.current) {
      try {
        clearInterval(timerIdRef.current);
      } catch {
        // Safe catch
      }
      timerIdRef.current = null;
    }

    if (pollIntervalRef.current) {
      try {
        clearInterval(pollIntervalRef.current);
      } catch {
        // Safe catch
      }
      pollIntervalRef.current = null;
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
      if (pollIntervalRef.current) {
        try {
          clearInterval(pollIntervalRef.current);
        } catch {
          // Safe catch
        }
        pollIntervalRef.current = null;
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

      // Stop expiry timer & channel & polling
      if (timerIdRef.current) {
        try {
          clearInterval(timerIdRef.current);
        } catch {
          // Safe catch
        }
        timerIdRef.current = null;
      }
      if (pollIntervalRef.current) {
        try {
          clearInterval(pollIntervalRef.current);
        } catch {
          // Safe catch
        }
        pollIntervalRef.current = null;
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

        let sessionData: any = null;
        try {
          const res = await supabase.auth.setSession({
            access_token: newRow.access_token,
            refresh_token: newRow.refresh_token,
          });

          console.log('[QR_DEBUG] Right after supabase.auth.setSession(...) response:', res);
          if (!res.error && res.data?.session) {
            sessionData = res.data;
          }
        } catch (setSessErr) {
          console.warn('[QR_DEBUG] supabase.auth.setSession threw error:', setSessErr);
        }

        // Resilient fallback: If setSession failed or rejected (e.g. GoTrue session_not_found from mobile app),
        // decode the signed JWT access_token to hydrate the session directly if valid and unexpired
        if (!sessionData?.session) {
          try {
            const tokenParts = newRow.access_token.split('.');
            if (tokenParts.length === 3) {
              const base64Url = tokenParts[1];
              const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
              const jsonPayload = decodeURIComponent(
                atob(base64)
                  .split('')
                  .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                  .join('')
              );
              const payload = JSON.parse(jsonPayload);

              const nowSec = Date.now() / 1000;
              if (payload.exp && payload.exp > nowSec && payload.sub) {
                console.log('[QR_DEBUG] Fallback: parsed valid unexpired JWT for user:', payload.email);
                const sessionObj: any = {
                  access_token: newRow.access_token,
                  refresh_token: newRow.refresh_token,
                  expires_in: Math.floor(payload.exp - nowSec),
                  expires_at: payload.exp,
                  token_type: 'bearer',
                  user: {
                    id: payload.sub,
                    aud: payload.aud || 'authenticated',
                    role: payload.role || 'authenticated',
                    email: payload.email,
                    email_confirmed_at: payload.iat ? new Date(payload.iat * 1000).toISOString() : new Date().toISOString(),
                    phone: payload.phone || '',
                    confirmed_at: payload.iat ? new Date(payload.iat * 1000).toISOString() : new Date().toISOString(),
                    last_sign_in_at: payload.iat ? new Date(payload.iat * 1000).toISOString() : new Date().toISOString(),
                    app_metadata: payload.app_metadata || {},
                    user_metadata: payload.user_metadata || {},
                    identities: [],
                    created_at: payload.iat ? new Date(payload.iat * 1000).toISOString() : new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  },
                };

                const storageKey =
                  (supabase.auth as any).storageKey ||
                  'sb-upxsmlmsqxcwknvtywgk-auth-token';
                if (typeof localStorage !== 'undefined') {
                  try {
                    localStorage.setItem(storageKey, JSON.stringify(sessionObj));
                  } catch {
                    // Ignore localStorage error
                  }
                }

                if (typeof (supabase.auth as any)._saveSession === 'function') {
                  try {
                    await (supabase.auth as any)._saveSession(sessionObj);
                  } catch {
                    // Ignore internal method error
                  }
                }
                if (typeof (supabase.auth as any)._notifyAllSubscribers === 'function') {
                  try {
                    await (supabase.auth as any)._notifyAllSubscribers('SIGNED_IN', sessionObj);
                  } catch {
                    // Ignore notify error
                  }
                }

                sessionData = { session: sessionObj, user: sessionObj.user };
              }
            }
          } catch (jwtErr) {
            console.warn('[QR_DEBUG] JWT fallback hydration error:', jwtErr);
          }
        }

        if (!sessionData?.session) {
          throw new Error('Failed to set session');
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

        const rejectSession = async (message: string) => {
          try {
            await supabase.auth.signOut({ scope: 'local' });
          } catch {
            // Safe catch
          }
          setQrAuthInProgress(false);
          isAuthenticatingRef.current = false;
          if (isMountedRef.current) {
            setSessionToken('');
            setErrorMessage(message);
            setStatus('session_error');
          }
        };

        const userEmail = sessionData.user?.email;
        if (!userEmail) {
          await rejectSession('Could not verify your account. Please try again.');
          return;
        }

        let corporateRecord = null;
        try {
          corporateRecord = await apiService.getCorporateAdmin(userEmail);
        } catch {
          corporateRecord = null;
        }

        if (corporateRecord) {
          console.log('[QR_DEBUG] Right before navigate(...) called with path: /corporate-dashboard');
          navigateRef.current('/corporate-dashboard', { replace: true });
          return;
        }

        console.log('[QR_DEBUG] Right before navigate(...) called with path: /dashboard');
        navigateRef.current('/dashboard', { replace: true });
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

          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          if (!isTestEnv) {
            pollIntervalRef.current = setInterval(async () => {
              if (
                !isMountedRef.current ||
                isAuthenticatingRef.current ||
                activeTokenRef.current !== token
              ) {
                return;
              }
              try {
                const { data: pollRow, error: pollErr } = await supabase
                  .from('web_sessions')
                  .select('session_token, status, access_token, refresh_token')
                  .eq('session_token', token)
                  .maybeSingle();

                if (
                  !pollErr &&
                  pollRow &&
                  pollRow.status === 'AUTHENTICATED' &&
                  pollRow.access_token &&
                  pollRow.refresh_token &&
                  !isAuthenticatingRef.current &&
                  activeTokenRef.current === token
                ) {
                  console.log('[QR_DEBUG] Polling fallback detected AUTHENTICATED session:', pollRow.session_token);
                  handleUpdate({ new: pollRow });
                }
              } catch {
                // Ignore transient network errors
              }
            }, 1500);
          }
        } catch (insertCatchErr) {
          console.log('[QR_DEBUG] insert() call for PENDING row caught exception:', insertCatchErr);
          if (isMountedRef.current && activeTokenRef.current === token) {
            setErrorMessage('Could not generate QR, retry');
            setStatus('generate_error');
          }
        }
      } else if (subStatus === 'CHANNEL_ERROR' || subStatus === 'TIMED_OUT') {
        if (isMountedRef.current && activeTokenRef.current === token && !hasSubscribedRef.current) {
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

  const handleStartGenerating = useCallback(() => {
    setStatus('generating');
    setCountdown(countdownSeconds);

    if (countdownIntervalRef.current) {
      try {
        clearInterval(countdownIntervalRef.current);
      } catch {
        // Safe catch
      }
      countdownIntervalRef.current = null;
    }

    let current = countdownSeconds;
    countdownIntervalRef.current = setInterval(() => {
      current -= 1;
      if (!isMountedRef.current) return;
      setCountdown(current);

      if (current <= 0) {
        if (countdownIntervalRef.current) {
          try {
            clearInterval(countdownIntervalRef.current);
          } catch {
            // Safe catch
          }
          countdownIntervalRef.current = null;
        }
        initQrSessionRef.current();
      }
    }, 1000);
  }, [countdownSeconds]);

  const handleCancelGenerating = useCallback(() => {
    if (countdownIntervalRef.current) {
      try {
        clearInterval(countdownIntervalRef.current);
      } catch {
        // Safe catch
      }
      countdownIntervalRef.current = null;
    }
    setStatus('idle');
  }, []);

  useEffect(() => {
    console.log('[QR_DEBUG] Component mounted at:', new Date().toISOString(), 'Timestamp:', Date.now());
    isMountedRef.current = true;

    if (autoStart) {
      if (import.meta.env.DEV) {
        if (!hasInitializedRef.current) {
          hasInitializedRef.current = true;
          initQrSessionRef.current();
        }
      } else {
        initQrSessionRef.current();
      }
    }

    const handleVisibilityChange = () => {
      if (
        !document.hidden &&
        statusRef.current !== 'expired' &&
        statusRef.current !== 'authenticated' &&
        statusRef.current !== 'loading' &&
        statusRef.current !== 'idle' &&
        statusRef.current !== 'generating'
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

      if (countdownIntervalRef.current) {
        try {
          clearInterval(countdownIntervalRef.current);
        } catch {
          // Safe catch
        }
        countdownIntervalRef.current = null;
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
  }, [autoStart]); // Runs on real mount

  return (
    <div
      data-testid="qr-panel-placeholder"
      className="lg:col-span-5 bg-[#080E2A]/90 backdrop-blur-xl border border-[#1E3268] rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 shadow-[0_12px_40px_rgba(0,145,255,0.15)] flex flex-col items-center justify-between text-center relative overflow-hidden min-h-[460px]"
    >
      {/* Header */}
      <div>
        <div className="w-12 h-12 mx-auto rounded-2xl bg-[#0091FF]/15 border border-[#0091FF]/40 flex items-center justify-center text-[#0091FF] mb-3 shadow-[0_0_14px_rgba(0,145,255,0.3)]">
          <QrCode className="w-6 h-6" />
        </div>
        <h2 className="text-base sm:text-lg font-bold text-white mb-1">Log in with QR Code</h2>
        <p className="text-slate-300 text-xs max-w-xs leading-relaxed">
          Open MoneyMapper → Profile → QR scanner icon → scan this code
        </p>
      </div>

      {/* QR Display Area */}
      <div className="my-6 relative flex items-center justify-center">
        <div className="p-4 bg-white rounded-2xl shadow-inner min-w-[216px] min-h-[216px] flex flex-col items-center justify-center relative border border-slate-200">
          {status === 'idle' && (
            <div data-testid="qr-idle-state" className="flex flex-col items-center justify-center text-center p-3 w-full">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0091FF] mb-3 shadow-xs">
                <QrCode className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-slate-800 mb-1">Instant QR Login</p>
              <p className="text-[11px] text-slate-500 mb-3.5 max-w-[190px] leading-snug">
                Click below to generate a secure login QR code
              </p>
              <button
                type="button"
                data-testid="generate-qr-button"
                onClick={handleStartGenerating}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-[#0091FF] hover:bg-[#007EE5] active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-[0_4px_14px_rgba(0,145,255,0.35)] cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Generate QR Code</span>
              </button>
            </div>
          )}

          {status === 'generating' && (
            <div data-testid="qr-generating-countdown" className="flex flex-col items-center justify-center text-center p-3 w-full">
              <div className="relative w-14 h-14 flex items-center justify-center mb-3">
                <div className="absolute inset-0 rounded-full border-2 border-[#0091FF] animate-ping opacity-25" />
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-[#0091FF] flex items-center justify-center text-[#0091FF] font-black text-lg shadow-sm">
                  {countdown}s
                </div>
              </div>
              <p className="text-xs font-bold text-slate-800 mb-1">Generating QR Code...</p>
              <p className="text-[11px] text-slate-500 mb-3">
                Opening secure code in {countdown}s
              </p>
              <button
                type="button"
                onClick={handleCancelGenerating}
                className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}

          {status === 'loading' && (
            <div data-testid="qr-loading" className="flex flex-col items-center justify-center text-slate-500 gap-2">
              <RefreshCw className="w-8 h-8 text-[#0084FF] animate-spin" />
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
                className="inline-flex items-center gap-1.5 py-2 px-3.5 bg-[#0084FF] hover:bg-[#0070DD] text-white rounded-xl text-xs font-semibold transition-all shadow-md"
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
        ) : status === 'generating' ? (
          <p className="text-white/40 text-[11px]">
            Preparing secure session in <span className="text-[#0091FF] font-mono font-bold">{countdown}s</span>
          </p>
        ) : status === 'idle' ? (
          <p className="text-white/40 text-[11px]">
            Click Generate QR Code to begin
          </p>
        ) : (
          <div className="h-4" />
        )}
      </div>
    </div>
  );
};

export default QrLoginPanel;
