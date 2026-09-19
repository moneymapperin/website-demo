import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('src/lib/supabase', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.unstubAllEnvs();
  });

  it('throws an error when VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY are missing', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');

    await expect(async () => {
      await import('../lib/supabase');
    }).rejects.toThrow(/Missing Supabase environment variables/);
  });

  it('throws an error when only VITE_SUPABASE_URL is provided', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');

    await expect(async () => {
      await import('../lib/supabase');
    }).rejects.toThrow(/Missing Supabase environment variables/);
  });

  it('initializes a valid Supabase client when valid environment variables are present', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://upxsmlmsqxcwknvtywgk.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key-valid-token');

    const mod = await import('../lib/supabase');

    expect(mod.supabase).toBeDefined();
    expect(typeof mod.supabase.from).toBe('function');
    expect(typeof mod.supabase.schema).toBe('function');
    expect(typeof mod.supabase.rpc).toBe('function');
    expect(typeof mod.supabase.auth.signInWithPassword).toBe('function');
  });

  it('createSupabaseClient factory can instantiate a client with explicit credentials', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://upxsmlmsqxcwknvtywgk.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key-valid-token');

    const { createSupabaseClient } = await import('../lib/supabase');
    const customClient = createSupabaseClient('https://custom.supabase.co', 'custom-anon-key');

    expect(customClient).toBeDefined();
    expect(typeof customClient.from).toBe('function');
  });
});
