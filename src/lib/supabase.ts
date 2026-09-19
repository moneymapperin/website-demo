import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Validates and retrieves required Supabase environment variables.
 * Throws a descriptive error if any required variable is missing.
 */
export function getSupabaseEnv(): { url: string; anonKey: string } {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
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
  const url = customUrl ?? import.meta.env.VITE_SUPABASE_URL;
  const anonKey = customAnonKey ?? import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Missing Supabase environment variables! VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be defined in your .env configuration.'
    );
  }

  return createClient(url, anonKey);
}

// Module-level shared singleton client
const { url, anonKey } = getSupabaseEnv();
export const supabase: SupabaseClient = createClient(url, anonKey);

export default supabase;
