import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { getLogoUrl, getDomainFromLogoUrl, getFallbackColor, normalizeName } from '../utils/brandingUtils';
import { BrandLogo } from '../components/market/BrandLogo';

describe('brandingUtils', () => {
  it('normalizes company names correctly', () => {
    expect(normalizeName('HDFC Bank Limited')).toBe('hdfcbank');
    expect(normalizeName('TCS.NS')).toBe('tcs');
    expect(normalizeName('Reliance Industries Ltd.')).toBe('relianceindustries.');
  });

  it('matches mapped domains with highest length precedence', () => {
    const url = getLogoUrl('HDFC Bank Limited');
    expect(url).toContain('https://img.logo.dev/hdfcbank.com');
  });

  it('falls back to ticker.com for valid tickers without spaces', () => {
    const url = getLogoUrl('INFY');
    expect(url).toContain('https://img.logo.dev/infosys.com'); // in map
    const customTicker = getLogoUrl('XYZT');
    expect(customTicker).toContain('https://img.logo.dev/xyzt.com');
  });

  it('returns null for unmapped multi-word names', () => {
    expect(getLogoUrl('Foo Bar Baz Qux Fund')).toBeNull();
  });

  it('extracts domain correctly from logo URL', () => {
    expect(getDomainFromLogoUrl('https://img.logo.dev/reliance.com?token=123')).toBe('reliance.com');
    expect(getDomainFromLogoUrl(null)).toBeNull();
  });

  it('returns fallback colors deterministically', () => {
    const c1 = getFallbackColor('TCS');
    const c2 = getFallbackColor('TCS');
    expect(c1).toBe(c2);
  });
});

describe('BrandLogo component', () => {
  it('renders initial image from logo.dev', () => {
    render(<BrandLogo name="RELIANCE" size={36} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', expect.stringContaining('reliance.com'));
  });

  it('falls back to Google favicon when logo.dev image fails', () => {
    render(<BrandLogo name="RELIANCE" size={36} />);
    const img = screen.getByRole('img');
    fireEvent.error(img);
    expect(img).toHaveAttribute('src', expect.stringContaining('google.com/s2/favicons'));
  });

  it('falls back to letter initial when Google favicon also fails', () => {
    render(<BrandLogo name="RELIANCE" size={36} />);
    const img = screen.getByRole('img');
    // First error triggers Google fallback
    fireEvent.error(img);
    // Second error triggers letter fallback
    fireEvent.error(img);
    expect(screen.getByText('R')).toBeInTheDocument();
  });

  it('renders letter initial directly when no logo URL exists', () => {
    render(<BrandLogo name="Unknown Company Scheme Long Name" size={36} />);
    expect(screen.getByText('U')).toBeInTheDocument();
  });
});
