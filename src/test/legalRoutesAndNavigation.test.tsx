import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from '../App';
import { BusinessSection } from '../components/BusinessSection';

vi.mock('../services/apiService', () => ({
  apiService: {
    getSubscriptionDetails: vi.fn().mockResolvedValue(null),
    getInsightsFeed: vi.fn().mockResolvedValue([]),
    getGoldRates: vi.fn().mockResolvedValue([]),
    clearCache: vi.fn(),
  },
}));

describe('Clean SPA Routes & SEO Redirects', () => {
  it('renders clean route /faq directly', async () => {
    render(<App initialEntries={['/faq']} />);
    await waitFor(() => {
      expect(screen.getByText(/questions,/i)).toBeInTheDocument();
      expect(screen.getByText(/is moneymapper a sebi-registered/i)).toBeInTheDocument();
    });
  });

  it('renders clean route /business-details directly', async () => {
    render(<App initialEntries={['/business-details']} />);
    await waitFor(() => {
      expect(screen.getByText(/moneymapper for business/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /request full details & demo/i })).toBeInTheDocument();
    });
  });

  it('renders clean route /score-story directly', async () => {
    render(<App initialEntries={['/score-story']} />);
    await waitFor(() => {
      expect(screen.getByText(/the story behind your score/i)).toBeInTheDocument();
    });
  });

  it('renders clean route /privacy-policy directly', async () => {
    render(<App initialEntries={['/privacy-policy']} />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /privacy policy/i })).toBeInTheDocument();
    });
  });

  it('renders clean route /terms-and-conditions directly', async () => {
    render(<App initialEntries={['/terms-and-conditions']} />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /terms and conditions/i })).toBeInTheDocument();
    });
  });

  it('renders clean route /cookie-policy directly', async () => {
    render(<App initialEntries={['/cookie-policy']} />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /cookie policy/i })).toBeInTheDocument();
    });
  });

  it('renders clean route /grievance-redressal-policy directly', async () => {
    render(<App initialEntries={['/grievance-redressal-policy']} />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /grievance redressal policy/i })).toBeInTheDocument();
    });
  });

  it('renders clean route /disclaimer-and-data-processing-consent directly', async () => {
    render(<App initialEntries={['/disclaimer-and-data-processing-consent']} />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /disclaimer & data processing consent/i })).toBeInTheDocument();
    });
  });

  it('renders clean route /delete_my_data directly', async () => {
    render(<App initialEntries={['/delete_my_data']} />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /data deletion request/i })).toBeInTheDocument();
    });
  });

  it('redirects old .html and alias routes to clean routes without full page reload', async () => {
    const { unmount: u1 } = render(<App initialEntries={['/faq.html']} />);
    await waitFor(() => {
      expect(screen.getByText(/questions,/i)).toBeInTheDocument();
    });
    u1();

    const { unmount: u2 } = render(<App initialEntries={['/terms-and-conditions.html']} />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /terms and conditions/i })).toBeInTheDocument();
    });
    u2();

    const { unmount: u3 } = render(<App initialEntries={['/privacy-policy.html']} />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /privacy policy/i })).toBeInTheDocument();
    });
    u3();

    const { unmount: u4 } = render(<App initialEntries={['/business-details.html']} />);
    await waitFor(() => {
      expect(screen.getByText(/moneymapper for business/i)).toBeInTheDocument();
    });
    u4();

    const { unmount: u5 } = render(<App initialEntries={['/moneymapper-score-story.html']} />);
    await waitFor(() => {
      expect(screen.getByText(/the story behind your score/i)).toBeInTheDocument();
    });
    u5();

    const { unmount: u6 } = render(<App initialEntries={['/delete_my_data.html']} />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /data deletion request/i })).toBeInTheDocument();
    });
    u6();
  });

  it('renders BusinessSection with Corporate login button and hides Full business details button when flag is false', () => {
    render(
      <MemoryRouter>
        <BusinessSection />
      </MemoryRouter>
    );
    expect(screen.getByRole('button', { name: /corporate login/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /full business details/i })).not.toBeInTheDocument();
  });
});
