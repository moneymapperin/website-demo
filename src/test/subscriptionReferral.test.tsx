import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SubscriptionPage } from '../pages/SubscriptionPage';
import { RegisterPage } from '../pages/RegisterPage';
import { paymentService } from '../services/paymentService';
import * as referralService from '../services/referralService';
import { authService } from '../services/authService';
import { supabase } from '../lib/supabase';

const mockDbPlans = [
  {
    id: 'db_plan_3',
    plan_code: 'mm_quarterly_prod',
    title: 'Quarterly Plan',
    months_duration: 3,
    discounted_price: 1497,
    original_price: 799,
    is_recommended: false,
  },
  {
    id: 'db_plan_6',
    plan_code: 'mm_halfyearly_prod',
    title: 'Half-Yearly Plan',
    months_duration: 6,
    discounted_price: 2394,
    original_price: 799,
    is_recommended: false,
  },
  {
    id: 'db_plan_12',
    plan_code: 'mm_yearly_prod',
    title: 'Yearly Plan',
    months_duration: 12,
    discounted_price: 3588,
    original_price: 799,
    is_recommended: true,
  },
];

vi.mock('../services/apiService', () => ({
  apiService: {
    getSubscriptionDetails: vi.fn().mockResolvedValue({
      tier: 'FREE',
      plan: 'FREE',
      current_period_end: null,
    }),
  },
}));

vi.mock('../hooks/usePlan', () => ({
  usePlan: () => ({
    isPro: false,
    plan: 'FREE',
    refreshPlan: vi.fn().mockResolvedValue(true),
  }),
}));

vi.mock('../services/paymentService', () => ({
  paymentService: {
    startCheckout: vi.fn().mockResolvedValue({ ok: true, orderId: 'test_order' }),
    getPlanCode: vi.fn().mockReturnValue('mm_quarterly_prod'),
  },
}));

vi.mock('../services/authService', () => ({
  authService: {
    signUp: vi.fn().mockResolvedValue({ user: { id: 'test_user_id' } }),
    savePlan: vi.fn(),
  },
}));

describe('Referral Flow - SubscriptionPage & RegisterPage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();

    const mockOrder = vi.fn().mockResolvedValue({ data: mockDbPlans, error: null });
    const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
    const mockSchema = vi.fn().mockReturnValue({ from: mockFrom });
    vi.spyOn(supabase, 'schema').mockImplementation(mockSchema as any);
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('SubscriptionPage Referral Section', () => {
    it('renders referral input and APPLY button', () => {
      render(
        <MemoryRouter>
          <SubscriptionPage />
        </MemoryRouter>
      );

      const input = screen.getByPlaceholderText('Enter Referral Code (Optional)');
      expect(input).toBeInTheDocument();

      const applyBtn = screen.getByRole('button', { name: /apply/i });
      expect(applyBtn).toBeInTheDocument();
      expect(applyBtn).toBeDisabled();
    });

    it('typing into referral input transforms to uppercase and enables APPLY button', () => {
      render(
        <MemoryRouter>
          <SubscriptionPage />
        </MemoryRouter>
      );

      const input = screen.getByPlaceholderText('Enter Referral Code (Optional)') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'finfree' } });

      expect(input.value).toBe('FINFREE');

      const applyBtn = screen.getByRole('button', { name: /apply/i });
      expect(applyBtn).not.toBeDisabled();
    });

    it('FINFREE on Quarterly: shows Code Applied, final price ₹0, discount line on Quarterly card only', async () => {
      vi.spyOn(referralService, 'validateReferralCode').mockResolvedValue({
        valid: true,
        status: 'valid',
        discountAmount: 1497,
        effectiveDiscount: 1497,
        message: 'Code Applied! ₹1497 off.',
      });

      render(
        <MemoryRouter>
          <SubscriptionPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('sub-plan-card-3')).toBeInTheDocument();
      });

      // Select Quarterly Plan (3 months)
      fireEvent.click(screen.getByTestId('sub-plan-card-3'));

      const input = screen.getByPlaceholderText('Enter Referral Code (Optional)');
      fireEvent.change(input, { target: { value: 'FINFREE' } });

      const applyBtn = screen.getByRole('button', { name: /apply/i });
      fireEvent.click(applyBtn);

      await waitFor(() => {
        expect(screen.getByText('Code Applied! ₹1497 off.')).toBeInTheDocument();
      });

      // Shows referral discount on Quarterly card only
      expect(screen.getByText('₹1497 Referral discount applied')).toBeInTheDocument();

      // CTA button shows "Activate PRO for free" when final price is ₹0
      const buyBtn = screen.getByTestId('buy-plan-btn');
      expect(buyBtn).toHaveTextContent('Activate PRO for free');
      expect(screen.getByTestId('free-activation-note')).toHaveTextContent(
        'No payment needed. Your referral code covers this plan.'
      );

      // Other cards (Half-Yearly: 6 months, Yearly: 12 months) show normal prices
      const card6 = screen.getByTestId('sub-plan-card-6');
      expect(card6).toHaveTextContent('₹399');
      expect(card6).not.toHaveTextContent('Referral discount applied');

      const card12 = screen.getByTestId('sub-plan-card-12');
      expect(card12).toHaveTextContent('₹299');
      expect(card12).not.toHaveTextContent('Referral discount applied');
    });

    it('FINFREE on Yearly: applies discount, shows Code Applied, and displays discounted price', async () => {
      vi.spyOn(referralService, 'validateReferralCode').mockResolvedValue({
        valid: true,
        status: 'valid',
        discountAmount: 1497,
        effectiveDiscount: 1497,
        message: 'Code Applied! ₹1497 off.',
      });

      render(
        <MemoryRouter>
          <SubscriptionPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('sub-plan-card-12')).toBeInTheDocument();
      });

      // Select Yearly Plan (default)
      fireEvent.click(screen.getByTestId('sub-plan-card-12'));

      const input = screen.getByPlaceholderText('Enter Referral Code (Optional)');
      fireEvent.change(input, { target: { value: 'FINFREE' } });

      const applyBtn = screen.getByRole('button', { name: /apply/i });
      fireEvent.click(applyBtn);

      await waitFor(() => {
        expect(screen.getByText('Code Applied! ₹1497 off.')).toBeInTheDocument();
      });

      // Shows referral discount on Yearly card
      expect(screen.getByText('₹1497 Referral discount applied')).toBeInTheDocument();

      // Discounted price on CTA button (3588 - 1497 = 2091)
      const buyBtn = screen.getByTestId('buy-plan-btn');
      expect(buyBtn).toHaveTextContent('Get Financially Free (₹2,091)');
    });

    it('switching plan keeps code applied and re-validates discount for the new plan', async () => {
      vi.spyOn(referralService, 'validateReferralCode')
        .mockResolvedValue({
          valid: true,
          status: 'valid',
          discountAmount: 1497,
          effectiveDiscount: 1497,
          message: 'Code Applied! ₹1497 off.',
        });

      render(
        <MemoryRouter>
          <SubscriptionPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('sub-plan-card-3')).toBeInTheDocument();
      });

      // Apply on Quarterly
      fireEvent.click(screen.getByTestId('sub-plan-card-3'));
      const input = screen.getByPlaceholderText('Enter Referral Code (Optional)');
      fireEvent.change(input, { target: { value: 'FINFREE' } });
      fireEvent.click(screen.getByRole('button', { name: /apply/i }));

      await waitFor(() => {
        expect(screen.getByText('Code Applied! ₹1497 off.')).toBeInTheDocument();
        expect(screen.getByText('₹1497 Referral discount applied')).toBeInTheDocument();
      });

      // Switch to Yearly Plan (12 months)
      fireEvent.click(screen.getByTestId('sub-plan-card-12'));

      await waitFor(() => {
        // Re-validated on Yearly as valid
        expect(screen.getByText('Code Applied! ₹1497 off.')).toBeInTheDocument();
      });

      // Discount applied on Yearly card
      expect(screen.getByText('₹1497 Referral discount applied')).toBeInTheDocument();
      expect(screen.getByTestId('buy-plan-btn')).toHaveTextContent('Get Financially Free (₹2,091)');
    });

    it('passes referral_code to paymentService.startCheckout only when valid for selected plan', async () => {
      vi.spyOn(referralService, 'validateReferralCode').mockResolvedValue({
        valid: true,
        status: 'valid',
        discountAmount: 1497,
        effectiveDiscount: 1497,
        message: 'Code Applied! ₹1497 off.',
      });

      render(
        <MemoryRouter>
          <SubscriptionPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('sub-plan-card-3')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('sub-plan-card-3'));

      const input = screen.getByPlaceholderText('Enter Referral Code (Optional)');
      fireEvent.change(input, { target: { value: 'FINFREE' } });
      fireEvent.click(screen.getByRole('button', { name: /apply/i }));

      await waitFor(() => {
        expect(screen.getByText('Code Applied! ₹1497 off.')).toBeInTheDocument();
      });

      const buyBtn = screen.getByTestId('buy-plan-btn');
      fireEvent.click(buyBtn);

      await waitFor(() => {
        expect(paymentService.startCheckout).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            referralCode: 'FINFREE',
            isReferralValid: true,
          })
        );
      });
    });

    it('shows invalid message and never sends referralCode at checkout', async () => {
      vi.spyOn(referralService, 'validateReferralCode').mockResolvedValue({
        valid: false,
        status: 'invalid',
        discountAmount: 0,
        message: 'Invalid or expired referral code.',
      });

      render(
        <MemoryRouter>
          <SubscriptionPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('sub-plan-card-3')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('sub-plan-card-3'));

      const input = screen.getByPlaceholderText('Enter Referral Code (Optional)');
      fireEvent.change(input, { target: { value: 'UNKNOWN_CODE' } });
      fireEvent.click(screen.getByRole('button', { name: /apply/i }));

      await waitFor(() => {
        expect(screen.getByText('Invalid or expired referral code.')).toBeInTheDocument();
      });

      // Discount is 0 and not applied on card
      expect(screen.queryByText(/referral discount applied/i)).not.toBeInTheDocument();

      const buyBtn = screen.getByTestId('buy-plan-btn');
      fireEvent.click(buyBtn);

      await waitFor(() => {
        expect(paymentService.startCheckout).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            referralCode: undefined,
            isReferralValid: false,
          })
        );
      });
    });

    it('shows already used message and never sends referralCode at checkout', async () => {
      vi.spyOn(referralService, 'validateReferralCode').mockResolvedValue({
        valid: false,
        status: 'already_used',
        discountAmount: 0,
        message: 'You have already claimed a referral discount previously.',
      });

      render(
        <MemoryRouter>
          <SubscriptionPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('sub-plan-card-3')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('sub-plan-card-3'));

      const input = screen.getByPlaceholderText('Enter Referral Code (Optional)');
      fireEvent.change(input, { target: { value: 'FINFREE' } });
      fireEvent.click(screen.getByRole('button', { name: /apply/i }));

      await waitFor(() => {
        expect(screen.getByText('You have already claimed a referral discount previously.')).toBeInTheDocument();
      });

      // Discount is 0 and not applied on card
      expect(screen.queryByText(/referral discount applied/i)).not.toBeInTheDocument();

      const buyBtn = screen.getByTestId('buy-plan-btn');
      fireEvent.click(buyBtn);

      await waitFor(() => {
        expect(paymentService.startCheckout).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            referralCode: undefined,
            isReferralValid: false,
          })
        );
      });
    });

    it('clears applied discount and message when user modifies input after applying', async () => {
      vi.spyOn(referralService, 'validateReferralCode').mockResolvedValue({
        valid: true,
        status: 'valid',
        discountAmount: 1497,
        effectiveDiscount: 1497,
        message: 'Code Applied! ₹1497 off.',
      });

      render(
        <MemoryRouter>
          <SubscriptionPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('sub-plan-card-3')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('sub-plan-card-3'));

      const input = screen.getByPlaceholderText('Enter Referral Code (Optional)');
      fireEvent.change(input, { target: { value: 'FINFREE' } });
      fireEvent.click(screen.getByRole('button', { name: /apply/i }));

      await waitFor(() => {
        expect(screen.getByText('Code Applied! ₹1497 off.')).toBeInTheDocument();
      });

      // User modifies text
      fireEvent.change(input, { target: { value: 'FINFREE2' } });

      expect(screen.queryByText('Code Applied! ₹1497 off.')).not.toBeInTheDocument();
      expect(screen.queryByText('₹1497 Referral discount applied')).not.toBeInTheDocument();
    });
  });

  describe('RegisterPage Referral Saving', () => {
    it('saves referral code to localStorage on successful registration', async () => {
      render(
        <MemoryRouter>
          <RegisterPage />
        </MemoryRouter>
      );

      fireEvent.change(screen.getByPlaceholderText('John Doe'), {
        target: { value: 'Sarthak User' },
      });
      fireEvent.change(screen.getByPlaceholderText('+91 98765 43210'), {
        target: { value: '9876543210' },
      });
      fireEvent.change(screen.getByPlaceholderText('name@example.com'), {
        target: { value: 'user@test.com' },
      });
      fireEvent.change(screen.getByPlaceholderText('Enter Referral Code (Optional)'), {
        target: { value: 'FRIEND50' },
      });
      fireEvent.change(screen.getByLabelText(/^Password$/i), {
        target: { value: 'Password123!' },
      });
      fireEvent.change(screen.getByLabelText(/^Confirm Password$/i), {
        target: { value: 'Password123!' },
      });

      fireEvent.click(screen.getByRole('button', { name: /^Register$/i }));

      await waitFor(() => {
        expect(authService.signUp).toHaveBeenCalledWith('user@test.com', 'Password123!', {
          fullName: 'Sarthak User',
          mobile: '9876543210',
          plan: 'b2c',
        });
        expect(localStorage.getItem('saved_referral_code')).toBe('FRIEND50');
      });
    });
  });
});
