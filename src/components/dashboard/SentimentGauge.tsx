import React, { useState, useEffect } from 'react';

export interface SentimentGaugeProps {
  value: number; // 0 to 100
  size?: number;
  enableWiggle?: boolean;
}

export const SentimentGauge: React.FC<SentimentGaugeProps> = ({
  value,
  size = 200,
  enableWiggle = true,
}) => {
  const clamped = Math.min(100, Math.max(0, value));
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setDisplayValue(clamped);
    });
    return () => cancelAnimationFrame(frame);
  }, [clamped]);

  // Needle angle in degrees: 0 -> -90 (left), 100 -> 90 (right)
  const rotationDeg = -90 + (displayValue / 100) * 180;

  const w = size;
  const h = size * 0.6;
  const strokeWidth = size * 0.14;
  const radius = size * 0.42;
  const cx = w / 2;
  const cy = h * 0.9;

  return (
    <div
      style={{ width: w, height: h }}
      className="relative flex flex-col items-center justify-end select-none overflow-visible"
      data-testid="sentiment-gauge"
    >
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
        <defs>
          <style>{`
            @keyframes gaugeNeedleWiggleDashboard {
              0%, 100% {
                transform: rotate(-1.2deg);
              }
              50% {
                transform: rotate(1.2deg);
              }
            }
            @media (prefers-reduced-motion: reduce) {
              .gauge-needle-wiggle-group-dash {
                animation: none !important;
              }
            }
          `}</style>
        </defs>

        {/* 5 Segments: Red, Orange, Yellow, Light Green, Green */}
        {[
          { color: '#EF4444', angle: 0 },
          { color: '#F97316', angle: 36 },
          { color: '#EAB308', angle: 72 },
          { color: '#84CC16', angle: 108 },
          { color: '#22C55E', angle: 144 },
        ].map((seg, idx) => {
          const startAngle = Math.PI + (idx * Math.PI) / 5;
          const sweepAngle = Math.PI / 5;
          const endAngle = startAngle + sweepAngle;

          const x1 = cx + radius * Math.cos(startAngle);
          const y1 = cy + radius * Math.sin(startAngle);
          const x2 = cx + radius * Math.cos(endAngle);
          const y2 = cy + radius * Math.sin(endAngle);

          return (
            <path
              key={idx}
              d={`M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`}
              stroke={seg.color}
              strokeWidth={strokeWidth}
              fill="none"
            />
          );
        })}

        {/* POOR / GOOD labels */}
        <text
          x={cx - radius}
          y={cy + 15}
          textAnchor="middle"
          fontSize="10"
          fontWeight="900"
          fill="#9CA3AF"
          letterSpacing="0.5"
        >
          POOR
        </text>
        <text
          x={cx + radius}
          y={cy + 15}
          textAnchor="middle"
          fontSize="10"
          fontWeight="900"
          fill="#9CA3AF"
          letterSpacing="0.5"
        >
          GOOD
        </text>

        {/* Rotating & Moving Needle */}
        <g
          data-testid="sentiment-gauge-needle"
          style={{
            transformOrigin: `${cx}px ${cy}px`,
            transform: `rotate(${rotationDeg}deg)`,
            transition: 'transform 1.4s cubic-bezier(0.34, 1.3, 0.64, 1)',
          }}
        >
          <g
            className="gauge-needle-wiggle-group-dash"
            style={{
              transformOrigin: `${cx}px ${cy}px`,
              animation: enableWiggle ? 'gaugeNeedleWiggleDashboard 1.6s ease-in-out infinite' : 'none',
            }}
          >
            <line
              x1={cx}
              y1={cy}
              x2={cx}
              y2={cy - radius * 0.9}
              strokeWidth="5"
              strokeLinecap="round"
              className="stroke-slate-800 dark:stroke-slate-100"
              style={{
                filter: 'drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.45))',
              }}
            />
          </g>
        </g>

        {/* Pivot Center shadow & caps */}
        <circle cx={cx} cy={cy} r="14" fill="black" fillOpacity="0.12" />
        <circle cx={cx} cy={cy} r="11" fill="#9CA3AF" />
        <circle cx={cx} cy={cy} r="6" className="fill-slate-900 dark:fill-slate-950" />
        <circle cx={cx} cy={cy} r="2" fill="#E2E8F0" />
      </svg>
    </div>
  );
};
