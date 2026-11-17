import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { MemoryRouter } from 'react-router-dom';
import { Hero } from '../components/Hero';
import { IosInstallGuide, IosInstallBanner } from '../components/IosInstallGuide';

describe('PWA & iOS Web App Integration', () => {
  const originalUserAgent = navigator.userAgent;

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  it('manifest parses as JSON and contains required PWA fields', () => {
    const manifestPath = path.resolve(process.cwd(), 'public/manifest.webmanifest');
    expect(fs.existsSync(manifestPath)).toBe(true);

    const raw = fs.readFileSync(manifestPath, 'utf8');
    const parsed = JSON.parse(raw);

    expect(parsed.name).toBe('MoneyMapper');
    expect(parsed.start_url).toBe('/');
    expect(parsed.display).toBe('standalone');
    expect(Array.isArray(parsed.icons)).toBe(true);

    const sizes = parsed.icons.map((icon: { sizes: string }) => icon.sizes);
    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');
  });

  it('index.html contains manifest link and apple-mobile-web-app-capable meta', () => {
    const indexPath = path.resolve(process.cwd(), 'index.html');
    const html = fs.readFileSync(indexPath, 'utf8');

    expect(html).toContain('<link rel="manifest" href="/manifest.webmanifest" />');
    expect(html).toContain('<meta name="apple-mobile-web-app-capable" content="yes" />');
    expect(html).toContain('<meta name="apple-mobile-web-app-title" content="MoneyMapper" />');
    expect(html).toContain('<meta name="theme-color" content="#4f46e5" />');
    expect(html).toContain('viewport-fit=cover');
  });

  it('IosInstallGuide renders the 4 steps when open and calls onClose when Escape is pressed', () => {
    const onClose = vi.fn();
    const { rerender } = render(<IosInstallGuide isOpen={false} onClose={onClose} />);

    expect(screen.queryByTestId('ios-install-modal')).not.toBeInTheDocument();

    rerender(<IosInstallGuide isOpen={true} onClose={onClose} />);
    expect(screen.getByTestId('ios-install-modal')).toBeInTheDocument();
    expect(screen.getByText('Add MoneyMapper to your iPhone Home Screen')).toBeInTheDocument();

    expect(screen.getByText(/Open this website in Safari/i)).toBeInTheDocument();
    expect(screen.getByText(/Tap the Share button/i)).toBeInTheDocument();
    expect(screen.getByText(/Scroll down and tap/i)).toBeInTheDocument();
    expect(screen.getByText(/Tap “Add” in the top right corner/i)).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Landing page renders "Download web app for iOS" button directly after "Download APK" in DOM, and clicking opens guide', () => {
    render(<Hero />);

    const apkBtn = screen.getByRole('link', { name: /Download Android App \(APK\)/i });
    const iosBtn = screen.getByRole('button', { name: /Download web app for iOS/i });

    expect(apkBtn).toBeInTheDocument();
    expect(iosBtn).toBeInTheDocument();

    // Verify DOM sibling order: iOS button directly follows APK link
    expect(apkBtn.nextElementSibling).toBe(iosBtn);

    // Guide modal is initially closed
    expect(screen.queryByTestId('ios-install-modal')).not.toBeInTheDocument();

    // Click iOS button
    fireEvent.click(iosBtn);

    // Guide modal is now open
    expect(screen.getByTestId('ios-install-modal')).toBeInTheDocument();
    expect(screen.getByText('Add MoneyMapper to your iPhone Home Screen')).toBeInTheDocument();
  });

  it('Banner does not render when localStorage pwa_banner_dismissed is true', () => {
    localStorage.setItem('pwa_banner_dismissed', 'true');

    // Mock iPhone userAgent
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      configurable: true,
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <IosInstallBanner />
      </MemoryRouter>
    );

    expect(screen.queryByTestId('ios-install-banner')).not.toBeInTheDocument();
  });

  it('Banner renders on iOS device when not dismissed, and dismisses on close button click', () => {
    // Mock iPhone userAgent
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      configurable: true,
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <IosInstallBanner />
      </MemoryRouter>
    );

    expect(screen.getByTestId('ios-install-banner')).toBeInTheDocument();
    expect(screen.getByText('Install MoneyMapper on your iPhone')).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: /Close banner/i });
    fireEvent.click(closeBtn);

    expect(localStorage.getItem('pwa_banner_dismissed')).toBe('true');
    expect(screen.queryByTestId('ios-install-banner')).not.toBeInTheDocument();
  });
});
