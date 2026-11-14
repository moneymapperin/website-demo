import React, { useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import '../../styles/legal-pages.css';

export const LegalLayout: React.FC = () => {
  const location = useLocation();
  const { effectiveTheme } = useTheme();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (effectiveTheme === 'light') {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      } else {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      }
    }
  }, [effectiveTheme]);

  return (
    <div
      className="legal-page-shell"
      style={{
        backgroundColor: 'var(--bg)',
        color: 'var(--body-text)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <nav className="top-nav">
        <div className="top-nav-inner">
          <Link to="/" className="brand-link" aria-label="MoneyMapper Home">
            <img src="/src/assets/logo.png" alt="MoneyMapper" className="logo-img" />
            <span className="brand-name">MoneyMapper</span>
          </Link>
          <Link to="/" className="btn-home">Back to Home</Link>
        </div>
      </nav>

      <div style={{ flex: 1 }}>
        <Outlet />
      </div>

      <footer>&copy; 2026 Monezra Mapper Private Limited. All rights reserved.</footer>
    </div>
  );
};

export default LegalLayout;

