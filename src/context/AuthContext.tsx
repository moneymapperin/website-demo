import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useLocation, Navigate, Outlet } from 'react-router-dom';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { authService } from '../services/authService';
import { premiumService } from '../services/premiumService';
import { navigateTo } from '../lib/navigation';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    // 1. Initial session check
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!isMounted) return;
        const currentSession = data?.session ?? null;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        authService.setCurrentUser(currentSession?.user ?? null);
        setIsLoading(false);

        // Sync subscription if session is present on initial load
        if (currentSession) {
          premiumService.syncSubscriptionStatus().catch(() => {});
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setSession(null);
        setUser(null);
        authService.setCurrentUser(null);
        setIsLoading(false);
      });

    // 2. Auth state subscription
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!isMounted) return;

      if (event === 'SIGNED_OUT') {
        authService.clearLocalData();
        premiumService.clearLocalPlan();
        setSession(null);
        setUser(null);
        authService.setCurrentUser(null);
        setIsLoading(false);
      } else if (event === 'PASSWORD_RECOVERY') {
        setSession(newSession ?? null);
        setUser(newSession?.user ?? null);
        authService.setCurrentUser(newSession?.user ?? null);
        setIsLoading(false);
        navigateTo('/reset-password');
      } else {
        setSession(newSession ?? null);
        setUser(newSession?.user ?? null);
        authService.setCurrentUser(newSession?.user ?? null);
        setIsLoading(false);

        // Trigger subscription sync on SIGNED_IN, INITIAL_SESSION, and TOKEN_REFRESHED when session is present
        if (newSession && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED')) {
          premiumService.syncSubscriptionStatus().catch(() => {});
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setSession(null);
    setUser(null);
  }, []);

  const authContextValue = useMemo(
    () => ({
      user,
      session,
      isLoading,
      isLoggedIn: !!session,
      logout,
    }),
    [user, session, isLoading, logout]
  );

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Route guard that requires an active session.
 * Displays a loading state while session is being verified.
 * Redirects unauthenticated users to /login, recording previous location.
 */
export function ProtectedRoute({ children }: { children?: React.ReactNode }): JSX.Element {
  const { session, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        data-testid="auth-loading-spinner"
        className="min-h-screen flex items-center justify-center bg-background text-white"
      >
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-purple"></div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children || <Outlet />}</>;
}

let globalQrAuthInProgress = false;
const qrAuthListeners = new Set<(inProgress: boolean) => void>();

export function setQrAuthInProgress(inProgress: boolean): void {
  globalQrAuthInProgress = inProgress;
  qrAuthListeners.forEach((listener) => listener(inProgress));
}

export function getQrAuthInProgress(): boolean {
  return globalQrAuthInProgress;
}

export function useQrAuthInProgress(): boolean {
  const [inProgress, setInProgress] = useState<boolean>(globalQrAuthInProgress);

  useEffect(() => {
    const listener = (val: boolean) => setInProgress(val);
    qrAuthListeners.add(listener);
    return () => {
      qrAuthListeners.delete(listener);
    };
  }, []);

  return inProgress;
}

/**
 * Route guard for public-only screens (e.g. Login, Register, Forgot Password).
 * Displays a loading state while session is being verified.
 * Redirects authenticated users to /dashboard or their intended destination,
 * unless QR login is actively in progress.
 */
export function PublicOnlyRoute({ children }: { children?: React.ReactNode }): JSX.Element {
  const { session, isLoading } = useAuth();
  const location = useLocation();
  const isQrAuth = useQrAuthInProgress() || getQrAuthInProgress();

  if (isLoading) {
    return (
      <div
        data-testid="auth-loading-spinner"
        className="min-h-screen flex items-center justify-center bg-background text-white"
      >
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-purple"></div>
      </div>
    );
  }

  // Do not redirect while QR authentication is actively resolving its destination
  if (session && !isQrAuth) {
    const fromPath = (location.state as any)?.from?.pathname || '/dashboard';
    return <Navigate to={fromPath} replace />;
  }

  return <>{children || <Outlet />}</>;
}
