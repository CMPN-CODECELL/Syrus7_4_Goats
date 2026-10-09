import React from 'react';
import { SeriesStyle } from '../lib/chartColors';

// Path for each marker, centred on (0,0) within a +-5 box
function markerPath(shape: SeriesStyle['shape']): string {
  switch (shape) {
    case 'diamond': return 'M0,-6 L6,0 L0,6 L-6,0 Z';
    case 'square': return 'M-5,-5 L5,-5 L5,5 L-5,5 Z';
    case 'triangle': return 'M0,-6 L6,5 L-6,5 Z';
    case 'cross': return 'M-5,-5 L5,5 M-5,5 L5,-5';
    default: return '';
  }
}

// Marker drawn inside an existing <svg>/<g>, used as a Recharts shape and for dots on a line
// `hollow` overrides the style's own fill, so markers that share a point can be nested as outlines.
export const MarkerGlyph: React.FC<{ style: SeriesStyle; cx: number; cy: number; scale?: number; hollow?: boolean }> = ({ style, cx, cy, scale = 1, hollow }) => {
  if (typeof cx !== 'number' || typeof cy !== 'number' || !Number.isFinite(cx) || !Number.isFinite(cy)) return null;
  const t = `translate(${cx},${cy}) scale(${scale})`;
  const isHollow = hollow ?? style.hollow;
  // vectorEffect keeps the outline a constant width however much the marker is scaled
  if (style.shape === 'circle') {
    return <circle cx={cx} cy={cy} r={5 * scale} fill={isHollow ? '#000000' : style.color} stroke={style.color} strokeWidth={1.5} />;
  }
  if (style.shape === 'dash') {
    return <line x1={cx - 6} x2={cx + 6} y1={cy} y2={cy} stroke={style.color} strokeWidth={2} strokeDasharray="3 2" />;
  }
  if (style.shape === 'cross') {
    return <path transform={t} d={markerPath('cross')} stroke={style.color} strokeWidth={2} fill="none" vectorEffect="non-scaling-stroke" />;
  }
  return (
    <path
      transform={t}
      d={markerPath(style.shape)}
      fill={isHollow ? '#000000' : style.color}
      stroke={style.color}
      strokeWidth={1.5}
      vectorEffect="non-scaling-stroke"
    />
  );
};

// Small inline legend swatch
export const SolverMarker: React.FC<{ style: SeriesStyle; size?: number }> = ({ style, size = 14 }) => (
  <svg width={size} height={size} viewBox="-8 -8 16 16" aria-hidden="true" className="shrink-0">
    <MarkerGlyph style={style} cx={0} cy={0} />
  </svg>
);
