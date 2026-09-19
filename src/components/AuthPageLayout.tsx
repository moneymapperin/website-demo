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
    <div className="min-h-screen bg-[#09090B] text-white flex flex-col selection:bg-[#4F46E5]/30 selection:text-white">
      {/* Premium Indigo-to-Violet Header mirroring Flutter AuthPageLayout */}
      <div className="w-full bg-gradient-to-br from-[#4F46E5] to-[#6366F1] px-6 pt-10 pb-12 rounded-b-[28px] shadow-xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto flex flex-col items-start">
          {showBack && (
            <button
              type="button"
              onClick={handleBack}
              className="mb-4 inline-flex items-center gap-2 text-white/90 hover:text-white text-sm font-medium transition-colors p-1 -ml-1 rounded-lg hover:bg-white/10"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
          )}

          <span className="text-3xl font-black tracking-tight text-white drop-shadow-sm">
            MoneyMapper
          </span>
          <h1 className="text-xl font-bold text-white mt-2 tracking-wide">
            {title}
          </h1>
          {subtitle && (
            <p className="text-white/80 text-sm mt-1 leading-relaxed max-w-xl">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 px-4 py-8 flex items-center justify-center">
        <div className={`w-full ${maxWidthClass}`}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default AuthPageLayout;
