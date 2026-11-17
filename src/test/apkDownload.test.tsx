import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Hero } from '../components/Hero';
import { Footer } from '../components/Footer';
import { MemoryRouter } from 'react-router-dom';
import * as appDownloadModule from '../config/appDownload';

describe('Android APK Download Button & Config', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('getApkDownloadHref adds download=MoneyMapper.apk, preserves token, and does not duplicate on repeated calls', () => {
    const firstHref = appDownloadModule.getApkDownloadHref();
    expect(firstHref).toContain('download=MoneyMapper.apk');
    expect(firstHref).toContain('token=');

    const secondHref = appDownloadModule.getApkDownloadHref();
    expect(secondHref).toBe(firstHref);

    // Verify count of download parameter in query string
    const url = new URL(firstHref);
    expect(url.searchParams.getAll('download')).toHaveLength(1);
    expect(url.searchParams.get('download')).toBe('MoneyMapper.apk');
  });

  it('Hero renders the APK link with correct href, download attribute, and helper text', () => {
    render(<Hero />);

    const downloadBtn = screen.getByRole('link', { name: /Download Android App \(APK\)/i });
    expect(downloadBtn).toBeInTheDocument();
    expect(downloadBtn).toHaveAttribute('href');
    expect(downloadBtn.getAttribute('href')).toContain('download=MoneyMapper.apk');
    expect(downloadBtn.getAttribute('href')).toContain('token=');
    expect(downloadBtn).toHaveAttribute('download', 'MoneyMapper.apk');
    expect(downloadBtn).toHaveAttribute('id', 'hero-download-apk-btn');

    expect(
      screen.getByText('Android only. If asked, allow “Install unknown apps” for your browser.')
    ).toBeInTheDocument();
  });

  it('Hero does not render button or helper line when APK_DOWNLOAD_URL is empty', async () => {
    vi.resetModules();
    vi.doMock('../config/appDownload', () => ({
      APK_DOWNLOAD_URL: '',
      APK_FILE_NAME: 'MoneyMapper.apk',
      PLAY_STORE_URL: 'https://play.google.com/store/apps/details?id=com.moneymapper&hl=en',
      getApkDownloadHref: () => '',
    }));

    const { Hero: DynamicHero } = await import('../components/Hero');
    render(<DynamicHero />);

    expect(
      screen.queryByRole('link', { name: /Download Android App \(APK\)/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Install unknown apps/)
    ).not.toBeInTheDocument();

    vi.doUnmock('../config/appDownload');
  });

  it('Footer renders Download App (APK) link in Product column', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    const footerApkLink = screen.getByRole('link', { name: /Download App \(APK\)/i });
    expect(footerApkLink).toBeInTheDocument();
    expect(footerApkLink).toHaveAttribute('download', 'MoneyMapper.apk');
    expect(footerApkLink.getAttribute('href')).toContain('download=MoneyMapper.apk');
  });

  it('Hero renders Google Play badge link with target="_blank", rel containing "noopener", and correct alt', () => {
    render(<Hero />);

    const playStoreLink = screen.getByRole('link', { name: /Get MoneyMapper on Google Play/i });
    expect(playStoreLink).toBeInTheDocument();
    expect(playStoreLink).toHaveAttribute('href', appDownloadModule.PLAY_STORE_URL);
    expect(playStoreLink).toHaveAttribute('target', '_blank');
    expect(playStoreLink.getAttribute('rel')).toContain('noopener');

    const badgeImgs = screen.getAllByAltText('Get it on Google Play');
    expect(badgeImgs[0]).toBeInTheDocument();
  });

  it('Footer renders Google Play badge link and trademark line', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    const footerPlayLink = document.getElementById('footer-google-play-btn');
    expect(footerPlayLink).toBeInTheDocument();
    expect(footerPlayLink).toHaveAttribute('href', appDownloadModule.PLAY_STORE_URL);
    expect(footerPlayLink).toHaveAttribute('target', '_blank');
    expect(footerPlayLink?.getAttribute('rel')).toContain('noopener');

    expect(
      screen.getByText('Google Play and the Google Play logo are trademarks of Google LLC.')
    ).toBeInTheDocument();
  });
});
