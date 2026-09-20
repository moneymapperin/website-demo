import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { useContext } from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import fs from 'fs';
import path from 'path';
import { QrLoginPanel } from '../components/QrLoginPanel';
import { LoginPage } from '../pages/LoginPage';
import { supabase } from '../lib/supabase';
import { apiService } from '../services/apiService';
import { AuthProvider, AuthContext } from '../context/AuthContext';

const visitedRoutes: string[] = [];

function RouteTracker() {
  const location = useLocation();
  React.useEffect(() => {
    visitedRoutes.push(location.pathname);
  }, [location.pathname]);
  return <div data-testid="route-indicator">{location.pathname}</div>;
}

describe('Rebuilt QrLoginPanel (Supabase Realtime Contract)', () => {
  let mockChannel: any;
  let updateCallback: ((payload: any) => void) | null = null;
  let subscribeCallback: ((status: string, err?: any) => void) | null = null;
  let insertSpy: any;
  let deleteSpy: any;
  let eqSpy: any;
  let rpcSpy: any;

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    visitedRoutes.length = 0;
    updateCallback = null;
    subscribeCallback = null;

    mockChannel = {
      on: vi.fn().mockImplementation((event: string, filter: any, cb: (payload: any) => void) => {
        if (event === 'postgres_changes' && filter.event === 'UPDATE') {
          updateCallback = cb;
        }
        return mockChannel;
      }),
      subscribe: vi.fn().mockImplementation((cb: (status: string, err?: any) => void) => {
        subscribeCallback = cb;
        return mockChannel;
      }),
    };

    vi.spyOn(supabase, 'channel').mockReturnValue(mockChannel);
    vi.spyOn(supabase, 'removeChannel').mockReturnValue({} as any);

    eqSpy = vi.fn().mockReturnValue({
      then: vi.fn().mockImplementation((onFulfilled) => Promise.resolve(onFulfilled?.())),
    });

    deleteSpy = vi.fn().mockReturnValue({
      eq: eqSpy,
    });

    insertSpy = vi.fn().mockResolvedValue({ data: null, error: null });

    vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      if (table === 'web_sessions') {
        return {
          insert: insertSpy,
          delete: deleteSpy,
        } as any;
      }
      return {} as any;
    });

    rpcSpy = vi.spyOn(supabase, 'rpc');
  });

  afterEach(() => {
    vi.useRealTimers();
    // Invariant: rpc must NOT be called anywhere in QrLoginPanel
    expect(rpcSpy).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // 1. Subscribe FIRST, Insert ONLY AFTER SUBSCRIBED
  // ---------------------------------------------------------------------------
  it('1. calls insert() only AFTER mocked channel subscribe callback fires with "SUBSCRIBED"', async () => {
    render(
      <MemoryRouter>
        <QrLoginPanel />
      </MemoryRouter>
    );

    // Realtime channel created with session token filter
    expect(supabase.channel).toHaveBeenCalledTimes(1);
    const channelName = vi.mocked(supabase.channel).mock.calls[0][0];
    expect(channelName).toMatch(/^qr-login-[0-9a-f-]{36}$/);
    expect(mockChannel.subscribe).toHaveBeenCalledTimes(1);

    // CRITICAL: insert() must NOT be called if subscribe callback hasn't fired yet
    expect(insertSpy).not.toHaveBeenCalled();

    // Loading state displayed, QR code not rendered yet
    expect(screen.getByTestId('qr-loading')).toHaveTextContent('Generating secure QR...');
    expect(screen.queryByTestId('qr-code-svg')).not.toBeInTheDocument();

    // Simulate Realtime subscription confirmation
    await act(async () => {
      subscribeCallback?.('SUBSCRIBED');
    });

    // AFTER subscription confirms, insert() is called
    expect(insertSpy).toHaveBeenCalledTimes(1);
    const insertArg = insertSpy.mock.calls[0][0];
    expect(insertArg.status).toBe('PENDING');
    expect(insertArg.session_token).toMatch(/^[0-9a-f-]{36}$/);

    // QR code is now rendered
    const qrSvg = await screen.findByTestId('qr-code-svg');
    expect(qrSvg).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // 2. QR renders only after insert() succeeds, with value === raw uuid exactly
  // ---------------------------------------------------------------------------
  it('2. renders QR with value equal to exact raw UUID (no wrapping/prefix) only after insert() resolves', async () => {
    render(
      <MemoryRouter>
        <QrLoginPanel />
      </MemoryRouter>
    );

    expect(screen.queryByTestId('qr-code-svg')).not.toBeInTheDocument();

    await act(async () => {
      subscribeCallback?.('SUBSCRIBED');
    });

    const qrSvg = await screen.findByTestId('qr-code-svg');
    const token = qrSvg.getAttribute('data-token');
    const qrValue = qrSvg.getAttribute('data-value');

    // Strict UUID v4 regex
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(token).toMatch(uuidRegex);
    expect(qrValue).toBe(token);
    expect(qrValue?.startsWith('http')).toBe(false);
    expect(qrValue?.startsWith('{')).toBe(false);
    expect(qrValue?.includes(':')).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // 3. Insert failure shows "Could not generate QR, retry" and no QR renders
  // ---------------------------------------------------------------------------
  it('3. shows "Could not generate QR, retry" UI and no QR renders if insert() rejects', async () => {
    insertSpy.mockRejectedValueOnce(new Error('Insert failed'));

    render(
      <MemoryRouter>
        <QrLoginPanel />
      </MemoryRouter>
    );

    await act(async () => {
      subscribeCallback?.('SUBSCRIBED');
    });

    // Error message displayed
    expect(screen.getByText('Could not generate QR, retry')).toBeInTheDocument();
    const retryButton = screen.getByRole('button', { name: /retry/i });
    expect(retryButton).toBeInTheDocument();

    // QR code must NOT render
    expect(screen.queryByTestId('qr-code-svg')).not.toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // 4A. UPDATE payload -> setSession -> delete() -> non-admin -> /dashboard
  // ---------------------------------------------------------------------------
  it('4A. handles UPDATE for standard user: setSession called, row deleted, navigated to /dashboard', async () => {
    const setSessionSpy = vi.spyOn(supabase.auth, 'setSession').mockResolvedValue({
      data: {
        session: { user: { email: 'standard@user.com' } } as any,
        user: { email: 'standard@user.com' } as any,
      },
      error: null,
    });

    const getCorporateAdminSpy = vi.spyOn(apiService, 'getCorporateAdmin').mockResolvedValue(null);

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<QrLoginPanel />} />
          <Route path="/corporate-dashboard" element={<RouteTracker />} />
          <Route path="/dashboard" element={<RouteTracker />} />
        </Routes>
      </MemoryRouter>
    );

    await act(async () => {
      subscribeCallback?.('SUBSCRIBED');
    });

    const qrSvg = await screen.findByTestId('qr-code-svg');
    const token = qrSvg.getAttribute('data-token')!;

    await act(async () => {
      updateCallback?.({
        new: {
          session_token: token,
          status: 'AUTHENTICATED',
          access_token: 'acc-token-standard',
          refresh_token: 'ref-token-standard',
        },
      });
    });

    // setSession called with exact tokens
    expect(setSessionSpy).toHaveBeenCalledWith({
      access_token: 'acc-token-standard',
      refresh_token: 'ref-token-standard',
    });

    // delete() called on public.web_sessions for correct token
    expect(deleteSpy).toHaveBeenCalled();
    expect(eqSpy).toHaveBeenCalledWith('session_token', token);

    // apiService.getCorporateAdmin called with session user's email
    expect(getCorporateAdminSpy).toHaveBeenCalledWith('standard@user.com');

    // Navigated to /dashboard
    await waitFor(() => {
      expect(visitedRoutes).toContain('/dashboard');
    });
  });

  // ---------------------------------------------------------------------------
  // 4B. UPDATE payload -> setSession -> delete() -> admin=true -> /corporate-dashboard
  // ---------------------------------------------------------------------------
  it('4B. handles UPDATE for corporate admin: setSession called, row deleted, navigated to /corporate-dashboard', async () => {
    const setSessionSpy = vi.spyOn(supabase.auth, 'setSession').mockResolvedValue({
      data: {
        session: { user: { email: 'admin@enterprise.com' } } as any,
        user: { email: 'admin@enterprise.com' } as any,
      },
      error: null,
    });

    const getCorporateAdminSpy = vi.spyOn(apiService, 'getCorporateAdmin').mockResolvedValue({
      company_name: 'Enterprise Corp',
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<QrLoginPanel />} />
          <Route path="/corporate-dashboard" element={<RouteTracker />} />
          <Route path="/dashboard" element={<RouteTracker />} />
        </Routes>
      </MemoryRouter>
    );

    await act(async () => {
      subscribeCallback?.('SUBSCRIBED');
    });

    const qrSvg = await screen.findByTestId('qr-code-svg');
    const token = qrSvg.getAttribute('data-token')!;

    await act(async () => {
      updateCallback?.({
        new: {
          session_token: token,
          status: 'AUTHENTICATED',
          access_token: 'acc-token-corp',
          refresh_token: 'ref-token-corp',
        },
      });
    });

    expect(setSessionSpy).toHaveBeenCalledWith({
      access_token: 'acc-token-corp',
      refresh_token: 'ref-token-corp',
    });

    expect(deleteSpy).toHaveBeenCalled();
    expect(eqSpy).toHaveBeenCalledWith('session_token', token);
    expect(getCorporateAdminSpy).toHaveBeenCalledWith('admin@enterprise.com');

    await waitFor(() => {
      expect(visitedRoutes).toContain('/corporate-dashboard');
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Missing access_token or refresh_token ignored
  // ---------------------------------------------------------------------------
  it('5. ignores UPDATE payload with status "AUTHENTICATED" when access_token or refresh_token is missing', async () => {
    const setSessionSpy = vi.spyOn(supabase.auth, 'setSession');

    render(
      <MemoryRouter>
        <QrLoginPanel />
      </MemoryRouter>
    );

    await act(async () => {
      subscribeCallback?.('SUBSCRIBED');
    });

    const qrSvg = await screen.findByTestId('qr-code-svg');
    const token = qrSvg.getAttribute('data-token')!;

    // Missing access_token
    await act(async () => {
      updateCallback?.({
        new: {
          session_token: token,
          status: 'AUTHENTICATED',
          access_token: null,
          refresh_token: 'valid-refresh-token',
        },
      });
    });

    // Missing refresh_token
    await act(async () => {
      updateCallback?.({
        new: {
          session_token: token,
          status: 'AUTHENTICATED',
          access_token: 'valid-access-token',
          refresh_token: '',
        },
      });
    });

    expect(setSessionSpy).not.toHaveBeenCalled();
    expect(deleteSpy).not.toHaveBeenCalled();
    expect(screen.queryByText('Login failed, please retry')).not.toBeInTheDocument();
    expect(screen.queryByText('Could not generate QR, retry')).not.toBeInTheDocument();
    expect(screen.getByTestId('qr-code-svg')).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // 6. Mismatched session_token ignored entirely
  // ---------------------------------------------------------------------------
  it('6. ignores UPDATE payload for a different/mismatched session_token', async () => {
    const setSessionSpy = vi.spyOn(supabase.auth, 'setSession');

    render(
      <MemoryRouter>
        <QrLoginPanel />
      </MemoryRouter>
    );

    await act(async () => {
      subscribeCallback?.('SUBSCRIBED');
    });

    const qrSvg = await screen.findByTestId('qr-code-svg');
    expect(qrSvg).toBeInTheDocument();

    await act(async () => {
      updateCallback?.({
        new: {
          session_token: 'different-uuid-1111-2222-3333-444455556666',
          status: 'AUTHENTICATED',
          access_token: 'valid-acc',
          refresh_token: 'valid-ref',
        },
      });
    });

    expect(setSessionSpy).not.toHaveBeenCalled();
    expect(deleteSpy).not.toHaveBeenCalled();
    expect(screen.getByTestId('qr-code-svg')).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // 7. setSession rejects -> "Login failed, please retry" UI, no delete, no navigate
  // ---------------------------------------------------------------------------
  it('7. displays "Login failed, please retry" UI, does NOT call delete(), and does NOT navigate when setSession rejects', async () => {
    vi.spyOn(supabase.auth, 'setSession').mockRejectedValueOnce(new Error('Session validation failed'));

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<QrLoginPanel />} />
          <Route path="/dashboard" element={<RouteTracker />} />
        </Routes>
      </MemoryRouter>
    );

    await act(async () => {
      subscribeCallback?.('SUBSCRIBED');
    });

    const qrSvg = await screen.findByTestId('qr-code-svg');
    const token = qrSvg.getAttribute('data-token')!;
    deleteSpy.mockClear();

    await act(async () => {
      updateCallback?.({
        new: {
          session_token: token,
          status: 'AUTHENTICATED',
          access_token: 'bad-acc',
          refresh_token: 'bad-ref',
        },
      });
    });

    expect(screen.getByText('Login failed, please retry')).toBeInTheDocument();
    expect(deleteSpy).not.toHaveBeenCalled();
    expect(visitedRoutes).not.toContain('/dashboard');

    const tryAgainBtn = screen.getByRole('button', { name: /try again/i });
    expect(tryAgainBtn).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // 8. Fake-timer advance of 120s -> 'expired' UI, channel unsubscribed, delete attempted
  // ---------------------------------------------------------------------------
  it('8. shows "QR expired" UI, unsubscribes channel, and attempts pending row delete on 120s timer expiry', async () => {
    vi.useFakeTimers();

    render(
      <MemoryRouter>
        <QrLoginPanel />
      </MemoryRouter>
    );

    await act(async () => {
      subscribeCallback?.('SUBSCRIBED');
    });

    expect(screen.getByTestId('qr-code-svg')).toBeInTheDocument();

    // Advance timers by 120 seconds
    await act(async () => {
      vi.advanceTimersByTime(120000);
    });

    expect(screen.getByText('QR expired')).toBeInTheDocument();
    expect(supabase.removeChannel).toHaveBeenCalledTimes(1);
    expect(deleteSpy).toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // 9. Clicking "Refresh QR" after expiry runs new subscribe->insert cycle in order
  // ---------------------------------------------------------------------------
  it('9. clicking "Refresh QR" after expiry removes old channel and runs new subscribe->insert cycle with new uuid', async () => {
    vi.useFakeTimers();

    render(
      <MemoryRouter>
        <QrLoginPanel />
      </MemoryRouter>
    );

    await act(async () => {
      subscribeCallback?.('SUBSCRIBED');
    });

    const qrSvgFirst = screen.getByTestId('qr-code-svg');
    const firstToken = qrSvgFirst.getAttribute('data-token')!;

    // Trigger expiry
    await act(async () => {
      vi.advanceTimersByTime(120000);
    });

    const refreshBtn = screen.getByRole('button', { name: /refresh qr/i });
    expect(refreshBtn).toBeInTheDocument();

    // Click Refresh QR
    await act(async () => {
      fireEvent.click(refreshBtn);
    });

    // Old channel removed
    expect(supabase.removeChannel).toHaveBeenCalled();

    // New channel initialized
    expect(supabase.channel).toHaveBeenCalledTimes(2);

    // Before new subscribe confirms, insert has not fired again
    expect(insertSpy).toHaveBeenCalledTimes(1);

    // Confirm subscription on new channel
    await act(async () => {
      subscribeCallback?.('SUBSCRIBED');
    });

    // Second insert happens with new token
    expect(insertSpy).toHaveBeenCalledTimes(2);
    const secondToken = insertSpy.mock.calls[1][0].session_token;
    expect(secondToken).not.toBe(firstToken);
    expect(secondToken).toMatch(/^[0-9a-f-]{36}$/);

    const qrSvgSecond = screen.getByTestId('qr-code-svg');
    expect(qrSvgSecond.getAttribute('data-token')).toBe(secondToken);
  });

  // ---------------------------------------------------------------------------
  // 10. Unmount at any point removes channel and attempts delete; handles rejection
  // ---------------------------------------------------------------------------
  it('10. removes channel, attempts delete, and suppresses delete rejection on unmount', async () => {
    eqSpy.mockReturnValue({
      then: vi.fn().mockImplementation((_, onRejected) => Promise.resolve(onRejected?.(new Error('Network offline')))),
    });

    const { unmount } = render(
      <MemoryRouter>
        <QrLoginPanel />
      </MemoryRouter>
    );

    await act(async () => {
      subscribeCallback?.('SUBSCRIBED');
    });

    expect(() => {
      unmount();
    }).not.toThrow();

    expect(supabase.removeChannel).toHaveBeenCalledTimes(1);
    expect(deleteSpy).toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // 11. Grep-based test: claim_web_session does not appear in QrLoginPanel.tsx
  // ---------------------------------------------------------------------------
  it('11. asserts the string "claim_web_session" does not appear anywhere in QrLoginPanel.tsx', () => {
    const componentPath = path.resolve(__dirname, '../components/QrLoginPanel.tsx');
    const source = fs.readFileSync(componentPath, 'utf8');

    const targetTerm = ['claim', 'web', 'session'].join('_');
    expect(source.includes(targetTerm)).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // Integration: embedded in LoginPage
  // ---------------------------------------------------------------------------
  it('renders embedded in LoginPage with correct Realtime initialization', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('qr-loading')).toBeInTheDocument();

    await act(async () => {
      subscribeCallback?.('SUBSCRIBED');
    });

    const qrSvg = await screen.findByTestId('qr-code-svg');
    expect(qrSvg).toBeInTheDocument();
    expect(screen.getByText('Log in with QR Code')).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // 12. React 18 StrictMode dev double-invoke: skips destructive cleanup on synthetic unmount
  // ---------------------------------------------------------------------------
  it('12. survives React 18 StrictMode mount->unmount->remount cycle without destructive cleanup', async () => {
    // Render under React.StrictMode in dev mode
    const { unmount } = render(
      <React.StrictMode>
        <MemoryRouter>
          <QrLoginPanel />
        </MemoryRouter>
      </React.StrictMode>
    );

    // During StrictMode mount->cleanup->remount, removeChannel and delete must NOT be called on synthetic cleanup
    expect(supabase.removeChannel).not.toHaveBeenCalled();
    expect(deleteSpy).not.toHaveBeenCalled();

    // The subscription confirmation for the stable session
    await act(async () => {
      subscribeCallback?.('SUBSCRIBED');
    });

    // Exactly one insert call happens for the PENDING row
    expect(insertSpy).toHaveBeenCalledTimes(1);
    const token = insertSpy.mock.calls[0][0].session_token;

    // The rendered QR code has that exact token
    const qrSvg = await screen.findByTestId('qr-code-svg');
    expect(qrSvg.getAttribute('data-token')).toBe(token);

    // Now perform real unmount
    unmount();

    // On real unmount, destructive cleanup runs
    expect(supabase.removeChannel).toHaveBeenCalledTimes(1);
    expect(deleteSpy).toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // 13. Production mode (import.meta.env.PROD = true): unmount runs cleanup normally
  // ---------------------------------------------------------------------------
  it('13. runs cleanup normally on unmount when import.meta.env.PROD is true', async () => {
    const originalDev = import.meta.env.DEV;
    const originalProd = import.meta.env.PROD;

    try {
      (import.meta.env as any).DEV = false;
      (import.meta.env as any).PROD = true;

      const { unmount } = render(
        <MemoryRouter>
          <QrLoginPanel />
        </MemoryRouter>
      );

      // Unmount immediately without waiting for subscription
      unmount();

      // In production, cleanup is never skipped on unmount
      expect(supabase.removeChannel).toHaveBeenCalledTimes(1);
      expect(deleteSpy).toHaveBeenCalled();
    } finally {
      (import.meta.env as any).DEV = originalDev;
      (import.meta.env as any).PROD = originalProd;
    }
  });

  // ---------------------------------------------------------------------------
  // 14. 1-second countdown interval firing repeatedly does NOT trigger re-inits
  // ---------------------------------------------------------------------------
  it('14. countdown interval firing repeatedly does NOT trigger additional insert or subscribe calls', async () => {
    vi.useFakeTimers();

    render(
      <MemoryRouter>
        <QrLoginPanel />
      </MemoryRouter>
    );

    await act(async () => {
      subscribeCallback?.('SUBSCRIBED');
    });

    expect(insertSpy).toHaveBeenCalledTimes(1);
    expect(supabase.channel).toHaveBeenCalledTimes(1);

    // Advance timer by 5 seconds (5 ticks)
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    // Verify countdown updated on screen (120 - 5 = 115s)
    expect(screen.getByText(/115s/)).toBeInTheDocument();

    // Assert NO additional channel or insert calls occurred
    expect(insertSpy).toHaveBeenCalledTimes(1);
    expect(supabase.channel).toHaveBeenCalledTimes(1);
    expect(supabase.removeChannel).not.toHaveBeenCalled();
    expect(deleteSpy).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // 15. AuthContext: context value reference stays the same across re-renders when state is unchanged
  // ---------------------------------------------------------------------------
  it('15. AuthProvider maintains referential equality of context value across re-renders when state is unchanged', () => {
    const capturedValues: any[] = [];

    const Consumer = ({ count }: { count: number }) => {
      const auth = useContext(AuthContext);
      capturedValues.push(auth);
      return <div>Count: {count}</div>;
    };

    let forceParentRerender: (() => void) | null = null;
    const TestComponent = () => {
      const [count, setCount] = React.useState(0);
      forceParentRerender = () => setCount((c) => c + 1);

      return (
        <AuthProvider>
          <Consumer count={count} />
        </AuthProvider>
      );
    };

    render(<TestComponent />);

    expect(capturedValues.length).toBe(1);
    const firstValue = capturedValues[0];

    act(() => {
      forceParentRerender?.();
    });

    expect(capturedValues.length).toBe(2);
    const secondValue = capturedValues[1];

    // Referential equality check on memoized context value
    expect(secondValue).toBe(firstValue);
  });
});
