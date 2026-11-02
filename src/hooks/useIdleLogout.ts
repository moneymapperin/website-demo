import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

const IDLE_TIMEOUT_MINUTES = 15;
const CHECK_INTERVAL_MS = 30000;
const IDLE_TIMEOUT_MS = IDLE_TIMEOUT_MINUTES * 60 * 1000;
const ACTIVITY_WRITE_INTERVAL_MS = 5000;

// In-memory tracker for last user activity timestamp (pure in-memory, no sessionStorage/localStorage)
let inMemoryLastActivity: number | null = null;

export function getInMemoryLastActivity(): number | null {
  return inMemoryLastActivity;
}

export function resetInMemoryLastActivity(): void {
  inMemoryLastActivity = null;
}

export function useIdleLogout(): void {
  const navigate = useNavigate();

  useEffect(() => {
    let lastActivityWrite = 0;
    let isLoggingOut = false;

    const recordActivity = (force = false) => {
      const now = Date.now();
      if (!force && now - lastActivityWrite < ACTIVITY_WRITE_INTERVAL_MS) return;

      lastActivityWrite = now;
      inMemoryLastActivity = now;
    };

    const checkIdle = async () => {
      if (isLoggingOut) return;

      if (inMemoryLastActivity === null || !Number.isFinite(inMemoryLastActivity)) {
        return;
      }

      if (Date.now() - inMemoryLastActivity > IDLE_TIMEOUT_MS) {
        isLoggingOut = true;
        try {
          await authService.logout();
        } catch {
          // Continue redirecting if remote sign-out fails.
        }
        inMemoryLastActivity = null;
        navigate('/login', { replace: true });
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void checkIdle();
      }
    };
    const handleActivity = () => recordActivity();

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'] as const;
    const listenerOptions: AddEventListenerOptions = { passive: true };

    recordActivity(true);
    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, handleActivity, listenerOptions);
    });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const intervalId = window.setInterval(() => {
      void checkIdle();
    }, CHECK_INTERVAL_MS);

    return () => {
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, handleActivity, listenerOptions);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.clearInterval(intervalId);
    };
  }, [navigate]);
}
