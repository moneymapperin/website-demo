import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth, ProtectedRoute, PublicOnlyRoute } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import * as navigation from '../lib/navigation';
import App from '../App';

function AuthStateConsumer() {
  const { session, user, isLoading } = useAuth();
  return (
    <div>
      <span data-testid="loading-state">{isLoading ? 'loading' : 'done'}</span>
      <span data-testid="session-state">{session ? 'has-session' : 'no-session'}</span>
      <span data-testid="user-email">{user?.email ?? 'no-email'}</span>
    </div>
  );
}

function LocationStateConsumer() {
  const location = useLocation();
  return (
    <div>
      <span data-testid="current-path">{location.pathname}</span>
      <span data-testid="from-state">{(location.state as any)?.from?.pathname ?? 'none'}</span>
    </div>
  );
}

describe('Task 2: AuthProvider & Routing Guards', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe('AuthProvider Lifecycle & Auth State Change Events', () => {
    it('sets isLoading=false and session=null when getSession() rejects', async () => {
      vi.spyOn(supabase.auth, 'getSession').mockRejectedValue(new Error('Network failure'));
      vi.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      } as any);

      render(
        <AuthProvider>
          <AuthStateConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading-state').textContent).toBe('done');
      });
      expect(screen.getByTestId('session-state').textContent).toBe('no-session');
      expect(screen.getByTestId('user-email').textContent).toBe('no-email');
    });

    it('unsubscribes from onAuthStateChange on unmount', () => {
      const unsubscribeSpy = vi.fn();
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: { session: null },
        error: null,
      });
      vi.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValue({
        data: { subscription: { unsubscribe: unsubscribeSpy } },
      } as any);

      const { unmount } = render(
        <AuthProvider>
          <AuthStateConsumer />
        </AuthProvider>
      );

      expect(unsubscribeSpy).not.toHaveBeenCalled();
      unmount();
      expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
    });

    it('a SIGNED_OUT event clears user and session', async () => {
      let authCallback: ((event: string, session: any) => void) | null = null;
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: {
          session: {
            access_token: 'valid-token',
            user: { id: 'u-1', email: 'active@test.com' },
          } as any,
        },
        error: null,
      });
      vi.spyOn(supabase.auth, 'onAuthStateChange').mockImplementation((cb: any) => {
        authCallback = cb;
        return { data: { subscription: { unsubscribe: vi.fn() } } } as any;
      });

      render(
        <AuthProvider>
          <AuthStateConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('session-state').textContent).toBe('has-session');
        expect(screen.getByTestId('user-email').textContent).toBe('active@test.com');
      });

      // Simulate SIGNED_OUT event
      authCallback!('SIGNED_OUT', null);

      await waitFor(() => {
        expect(screen.getByTestId('session-state').textContent).toBe('no-session');
        expect(screen.getByTestId('user-email').textContent).toBe('no-email');
      });
    });

    it('a TOKEN_REFRESHED event updates the session', async () => {
      let authCallback: ((event: string, session: any) => void) | null = null;
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: { session: null },
        error: null,
      });
      vi.spyOn(supabase.auth, 'onAuthStateChange').mockImplementation((cb: any) => {
        authCallback = cb;
        return { data: { subscription: { unsubscribe: vi.fn() } } } as any;
      });

      render(
        <AuthProvider>
          <AuthStateConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('session-state').textContent).toBe('no-session');
      });

      // Simulate TOKEN_REFRESHED with a new refreshed session
      authCallback!('TOKEN_REFRESHED', {
        access_token: 'refreshed-token',
        user: { id: 'u-2', email: 'refreshed@test.com' },
      });

      await waitFor(() => {
        expect(screen.getByTestId('session-state').textContent).toBe('has-session');
        expect(screen.getByTestId('user-email').textContent).toBe('refreshed@test.com');
      });
    });

    it('PASSWORD_RECOVERY event triggers navigateTo("/reset-password")', async () => {
      let authCallback: ((event: string, session: any) => void) | null = null;
      const navigateSpy = vi.spyOn(navigation, 'navigateTo').mockImplementation(() => {});

      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: { session: null },
        error: null,
      });
      vi.spyOn(supabase.auth, 'onAuthStateChange').mockImplementation((cb: any) => {
        authCallback = cb;
        return { data: { subscription: { unsubscribe: vi.fn() } } } as any;
      });

      render(
        <AuthProvider>
          <AuthStateConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading-state').textContent).toBe('done');
      });

      authCallback!('PASSWORD_RECOVERY', {
        access_token: 'recovery-token',
        user: { id: 'u-recovery', email: 'recover@test.com' },
      });

      expect(navigateSpy).toHaveBeenCalledWith('/reset-password');
    });
  });

  describe('ProtectedRoute', () => {
    it('shows loader while loading', () => {
      // getSession returns a pending promise
      vi.spyOn(supabase.auth, 'getSession').mockReturnValue(new Promise(() => {}));
      vi.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      } as any);

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <AuthProvider>
            <Routes>
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <div>Protected Content</div>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      expect(screen.getByTestId('auth-loading-spinner')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('redirects unauthenticated user to /login and preserves from in state', async () => {
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: { session: null },
        error: null,
      });
      vi.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      } as any);

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <AuthProvider>
            <Routes>
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <div>Protected Content</div>
                  </ProtectedRoute>
                }
              />
              <Route path="/login" element={<LocationStateConsumer />} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('current-path').textContent).toBe('/login');
      });
      expect(screen.getByTestId('from-state').textContent).toBe('/dashboard');
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('renders protected children when user is authenticated', async () => {
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: {
          session: { access_token: 'tok', user: { id: 'u-auth' } } as any,
        },
        error: null,
      });
      vi.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      } as any);

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <AuthProvider>
            <Routes>
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <div data-testid="protected-content">Welcome to Dashboard</div>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
    });
  });

  describe('PublicOnlyRoute', () => {
    it('shows loader while loading', () => {
      vi.spyOn(supabase.auth, 'getSession').mockReturnValue(new Promise(() => {}));
      vi.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      } as any);

      render(
        <MemoryRouter initialEntries={['/login']}>
          <AuthProvider>
            <Routes>
              <Route
                path="/login"
                element={
                  <PublicOnlyRoute>
                    <div>Login Form</div>
                  </PublicOnlyRoute>
                }
              />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      expect(screen.getByTestId('auth-loading-spinner')).toBeInTheDocument();
      expect(screen.queryByText('Login Form')).not.toBeInTheDocument();
    });

    it('redirects authenticated user to /dashboard', async () => {
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: {
          session: { access_token: 'tok', user: { id: 'u-auth' } } as any,
        },
        error: null,
      });
      vi.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      } as any);

      render(
        <MemoryRouter initialEntries={['/login']}>
          <AuthProvider>
            <Routes>
              <Route
                path="/login"
                element={
                  <PublicOnlyRoute>
                    <div>Login Form</div>
                  </PublicOnlyRoute>
                }
              />
              <Route path="/dashboard" element={<div data-testid="dashboard-dest">Dashboard View</div>} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-dest')).toBeInTheDocument();
      });
      expect(screen.queryByText('Login Form')).not.toBeInTheDocument();
    });

    it('renders public form when user is not authenticated', async () => {
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: { session: null },
        error: null,
      });
      vi.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      } as any);

      render(
        <MemoryRouter initialEntries={['/login']}>
          <AuthProvider>
            <Routes>
              <Route
                path="/login"
                element={
                  <PublicOnlyRoute>
                    <div data-testid="login-form">Login Form</div>
                  </PublicOnlyRoute>
                }
              />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('login-form')).toBeInTheDocument();
      });
    });
  });

  describe('App Route Navigation & Redirects', () => {
    it('unknown route redirects to "/" (landing page)', async () => {
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: { session: null },
        error: null,
      });
      vi.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      } as any);

      window.history.pushState({}, '', '/non-existent-random-route');
      render(<App />);

      await waitFor(() => {
        expect(window.location.pathname).toBe('/');
      });
    });

    it('redirects /qr-login to /login', async () => {
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: { session: null },
        error: null,
      });
      vi.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      } as any);

      window.history.pushState({}, '', '/qr-login');
      render(<App />);

      await waitFor(() => {
        expect(window.location.pathname).toBe('/login');
      });
    });

    it('redirects canonical alias /main to /dashboard (which guards and redirects to /login when logged out)', async () => {
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: { session: null },
        error: null,
      });
      vi.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      } as any);

      window.history.pushState({}, '', '/main');
      render(<App />);

      await waitFor(() => {
        expect(window.location.pathname).toBe('/login');
      });
    });

    it('redirects /assistant to canonical /ai-assistant', async () => {
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: {
          session: { access_token: 'token', user: { id: 'u' } } as any,
        },
        error: null,
      });
      vi.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      } as any);

      window.history.pushState({}, '', '/assistant');
      render(<App />);

      await waitFor(() => {
        expect(window.location.pathname).toBe('/ai-assistant');
      });
    });

    it('redirects /corporate/login to /corporate-login', async () => {
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: { session: null },
        error: null,
      });
      vi.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      } as any);

      window.history.pushState({}, '', '/corporate/login');
      render(<App />);

      await waitFor(() => {
        expect(window.location.pathname).toBe('/corporate-login');
      });
    });

    it('redirects /corporate/dashboard to /corporate-dashboard', async () => {
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: {
          session: { access_token: 'token', user: { id: 'corp-user' } } as any,
        },
        error: null,
      });
      vi.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      } as any);

      window.history.pushState({}, '', '/corporate/dashboard');
      render(<App />);

      await waitFor(() => {
        expect(window.location.pathname).toBe('/corporate-dashboard');
      });
    });
  });
});
