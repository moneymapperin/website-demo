import React from 'react';

export interface SentimentGaugeProps {
  value: number; // 0 to 100
  size?: number;
}

export const SentimentGauge: React.FC<SentimentGaugeProps> = ({
  value,
  size = 200,
}) => {
  const clamped = Math.min(100, Math.max(0, value));
  // Needle angle in degrees: 0 -> -90 (left), 100 -> 90 (right)
  const rotationDeg = -90 + (clamped / 100) * 180;

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
          {/* Semi-circle colored segments */}
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

        {/* Pivot Center shadow */}
        <circle cx={cx} cy={cy} r="14" fill="black" fillOpacity="0.08" />

        {/* Rotating Needle */}
        <g transform={`translate(${cx}, ${cy}) rotate(${rotationDeg})`}>
          <line
            x1="0"
            y1="0"
            x2="0"
            y2={-radius * 0.9}
            stroke="#1F2937"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </g>

        {/* Pivot Center Cap */}
        <circle cx={cx} cy={cy} r="11" fill="#9CA3AF" />
        <circle cx={cx} cy={cy} r="6" fill="#111827" />
      </svg>
    </div>
  );
};
