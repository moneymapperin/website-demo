import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

function parseOAuthError(): string | null {
  if (typeof window === 'undefined') return null;

  const searchParams = new URLSearchParams(window.location.search);
  const hashString = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash;
  const hashParams = new URLSearchParams(hashString);

  const error = searchParams.get('error') || hashParams.get('error');
  const errorCode = searchParams.get('error_code') || hashParams.get('error_code');
  let errorDescription = searchParams.get('error_description') || hashParams.get('error_description');

  if (error || errorCode || errorDescription) {
    if (error === 'access_denied') {
      return 'Google sign-in was cancelled. Please try again.';
    }
    if (errorDescription) {
      return errorDescription.replace(/\+/g, ' ');
    }
    return 'Google sign-in was abandoned or unsuccessful.';
  }

  return null;
}

export const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [oauthError] = useState<string | null>(() => parseOAuthError());
  const navigatedRef = useRef<boolean>(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (oauthError) {
      navigatedRef.current = true;
      if (import.meta.env.DEV) {
        console.info('[GOOGLE_AUTH] callback', { hasError: true, sessionFound: false });
      }
      navigate('/login', { replace: true, state: { oauthError } });
      return;
    }

    const goToDestination = () => {
      if (navigatedRef.current) return;
      navigatedRef.current = true;

      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      let destination = '/dashboard';
      try {
        const saved = sessionStorage.getItem('oauth_post_login_path');
        if (saved) {
          sessionStorage.removeItem('oauth_post_login_path');
          if (saved.startsWith('/') && !saved.startsWith('//')) {
            destination = saved;
          }
        }
      } catch {
        // ignore
      }

      if (import.meta.env.DEV) {
        console.info('[GOOGLE_AUTH] callback', { hasError: false, sessionFound: true });
      }
      navigate(destination, { replace: true });
    };

    // Safety timeout: 10 seconds after mount
    timerRef.current = setTimeout(() => {
      if (!navigatedRef.current) {
        navigatedRef.current = true;
        if (import.meta.env.DEV) {
          console.info('[GOOGLE_AUTH] callback', { hasError: false, sessionFound: false });
        }
        navigate('/login', {
          replace: true,
          state: { oauthError: 'Google sign-in was abandoned or unsuccessful.' },
        });
      }
    }, 10000);

    // a) on mount call supabase.auth.getSession() (it waits for the client to process the tokens in the URL)
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (data?.session) {
          goToDestination();
        }
      })
      .catch(() => {
        // ignore errors, fallback to onAuthStateChange / safety timeout
      });

    // b) also subscribe to supabase.auth.onAuthStateChange and go to destination on SIGNED_IN or INITIAL_SESSION
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
        goToDestination();
      }
    });

    // c) use a ref so navigation happens only once, and unsubscribe on unmount
    return () => {
      subscription.unsubscribe();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [oauthError, navigate]);

  return (
    <div
      data-testid="auth-callback-page"
      className="min-h-screen flex flex-col items-center justify-center bg-background text-white gap-4"
    >
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-purple" />
      <p className="text-sm font-medium text-slate-300">Signing you in with Google...</p>
    </div>
  );
};

export default AuthCallbackPage;
