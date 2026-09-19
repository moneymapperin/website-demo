import React from 'react';

export interface SparklineChartProps {
  dataPoints?: number[];
  width?: number | string;
  height?: number;
  lineColor?: string;
  nodeColor?: string;
}

export const SparklineChart: React.FC<SparklineChartProps> = ({
  dataPoints = [15, 28, 22, 38, 30, 48, 42, 65, 58, 82, 72, 95],
  width = 110,
  height = 55,
  lineColor = '#A855F7',
  nodeColor = '#C084FC',
}) => {
  if (dataPoints.length < 2) return null;

  const minVal = Math.min(...dataPoints);
  const maxVal = Math.max(...dataPoints);
  const range = maxVal - minVal === 0 ? 1 : maxVal - minVal;

  const w = typeof width === 'number' ? width : 110;
  const h = height;

  const stepX = w / (dataPoints.length - 1);
  const points: { x: number; y: number }[] = dataPoints.map((val, i) => {
    const x = i * stepX;
    const normalizedY = (val - minVal) / range;
    const y = h - normalizedY * (h - 12) - 6;
    return { x, y };
  });

  // Construct smooth bezier curve path
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const controlX = (p0.x + p1.x) / 2;
    pathD += ` C ${controlX} ${p0.y}, ${controlX} ${p1.y}, ${p1.x} ${p1.y}`;
  }

  const fillD = `${pathD} L ${points[points.length - 1].x} ${h} L ${points[0].x} ${h} Z`;

  // Key node peak points (indices 3, 7, and last point)
  const keyNodeIndices = [3, 7, points.length - 1].filter((idx) => idx < points.length);

  return (
    <div
      style={{ width, height: h }}
      className="inline-block relative overflow-hidden"
      data-testid="sparkline-chart"
    >
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
        <defs>
          <linearGradient id="sparkline-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.35" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Gradient fill under curve */}
        <path d={fillD} fill="url(#sparkline-grad)" />

        {/* Smooth wave line */}
        <path
          d={pathD}
          fill="none"
          stroke={lineColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Glowing peak dots */}
        {keyNodeIndices.map((idx) => {
          const pt = points[idx];
          return (
            <g key={idx}>
              {/* Outer Glow */}
              <circle cx={pt.x} cy={pt.y} r="6" fill={lineColor} fillOpacity="0.4" />
              {/* Core Dot */}
              <circle cx={pt.x} cy={pt.y} r="3.5" fill={nodeColor} />
              {/* Center White Pin */}
              <circle cx={pt.x} cy={pt.y} r="1.5" fill="#FFFFFF" />
            </g>
          );
        })}
      </svg>
    </div>
  );
};
