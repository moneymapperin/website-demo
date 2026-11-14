import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { navigateTo } from '../lib/navigation';
import { Menu, X } from 'lucide-react';
import logoImg from '../assets/logo.png';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Home', path: '/', end: true },
    { label: 'Features', path: '/features', end: false },
    { label: 'Insights', path: '/explore-insights', end: false },
    { label: 'Pricing', path: '/pricing', end: false },
    { label: 'About Us', path: '/about', end: false },
  ];

  const sectionLinkClass = (isActive: boolean, mobile = false) =>
    `group relative inline-flex ${mobile ? 'w-full py-2 text-base' : 'py-2 text-sm'} font-medium transition-all duration-200 cursor-pointer focus:outline-none focus-visible:outline-none no-underline hover:no-underline focus:no-underline after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:bg-gradient-to-r after:from-brand-purple after:to-pink-500 after:transition-all after:duration-200 ${isActive
      ? 'text-white drop-shadow-[0_0_8px_rgba(168,85,247,0.6)] after:w-full no-underline'
      : 'text-white/70 hover:text-white after:w-0 hover:after:w-full focus-visible:after:w-full no-underline'
    }`;

  const handleLoginClick = () => {
    setMobileMenuOpen(false);
    navigateTo('/login');
  };

  const handleGetStartedClick = () => {
    setMobileMenuOpen(false);
    navigateTo('/register');
  };

  return (
    <>
      <div className="fixed top-0 inset-x-0 z-40">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left: Brand Logo & Name */}
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="MoneyMapper Home"
            className="flex items-center gap-3 cursor-pointer select-none group shrink-0"
          >
            <img
              src={logoImg}
              alt="MoneyMapper"
              className="h-9 w-9 object-contain group-hover:scale-105 transition-transform duration-200"
            />
            <span className="text-xl font-bold tracking-tight text-white group-hover:text-white/90">
              MoneyMapper
            </span>
          </Link>

          {/* Center: Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 lg:gap-10 mx-4 lg:mx-8">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.end}
                className={({ isActive }) => sectionLinkClass(isActive)}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Right: Auth Action Buttons */}
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            <button
              id="nav-login-btn"
              onClick={handleLoginClick}
              className="px-5 py-2 text-sm font-medium text-white/90 bg-[#161426] hover:bg-[#1f1b36] hover:text-white border border-white/10 hover:border-white/25 rounded-full transition-all duration-150 focus:outline-none cursor-pointer"
            >
              Login
            </button>
            <button
              id="nav-get-started-btn"
              onClick={handleGetStartedClick}
              className="px-5 py-2 text-sm font-medium text-white bg-brand-gradient hover:opacity-95 active:scale-95 rounded-full shadow-lg shadow-brand-purple/25 transition-all duration-150 focus:outline-none cursor-pointer"
            >
              Get Started
            </button>
          </div>

          {/* Mobile Hamburger Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-white/70 hover:text-white rounded-lg focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0e0c1a] border-b border-white/10 px-6 py-4 space-y-3 animate-fade-in">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.end}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) => `${sectionLinkClass(isActive, true)} text-left`}
              >
                {link.label}
              </NavLink>
            ))}
            <div className="pt-4 border-t border-white/10 flex flex-col gap-2.5">
              <button
                onClick={handleLoginClick}
                className="w-full py-2.5 text-center text-sm font-medium text-white/90 bg-[#161426] border border-white/10 rounded-full"
              >
                Login
              </button>
              <button
                onClick={handleGetStartedClick}
                className="w-full py-2.5 text-center text-sm font-medium text-white bg-brand-gradient rounded-full shadow-md shadow-brand-purple/20"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Spacer so page content does not hide under fixed bar */}
      <div aria-hidden="true" className="h-16" />
    </>
  );
};

export default Navbar;