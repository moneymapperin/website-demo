import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { authService, AuthService, AUTH_STORAGE_KEYS, sanitizeErrorMessage } from '../services/authService';

describe('Task 2: AuthService (Port of Flutter auth_service.dart)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('signUp', () => {
    it('calls supabase.auth.signUp with exact arguments including metadata', async () => {
      const mockSignUp = vi.spyOn(supabase.auth, 'signUp').mockResolvedValue({
        data: {
          user: {
            id: 'u-123',
            email: 'test@example.com',
            user_metadata: { fullName: 'Jane Doe', mobile: '9876543210', plan: 'b2c' },
            app_metadata: {},
            aud: 'authenticated',
            created_at: new Date().toISOString(),
          } as any,
          session: null,
        },
        error: null,
      });

      const res = await authService.signUp('test@example.com', 'password123', {
        fullName: 'Jane Doe',
        mobile: '9876543210',
        plan: 'b2c',
      });

      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          data: {
            fullName: 'Jane Doe',
            mobile: '9876543210',
            plan: 'b2c',
          },
        },
      });
      expect(res.user?.id).toBe('u-123');
    });

    it('maps "already registered" error to exact required message', async () => {
      vi.spyOn(supabase.auth, 'signUp').mockResolvedValue({
        data: { user: null, session: null },
        error: { name: 'AuthApiError', message: 'User already registered', status: 400 } as any,
      });

      await expect(
        authService.signUp('existing@example.com', 'pwd', { fullName: 'Existing' })
      ).rejects.toThrow('An account already exists with this email.');
    });

    it('sanitizes unexpected technical errors', async () => {
      vi.spyOn(supabase.auth, 'signUp').mockResolvedValue({
        data: { user: null, session: null },
        error: { name: 'AuthApiError', message: 'Failed host lookup or socket error', status: 500 } as any,
      });

      await expect(
        authService.signUp('err@example.com', 'pwd', { fullName: 'Err' })
      ).rejects.toThrow('Connection issue detected. Please check your internet and try again.');
    });
  });

  describe('signIn', () => {
    it('calls supabase.auth.signInWithPassword and stores user info without jwt_token', async () => {
      const mockSignIn = vi.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValue({
        data: {
          user: {
            id: 'u-456',
            email: 'john@example.com',
            user_metadata: { fullName: 'John Doe', plan: 'pro' },
            app_metadata: {},
            aud: 'authenticated',
            created_at: new Date().toISOString(),
          } as any,
          session: {
            access_token: 'dummy-access-token',
            refresh_token: 'dummy-refresh-token',
            expires_in: 3600,
            token_type: 'bearer',
            user: {} as any,
          },
        },
        error: null,
      });

      await authService.signIn('john@example.com', 'secret123');

      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'john@example.com',
        password: 'secret123',
      });

      // App-owned keys stored
      expect(localStorage.getItem(AUTH_STORAGE_KEYS.NAME)).toBe('John Doe');
      expect(localStorage.getItem(AUTH_STORAGE_KEYS.EMAIL)).toBe('john@example.com');
      expect(localStorage.getItem(AUTH_STORAGE_KEYS.PLAN)).toBe('pro');

      // Crucial: jwt_token must NEVER be saved in localStorage
      expect(localStorage.getItem('jwt_token')).toBeNull();
    });

    it('maps "Invalid login credentials" to exact required message', async () => {
      vi.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValue({
        data: { user: null, session: null } as any,
        error: { name: 'AuthApiError', message: 'Invalid login credentials', status: 400 } as any,
      });

      await expect(authService.signIn('wrong@example.com', 'badpwd')).rejects.toThrow(
        'Incorrect email or password. Please try again.'
      );
    });

    it('defaults plan to b2c if metadata does not specify one', async () => {
      vi.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValue({
        data: {
          user: {
            id: 'u-789',
            email: 'default@example.com',
            user_metadata: { fullName: 'Default User' },
          } as any,
          session: null as any,
        },
        error: null,
      } as any);

      await authService.signIn('default@example.com', 'pwd');
      expect(localStorage.getItem(AUTH_STORAGE_KEYS.PLAN)).toBe('b2c');
    });
  });

  describe('resetPassword and updatePassword', () => {
    it('resetPassword calls resetPasswordForEmail with origin/reset-password', async () => {
      const mockReset = vi.spyOn(supabase.auth, 'resetPasswordForEmail').mockResolvedValue({
        data: {},
        error: null,
      });

      await authService.resetPassword('recover@example.com');

      expect(mockReset).toHaveBeenCalledWith('recover@example.com', {
        redirectTo: `${window.location.origin}/reset-password`,
      });
    });

    it('updatePassword calls updateUser with password', async () => {
      const mockUpdate = vi.spyOn(supabase.auth, 'updateUser').mockResolvedValue({
        data: { user: { id: 'u-updated' } as any },
        error: null,
      });

      await authService.updatePassword('newPassword123');

      expect(mockUpdate).toHaveBeenCalledWith({ password: 'newPassword123' });
    });
  });

  describe('logout & localStorage cleanup', () => {
    it('clears app-owned keys and cache keys while strictly preserving theme_mode', async () => {
      vi.spyOn(supabase.auth, 'signOut').mockResolvedValue({ error: null });

      localStorage.setItem('theme_mode', 'dark');
      localStorage.setItem(AUTH_STORAGE_KEYS.NAME, 'John');
      localStorage.setItem(AUTH_STORAGE_KEYS.EMAIL, 'john@example.com');
      localStorage.setItem(AUTH_STORAGE_KEYS.PLAN, 'b2c');
      localStorage.setItem(AUTH_STORAGE_KEYS.PROFILE_CACHE, '{"foo":"bar"}');
      localStorage.setItem('dashboard_cache_scores', '{"score":90}');
      localStorage.setItem('profile_avatar_cache', 'url');
      localStorage.setItem('mm_cache_news', 'items');

      await authService.logout();

      // App keys and cache keys cleared
      expect(localStorage.getItem(AUTH_STORAGE_KEYS.NAME)).toBeNull();
      expect(localStorage.getItem(AUTH_STORAGE_KEYS.EMAIL)).toBeNull();
      expect(localStorage.getItem(AUTH_STORAGE_KEYS.PLAN)).toBeNull();
      expect(localStorage.getItem(AUTH_STORAGE_KEYS.PROFILE_CACHE)).toBeNull();
      expect(localStorage.getItem('dashboard_cache_scores')).toBeNull();
      expect(localStorage.getItem('profile_avatar_cache')).toBeNull();
      expect(localStorage.getItem('mm_cache_news')).toBeNull();

      // theme_mode preserved!
      expect(localStorage.getItem('theme_mode')).toBe('dark');
    });

    it('clears data even when signOut rejects with a network error', async () => {
      vi.spyOn(supabase.auth, 'signOut').mockRejectedValue(new Error('Network offline'));

      localStorage.setItem('theme_mode', 'light');
      localStorage.setItem(AUTH_STORAGE_KEYS.NAME, 'Alice');
      localStorage.setItem('dashboard_scores', 'cached');

      await authService.logout();

      expect(localStorage.getItem(AUTH_STORAGE_KEYS.NAME)).toBeNull();
      expect(localStorage.getItem('dashboard_scores')).toBeNull();
      expect(localStorage.getItem('theme_mode')).toBe('light');
    });

    it('guarantees Supabase session removal using a REAL client with rejecting fetch', async () => {
      // Create a real Supabase client with a custom storage key
      const realClient = createClient('https://test-project.supabase.co', 'test-anon-key', {
        auth: {
          persistSession: true,
          storage: window.localStorage,
          storageKey: 'sb-test-project-auth-token',
        },
      });

      // Seed a session in localStorage
      localStorage.setItem(
        'sb-test-project-auth-token',
        JSON.stringify({
          access_token: 'fake-access-token',
          user: { id: 'real-user-123' },
        })
      );
      localStorage.setItem('theme_mode', 'dark');
      localStorage.setItem('user_name', 'Sarthak');
      localStorage.setItem('dashboard_analytics', 'cached_data');

      // Mock fetch rejection simulating complete offline/network failure
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

      try {
        await authService.logout(realClient);

        // Supabase session token MUST be gone
        expect(localStorage.getItem('sb-test-project-auth-token')).toBeNull();

        // App-owned data MUST be gone
        expect(localStorage.getItem('user_name')).toBeNull();
        expect(localStorage.getItem('dashboard_analytics')).toBeNull();

        // theme_mode MUST be preserved
        expect(localStorage.getItem('theme_mode')).toBe('dark');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  describe('isLoggedIn and currentUserId', () => {
    it('isLoggedIn returns true when session exists and false when null', async () => {
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValueOnce({
        data: { session: { access_token: 't' } as any },
        error: null,
      });
      expect(await authService.isLoggedIn()).toBe(true);

      vi.spyOn(supabase.auth, 'getSession').mockResolvedValueOnce({
        data: { session: null },
        error: null,
      });
      expect(await authService.isLoggedIn()).toBe(false);
    });

    it('currentUserId returns user id from currentUser or stored session', () => {
      const service = new AuthService();
      expect(service.currentUserId).toBeNull();

      service.setCurrentUser({ id: 'active-user-99' } as any);
      expect(service.currentUserId).toBe('active-user-99');

      service.setCurrentUser(null);
      // Fallback to reading stored session in localStorage
      localStorage.setItem(
        'sb-proj-auth-token',
        JSON.stringify({ user: { id: 'stored-user-88' } })
      );
      expect(service.currentUserId).toBe('stored-user-88');
    });
  });

  describe('syncMetadata', () => {
    it('syncs user_metadata from active user into localStorage', async () => {
      vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
        data: {
          user: {
            email: 'sync@example.com',
            user_metadata: { fullName: 'Sync Name', plan: 'enterprise' },
          } as any,
        },
        error: null,
      });

      await authService.syncMetadata();

      expect(localStorage.getItem(AUTH_STORAGE_KEYS.NAME)).toBe('Sync Name');
      expect(localStorage.getItem(AUTH_STORAGE_KEYS.EMAIL)).toBe('sync@example.com');
      expect(localStorage.getItem(AUTH_STORAGE_KEYS.PLAN)).toBe('enterprise');
    });
  });

  describe('sanitizeErrorMessage utility', () => {
    it('maps network, rate limit, timeout, and auth errors correctly', () => {
      expect(sanitizeErrorMessage('failed host lookup')).toContain('Connection issue detected');
      expect(sanitizeErrorMessage('Rate limit exceeded (429)')).toContain('Servers are busy');
      expect(sanitizeErrorMessage('Request timeout')).toContain('The request took too long');
      expect(sanitizeErrorMessage('Unauthorized 401')).toContain('Session expired or unauthorized');
      expect(sanitizeErrorMessage('Unknown random database failure')).toContain('Something went wrong on our end');
    });
  });
});
