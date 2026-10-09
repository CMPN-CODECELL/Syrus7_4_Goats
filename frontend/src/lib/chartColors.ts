// Monochrome chart palette. Shape carries the series identity so colour is never the only signal.
export const CHART_COLORS = {
  // Solver series
  qaoa_standard: '#FFFFFF',
  qaoa_xy: '#FFFFFF',
  brute_force: '#D4D4D4',
  relaxation: '#A3A3A3',
  annealing: '#737373',
  nifty50: '#A3A3A3',

  // Histogram state colours
  optimal: '#FFFFFF',
  feasible: '#737373',
  infeasible: '#1A1A1A',
  infeasibleStroke: '#6B6B6B',

  // Chart chrome
  grid: '#262626',
  tick: '#A3A3A3',

  // UI palette
  bg: '#000000',
  surface: '#0A0A0A',
  line: '#262626',
  lineStrong: '#6B6B6B',
  text: '#FFFFFF',
  muted: '#A3A3A3',
  faint: '#737373',
  gain: '#22C55E',
  loss: '#EF4444'
} as const;

export type MarkerShape = 'circle' | 'diamond' | 'square' | 'triangle' | 'cross' | 'dash';

export interface SeriesStyle {
  color: string;
  shape: MarkerShape;
  hollow: boolean;
  dashed: boolean;
}

export const SOLVER_STYLES: Record<string, SeriesStyle> = {
  qaoa: { color: CHART_COLORS.qaoa_standard, shape: 'circle', hollow: false, dashed: false },
  qaoa_xy: { color: CHART_COLORS.qaoa_xy, shape: 'diamond', hollow: true, dashed: true },
  brute_force: { color: CHART_COLORS.brute_force, shape: 'square', hollow: false, dashed: false },
  relaxation: { color: CHART_COLORS.relaxation, shape: 'triangle', hollow: false, dashed: false },
  annealing: { color: CHART_COLORS.annealing, shape: 'cross', hollow: false, dashed: false },
  nifty50: { color: CHART_COLORS.nifty50, shape: 'dash', hollow: false, dashed: true }
};

export function getSolverStyle(solverKey: string): SeriesStyle {
  if (solverKey.includes('qaoa_xy')) return SOLVER_STYLES.qaoa_xy;
  if (solverKey.includes('qaoa')) return SOLVER_STYLES.qaoa;
  if (solverKey.includes('brute')) return SOLVER_STYLES.brute_force;
  if (solverKey.includes('relax')) return SOLVER_STYLES.relaxation;
  if (solverKey.includes('anneal')) return SOLVER_STYLES.annealing;
  if (solverKey.includes('nifty')) return SOLVER_STYLES.nifty50;
  return SOLVER_STYLES.qaoa;
}

export function getSolverColor(solverKey: string): string {
  return getSolverStyle(solverKey).color;
}

// Evidence studies have generic series (by position), so they take the solver styles in a fixed order
const STUDY_SERIES_ORDER: SeriesStyle[] = [
  SOLVER_STYLES.qaoa,
  SOLVER_STYLES.qaoa_xy,
  SOLVER_STYLES.brute_force,
  SOLVER_STYLES.relaxation,
  SOLVER_STYLES.annealing
];

export function getSeriesStyle(index: number): SeriesStyle {
  return STUDY_SERIES_ORDER[index % STUDY_SERIES_ORDER.length];
}

export function formatPercent(val: number | null | undefined, decimals = 1): string {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return `${(val * 100).toFixed(decimals)}%`;
}

// Gain and loss: green "▲ +x%" for positive, red "▼ −x%" for negative. Zero and missing values stay neutral.
export function formatSignedPercent(val: number | null | undefined, decimals = 1): string {
  if (val === null || val === undefined || isNaN(val)) return '—';
  const abs = (Math.abs(val) * 100).toFixed(decimals);
  if (Number(abs) === 0) return `${abs}%`;
  return val > 0 ? `▲ +${abs}%` : `▼ −${abs}%`;
}

export function gainLossClass(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val) || val === 0) return 'text-text';
  return val > 0 ? 'text-gain' : 'text-loss';
}

// A drawdown is a loss by definition, whichever sign the server uses
export function formatDrawdown(val: number | null | undefined, decimals = 1): string {
  if (val === null || val === undefined || isNaN(val)) return '—';
  const abs = (Math.abs(val) * 100).toFixed(decimals);
  return Number(abs) === 0 ? `${abs}%` : `▼ −${abs}%`;
}

export function drawdownClass(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val) || val === 0) return 'text-text';
  return 'text-loss';
}

export function formatINR(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return `₹${Math.round(val).toLocaleString('en-IN')}`;
}

export function formatNumber(val: number | null | undefined, decimals = 3): string {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return val.toFixed(decimals);
}
