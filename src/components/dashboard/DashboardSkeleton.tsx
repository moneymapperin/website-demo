import React from 'react';

export interface ShimmerBoxProps {
  height?: number | string;
  width?: number | string;
  borderRadius?: number;
  className?: string;
}

export const ShimmerBox: React.FC<ShimmerBoxProps> = ({
  height,
  width,
  borderRadius = 16,
  className = '',
}) => {
  return (
    <div
      style={{
        height,
        width,
        borderRadius: `${borderRadius}px`,
      }}
      className={`animate-pulse bg-gray-200 dark:bg-[#1F1F23] ${className}`}
      data-testid="shimmer-box"
    />
  );
};

export const DashboardHeaderSkeleton: React.FC = () => {
  return (
    <div
      className="p-5 bg-mm-headerPurple dark:bg-mm-darkBackground flex items-center justify-between"
      data-testid="dashboard-header-skeleton"
    >
      <div className="space-y-2">
        <div className="h-3 w-24 bg-white/20 rounded animate-pulse" />
        <div className="h-5 w-36 bg-white/20 rounded animate-pulse" />
      </div>
      <div className="w-11 h-11 rounded-full bg-white/20 animate-pulse" />
    </div>
  );
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <div
      className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full"
      data-testid="dashboard-skeleton"
    >
      {/* Hero Financial Position Card Shimmer */}
      <ShimmerBox height={220} borderRadius={24} />

      {/* Title Shimmer */}
      <div className="flex items-center space-x-3">
        <ShimmerBox height={18} width={160} borderRadius={6} />
      </div>

      {/* Grid Shimmer for Pillars / Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ShimmerBox height={110} borderRadius={20} />
        <ShimmerBox height={110} borderRadius={20} />
        <ShimmerBox height={110} borderRadius={20} />
        <ShimmerBox height={110} borderRadius={20} />
        <ShimmerBox height={110} borderRadius={20} />
      </div>

      {/* Weekly Spending / Live Calculator Shimmer */}
      <ShimmerBox height={150} borderRadius={24} />
      <ShimmerBox height={180} borderRadius={24} />
    </div>
  );
};
