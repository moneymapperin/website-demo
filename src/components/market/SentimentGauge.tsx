import React, { useState, useEffect } from 'react';

export function calculateSentimentValue(angle: any): number {
  if (angle === undefined || angle === null || angle === '') return 50;
  const num = typeof angle === 'number' ? angle : parseFloat(angle);
  if (isNaN(num)) return 50;
  const mapped = ((num + 90) / 180) * 100;
  return Math.min(100, Math.max(0, mapped));
}

export interface SentimentGaugeProps {
  value: number; // 0 to 100
  size?: number;
  enableWiggle?: boolean;
}

export const SentimentGauge: React.FC<SentimentGaugeProps> = ({
  value,
  size = 260,
  enableWiggle = true,
}) => {
  const clampedValue = Math.min(100, Math.max(0, value));

  // State for entry sweep animation (starts at 0 on mount, sweeps to clampedValue)
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    // Sweep needle to target value on mount or value change
    const frame = requestAnimationFrame(() => {
      setDisplayValue(clampedValue);
    });
    return () => cancelAnimationFrame(frame);
  }, [clampedValue]);

  // Rotation in degrees relative to vertical (up):
  // 0 -> -90 deg (left / POOR)
  // 50 -> 0 deg (straight up / NEUTRAL)
  // 100 -> +90 deg (right / GOOD)
  const targetRotation = -90 + (displayValue / 100) * 180;

  // 5 colored segments matching Flutter: Red, Orange, Yellow, Light Green, Green
  const colors = [
    '#EF4444', // Red
    '#F97316', // Orange
    '#EAB308', // Yellow
    '#84CC16', // Light Green
    '#22C55E', // Green
  ];

  const strokeWidth = size * 0.12;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const arcLength = Math.PI * radius;
  const segmentLength = arcLength / 5;
  const needleLength = radius * 0.92;

  return (
    <div
      className="flex flex-col items-center justify-center select-none"
      data-testid="sentiment-gauge"
      style={{ width: size, height: size * 0.6 }}
    >
      <svg
        width={size}
        height={size * 0.6}
        viewBox={`0 0 ${size} ${size * 0.6}`}
        className="overflow-visible"
        aria-label={`Market Sentiment Gauge: ${Math.round(clampedValue)}/100`}
      >
        <defs>
          <style>{`
            @keyframes gaugeNeedleWiggle {
              0%, 100% {
                transform: rotate(-1.2deg);
              }
              50% {
                transform: rotate(1.2deg);
              }
            }
            @media (prefers-reduced-motion: reduce) {
              .gauge-needle-wiggle-group {
                animation: none !important;
              }
            }
          `}</style>
        </defs>

        {/* 5 Semicircle Segments */}
        {colors.map((color, idx) => (
          <path
            key={color}
            d={`M ${strokeWidth / 2} ${center} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${center}`}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${segmentLength - 1} ${arcLength * 2}`}
            strokeDashoffset={-(idx * segmentLength)}
          />
        ))}

        {/* Labels POOR and GOOD */}
        <text
          x={strokeWidth / 2 + 10}
          y={center + 20}
          fontSize="10"
          fontWeight="900"
          fill="#9CA3AF"
          letterSpacing="0.5"
        >
          POOR
        </text>
        <text
          x={size - strokeWidth / 2 - 35}
          y={center + 20}
          fontSize="10"
          fontWeight="900"
          fill="#9CA3AF"
          letterSpacing="0.5"
        >
          GOOD
        </text>

        {/* Moving Needle Group: Outer group handles entry sweep & value rotation */}
        <g
          data-testid="sentiment-gauge-needle"
          style={{
            transformOrigin: `${center}px ${center}px`,
            transform: `rotate(${targetRotation}deg)`,
            transition: 'transform 1.4s cubic-bezier(0.34, 1.3, 0.64, 1)',
          }}
        >
          {/* Inner group handles continuous subtle idle wiggle (matching Flutter 1600ms oscillation) */}
          <g
            className="gauge-needle-wiggle-group"
            style={{
              transformOrigin: `${center}px ${center}px`,
              animation: enableWiggle ? 'gaugeNeedleWiggle 1.6s ease-in-out infinite' : 'none',
            }}
          >
            {/* Needle Line with drop shadow */}
            <line
              x1={center}
              y1={center}
              x2={center}
              y2={center - needleLength}
              strokeWidth="5"
              strokeLinecap="round"
              className="stroke-slate-800 dark:stroke-slate-100"
              style={{
                filter: 'drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.45))',
              }}
            />
          </g>
        </g>

        {/* Center Pivot Base (Drawn on top of the needle root, matching Flutter) */}
        <circle cx={center} cy={center} r="14" fill="#000000" fillOpacity="0.12" />
        <circle cx={center} cy={center} r="11" fill="#9CA3AF" />
        <circle cx={center} cy={center} r="6" className="fill-slate-900 dark:fill-slate-950" />
        <circle cx={center} cy={center} r="2" fill="#E2E8F0" />
      </svg>
    </div>
  );
};
