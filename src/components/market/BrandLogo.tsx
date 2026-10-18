import React, { useState, useEffect, useMemo } from 'react';
import { getLogoUrl, getDomainFromLogoUrl, getFallbackColor } from '../../utils/brandingUtils';

export interface BrandLogoProps {
  name: string;
  size?: number;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = React.memo(({ name, size = 40, className = '' }) => {
  // 0: logo.dev, 1: google favicon, 2: letter fallback
  const [fallbackStage, setFallbackStage] = useState<0 | 1 | 2>(0);
  const [isLoading, setIsLoading] = useState(true);

  // Reset state when name changes
  useEffect(() => {
    setFallbackStage(0);
    setIsLoading(true);
  }, [name]);

  const logoDevUrl = useMemo(() => getLogoUrl(name), [name]);
  const domain = useMemo(() => getDomainFromLogoUrl(logoDevUrl), [logoDevUrl]);

  // Determine current image source
  let currentSrc: string | null = null;
  if (fallbackStage === 0 && logoDevUrl) {
    currentSrc = logoDevUrl;
  } else if (fallbackStage <= 1 && domain) {
    currentSrc = `https://www.google.com/s2/favicons?sz=128&domain=${domain}`;
  }

  const handleError = () => {
    setIsLoading(false);
    setFallbackStage((prev) => (prev === 0 && domain ? 1 : 2));
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  const initial = name && name.trim().length > 0 ? name.trim()[0].toUpperCase() : '?';
  const fallbackColor = getFallbackColor(name);

  const borderRadius = Math.round(size * 0.25);
  const padding = Math.round(size * 0.15);
  const fontSize = Math.round(size * 0.45);

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius,
        padding,
      }}
      className={`relative shrink-0 overflow-hidden flex items-center justify-center bg-white border border-slate-200 dark:border-white/10 shadow-[0_2px_4px_rgba(0,0,0,0.05)] dark:shadow-none ${className}`}
      aria-label={name}
    >
      {currentSrc && fallbackStage < 2 ? (
        <>
          {isLoading && (
            <span
              className="absolute inset-0 m-auto w-2 h-2 rounded-full border border-slate-300 border-t-transparent animate-spin pointer-events-none"
              aria-hidden="true"
            />
          )}
          <img
            src={currentSrc}
            alt={name}
            loading="lazy"
            referrerPolicy="no-referrer"
            onLoad={handleLoad}
            onError={handleError}
            className={`w-full h-full object-contain transition-opacity duration-150 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          />
        </>
      ) : (
        <span
          style={{
            color: fallbackColor,
            fontSize,
          }}
          className="font-black leading-none select-none text-center"
        >
          {initial}
        </span>
      )}
    </div>
  );
});

BrandLogo.displayName = 'BrandLogo';
