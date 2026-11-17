import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Footer } from '../components/Footer';

describe('Footer Contact Us Dropdown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Contact Us as a toggle button instead of a plain link and removes old separate Email item', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    // Careers is removed from Company column
    expect(screen.queryByText('Careers')).toBeNull();

    // Old standalone list item "Email: info@moneymapper.in" is removed
    expect(screen.queryByText('Email: info@moneymapper.in')).toBeNull();

    // Contact Us button exists
    const contactBtn = screen.getByRole('button', { name: /contact us/i });
    expect(contactBtn).toBeInTheDocument();
    expect(contactBtn).toHaveAttribute('aria-expanded', 'false');
    expect(contactBtn).toHaveAttribute('aria-controls', 'footer-contact-panel');

    // Panel is closed initially
    expect(document.getElementById('footer-contact-panel')).toBeNull();
  });

  it('toggles dropdown panel on button click with email link', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    const contactBtn = screen.getByRole('button', { name: /contact us/i });

    // Open dropdown
    fireEvent.click(contactBtn);
    expect(contactBtn).toHaveAttribute('aria-expanded', 'true');

    const panel = document.getElementById('footer-contact-panel');
    expect(panel).toBeInTheDocument();

    const emailLink = screen.getByRole('link', { name: 'info@moneymapper.in' });
    expect(emailLink).toBeInTheDocument();
    expect(emailLink).toHaveAttribute('href', 'mailto:info@moneymapper.in');

    // Toggle closed on second click
    fireEvent.click(contactBtn);
    expect(contactBtn).toHaveAttribute('aria-expanded', 'false');
    expect(document.getElementById('footer-contact-panel')).toBeNull();
  });

  it('closes panel when pressing Escape key', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    const contactBtn = screen.getByRole('button', { name: /contact us/i });
    fireEvent.click(contactBtn);
    expect(document.getElementById('footer-contact-panel')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(document.getElementById('footer-contact-panel')).toBeNull();
    expect(contactBtn).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes panel when clicking outside', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    const contactBtn = screen.getByRole('button', { name: /contact us/i });
    fireEvent.click(contactBtn);
    expect(document.getElementById('footer-contact-panel')).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(document.getElementById('footer-contact-panel')).toBeNull();
    expect(contactBtn).toHaveAttribute('aria-expanded', 'false');
  });
});
