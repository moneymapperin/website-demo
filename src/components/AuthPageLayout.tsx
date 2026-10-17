import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, BarChart2, Shield, PiggyBank } from 'lucide-react';
import logoImg from '../assets/app/log_3d_hd.png';

interface AuthPageLayoutProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  maxWidth?: 'sm' | 'md' | 'lg' | '4xl' | '5xl';
  children: React.ReactNode;
}

export const AuthPageLayout: React.FC<AuthPageLayoutProps> = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  maxWidth = 'md',
  children,
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  const maxWidthClass =
    maxWidth === '5xl'
      ? 'max-w-5xl'
      : maxWidth === '4xl'
      ? 'max-w-4xl'
      : maxWidth === 'lg'
      ? 'max-w-2xl'
      : maxWidth === 'sm'
      ? 'max-w-sm'
      : 'max-w-md';

  return (
    <div className="min-h-screen bg-[#04081E] text-white flex flex-col justify-between relative overflow-x-hidden selection:bg-[#0091FF]/30 selection:text-white py-6 px-4 sm:px-6">
      {/* Decorative Electric Neon Blue Curved Wave Lines mirroring the photo */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden select-none z-0">
        <svg
          className="absolute inset-0 w-full h-full opacity-65"
          viewBox="0 0 1440 900"
          preserveAspectRatio="none"
          fill="none"
        >
          {/* Main Upper Electric Blue Wave (runs behind logo/branding) */}
          <path
            d="M -100 240 C 250 170, 500 280, 800 200 C 1100 120, 1320 250, 1550 190"
            stroke="#0091FF"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="filter drop-shadow-[0_0_14px_#0091FF]"
          />
          {/* Secondary Cyan Accent Wave */}
          <path
            d="M -100 270 C 280 200, 520 300, 820 220 C 1120 140, 1310 270, 1550 210"
            stroke="#00F0FF"
            strokeWidth="1.2"
            strokeLinecap="round"
            className="opacity-40 filter drop-shadow-[0_0_10px_#00F0FF]"
          />
          {/* Bottom Electric Blue Wave */}
          <path
            d="M -50 780 C 260 850, 520 670, 860 780 C 1200 880, 1370 710, 1500 750"
            stroke="#0091FF"
            strokeWidth="2"
            strokeLinecap="round"
            className="opacity-50 filter drop-shadow-[0_0_12px_#0091FF]"
          />
        </svg>

        {/* Ambient radial glows */}
        <div className="absolute top-1/6 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-[#0091FF]/12 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Top Header / Branding Bar */}
      <header className="relative z-10 w-full max-w-5xl mx-auto mb-5 sm:mb-6">
        <div className="relative flex items-center justify-center">
          {showBack && (
            <button
              type="button"
              onClick={handleBack}
              className="absolute left-0 top-1 p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1.5 text-xs font-semibold"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}

          {/* Centered Logo & Branding matching Image photo */}
          <div className="flex flex-col items-center text-center">
            {/* 3D Glowing Emblem */}
            <div className="relative mb-1.5 flex items-center justify-center">
              <div className="absolute w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#0091FF]/35 blur-xl scale-125 pointer-events-none" />
              <img
                src={logoImg}
                alt="MoneyMapper Logo"
                className="w-14 h-14 sm:w-16 sm:h-16 object-contain relative z-10 drop-shadow-[0_0_18px_rgba(0,145,255,0.8)] select-none"
              />
            </div>

            {/* Brand Title & Subtitle */}
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {title || 'MoneyMapper'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium mt-0.5">
              {subtitle || 'Your Personal Money Manager'}
            </p>

            {/* 5 Financial Pillars Circular Icons Row with vibrant colors matching photo */}
            <div className="flex items-center justify-center gap-3 sm:gap-5 md:gap-7 mt-4 select-none">
              {/* 1. Income (Teal) */}
              <div className="flex flex-col items-center gap-1.5 group cursor-default">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#00C49F] flex items-center justify-center text-white shadow-[0_0_16px_rgba(0,196,159,0.5)] border border-white/20 transition-transform group-hover:scale-110">
                  <span className="text-base sm:text-lg font-black leading-none">₹</span>
                </div>
                <span className="text-[11px] sm:text-xs font-semibold text-white/90 tracking-wide">
                  Income
                </span>
              </div>

              {/* 2. Expenses (Rose/Pink) */}
              <div className="flex flex-col items-center gap-1.5 group cursor-default">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#F43F5E] flex items-center justify-center text-white shadow-[0_0_16px_rgba(244,63,94,0.5)] border border-white/20 transition-transform group-hover:scale-110">
                  <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="text-[11px] sm:text-xs font-semibold text-white/90 tracking-wide">
                  Expenses
                </span>
              </div>

              {/* 3. Investment (Blue) */}
              <div className="flex flex-col items-center gap-1.5 group cursor-default">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#0084FF] flex items-center justify-center text-white shadow-[0_0_16px_rgba(0,132,255,0.5)] border border-white/20 transition-transform group-hover:scale-110">
                  <BarChart2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="text-[11px] sm:text-xs font-semibold text-white/90 tracking-wide">
                  Investment
                </span>
              </div>

              {/* 4. Insurance (Purple) */}
              <div className="flex flex-col items-center gap-1.5 group cursor-default">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#8B5CF6] flex items-center justify-center text-white shadow-[0_0_16px_rgba(139,92,246,0.5)] border border-white/20 transition-transform group-hover:scale-110">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="text-[11px] sm:text-xs font-semibold text-white/90 tracking-wide">
                  Insurance
                </span>
              </div>

              {/* 5. Savings (Gold/Amber) */}
              <div className="flex flex-col items-center gap-1.5 group cursor-default">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#F59E0B] flex items-center justify-center text-white shadow-[0_0_16px_rgba(245,158,11,0.5)] border border-white/20 transition-transform group-hover:scale-110">
                  <PiggyBank className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="text-[11px] sm:text-xs font-semibold text-white/90 tracking-wide">
                  Savings
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area (supports side-by-side Web Login + QR on desktop, stacked on mobile) */}
      <main className="relative z-10 flex-1 flex items-center justify-center py-2 sm:py-4">
        <div className={`w-full ${maxWidthClass}`}>
          {children}
        </div>
      </main>

      {/* Website Footer */}
      <footer className="relative z-10 text-center py-3 text-[11px] text-slate-400/80 font-medium">
        © {new Date().getFullYear()} MoneyMapper. All rights reserved.
      </footer>
    </div>
  );
};
