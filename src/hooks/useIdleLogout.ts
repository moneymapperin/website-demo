import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

const IDLE_TIMEOUT_MINUTES = 15;
const CHECK_INTERVAL_MS = 30000;
const ACTIVITY_KEY = 'mm_last_activity';
const IDLE_TIMEOUT_MS = IDLE_TIMEOUT_MINUTES * 60 * 1000;
const ACTIVITY_WRITE_INTERVAL_MS = 5000;

export function useIdleLogout(): void {
  const navigate = useNavigate();

  useEffect(() => {
    let lastActivityWrite = 0;
    let isLoggingOut = false;

    const recordActivity = (force = false) => {
      const now = Date.now();
      if (!force && now - lastActivityWrite < ACTIVITY_WRITE_INTERVAL_MS) return;

      lastActivityWrite = now;
      try {
        localStorage.setItem(ACTIVITY_KEY, String(now));
      } catch {
        // Ignore unavailable localStorage.
      }
    };

    const checkIdle = async () => {
      if (isLoggingOut) return;

      let lastActivity: string | null;
      try {
        lastActivity = localStorage.getItem(ACTIVITY_KEY);
      } catch {
        return;
      }

      if (lastActivity === null || !Number.isFinite(Number(lastActivity))) {
        return;
      }

      if (Date.now() - Number(lastActivity) > IDLE_TIMEOUT_MS) {
        isLoggingOut = true;
        try {
          await authService.logout();
        } catch {
          // Continue redirecting if remote sign-out fails.
        }
        try {
          localStorage.removeItem(ACTIVITY_KEY);
        } catch {
          // Ignore unavailable localStorage.
        }
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
