import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIdleLogout, getInMemoryLastActivity, resetInMemoryLastActivity } from '../hooks/useIdleLogout';
import { authService } from '../services/authService';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

describe('useIdleLogout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
    localStorage.clear();
    resetInMemoryLastActivity();
    mockNavigate.mockClear();
    vi.spyOn(authService, 'logout').mockResolvedValue();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('records initial activity timestamp in memory without touching sessionStorage or localStorage', () => {
    renderHook(() => useIdleLogout());
    expect(getInMemoryLastActivity()).not.toBeNull();
    expect(sessionStorage.getItem('mm_last_activity')).toBeNull();
    expect(localStorage.getItem('mm_last_activity')).toBeNull();
  });

  it('logs out and redirects to /login after 15 minutes of inactivity', async () => {
    renderHook(() => useIdleLogout());

    await act(async () => {
      vi.advanceTimersByTime(16 * 60 * 1000);
    });

    expect(authService.logout).toHaveBeenCalled();
    expect(getInMemoryLastActivity()).toBeNull();
    expect(sessionStorage.getItem('mm_last_activity')).toBeNull();
    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
  });
});
