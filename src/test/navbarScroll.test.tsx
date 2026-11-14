import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Navbar } from '../components/Navbar';

describe('Navbar Layout & Mobile Menu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders fixed outer div, full-width wrapper, and spacer element without <header>', () => {
    const { container } = render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    // Header tag is not used (avoids global legal-pages.css header padding)
    expect(container.querySelector('header')).toBeNull();

    // Outer fixed div
    const fixedBar = container.querySelector('div.fixed.top-0.inset-x-0.z-40');
    expect(fixedBar).toBeInTheDocument();

    // Inner navbar wrapper has w-full and flex classes
    const wrapper = container.querySelector('div.max-w-7xl');
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveClass('w-full', 'flex', 'items-center', 'justify-between', 'h-16');

    // Spacer div with matching height
    const spacer = container.querySelector('div[aria-hidden="true"]');
    expect(spacer).toBeInTheDocument();
    expect(spacer).toHaveClass('h-16');
  });

  it('renders logo, navigation links, and action buttons with overlap prevention classes', () => {
    const { container } = render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    expect(screen.getByText('MoneyMapper')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Features')).toBeInTheDocument();
    expect(screen.getByText('Insights')).toBeInTheDocument();
    expect(screen.getByText('Pricing')).toBeInTheDocument();
    expect(screen.getByText('About Us')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Get Started' })).toBeInTheDocument();

    // Overlap prevention classes:
    const logoLink = screen.getByLabelText('MoneyMapper Home');
    expect(logoLink).toHaveClass('shrink-0');

    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('mx-4', 'lg:mx-8');

    const buttonGroup = container.querySelector('#nav-login-btn')?.parentElement;
    expect(buttonGroup).toHaveClass('shrink-0');
  });

  it('toggles mobile menu when hamburger button is clicked', () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    const toggleBtn = screen.getByLabelText('Toggle Navigation Menu');
    expect(toggleBtn).toBeInTheDocument();

    // Open mobile menu
    fireEvent.click(toggleBtn);

    // Now mobile links are present
    const mobileLinks = screen.getAllByRole('link', { name: 'Home' });
    expect(mobileLinks.length).toBeGreaterThan(1);
  });
});
