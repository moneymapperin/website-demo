import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { premiumService } from '../services/premiumService';

/**
 * useSubscriptionSync
 *
 * Keeps PRO membership in sync between mobile app and website:
 * 1. Listens to window focus & visibilitychange (throttled to 15s) and triggers refreshPlan(true).
 * 2. Subscribes to Supabase Realtime channel `sub-${userId}` on `bse_data.user_subscriptions`.
 * 3. Falls back to polling every 60s when the channel errors, times out, or closes while tab is visible.
 */
export function useSubscriptionSync(): void {
  const { user } = useAuth();
  const userId = user?.id;
  const lastRefreshTimeRef = useRef<number>(0);

  // Throttled refresh trigger (15s minimum gap)
  const triggerRefresh = useCallback(() => {
    const now = Date.now();
    if (now - lastRefreshTimeRef.current < 15000) {
      return;
    }
    lastRefreshTimeRef.current = now;
    premiumService.refreshPlan(true).catch((err) => {
      console.warn('Subscription sync refresh error:', err);
    });
  }, []);

  // 1. Focus & document visibility listener
  useEffect(() => {
    const handleFocus = () => {
      triggerRefresh();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        triggerRefresh();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [triggerRefresh]);

  // 2. Realtime subscription + fallback polling
  useEffect(() => {
    if (!userId) return;

    let pollingTimer: ReturnType<typeof setInterval> | null = null;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const startPolling = () => {
      if (pollingTimer) return;
      pollingTimer = setInterval(() => {
        if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
          premiumService.refreshPlan(true).catch(() => {});
        }
      }, 60000);
    };

    const stopPolling = () => {
      if (pollingTimer) {
        clearInterval(pollingTimer);
        pollingTimer = null;
      }
    };

    try {
      channel = supabase
        .channel(`sub-${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'bse_data',
            table: 'user_subscriptions',
            filter: `user_id=eq.${userId}`,
          },
          () => {
            // Any change to user_subscriptions immediately triggers refresh
            premiumService.refreshPlan(true).catch(() => {});
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            stopPolling();
          } else if (
            status === 'CHANNEL_ERROR' ||
            status === 'TIMED_OUT' ||
            status === 'CLOSED'
          ) {
            startPolling();
          }
        });
    } catch {
      startPolling();
    }

    return () => {
      stopPolling();
      if (channel) {
        try {
          const removePromise = supabase.removeChannel(channel);
          if (removePromise && typeof (removePromise as Promise<any>).catch === 'function') {
            (removePromise as Promise<any>).catch(() => {});
          }
        } catch {
          // ignore cleanup errors
        }
      }
    };
  }, [userId]);
}
