import { useAuth } from '../context/AuthContext';

/**
 * Detects whether an active Supabase user session exists by delegating to AuthContext.
 * If called outside AuthProvider (e.g. in standalone test environments), falls back gracefully.
 */
export function useHasSession(): boolean {
  try {
    const { session } = useAuth();
    return !!session;
  } catch {
    return false;
  }
}

export default useHasSession;
