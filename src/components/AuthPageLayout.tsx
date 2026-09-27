import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface AuthPageLayoutProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  maxWidth?: 'sm' | 'md' | 'lg' | '4xl';
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
    maxWidth === '4xl'
      ? 'max-w-4xl'
      : maxWidth === 'lg'
      ? 'max-w-2xl'
      : maxWidth === 'sm'
      ? 'max-w-sm'
      : 'max-w-md';

  return (
    <div className="min-h-screen bg-[#09090B] text-white flex flex-col md:flex-row selection:bg-[#4F46E5]/30 selection:text-white">
      {/* Responsive Header / Brand Side Panel */}
      <div className="w-full md:w-5/12 lg:w-4/12 bg-gradient-to-br from-[#2E1065] via-[#4F46E5] to-[#6366F1] px-6 pt-10 pb-12 md:p-10 rounded-b-[28px] md:rounded-none shadow-xl relative overflow-hidden flex flex-col justify-between select-none shrink-0">
        {/* Subtle decorative glows */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 md:w-80 h-64 md:h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl md:max-w-none mx-auto md:mx-0 w-full flex flex-col items-start my-auto">
          {showBack && (
            <button
              type="button"
              onClick={handleBack}
              className="mb-4 md:mb-8 inline-flex items-center gap-2 text-white/90 hover:text-white text-sm font-medium transition-colors p-1 -ml-1 md:p-2 md:ml-0 rounded-lg hover:bg-white/10"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
          )}

          <span className="text-3xl lg:text-4xl font-black tracking-tight text-white drop-shadow-sm">
            MoneyMapper
          </span>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold md:font-black text-white mt-2 md:mt-4 tracking-wide leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-white/80 text-sm mt-1 md:mt-3 leading-relaxed max-w-xl">
              {subtitle}
            </p>
          )}

          {/* Desktop Features List */}
          <div className="hidden md:block space-y-3 pt-6 mt-6 border-t border-white/15 w-full">
            <div className="flex items-center gap-3 text-xs font-semibold text-white/90">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>5 Financial Pillars Evaluation</span>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold text-white/90">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>AI Assistant & Market Intelligence</span>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold text-white/90">
              <span className="w-2 h-2 rounded-full bg-indigo-300"></span>
              <span>256-bit Bank-Grade Encryption</span>
            </div>
          </div>
        </div>

        <div className="hidden md:block text-[11px] text-white/60 font-medium pt-8">
          © {new Date().getFullYear()} MoneyMapper. All rights reserved.
        </div>
      </div>

      {/* Main Content Form Area */}
      <main className="flex-1 px-4 py-8 md:p-12 lg:p-16 flex items-center justify-center min-h-[calc(100vh-140px)] md:min-h-screen">
        <div className={`w-full ${maxWidthClass} transition-all`}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default AuthPageLayout;
