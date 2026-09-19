import React, { useEffect } from 'react';
import { Lock, X } from 'lucide-react';
import { useComingSoon } from '../context/ComingSoonContext';
import { navigateTo } from '../lib/navigation';

export const ComingSoonModal: React.FC = () => {
  const { isOpen, featureName, closeComingSoon } = useComingSoon();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeComingSoon();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeComingSoon]);

  if (!isOpen) return null;

  const handleLoginClick = () => {
    closeComingSoon();
    navigateTo('/login');
  };

  return (
    <div
      id="login-prompt-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={closeComingSoon}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        id="login-prompt-modal-card"
        className="relative w-full max-w-md rounded-3xl border border-card-border bg-card p-6 sm:p-8 text-center shadow-2xl shadow-black/80 animate-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          id="close-login-prompt-btn"
          onClick={closeComingSoon}
          className="absolute top-4 right-4 p-2 rounded-full text-white/50 hover:text-white hover:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-purple/50 cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Gradient Icon Circle */}
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-brand-gradient shadow-lg shadow-brand-purple/30">
          <Lock className="h-8 w-8 text-white" />
        </div>

        {/* Heading */}
        <h3 id="modal-title" className="text-2xl font-bold text-white mb-2 tracking-tight">
          Please login first 🔒
        </h3>

        {/* Sub-line */}
        <p className="text-sm sm:text-base text-white/70 mb-6 leading-relaxed">
          <span className="font-semibold text-white">{featureName}</span> is available after you log in. Log in to continue.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            id="login-modal-btn"
            onClick={handleLoginClick}
            className="flex-1 py-3 px-6 rounded-xl font-semibold text-white bg-brand-gradient hover:opacity-95 active:scale-[0.98] transition-all duration-150 shadow-md shadow-brand-purple/25 focus:outline-none focus:ring-2 focus:ring-brand-magenta/50 cursor-pointer"
          >
            Login
          </button>
          <button
            id="not-now-modal-btn"
            onClick={closeComingSoon}
            className="py-3 px-6 rounded-xl font-semibold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 active:scale-[0.98] border border-white/10 transition-all duration-150 focus:outline-none cursor-pointer"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComingSoonModal;
