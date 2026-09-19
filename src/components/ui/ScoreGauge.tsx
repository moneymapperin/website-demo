import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export const GAUGE_SEGMENT_COLORS = [
  '#EF4444', // Bright Red
  '#F97316', // Orange
  '#FBBF24', // Yellow
  '#84CC16', // Light Green
  '#10B981', // Emerald Green
] as const;

export const TOTAL_SEGMENTS = 10;
export const START_ARC_RAD = (3 * Math.PI) / 4; // 135 degrees
export const TOTAL_SWEEP_RAD = (3 * Math.PI) / 2; // 270 degrees
export const GAP_ANGLE_RAD = 0.07;
export const SEGMENT_ANGLE_RAD =
  (TOTAL_SWEEP_RAD - GAP_ANGLE_RAD * (TOTAL_SEGMENTS - 1)) / TOTAL_SEGMENTS;

/**
 * Calculates fractional fill for a specific segment index (0 to 9) given a score (0 to 100).
 * fractional fill = clamp(progress * 10 - i, 0, 1)
 */
export function getSegmentFill(score: number, segmentIndex: number): number {
  const clampedScore = Math.min(Math.max(score, 0), 100);
  const progress = clampedScore / 100;
  const continuousFilled = progress * TOTAL_SEGMENTS;
  const rawFill = continuousFilled - segmentIndex;
  const clamped = Math.min(Math.max(rawFill, 0), 1);
  return Number(clamped.toFixed(6));
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return [r, g, b];
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.round(n).toString(16).padStart(2, '0').toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Interpolates across the 5 segment color stops based on ratio in [0, 1].
 */
export function getInterpolatedColor(ratio: number): string {
  if (ratio <= 0) return GAUGE_SEGMENT_COLORS[0];
  if (ratio >= 1) return GAUGE_SEGMENT_COLORS[GAUGE_SEGMENT_COLORS.length - 1];

  const scaled = ratio * (GAUGE_SEGMENT_COLORS.length - 1);
  const index = Math.floor(scaled);
  const remainder = scaled - index;

  if (remainder === 0) {
    return GAUGE_SEGMENT_COLORS[index];
  }

  const [r1, g1, b1] = hexToRgb(GAUGE_SEGMENT_COLORS[index]);
  const [r2, g2, b2] = hexToRgb(GAUGE_SEGMENT_COLORS[index + 1]);

  const r = r1 + (r2 - r1) * remainder;
  const g = g1 + (g2 - g1) * remainder;
  const b = b1 + (b2 - b1) * remainder;

  return rgbToHex(r, g, b);
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngleRad: number,
  sweepAngleRad: number
): string {
  if (sweepAngleRad <= 0.0001) return '';
  const x1 = cx + r * Math.cos(startAngleRad);
  const y1 = cy + r * Math.sin(startAngleRad);
  const x2 = cx + r * Math.cos(startAngleRad + sweepAngleRad);
  const y2 = cy + r * Math.sin(startAngleRad + sweepAngleRad);

  const largeArcFlag = sweepAngleRad > Math.PI ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
}

export interface ScoreGaugeProps {
  score: number;
  size?: number;
  className?: string;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score, size = 140, className = '' }) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const clamped = Math.min(Math.max(score, 0), 100);

  const strokeWidth = size * 0.12;
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;

  const trackColor = isDark ? 'rgba(39, 39, 42, 0.4)' : '#E5E7EB';

  const segments = Array.from({ length: TOTAL_SEGMENTS }, (_, i) => {
    const segmentStart = START_ARC_RAD + i * (SEGMENT_ANGLE_RAD + GAP_ANGLE_RAD);
    const ratio = i / (TOTAL_SEGMENTS - 1);
    const segColor = getInterpolatedColor(ratio);
    const fillRatio = getSegmentFill(clamped, i);

    const trackPath = describeArc(center, center, radius, segmentStart, SEGMENT_ANGLE_RAD);
    const activeSweep = SEGMENT_ANGLE_RAD * fillRatio;
    const activePath =
      fillRatio > 0 ? describeArc(center, center, radius, segmentStart, activeSweep) : '';

    return {
      i,
      segColor,
      fillRatio,
      trackPath,
      activePath,
    };
  });

  return (
    <div
      data-testid="score-gauge"
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Soft radial glow behind gauge */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: size * 0.85,
          height: size * 0.85,
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 70%)',
        }}
      />

      {/* Segmented Arc SVG */}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        {segments.map(({ i, segColor, fillRatio, trackPath, activePath }) => (
          <g key={i}>
            {/* Track arc */}
            {trackPath && (
              <path
                d={trackPath}
                fill="none"
                stroke={trackColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
              />
            )}
            {/* Active glow */}
            {activePath && (
              <path
                d={activePath}
                fill="none"
                stroke={segColor}
                strokeWidth={strokeWidth + 2}
                strokeLinecap="round"
                opacity={0.3 * fillRatio}
              />
            )}
            {/* Active arc */}
            {activePath && (
              <path
                d={activePath}
                fill="none"
                stroke={segColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
              />
            )}
          </g>
        ))}
      </svg>

      {/* Centered Score Text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        <span
          data-testid="score-gauge-value"
          className={`font-black leading-none tracking-tight ${
            isDark ? 'text-white' : 'text-zinc-900'
          }`}
          style={{ fontSize: `${size * 0.28}px` }}
        >
          {Math.round(clamped)}
        </span>
        <span
          data-testid="score-gauge-label"
          className={`font-extrabold tracking-wider mt-1 ${
            isDark ? 'text-white/60' : 'text-zinc-500'
          }`}
          style={{ fontSize: `${size * 0.08}px` }}
        >
          OF 100
        </span>
      </div>
    </div>
  );
};
