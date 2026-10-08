export const CHART_COLORS = {
  // Solver Series
  qaoa_standard: '#FFA586', // Peach
  qaoa_xy: '#FFD2C2',       // Light Peach
  brute_force: '#F4EFEA',   // Off-white / Text
  relaxation: '#8FA3C8',    // Slate
  annealing: '#C9566A',     // Red-Pink
  nifty50: '#A9B3C9',       // Muted

  // Histogram State Colors
  optimal: '#FFA586',
  feasible: '#8FA3C8',
  infeasible: '#B51A2B',

  // UI Palette
  ink: '#161E2F',
  panel: '#242F49',
  line: '#384358',
  peach: '#FFA586',
  red: '#B51A2B',
  wine: '#541A2E',
  text: '#F4EFEA',
  muted: '#A9B3C9',
  slate: '#8FA3C8'
} as const;

export function getSolverColor(solverKey: string): string {
  if (solverKey.includes('qaoa_xy')) return CHART_COLORS.qaoa_xy;
  if (solverKey.includes('qaoa')) return CHART_COLORS.qaoa_standard;
  if (solverKey.includes('brute')) return CHART_COLORS.brute_force;
  if (solverKey.includes('relax')) return CHART_COLORS.relaxation;
  if (solverKey.includes('anneal')) return CHART_COLORS.annealing;
  if (solverKey.includes('nifty')) return CHART_COLORS.nifty50;
  return CHART_COLORS.peach;
}

export function formatPercent(val: number | null | undefined, decimals = 1): string {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return `${(val * 100).toFixed(decimals)}%`;
}

export function formatINR(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return `₹${Math.round(val).toLocaleString('en-IN')}`;
}

export function formatNumber(val: number | null | undefined, decimals = 3): string {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return val.toFixed(decimals);
}
