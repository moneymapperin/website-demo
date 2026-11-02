import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { supabase } from '../lib/supabase';
import { AnnouncementPopup } from '../components/common/AnnouncementPopup';

function mockAnnouncementResponse(data: any, error: any = null) {
  vi.spyOn(supabase, 'from').mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data, error }),
          }),
        }),
      }),
    }),
  } as any);
}

describe('AnnouncementPopup Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('renders nothing when there is no active announcement', async () => {
    mockAnnouncementResponse(null);

    render(<AnnouncementPopup />);

    // Wait microtask tick
    await waitFor(() => {
      expect(screen.queryByTestId('announcement-popup')).not.toBeInTheDocument();
    });
  });

  it('renders title and sanitized HTML body, stripping <script> and onerror handlers', async () => {
    mockAnnouncementResponse({
      id: 'ann-sanitize-test-1',
      title: 'Diwali Special Offer! 🪔',
      html_content: `
        <div>
          <p>Get Flat ₹500 OFF with code <b>DIWALI500</b></p>
          <script>window.__hacked = true;</script>
          <img src="https://example.com/festive.jpg" onerror="window.__xss = true;" alt="Banner" />
        </div>
      `,
      is_active: true,
      show_once_per_user: false,
      created_at: new Date().toISOString(),
    });

    render(<AnnouncementPopup />);

    await waitFor(() => {
      expect(screen.getByTestId('announcement-popup')).toBeInTheDocument();
    });

    expect(screen.getByText('Diwali Special Offer! 🪔')).toBeInTheDocument();
    expect(screen.getByText(/Get Flat ₹500 OFF with code/)).toBeInTheDocument();

    const popupHtml = screen.getByTestId('announcement-popup').innerHTML;
    // Script tag must be stripped out
    expect(popupHtml).not.toContain('<script');
    expect((window as any).__hacked).toBeUndefined();

    // onerror event handler must be stripped out
    expect(popupHtml).not.toContain('onerror=');
    expect((window as any).__xss).toBeUndefined();
  });

  it('does not display popup if show_once_per_user is true and announcement_seen_{id} is in localStorage', async () => {
    const testId = 'ann-seen-test-2';
    localStorage.setItem(`announcement_seen_${testId}`, 'true');

    mockAnnouncementResponse({
      id: testId,
      title: 'Already Seen Announcement',
      html_content: '<p>You should not see this.</p>',
      is_active: true,
      show_once_per_user: true,
      created_at: new Date().toISOString(),
    });

    render(<AnnouncementPopup />);

    await waitFor(() => {
      expect(screen.queryByTestId('announcement-popup')).not.toBeInTheDocument();
    });
  });

  it('closes on "Okay" button click and sets seen key in localStorage when show_once_per_user is true', async () => {
    const testId = 'ann-okay-test-3';
    mockAnnouncementResponse({
      id: testId,
      title: 'Important Maintenance Notice',
      html_content: '<p>We are upgrading our servers tonight.</p>',
      is_active: true,
      show_once_per_user: true,
      created_at: new Date().toISOString(),
    });

    render(<AnnouncementPopup />);

    await waitFor(() => {
      expect(screen.getByTestId('announcement-popup')).toBeInTheDocument();
    });

    const okayButton = screen.getByRole('button', { name: /Okay/i });
    fireEvent.click(okayButton);

    await waitFor(() => {
      expect(screen.queryByTestId('announcement-popup')).not.toBeInTheDocument();
    });

    expect(localStorage.getItem(`announcement_seen_${testId}`)).toBe('true');
  });

  it('closes on "X" button click and sets seen key in localStorage when show_once_per_user is true', async () => {
    const testId = 'ann-close-x-test-4';
    mockAnnouncementResponse({
      id: testId,
      title: 'New Feature Available',
      html_content: '<p>Check out our brand new stock screener!</p>',
      is_active: true,
      show_once_per_user: true,
      created_at: new Date().toISOString(),
    });

    render(<AnnouncementPopup />);

    await waitFor(() => {
      expect(screen.getByTestId('announcement-popup')).toBeInTheDocument();
    });

    const closeButton = screen.getByLabelText('Close announcement');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByTestId('announcement-popup')).not.toBeInTheDocument();
    });

    expect(localStorage.getItem(`announcement_seen_${testId}`)).toBe('true');
  });
});
