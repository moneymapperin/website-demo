import { useEffect, useState } from 'react';
import { navigateTo } from '../lib/navigation';
import { Menu, X } from 'lucide-react';
import logoImg from '../assets/logo.png';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  const navLinks = [
    { label: 'Home', sectionId: 'home' },
    { label: 'Features', sectionId: 'features' },
    { label: 'Insights', sectionId: 'insights' },
    { label: 'Pricing', sectionId: 'pricing' },
    { label: 'About Us', sectionId: 'about' },
  ];

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;

    const sections = navLinks
      .map(({ sectionId }) => document.getElementById(sectionId))
      .filter((section): section is HTMLElement => section !== null);
    let observer: IntersectionObserver | undefined;
    const observeSections = () => {
      observer?.disconnect();
      observer = new IntersectionObserver(
        (entries) => {
        if (window.scrollY <= 0) {
          setActiveSection('home');
          return;
        }

        const visibleSections = entries.filter((entry) => entry.isIntersecting);
        if (visibleSections.length === 0) return;

        const activeEntry = visibleSections.reduce((closest, entry) =>
          Math.abs(entry.boundingClientRect.top - window.innerHeight * 0.425) <
          Math.abs(closest.boundingClientRect.top - window.innerHeight * 0.425)
            ? entry
            : closest
        );
        setActiveSection(activeEntry.target.id);
        },
        {
          rootMargin: `-${Math.round(window.innerHeight * 0.4)}px 0px -${Math.round(window.innerHeight * 0.55)}px 0px`,
        }
      );
      sections.forEach((section) => observer?.observe(section));
    };

    observeSections();
    window.addEventListener('resize', observeSections);
    return () => {
      window.removeEventListener('resize', observeSections);
      observer?.disconnect();
    };
  }, []);

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    setMobileMenuOpen(false);

    const scroll = () => {
      if (sectionId === 'home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}#${sectionId}`);
    };

    if (window.location.pathname !== '/') {
      navigateTo('/');
      if (typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(() => window.requestAnimationFrame(scroll));
      } else {
        window.setTimeout(scroll, 100);
      }
      return;
    }

    scroll();
  };

  const sectionLinkClass = (isActive: boolean, mobile = false) =>
    `group relative inline-flex ${mobile ? 'w-full py-2 text-base' : 'py-2 text-sm'} font-medium transition-all duration-200 cursor-pointer focus:outline-none after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:bg-gradient-to-r after:from-brand-purple after:to-pink-500 after:transition-all after:duration-200 ${
      isActive
        ? 'text-white drop-shadow-[0_0_8px_rgba(168,85,247,0.6)] after:w-full'
        : 'text-white/70 hover:text-white after:w-0 hover:after:w-full focus-visible:after:w-full'
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
    <header className="sticky top-0 z-40 w-full bg-[#0b0a14]/80 backdrop-blur-md border-b border-white/[0.06] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Left: Brand Logo & Name */}
        <button
          type="button"
          onClick={() => scrollToSection('home')}
          aria-label="MoneyMapper Home"
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          <img
            src={logoImg}
            alt="MoneyMapper"
            className="h-9 w-9 object-contain group-hover:scale-105 transition-transform duration-200"
          />
          <span className="text-xl font-bold tracking-tight text-white group-hover:text-white/90">
            MoneyMapper
          </span>
        </button>

        {/* Center: Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8 lg:gap-10">
          {navLinks.map((link) => (
            <button
              key={link.sectionId}
              onClick={() => scrollToSection(link.sectionId)}
              aria-current={activeSection === link.sectionId ? 'location' : undefined}
              className={sectionLinkClass(activeSection === link.sectionId)}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Right: Auth Action Buttons */}
        <div className="hidden sm:flex items-center gap-3">
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
            <button
              key={link.sectionId}
              onClick={() => scrollToSection(link.sectionId)}
              aria-current={activeSection === link.sectionId ? 'location' : undefined}
              className={`${sectionLinkClass(activeSection === link.sectionId, true)} text-left`}
            >
              {link.label}
            </button>
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
    </header>
  );
};

export default Navbar;

