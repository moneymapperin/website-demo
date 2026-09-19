import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QrLoginPanel } from '../components/QrLoginPanel';
import { LoginPage } from '../pages/LoginPage';
import { supabase } from '../lib/supabase';
import { apiService } from '../services/apiService';
import { AuthProvider, PublicOnlyRoute } from '../context/AuthContext';

const visitedRoutes: string[] = [];

function LocationTracker() {
  const location = useLocation();
  React.useEffect(() => {
    visitedRoutes.push(location.pathname);
  }, [location.pathname]);
  return <div data-testid="current-route">{location.pathname}</div>;
}

describe('Task 4B: Web QR Login Security Hardening (QrLoginPanel with claim_web_session polling)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    visitedRoutes.length = 0;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('generates a UUID QR token and NEVER calls supabase.from("web_sessions") (zero pending row)', async () => {
    const fromSpy = vi.spyOn(supabase, 'from');
    vi.spyOn(supabase, 'rpc').mockResolvedValue({ data: [], error: null } as any);

    render(
      <MemoryRouter>
        <QrLoginPanel />
      </MemoryRouter>
    );

    const qrSvg = await screen.findByTestId('qr-code-svg');
    expect(qrSvg).toBeInTheDocument();
    const token = qrSvg.getAttribute('data-token');
    expect(token).toBeDefined();

    // Verify valid UUID v4 format (8-4-4-4-12)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(token).toMatch(uuidRegex);

    // ZERO table access: supabase.from('web_sessions') is never invoked
    expect(fromSpy).not.toHaveBeenCalled();
  });

  it('starts polling rpc("claim_web_session") every 2 seconds with exact { p_token: sessionToken }', async () => {
    vi.useFakeTimers();
    let capturedToken = '';

    const rpcSpy = vi.spyOn(supabase, 'rpc').mockImplementation((fn: string, args: any) => {
      if (fn === 'claim_web_session') {
        capturedToken = args.p_token;
        return Promise.resolve({ data: [], error: null }) as any;
      }
      return Promise.resolve({ data: null, error: null }) as any;
    });

    render(
      <MemoryRouter>
        <QrLoginPanel />
      </MemoryRouter>
    );

    // Initial state: no rpc call yet before interval ticks
    expect(rpcSpy).not.toHaveBeenCalled();

    // Advance 2 seconds -> first poll tick
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(rpcSpy).toHaveBeenCalledTimes(1);
    expect(rpcSpy).toHaveBeenCalledWith('claim_web_session', { p_token: capturedToken });

    // Advance another 2 seconds -> second poll tick
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(rpcSpy).toHaveBeenCalledTimes(2);
    expect(rpcSpy).toHaveBeenLastCalledWith('claim_web_session', { p_token: capturedToken });
  });

  it('stops polling immediately on successful claim and hydrates session for corporate admin', async () => {
    vi.useFakeTimers();
    let capturedToken = '';

    const rpcSpy = vi.spyOn(supabase, 'rpc').mockImplementation((fn: string, args: any) => {
      if (fn === 'claim_web_session') {
        capturedToken = args.p_token;
        // On first poll, return authenticated tokens
        return Promise.resolve({
          data: [
            {
              access_token: 'live-corp-acc',
              refresh_token: 'live-corp-ref',
            },
          ],
          error: null,
        }) as any;
      }
      return Promise.resolve({ data: null, error: null }) as any;
    });

    const setSessionSpy = vi.spyOn(supabase.auth, 'setSession').mockResolvedValue({
      data: {
        session: { access_token: 'live-corp-acc' } as any,
        user: { id: 'corp-user-1', email: 'corp.director@reliance.com' } as any,
      },
      error: null,
    });

    const getAdminSpy = vi.spyOn(apiService, 'getCorporateAdmin').mockResolvedValue({
      company_name: 'Reliance Industries',
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<QrLoginPanel />} />
          <Route path="/corporate-dashboard" element={<div data-testid="corp-dest">Corporate Dashboard OK</div>} />
          <Route path="/dashboard" element={<div data-testid="wrong-dest">Wrong Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );

    // Trigger first poll
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    // Tokens were claimed
    expect(capturedToken).not.toBe('');
    expect(rpcSpy).toHaveBeenCalledWith('claim_web_session', { p_token: capturedToken });
    expect(setSessionSpy).toHaveBeenCalledWith({
      access_token: 'live-corp-acc',
      refresh_token: 'live-corp-ref',
    });

    // Corporate admin check used email from setSession result
    expect(getAdminSpy).toHaveBeenCalledWith('corp.director@reliance.com');

    // Navigated to corporate dashboard
    expect(screen.getByTestId('corp-dest')).toBeInTheDocument();
    expect(screen.queryByTestId('wrong-dest')).not.toBeInTheDocument();

    // Advancing timers further does NOT trigger any additional RPC calls (polling was stopped)
    await act(async () => {
      vi.advanceTimersByTime(10000);
    });

    expect(rpcSpy).toHaveBeenCalledTimes(1);
  });

  it('stops polling and navigates to /dashboard for normal user', async () => {
    vi.useFakeTimers();

    vi.spyOn(supabase, 'rpc').mockImplementation((fn: string) => {
      if (fn === 'claim_web_session') {
        return Promise.resolve({
          data: [
            {
              access_token: 'norm-acc',
              refresh_token: 'norm-ref',
            },
          ],
          error: null,
        }) as any;
      }
      return Promise.resolve({ data: null, error: null }) as any;
    });

    vi.spyOn(supabase.auth, 'setSession').mockResolvedValue({
      data: {
        session: { access_token: 'norm-acc' } as any,
        user: { id: 'norm-user', email: 'regular@gmail.com' } as any,
      },
      error: null,
    });

    vi.spyOn(apiService, 'getCorporateAdmin').mockResolvedValue(null);

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<QrLoginPanel />} />
          <Route path="/dashboard" element={<div data-testid="user-dest">User Dashboard OK</div>} />
        </Routes>
      </MemoryRouter>
    );

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByTestId('user-dest')).toBeInTheDocument();
  });

  it('handles setSession failure: stops polling, shows retry UI, and refresh restarts polling', async () => {
    vi.useFakeTimers();
    let pollCount = 0;

    vi.spyOn(supabase, 'rpc').mockImplementation((fn: string) => {
      if (fn === 'claim_web_session') {
        pollCount++;
        return Promise.resolve({
          data: [
            {
              access_token: 'bad-acc',
              refresh_token: 'bad-ref',
            },
          ],
          error: null,
        }) as any;
      }
      return Promise.resolve({ data: null, error: null }) as any;
    });

    vi.spyOn(supabase.auth, 'setSession').mockRejectedValue(new Error('Session hydration failed'));

    render(
      <MemoryRouter>
        <QrLoginPanel />
      </MemoryRouter>
    );

    // Poll triggers claim which fails at setSession
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByText('Login session failed')).toBeInTheDocument();
    const tryAgainBtn = screen.getByRole('button', { name: /Try again/i });
    expect(tryAgainBtn).toBeInTheDocument();

    const countBeforeClick = pollCount;

    // Advance time: no more polling while in error state
    await act(async () => {
      vi.advanceTimersByTime(6000);
    });
    expect(pollCount).toBe(countBeforeClick);

    // Click "Try again"
    act(() => {
      fireEvent.click(tryAgainBtn);
    });

    // Polling is restarted
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(pollCount).toBeGreaterThan(countBeforeClick);
  });

  it('expires after 120s: stops polling, overlays "QR expired", and refresh generates new token', async () => {
    vi.useFakeTimers();
    let pollCount = 0;

    vi.spyOn(supabase, 'rpc').mockImplementation((fn: string) => {
      if (fn === 'claim_web_session') {
        pollCount++;
        return Promise.resolve({ data: [], error: null }) as any;
      }
      return Promise.resolve({ data: null, error: null }) as any;
    });

    render(
      <MemoryRouter>
        <QrLoginPanel />
      </MemoryRouter>
    );

    const initialSvg = screen.getByTestId('qr-code-svg');
    const initialToken = initialSvg.getAttribute('data-token');

    // Fast-forward 120 seconds
    act(() => {
      vi.advanceTimersByTime(120000);
    });

    // "QR expired" overlay shown
    expect(screen.getByText('QR expired')).toBeInTheDocument();
    const refreshBtn = screen.getByRole('button', { name: /Refresh QR/i });
    expect(refreshBtn).toBeInTheDocument();

    const countAtExpiry = pollCount;

    // Further time does NOT cause more polls
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(pollCount).toBe(countAtExpiry);

    // Click Refresh QR
    act(() => {
      fireEvent.click(refreshBtn);
    });

    const newSvg = screen.getByTestId('qr-code-svg');
    const newToken = newSvg.getAttribute('data-token');
    expect(newToken).not.toBe(initialToken);

    // Polling resumes with new token
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(pollCount).toBeGreaterThan(countAtExpiry);
  });

  it('stops polling on visibilitychange when background tab throttles timers past 120s', async () => {
    let pollCount = 0;
    vi.spyOn(supabase, 'rpc').mockImplementation((fn: string) => {
      if (fn === 'claim_web_session') {
        pollCount++;
        return Promise.resolve({ data: [], error: null }) as any;
      }
      return Promise.resolve({ data: null, error: null }) as any;
    });

    render(
      <MemoryRouter>
        <QrLoginPanel />
      </MemoryRouter>
    );

    // Mock Date.now() advancing 125 seconds ahead (background tab without timer ticks)
    const originalNow = Date.now;
    try {
      const futureTime = originalNow() + 125000;
      Date.now = () => futureTime;

      // Tab becomes visible again
      act(() => {
        document.dispatchEvent(new Event('visibilitychange'));
      });

      // Overlay appears immediately
      expect(screen.getByText('QR expired')).toBeInTheDocument();
    } finally {
      Date.now = originalNow;
    }
  });

  it('unmount clears the polling interval', async () => {
    vi.useFakeTimers();
    let pollCount = 0;

    vi.spyOn(supabase, 'rpc').mockImplementation((fn: string) => {
      if (fn === 'claim_web_session') {
        pollCount++;
        return Promise.resolve({ data: [], error: null }) as any;
      }
      return Promise.resolve({ data: null, error: null }) as any;
    });

    const { unmount } = render(
      <MemoryRouter>
        <QrLoginPanel />
      </MemoryRouter>
    );

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(pollCount).toBe(1);

    unmount();

    // Advance time after unmount
    await act(async () => {
      vi.advanceTimersByTime(10000);
    });

    // No additional polls occurred after unmount
    expect(pollCount).toBe(1);
  });

  it('handles React.StrictMode (mount -> unmount -> mount) leaving 1 active polling cycle', async () => {
    vi.useFakeTimers();
    let activeToken = '';

    vi.spyOn(supabase, 'rpc').mockImplementation((fn: string, args: any) => {
      if (fn === 'claim_web_session') {
        activeToken = args.p_token;
        return Promise.resolve({ data: [], error: null }) as any;
      }
      return Promise.resolve({ data: null, error: null }) as any;
    });

    // Mount first time
    const { unmount } = render(
      <MemoryRouter>
        <QrLoginPanel />
      </MemoryRouter>
    );

    // Unmount (simulating StrictMode cleanup)
    unmount();

    // Mount second time (simulating StrictMode remount)
    render(
      <MemoryRouter>
        <QrLoginPanel />
      </MemoryRouter>
    );

    const liveSvg = screen.getByTestId('qr-code-svg');
    const liveToken = liveSvg.getAttribute('data-token');

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    // Live polling token matches the active rendered QR code
    expect(activeToken).toBe(liveToken);
  });

  describe('Integration Test: Real PublicOnlyRoute + AuthProvider', () => {
    it('admin ends on /corporate-dashboard and never visits /dashboard in between', async () => {
      vi.useFakeTimers();
      let authChangeCallback: ((event: string, session: any) => void) | null = null;
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: { session: null },
        error: null,
      });
      vi.spyOn(supabase.auth, 'onAuthStateChange').mockImplementation((cb: any) => {
        authChangeCallback = cb;
        return { data: { subscription: { unsubscribe: vi.fn() } } } as any;
      });

      vi.spyOn(supabase, 'rpc').mockImplementation((fn: string) => {
        if (fn === 'claim_web_session') {
          return Promise.resolve({
            data: [
              {
                access_token: 'admin-live-acc',
                refresh_token: 'admin-live-ref',
              },
            ],
            error: null,
          }) as any;
        }
        return Promise.resolve({ data: null, error: null }) as any;
      });

      vi.spyOn(supabase.auth, 'setSession').mockImplementation((async () => {
        const session = {
          access_token: 'admin-live-acc',
          user: { id: 'corp-admin-id', email: 'director@company.com' },
        };
        // Emit SIGNED_IN event like the real Supabase client does
        if (authChangeCallback) {
          authChangeCallback('SIGNED_IN', session);
        }
        return {
          data: { session, user: session.user as any },
          error: null,
        };
      }) as any);

      vi.spyOn(apiService, 'getCorporateAdmin').mockResolvedValue({
        company_name: 'Reliance Industries',
      });

      render(
        <MemoryRouter initialEntries={['/login']}>
          <AuthProvider>
            <LocationTracker />
            <Routes>
              <Route
                path="/login"
                element={
                  <PublicOnlyRoute>
                    <LoginPage />
                  </PublicOnlyRoute>
                }
              />
              <Route path="/corporate-dashboard" element={<div data-testid="corp-ok">Corp Admin OK</div>} />
              <Route path="/dashboard" element={<div data-testid="dash-bad">Wrong Standard Dashboard</div>} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      // Let AuthProvider initial getSession resolve
      await act(async () => {
        await Promise.resolve();
      });

      // Advance 2s to trigger claim poll
      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      // Flush async setSession and navigate
      await act(async () => {
        await Promise.resolve();
      });

      // Admin ends on /corporate-dashboard
      expect(screen.getByTestId('corp-ok')).toBeInTheDocument();
      expect(screen.queryByTestId('dash-bad')).not.toBeInTheDocument();

      // Destination was never wrong in between
      expect(visitedRoutes).not.toContain('/dashboard');
      expect(visitedRoutes[visitedRoutes.length - 1]).toBe('/corporate-dashboard');
    });

    it('normal user ends on /dashboard and never visits /corporate-dashboard in between', async () => {
      vi.useFakeTimers();
      let authChangeCallback: ((event: string, session: any) => void) | null = null;
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: { session: null },
        error: null,
      });
      vi.spyOn(supabase.auth, 'onAuthStateChange').mockImplementation((cb: any) => {
        authChangeCallback = cb;
        return { data: { subscription: { unsubscribe: vi.fn() } } } as any;
      });

      vi.spyOn(supabase, 'rpc').mockImplementation((fn: string) => {
        if (fn === 'claim_web_session') {
          return Promise.resolve({
            data: [
              {
                access_token: 'norm-live-acc',
                refresh_token: 'norm-live-ref',
              },
            ],
            error: null,
          }) as any;
        }
        return Promise.resolve({ data: null, error: null }) as any;
      });

      vi.spyOn(supabase.auth, 'setSession').mockImplementation((async () => {
        const session = {
          access_token: 'norm-live-acc',
          user: { id: 'norm-user-id', email: 'regular@gmail.com' },
        };
        if (authChangeCallback) {
          authChangeCallback('SIGNED_IN', session);
        }
        return {
          data: { session, user: session.user as any },
          error: null,
        };
      }) as any);

      vi.spyOn(apiService, 'getCorporateAdmin').mockResolvedValue(null);

      render(
        <MemoryRouter initialEntries={['/login']}>
          <AuthProvider>
            <LocationTracker />
            <Routes>
              <Route
                path="/login"
                element={
                  <PublicOnlyRoute>
                    <LoginPage />
                  </PublicOnlyRoute>
                }
              />
              <Route path="/corporate-dashboard" element={<div data-testid="corp-bad">Wrong Corporate Dashboard</div>} />
              <Route path="/dashboard" element={<div data-testid="dash-ok">Normal Dashboard OK</div>} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      // Let AuthProvider initial getSession resolve
      await act(async () => {
        await Promise.resolve();
      });

      // Advance 2s to trigger claim poll
      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      // Flush async setSession and navigate
      await act(async () => {
        await Promise.resolve();
      });

      expect(screen.getByTestId('dash-ok')).toBeInTheDocument();
      expect(screen.queryByTestId('corp-bad')).not.toBeInTheDocument();

      // Destination was never wrong in between
      expect(visitedRoutes).not.toContain('/corporate-dashboard');
      expect(visitedRoutes[visitedRoutes.length - 1]).toBe('/dashboard');
    });

    it('falls back to /dashboard if getCorporateAdmin throws', async () => {
      vi.useFakeTimers();
      let authChangeCallback: ((event: string, session: any) => void) | null = null;
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: { session: null },
        error: null,
      });
      vi.spyOn(supabase.auth, 'onAuthStateChange').mockImplementation((cb: any) => {
        authChangeCallback = cb;
        return { data: { subscription: { unsubscribe: vi.fn() } } } as any;
      });

      vi.spyOn(supabase, 'rpc').mockImplementation((fn: string) => {
        if (fn === 'claim_web_session') {
          return Promise.resolve({
            data: [
              {
                access_token: 'err-live-acc',
                refresh_token: 'err-live-ref',
              },
            ],
            error: null,
          }) as any;
        }
        return Promise.resolve({ data: null, error: null }) as any;
      });

      vi.spyOn(supabase.auth, 'setSession').mockImplementation((async () => {
        const session = {
          access_token: 'err-live-acc',
          user: { id: 'err-user-id', email: 'error@company.com' },
        };
        if (authChangeCallback) {
          authChangeCallback('SIGNED_IN', session);
        }
        return {
          data: { session, user: session.user as any },
          error: null,
        };
      }) as any);

      vi.spyOn(apiService, 'getCorporateAdmin').mockRejectedValue(new Error('Network error'));

      render(
        <MemoryRouter initialEntries={['/login']}>
          <AuthProvider>
            <LocationTracker />
            <Routes>
              <Route
                path="/login"
                element={
                  <PublicOnlyRoute>
                    <LoginPage />
                  </PublicOnlyRoute>
                }
              />
              <Route path="/corporate-dashboard" element={<div data-testid="corp-bad">Wrong Corporate Dashboard</div>} />
              <Route path="/dashboard" element={<div data-testid="dash-ok">Fallback Dashboard OK</div>} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      // Let AuthProvider initial getSession resolve
      await act(async () => {
        await Promise.resolve();
      });

      // Advance 2s to trigger claim poll
      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      // Flush async setSession and navigate
      await act(async () => {
        await Promise.resolve();
      });

      expect(screen.getByTestId('dash-ok')).toBeInTheDocument();
      expect(visitedRoutes[visitedRoutes.length - 1]).toBe('/dashboard');
    });
  });
});
