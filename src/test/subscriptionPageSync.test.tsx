import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SubscriptionPage } from '../pages/SubscriptionPage';
import { apiService } from '../services/apiService';
import { premiumService, PremiumService } from '../services/premiumService';

function renderSubscriptionPage() {
  return render(
    <MemoryRouter initialEntries={['/subscription']}>
      <SubscriptionPage />
    </MemoryRouter>
  );
}

describe('SubscriptionPage Global Plan Sync & Refresh Status', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    premiumService.resetSyncTimesForTesting();
    delete (window as any).__MOCK_PLAN__;
  });

  afterEach(() => {
    delete (window as any).__MOCK_PLAN__;
  });

  it('1. fetchSubscription success on mount propagates to premiumService.setPlan with correct derived plan status', async () => {
    const futureDate = new Date(Date.now() + 30 * 86400000).toISOString();
    vi.spyOn(apiService, 'getSubscriptionDetails').mockResolvedValue({
      tier: 'MoneyMapper Pro Membership',
      status: 'active',
      current_period_end: futureDate,
    });
    const setPlanSpy = vi.spyOn(premiumService, 'setPlan');

    renderSubscriptionPage();

    await waitFor(() => {
      expect(screen.getByTestId('subscription-page-title')).toBeInTheDocument();
    });

    // Verify premiumService.setPlan was called with derived pro plan
    await waitFor(() => {
      expect(setPlanSpy).toHaveBeenCalledWith('MoneyMapper Pro Membership');
    });

    // Verify localStorage / cache reflects pro status
    expect(premiumService.getCachedPlan()).toBe('MoneyMapper Pro Membership');
  });

  it('2. fetchSubscription with null or expired subscription propagates free tier to premiumService.setPlan', async () => {
    vi.spyOn(apiService, 'getSubscriptionDetails').mockResolvedValue(null);
    const setPlanSpy = vi.spyOn(premiumService, 'setPlan');

    renderSubscriptionPage();

    await waitFor(() => {
      expect(setPlanSpy).toHaveBeenCalledWith(PremiumService.freeMembership);
    });

    expect(screen.getByTestId('subscription-status-text')).toHaveTextContent('Free Tier - Limited Access');
    expect(screen.queryByTestId('pro-badge')).not.toBeInTheDocument();
  });

  it('3. "Refresh status" button click calls refreshPlan() and triggers subscription refresh', async () => {
    vi.spyOn(apiService, 'getSubscriptionDetails').mockResolvedValue(null);
    const refreshPlanSpy = vi.spyOn(premiumService, 'refreshPlan');

    renderSubscriptionPage();

    await waitFor(() => {
      expect(screen.getByTestId('refresh-status-btn')).toBeInTheDocument();
    });

    const refreshBtn = screen.getByTestId('refresh-status-btn');
    expect(refreshBtn).toHaveTextContent('Refresh status');

    await act(async () => {
      fireEvent.click(refreshBtn);
    });

    // Expect refreshPlan to be called with force=true to bypass the 5-minute throttle
    expect(refreshPlanSpy).toHaveBeenCalledWith(true);
  });

  it('4. UI shows PRO badge and updated status immediately after a successful refetch without needing a page reload (re-render test)', async () => {
    // Step 1: User is initially free
    let subDetailsMock: any = null;
    vi.spyOn(apiService, 'getSubscriptionDetails').mockImplementation(async () => subDetailsMock);

    renderSubscriptionPage();

    // Verify initial free state
    await waitFor(() => {
      expect(screen.getByTestId('subscription-status-text')).toHaveTextContent('Free Tier - Limited Access');
    });
    expect(screen.queryByTestId('pro-badge')).not.toBeInTheDocument();

    // Step 2: User completes purchase in mobile app -> backend row is now PRO
    const futureDate = new Date(Date.now() + 90 * 86400000);
    const formattedDate = futureDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    subDetailsMock = {
      tier: 'MoneyMapper Pro Membership',
      status: 'active',
      current_period_end: futureDate.toISOString(),
    };

    // Step 3: User clicks "Refresh status" button on the website
    const refreshBtn = screen.getByTestId('refresh-status-btn');
    await act(async () => {
      fireEvent.click(refreshBtn);
    });

    // Step 4: Verify UI immediately shows PRO badge and formatted expiry date without reloading
    await waitFor(() => {
      expect(screen.getByTestId('pro-badge')).toBeInTheDocument();
      expect(screen.getByTestId('pro-badge')).toHaveTextContent('PRO');
      expect(screen.getByTestId('subscription-status-text')).toHaveTextContent(`Valid until: ${formattedDate}`);
    });

    // Step 5: Global premium service state is immediately PRO
    expect(premiumService.isPro()).toBe(true);
  });
});
