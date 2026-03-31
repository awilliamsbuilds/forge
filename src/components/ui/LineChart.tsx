import { useState } from 'react';

interface DataPoint {
  x: string;   // date string
  y: number;
}

interface LineChartProps {
  data: DataPoint[];
  color?: string;
  formatY?: (v: number) => string;
  label?: string;
  height?: number;
}

const PAD = { top: 20, right: 20, bottom: 44, left: 60 };
const VB_W = 640;
const VB_H = 240;
const PLOT_W = VB_W - PAD.left - PAD.right;
const PLOT_H = VB_H - PAD.top - PAD.bottom;

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

export default function LineChart({
  data,
  color = '#C8FF00',
  formatY = (v) => v.toLocaleString(),
  label = '',
  height = 220,
}: LineChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center forge-card"
      >
        <span className="forge-label">NO DATA YET</span>
      </div>
    );
  }

  if (data.length === 1) {
    return (
      <div style={{ height }} className="flex flex-col items-center justify-center forge-card gap-1">
        <span className="forge-stat text-3xl">{formatY(data[0].y)}</span>
        <span className="forge-label">{label} — {formatDate(data[0].x)}</span>
      </div>
    );
  }

  const yValues = data.map(d => d.y);
  const yMin = Math.min(...yValues);
  const yMax = Math.max(...yValues);
  const yRange = yMax === yMin ? 1 : yMax - yMin;

  const toSvg = (i: number, y: number) => ({
    x: PAD.left + (i / (data.length - 1)) * PLOT_W,
    y: PAD.top + (1 - (y - yMin) / yRange) * PLOT_H,
  });

  const points = data.map((d, i) => toSvg(i, d.y));

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  // Area fill path
  const areaD =
    pathD +
    ` L ${points[points.length - 1].x.toFixed(1)} ${(PAD.top + PLOT_H).toFixed(1)}` +
    ` L ${points[0].x.toFixed(1)} ${(PAD.top + PLOT_H).toFixed(1)} Z`;

  // Y grid lines (5)
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map(t => ({
    y: PAD.top + (1 - t) * PLOT_H,
    label: formatY(yMin + t * yRange),
  }));

  // X labels (show at most 7, evenly spaced)
  const maxLabels = Math.min(data.length, 7);
  const labelIndices = data.length <= maxLabels
    ? data.map((_, i) => i)
    : Array.from({ length: maxLabels }, (_, i) =>
        Math.round((i / (maxLabels - 1)) * (data.length - 1))
      );

  const gradId = `grad-${label.replace(/\s/g, '')}`;

  return (
    <div style={{ height }} className="w-full relative">
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="none"
        style={{ width: '100%', height: '100%' }}
        onMouseLeave={() => setHovered(null)}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {gridLines.map((g, i) => (
          <g key={i}>
            <line
              x1={PAD.left} y1={g.y} x2={PAD.left + PLOT_W} y2={g.y}
              stroke="#252525" strokeWidth="1"
            />
            <text
              x={PAD.left - 8} y={g.y + 4}
              textAnchor="end"
              fontSize="10"
              fill="#4A4A4A"
              fontFamily="Space Mono, monospace"
            >
              {g.label}
            </text>
          </g>
        ))}

        {/* Area */}
        <path d={areaD} fill={`url(#${gradId})`} />

        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* X axis */}
        <line
          x1={PAD.left} y1={PAD.top + PLOT_H}
          x2={PAD.left + PLOT_W} y2={PAD.top + PLOT_H}
          stroke="#252525" strokeWidth="1"
        />

        {/* X labels */}
        {labelIndices.map(i => (
          <text
            key={i}
            x={points[i].x}
            y={PAD.top + PLOT_H + 16}
            textAnchor="middle"
            fontSize="9"
            fill="#4A4A4A"
            fontFamily="Space Mono, monospace"
          >
            {formatDate(data[i].x)}
          </text>
        ))}

        {/* Dots + hover zones */}
        {points.map((p, i) => (
          <g key={i}>
            <rect
              x={p.x - 12} y={PAD.top}
              width="24" height={PLOT_H}
              fill="transparent"
              onMouseEnter={() => setHovered(i)}
            />
            <circle
              cx={p.x} cy={p.y} r={hovered === i ? 5 : 3}
              fill={color}
              stroke={hovered === i ? '#fff' : 'transparent'}
              strokeWidth="1.5"
              style={{ transition: 'r 0.1s' }}
            />
          </g>
        ))}

        {/* Hover tooltip */}
        {hovered !== null && (() => {
          const p = points[hovered];
          const d = data[hovered];
          const tipW = 90;
          const tipX = Math.min(Math.max(p.x - tipW / 2, PAD.left), PAD.left + PLOT_W - tipW);
          const tipY = p.y - 42;
          return (
            <g>
              <line
                x1={p.x} y1={PAD.top} x2={p.x} y2={PAD.top + PLOT_H}
                stroke="#333" strokeWidth="1" strokeDasharray="3,3"
              />
              <rect
                x={tipX} y={tipY} width={tipW} height={32}
                fill="#161616" stroke="#252525" strokeWidth="1"
              />
              <text
                x={tipX + tipW / 2} y={tipY + 12}
                textAnchor="middle" fontSize="9"
                fill="#777" fontFamily="Space Mono, monospace"
              >
                {formatDate(d.x)}
              </text>
              <text
                x={tipX + tipW / 2} y={tipY + 26}
                textAnchor="middle" fontSize="12"
                fill={color} fontFamily="Space Mono, monospace"
                fontWeight="700"
              >
                {formatY(d.y)}
              </text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}
