import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export interface ShimmerBoxProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  style?: React.CSSProperties;
}

export const ShimmerBox: React.FC<ShimmerBoxProps> = ({
  className = '',
  width,
  height,
  borderRadius = '16px',
  style,
}) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  return (
    <div
      data-testid="shimmer-box"
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: isDark ? '#1C1C22' : '#E5E7EB',
        ...style,
      }}
      className={`animate-pulse ${className}`}
    />
  );
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <div data-testid="dashboard-skeleton" className="space-y-8 animate-fade-in p-6 max-w-7xl mx-auto">
      {/* Top Banner Skeleton */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-8 rounded-[24px] bg-zinc-800/20 border border-zinc-700/20">
        <div className="space-y-3 w-full md:w-1/2">
          <ShimmerBox height="28px" width="60%" borderRadius="8px" />
          <ShimmerBox height="18px" width="80%" borderRadius="6px" />
        </div>
        <ShimmerBox height="140px" width="140px" borderRadius="9999px" />
      </div>

      {/* Pillars Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-[24px] bg-zinc-800/20 border border-zinc-700/20 space-y-4"
          >
            <div className="flex items-center justify-between">
              <ShimmerBox height="20px" width="65%" borderRadius="6px" />
              <ShimmerBox height="24px" width="24px" borderRadius="9999px" />
            </div>
            <ShimmerBox height="32px" width="40%" borderRadius="8px" />
            <ShimmerBox height="6px" width="100%" borderRadius="9999px" />
          </div>
        ))}
      </div>
    </div>
  );
};
