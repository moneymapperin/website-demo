import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/ResetPasswordPage';
import { CorporateLoginPage } from '../pages/CorporateLoginPage';
import { authService } from '../services/authService';
import { apiService } from '../services/apiService';
import { AuthProvider } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import App from '../App';

describe('Task 3: Auth Pages (Mirroring Flutter screens)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();

    const mockChannel = {
      on: vi.fn(() => mockChannel),
      subscribe: vi.fn(() => mockChannel),
    };
    vi.spyOn(supabase, 'channel').mockReturnValue(mockChannel as any);
    vi.spyOn(supabase, 'removeChannel').mockResolvedValue('ok' as any);
  });

  describe('1. LoginPage (/login)', () => {
    it('renders with exact Flutter copy, labels, and QR placeholder', () => {
      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      );

      // Titles
      expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
      expect(screen.getByText('Sign in to view your financial fitness score')).toBeInTheDocument();

      // Form inputs with real labels
      expect(screen.getByLabelText(/^Email$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument();

      // Submit button
      expect(screen.getByRole('button', { name: /^Login$/i })).toBeInTheDocument();

      // Links
      expect(screen.getByRole('link', { name: /Forgot Password\?/i })).toHaveAttribute('href', '/forgot-password');
      expect(screen.getByRole('link', { name: /New user\? Register/i })).toHaveAttribute('href', '/register');
      expect(screen.getByRole('link', { name: /Access Corporate Portal/i })).toHaveAttribute('href', '/corporate-login');

      // QR panel placeholder for Task 4
      expect(screen.getByTestId('qr-panel-placeholder')).toBeInTheDocument();
      expect(screen.getByText('Log in with QR Code')).toBeInTheDocument();
    });

    it('shows validation alert when submitting empty fields', async () => {
      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByRole('button', { name: /^Login$/i }));

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent('Please enter email and password');
    });

    it('submits successfully and navigates to destination, disabling button during loading', async () => {
      let resolveSignIn: (val: any) => void;
      const signInPromise = new Promise((resolve) => {
        resolveSignIn = resolve;
      });
      vi.spyOn(authService, 'signIn').mockReturnValue(signInPromise as any);

      render(
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<div data-testid="dash-target">Dashboard</div>} />
          </Routes>
        </MemoryRouter>
      );

      await userEvent.type(screen.getByLabelText(/^Email$/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/^Password$/i), 'password123');

      const loginButton = screen.getByRole('button', { name: /^Login$/i });
      fireEvent.click(loginButton);

      // Button is disabled during loading
      expect(loginButton).toBeDisabled();

      resolveSignIn!({ user: { id: 'u-1' } });

      await waitFor(() => {
        expect(screen.getByTestId('dash-target')).toBeInTheDocument();
      });
      expect(authService.signIn).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    it('displays error message with role="alert" when signIn fails', async () => {
      vi.spyOn(authService, 'signIn').mockRejectedValue(
        new Error('Incorrect email or password. Please try again.')
      );

      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      );

      await userEvent.type(screen.getByLabelText(/^Email$/i), 'bad@example.com');
      await userEvent.type(screen.getByLabelText(/^Password$/i), 'badpass');

      fireEvent.click(screen.getByRole('button', { name: /^Login$/i }));

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent('Incorrect email or password. Please try again.');
    });

    it('renders status message with role="status" when passed in location state', () => {
      render(
        <MemoryRouter
          initialEntries={[
            {
              pathname: '/login',
              state: { message: 'Password updated successfully! Please login with your new password.' },
            },
          ]}
        >
          <LoginPage />
        </MemoryRouter>
      );

      const status = screen.getByRole('status');
      expect(status).toHaveTextContent('Password updated successfully! Please login with your new password.');
    });
  });

  describe('2. RegisterPage (/register)', () => {
    it('renders with exact Flutter copy and field labels', () => {
      render(
        <MemoryRouter>
          <RegisterPage />
        </MemoryRouter>
      );

      expect(screen.getByRole('heading', { name: 'Create account' })).toBeInTheDocument();
      expect(screen.getByText('Join MoneyMapper to track your financial health')).toBeInTheDocument();

      expect(screen.getByLabelText(/^Full Name$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Email Address$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Mobile Number$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Confirm Password$/i)).toBeInTheDocument();

      expect(screen.getByRole('button', { name: /^Register$/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Already have an account\? Login/i })).toHaveAttribute('href', '/login');
    });

    it('validates empty fields with exact message "Please fill in all fields"', async () => {
      render(
        <MemoryRouter>
          <RegisterPage />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByRole('button', { name: /^Register$/i }));

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent('Please fill in all fields');
    });

    it('validates password mismatch with exact message "Passwords do not match"', async () => {
      render(
        <MemoryRouter>
          <RegisterPage />
        </MemoryRouter>
      );

      await userEvent.type(screen.getByLabelText(/^Full Name$/i), 'John Doe');
      await userEvent.type(screen.getByLabelText(/^Email Address$/i), 'john@example.com');
      await userEvent.type(screen.getByLabelText(/^Mobile Number$/i), '9876543210');
      await userEvent.type(screen.getByLabelText(/^Password$/i), 'password123');
      await userEvent.type(screen.getByLabelText(/^Confirm Password$/i), 'different123');

      fireEvent.click(screen.getByRole('button', { name: /^Register$/i }));

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent('Passwords do not match');
    });

    it('sends exact metadata { fullName, mobile, plan: "b2c" } and shows success dialog', async () => {
      const signUpSpy = vi.spyOn(authService, 'signUp').mockResolvedValue({
        user: { id: 'u-reg' } as any,
        session: null,
      });

      render(
        <MemoryRouter>
          <RegisterPage />
        </MemoryRouter>
      );

      await userEvent.type(screen.getByLabelText(/^Full Name$/i), 'Sarthak Nigam');
      await userEvent.type(screen.getByLabelText(/^Email Address$/i), 'sarthak@example.com');
      await userEvent.type(screen.getByLabelText(/^Mobile Number$/i), '+919999988888');
      await userEvent.type(screen.getByLabelText(/^Password$/i), 'SecurePass123');
      await userEvent.type(screen.getByLabelText(/^Confirm Password$/i), 'SecurePass123');

      const registerBtn = screen.getByRole('button', { name: /^Register$/i });
      fireEvent.click(registerBtn);

      await waitFor(() => {
        expect(signUpSpy).toHaveBeenCalledWith(
          'sarthak@example.com',
          'SecurePass123',
          {
            fullName: 'Sarthak Nigam',
            mobile: '+919999988888',
            plan: 'b2c',
          }
        );
      });

      // Dialog appears per Flutter register_screen.dart
      const dialog = await screen.findByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Registration Successful' })).toBeInTheDocument();
      expect(
        screen.getByText(/Your account has been created! Please check your email inbox to verify your account before logging in\./i)
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Back to Login' })).toBeInTheDocument();
    });
  });

  describe('3. ForgotPasswordPage (/forgot-password)', () => {
    it('renders with exact copy and validates empty email', async () => {
      render(
        <MemoryRouter>
          <ForgotPasswordPage />
        </MemoryRouter>
      );

      expect(screen.getByRole('heading', { name: 'Reset Password' })).toBeInTheDocument();
      expect(screen.getByLabelText(/^Email Address$/i)).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /Send Reset Link/i }));

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent('Please enter your email to reset password');
    });

    it('submits and shows success message with role="status"', async () => {
      const resetSpy = vi.spyOn(authService, 'resetPassword').mockResolvedValue({});

      render(
        <MemoryRouter>
          <ForgotPasswordPage />
        </MemoryRouter>
      );

      await userEvent.type(screen.getByLabelText(/^Email Address$/i), 'reset@example.com');
      fireEvent.click(screen.getByRole('button', { name: /Send Reset Link/i }));

      await waitFor(() => {
        expect(resetSpy).toHaveBeenCalledWith('reset@example.com');
      });

      const status = await screen.findByRole('status');
      expect(status).toHaveTextContent('Password reset link sent to your email');
    });
  });

  describe('4. ResetPasswordPage (/reset-password)', () => {
    it('shows expired / invalid alert when no active session exists after loading', async () => {
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: { session: null },
        error: null,
      });
      vi.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      } as any);

      render(
        <MemoryRouter>
          <AuthProvider>
            <ResetPasswordPage />
          </AuthProvider>
        </MemoryRouter>
      );

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent('This reset link is invalid or has expired. Please request a new one.');
      expect(screen.getByRole('link', { name: /Request New Reset Link/i })).toHaveAttribute('href', '/forgot-password');
    });

    it('renders form when session exists and validates mismatch', async () => {
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: { session: { access_token: 'valid' } as any },
        error: null,
      });
      vi.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      } as any);

      render(
        <MemoryRouter>
          <AuthProvider>
            <ResetPasswordPage />
          </AuthProvider>
        </MemoryRouter>
      );

      const newPassInput = await screen.findByLabelText(/^New Password$/i);
      const confirmPassInput = screen.getByLabelText(/^Confirm Password$/i);

      await userEvent.type(newPassInput, 'Password123');
      await userEvent.type(confirmPassInput, 'Mismatch999');

      fireEvent.click(screen.getByRole('button', { name: /Update Password/i }));

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent('Passwords do not match');
    });

    it('updates password, signs out locally, and navigates to /login with status message', async () => {
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: { session: { access_token: 'valid' } as any },
        error: null,
      });
      vi.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      } as any);
      const updateSpy = vi.spyOn(authService, 'updatePassword').mockResolvedValue({ user: null });
      const signOutSpy = vi.spyOn(supabase.auth, 'signOut').mockResolvedValue({ error: null });

      render(
        <MemoryRouter initialEntries={['/reset-password']}>
          <AuthProvider>
            <Routes>
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/login" element={<LoginPage />} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      const newPassInput = await screen.findByLabelText(/^New Password$/i);
      const confirmPassInput = screen.getByLabelText(/^Confirm Password$/i);

      await userEvent.type(newPassInput, 'FreshPassword123');
      await userEvent.type(confirmPassInput, 'FreshPassword123');

      fireEvent.click(screen.getByRole('button', { name: /Update Password/i }));

      await waitFor(() => {
        expect(updateSpy).toHaveBeenCalledWith('FreshPassword123');
        expect(signOutSpy).toHaveBeenCalledWith({ scope: 'local' });
      });

      // Redirected to /login and status message is shown
      const status = await screen.findByRole('status');
      expect(status).toHaveTextContent('Password updated successfully! Please login with your new password.');
    });
  });

  describe('5. CorporateLoginPage (/corporate-login)', () => {
    it('renders with exact Flutter copy and field labels', () => {
      render(
        <MemoryRouter>
          <CorporateLoginPage />
        </MemoryRouter>
      );

      expect(screen.getByRole('heading', { name: 'Corporate Portal' })).toBeInTheDocument();
      expect(screen.getByText('Enter your admin credentials to access workforce intelligence')).toBeInTheDocument();

      expect(screen.getByLabelText(/^Corporate Email$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Admin Password$/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^Access Intelligence$/i })).toBeInTheDocument();
    });

    it('validates empty fields with "Please enter corporate email and password"', async () => {
      render(
        <MemoryRouter>
          <CorporateLoginPage />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByRole('button', { name: /^Access Intelligence$/i }));

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent('Please enter corporate email and password');
    });

    it('Outcome A: Admin verified -> navigates to /corporate-dashboard and passes trimmed lowercase email', async () => {
      vi.spyOn(authService, 'signIn').mockResolvedValue({ user: { id: 'admin-1' } } as any);
      const getAdminSpy = vi.spyOn(apiService, 'getCorporateAdmin').mockResolvedValue({
        company_name: 'Tata Consultancy Services',
      });

      render(
        <MemoryRouter initialEntries={['/corporate-login']}>
          <Routes>
            <Route path="/corporate-login" element={<CorporateLoginPage />} />
            <Route path="/corporate-dashboard" element={<div data-testid="corp-dash">Corp Dashboard</div>} />
            <Route path="/dashboard" element={<div data-testid="wrong-dash">Standard Dashboard</div>} />
          </Routes>
        </MemoryRouter>
      );

      await userEvent.type(screen.getByLabelText(/^Corporate Email$/i), '  ADMIN@TCS.COM  ');
      await userEvent.type(screen.getByLabelText(/^Admin Password$/i), 'SecretAdmin123');

      fireEvent.click(screen.getByRole('button', { name: /^Access Intelligence$/i }));

      await waitFor(() => {
        expect(getAdminSpy).toHaveBeenCalledWith('admin@tcs.com');
        expect(screen.getByTestId('corp-dash')).toBeInTheDocument();
      });

      // Crucial: Must NEVER route to /dashboard!
      expect(screen.queryByTestId('wrong-dash')).not.toBeInTheDocument();
    });

    it('Outcome B: Not in admin table (null) -> logs out and shows "Standard Account Detected" dialog', async () => {
      vi.spyOn(authService, 'signIn').mockResolvedValue({ user: { id: 'standard-user' } } as any);
      vi.spyOn(apiService, 'getCorporateAdmin').mockResolvedValue(null);
      const logoutSpy = vi.spyOn(authService, 'logout').mockResolvedValue();

      render(
        <MemoryRouter>
          <CorporateLoginPage />
        </MemoryRouter>
      );

      await userEvent.type(screen.getByLabelText(/^Corporate Email$/i), 'standard@employee.com');
      await userEvent.type(screen.getByLabelText(/^Admin Password$/i), 'pwd123');

      fireEvent.click(screen.getByRole('button', { name: /^Access Intelligence$/i }));

      await waitFor(() => {
        expect(logoutSpy).toHaveBeenCalled();
      });

      const dialog = await screen.findByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Standard Account Detected' })).toBeInTheDocument();
      expect(
        screen.getByText(/This email is not registered as a Corporate Admin\. Please login as a normal user to access your personal dashboard\./i)
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Back to Login' })).toBeInTheDocument();
    });

    it('Outcome C: Verification query throws -> logs out and shows error alert (NOT standard account dialog)', async () => {
      vi.spyOn(authService, 'signIn').mockResolvedValue({ user: { id: 'user-err' } } as any);
      vi.spyOn(apiService, 'getCorporateAdmin').mockRejectedValue(new Error('Network offline or RLS denied'));
      const logoutSpy = vi.spyOn(authService, 'logout').mockResolvedValue();

      render(
        <MemoryRouter>
          <CorporateLoginPage />
        </MemoryRouter>
      );

      await userEvent.type(screen.getByLabelText(/^Corporate Email$/i), 'error@company.com');
      await userEvent.type(screen.getByLabelText(/^Admin Password$/i), 'pwd123');

      fireEvent.click(screen.getByRole('button', { name: /^Access Intelligence$/i }));

      await waitFor(() => {
        expect(logoutSpy).toHaveBeenCalled();
      });

      // Crucial: Must show error message alert, NOT the standard user dialog!
      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent('Could not verify corporate access. Please try again.');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('6. Route Guarding Test: /corporate-login is NOT wrapped in PublicOnlyRoute', () => {
    it('with mocked admin, after submit on /corporate-login the final destination is /corporate-dashboard and never /dashboard', async () => {
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: { session: null },
        error: null,
      });
      vi.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      } as any);

      vi.spyOn(authService, 'signIn').mockResolvedValue({ user: { id: 'admin-123' } } as any);
      vi.spyOn(apiService, 'getCorporateAdmin').mockResolvedValue({ company_name: 'Infosys' });

      window.history.pushState({}, '', '/corporate-login');
      render(<App />);

      const emailInput = await screen.findByLabelText(/^Corporate Email$/i);
      const passInput = screen.getByLabelText(/^Admin Password$/i);

      await userEvent.type(emailInput, 'admin@infosys.com');
      await userEvent.type(passInput, 'Secret123');

      fireEvent.click(screen.getByRole('button', { name: /^Access Intelligence$/i }));

      await waitFor(() => {
        expect(window.location.pathname).toBe('/corporate-dashboard');
      });

      // Verify that at no point did it redirect to standard /dashboard
      expect(window.location.pathname).not.toBe('/dashboard');
    });
  });
});
