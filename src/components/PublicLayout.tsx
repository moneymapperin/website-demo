import React, { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

const HASH_ROUTE_MAP: Record<string, string> = {
  pricing: '/pricing',
  features: '/features',
  insights: '/explore-insights',
  about: '/about',
  home: '/',
};

export const PublicLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const rawHash = (location.hash || '').replace(/^#/, '').toLowerCase();
    if (rawHash && HASH_ROUTE_MAP[rawHash]) {
      navigate(HASH_ROUTE_MAP[rawHash], { replace: true });
      return;
    }

    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  }, [location.pathname, location.hash, navigate]);

  return (
    <div className="min-h-screen bg-background text-white flex flex-col selection:bg-brand-purple/30 selection:text-white">
      {/* Sticky Glassmorphic Navbar */}
      <Navbar />

      {/* Page Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default PublicLayout;

