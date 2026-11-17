import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { X, Share, Compass, PlusSquare, CheckCircle2 } from 'lucide-react';

export function isIosDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isIos = /iPhone|iPad/i.test(ua);
  const isStandalone =
    (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
    (typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches);
  return isIos && !isStandalone;
}

export interface IosInstallGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IosInstallGuide: React.FC<IosInstallGuideProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ios-install-title"
      data-testid="ios-install-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-3xl bg-[#131122] dark:bg-[#131122] border border-white/10 p-6 sm:p-8 shadow-2xl text-white animate-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-5 right-5 p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors focus:outline-none"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
            <Share className="w-5 h-5" />
          </div>
          <h2
            id="ios-install-title"
            className="text-lg sm:text-xl font-bold text-white tracking-tight leading-snug"
          >
            Add MoneyMapper to your iPhone Home Screen
          </h2>
        </div>

        {/* Steps List */}
        <div className="space-y-4 text-sm text-white/80">
          {/* Step 1 */}
          <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/[0.04] border border-white/5">
            <div className="w-7 h-7 rounded-xl bg-purple-500/20 text-purple-300 font-bold flex items-center justify-center shrink-0 text-xs">
              1
            </div>
            <div className="flex-1">
              <p className="font-semibold text-white flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-purple-400 inline" /> Open in Safari
              </p>
              <p className="text-xs text-white/60 mt-0.5">
                Open this website in Safari (not Chrome or any other app).
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/[0.04] border border-white/5">
            <div className="w-7 h-7 rounded-xl bg-purple-500/20 text-purple-300 font-bold flex items-center justify-center shrink-0 text-xs">
              2
            </div>
            <div className="flex-1">
              <p className="font-semibold text-white flex items-center gap-1.5">
                <Share className="w-4 h-4 text-purple-400 inline" /> Tap Share
              </p>
              <p className="text-xs text-white/60 mt-0.5">
                Tap the Share button (square with an up arrow) at the bottom of the screen.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/[0.04] border border-white/5">
            <div className="w-7 h-7 rounded-xl bg-purple-500/20 text-purple-300 font-bold flex items-center justify-center shrink-0 text-xs">
              3
            </div>
            <div className="flex-1">
              <p className="font-semibold text-white flex items-center gap-1.5">
                <PlusSquare className="w-4 h-4 text-purple-400 inline" /> Add to Home Screen
              </p>
              <p className="text-xs text-white/60 mt-0.5">
                Scroll down and tap &ldquo;Add to Home Screen&rdquo;.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/[0.04] border border-white/5">
            <div className="w-7 h-7 rounded-xl bg-purple-500/20 text-purple-300 font-bold flex items-center justify-center shrink-0 text-xs">
              4
            </div>
            <div className="flex-1">
              <p className="font-semibold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-purple-400 inline" /> Confirm Add
              </p>
              <p className="text-xs text-white/60 mt-0.5">
                Tap &ldquo;Add&rdquo; in the top right corner.
              </p>
            </div>
          </div>
        </div>

        {/* Got It Button */}
        <div className="mt-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3.5 px-6 rounded-2xl font-semibold text-white bg-brand-gradient hover:opacity-95 active:scale-[0.98] transition-all text-sm shadow-lg shadow-brand-purple/20 focus:outline-none cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};

export const IosInstallBanner: React.FC = () => {
  const [guideOpen, setGuideOpen] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return typeof window !== 'undefined' && localStorage.getItem('pwa_banner_dismissed') === 'true';
    } catch {
      return false;
    }
  });
  const [isIos, setIsIos] = useState(false);

  let pathname = '';
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    pathname = useLocation().pathname;
  } catch {
    pathname = '';
  }

  useEffect(() => {
    setIsIos(isIosDevice());
  }, []);

  const handleDismiss = () => {
    try {
      localStorage.setItem('pwa_banner_dismissed', 'true');
    } catch {
      // ignore
    }
    setDismissed(true);
  };

  if (dismissed) return null;
  if (!isIos) return null;
  if (pathname.startsWith('/subscription')) return null;

  return (
    <>
      <div
        data-testid="ios-install-banner"
        className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 bg-[#16132a]/95 dark:bg-[#16132a]/95 border border-purple-500/30 rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-3 text-white backdrop-blur-md"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Share className="w-5 h-5 text-purple-400 shrink-0" />
          <p className="text-xs sm:text-sm font-medium text-white truncate">
            Install MoneyMapper on your iPhone
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setGuideOpen(true)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-brand-gradient text-white hover:opacity-95 transition-opacity cursor-pointer"
          >
            How?
          </button>
          <button
            type="button"
            aria-label="Close banner"
            onClick={handleDismiss}
            className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      <IosInstallGuide isOpen={guideOpen} onClose={() => setGuideOpen(false)} />
    </>
  );
};
