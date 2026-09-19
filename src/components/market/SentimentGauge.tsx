import React from 'react';

export function calculateSentimentValue(angle: any): number {
  if (angle === undefined || angle === null || angle === '') return 50;
  const num = typeof angle === 'number' ? angle : parseFloat(angle);
  if (isNaN(num)) return 50;
  const mapped = ((num + 90) / 180) * 100;
  return Math.min(100, Math.max(0, mapped));
}

interface SentimentGaugeProps {
  value: number; // 0 to 100
  size?: number;
}

export const SentimentGauge: React.FC<SentimentGaugeProps> = ({ value, size = 260 }) => {
  const clampedValue = Math.min(100, Math.max(0, value));
  // Needle angle in degrees: 180 to 360 (or -180 to 0)
  // angle = 180 + (clampedValue / 100) * 180
  const needleAngle = 180 + (clampedValue / 100) * 180;

  // 5 colored segments
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

  return (
    <div
      className="flex flex-col items-center justify-center"
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
          <filter id="needle-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* 5 Semicircle Segments */}
        {colors.map((color, idx) => {
          // Dash array: segment length, remaining
          // Dash offset: -(idx * segmentLength)
          return (
            <path
              key={color}
              d={`M ${strokeWidth / 2} ${center} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${center}`}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${segmentLength - 1} ${arcLength * 2}`}
              strokeDashoffset={-(idx * segmentLength)}
            />
          );
        })}

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

        {/* Center Pivot Base */}
        <circle cx={center} cy={center} r="14" fill="#00000015" />
        <circle cx={center} cy={center} r="10" fill="#9CA3AF" />
        <circle cx={center} cy={center} r="6" fill="#1F2937" />

        {/* Needle with Rotation */}
        <g
          transform={`rotate(${needleAngle}, ${center}, ${center})`}
          style={{ transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
          filter="url(#needle-shadow)"
        >
          <line
            x1={center}
            y1={center}
            x2={center + radius * 0.88}
            y2={center}
            stroke="#1F2937"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  );
};
