import { createClient, SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://upxsmlmsqxcwknvtywgk.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVweHNtbG1zcXhjd2tudnR5d2drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk4NTYwMDAsImV4cCI6MjAyNTQzMjAwMH0.demo-anon-key';

// Pure in-memory storage for Supabase auth (no persistence in cookies, localStorage, or sessionStorage)
export const inMemoryStorage = (() => {
  const store = new Map<string, string>();
  return {
    getItem: (key: string): string | null => {
      const val = store.get(key);
      if (val !== undefined) return val;

      // Short-lived PKCE code verifier lookup for OAuth redirect return
      if (typeof window !== 'undefined' && key.includes('code-verifier')) {
        try {
          const sessionVal = window.sessionStorage?.getItem(key);
          if (sessionVal) {
            window.sessionStorage.removeItem(key);
            store.set(key, sessionVal);
            return sessionVal;
          }
        } catch {
          // Ignore
        }
      }
      return null;
    },
    setItem: (key: string, value: string): void => {
      store.set(key, value);
      // For PKCE OAuth redirect, store code-verifier temporarily in sessionStorage
      if (typeof window !== 'undefined' && key.includes('code-verifier')) {
        try {
          window.sessionStorage?.setItem(key, value);
        } catch {
          // Ignore
        }
      }
    },
    removeItem: (key: string): void => {
      store.delete(key);
      if (typeof window !== 'undefined' && key.includes('code-verifier')) {
        try {
          window.sessionStorage?.removeItem(key);
        } catch {
          // Ignore
        }
      }
    },
  };
})();

export function getSessionAuthStorage() {
  return inMemoryStorage;
}

// One-time cleanup at module load: remove all leftover sb-* keys from both localStorage and sessionStorage
if (typeof window !== 'undefined') {
  const isAuthCallback =
    window.location.pathname.startsWith('/auth/callback') &&
    (window.location.search.includes('code=') || window.location.hash.includes('access_token'));

  [window.localStorage, window.sessionStorage].forEach((st) => {
    if (!st) return;
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < st.length; i++) {
        const key = st.key(i);
        if (!key) continue;
        if (isAuthCallback && key.includes('code-verifier')) {
          continue;
        }
        if (key.startsWith('sb-') || /^sb-/.test(key)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => st.removeItem(key));
    } catch {
      // Ignore storage access errors
    }
  });
}

/**
 * Validates and retrieves required Supabase environment variables.
 * Throws a descriptive error if any required variable is missing.
 */
export function getSupabaseEnv(): { url: string; anonKey: string } {
  const url = import.meta.env.VITE_SUPABASE_URL ?? DEFAULT_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? DEFAULT_SUPABASE_ANON_KEY;

  if (url === '' || anonKey === '') {
    throw new Error(
      'Missing Supabase environment variables! VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be defined in your .env configuration.'
    );
  }

  return { url, anonKey };
}

/**
 * Factory function to create a new Supabase client instance.
 * Defaults to environment variables if parameters are omitted.
 */
export function createSupabaseClient(customUrl?: string, customAnonKey?: string): SupabaseClient {
  const url = customUrl ?? import.meta.env.VITE_SUPABASE_URL ?? DEFAULT_SUPABASE_URL;
  const anonKey = customAnonKey ?? import.meta.env.VITE_SUPABASE_ANON_KEY ?? DEFAULT_SUPABASE_ANON_KEY;

  if (url === '' || anonKey === '') {
    throw new Error(
      'Missing Supabase environment variables! VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be defined in your .env configuration.'
    );
  }

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: inMemoryStorage,
    },
  });
}

// Module-level shared singleton client
const { url, anonKey } = getSupabaseEnv();
export const supabase: SupabaseClient = createClient(url, anonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: inMemoryStorage,
  },
});

export default supabase;
