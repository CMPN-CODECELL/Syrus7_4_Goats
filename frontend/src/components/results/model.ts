// Types and pure helpers for the results dashboard. Nothing here renders; every sentence and number is derived
// from the run result, so the dashboard never shows text that is not backed by a field.
import type {
  PortfolioOut, PortfolioRow, QaoaMetrics, QaoaResult, RunResult, SolverResult,
} from '../../api/types';
import { formatINR, formatPct, isNum } from '../../lib/format';
import { profileForQ } from '../../lib/riskProfiles';

// ---- Optional backend fields that src/api/types.ts does not declare yet -------------------------------------
// They are all optional: an older backend simply omits them and the UI says "not computed for this run".
export interface AssetStat {
  ticker: string;
  name: string;
  sector: string;
  exp_return: number;
  volatility: number;
  sharpe: number;
  screen_rank?: number | null;
}

export interface QaoaControl {
  p_opt: number;
  feasible_rate: number;
  approx_ratio: number;
  best_of_shots_hit: number;
}

export type PortfolioRowX = PortfolioRow & {
  risk_contribution?: number | null;
  avg_corr?: number | null;
};

export type QaoaMetricsX = QaoaMetrics & { best_of_shots_hit?: number | null };
export type QaoaResultX = Omit<QaoaResult, 'metrics'> & { metrics: QaoaMetricsX; control?: QaoaControl | null };
export type ResultX = Omit<RunResult, 'qaoa'> & { qaoa: QaoaResultX; assets?: AssetStat[] | null };

/** The one place the API result is widened to include the optional fields above. */
export const asResultX = (r: RunResult): ResultX => r as unknown as ResultX;

// ---- Constants stated in TEAMS/CONTRACTS.md (cost assumptions, risk-free rate) ---------------------------------
export const C_BUY = 0.001187;
export const C_SELL = 0.001037;
export const RF = 0.0557;

// ---- Formatting that format.ts does not cover --------------------------------------------------------------------
const inr2 = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
/** Per-share prices need paise: ₹401.69, not ₹402. Same Indian grouping as formatINR. */
export const formatPrice = (x: number | null | undefined) => (isNum(x) ? inr2.format(x) : '—');

/** Plain number with a true minus sign. Returns "—" for missing or non-finite values. */
export function fmtNum(x: number | null | undefined, digits = 2): string {
  if (!isNum(x)) return '—';
  const s = Math.abs(x).toFixed(digits);
  return x < 0 && Number(s) !== 0 ? `−${s}` : s;
}

export function fmtSeconds(s: number | null | undefined): string {
  if (!isNum(s)) return '—';
  if (s < 0.01) return '<0.01 s';
  return s < 10 ? `${s.toFixed(2)} s` : `${s.toFixed(1)} s`;
}

export const symbolOf = (r: { symbol?: string; ticker: string }) => r.symbol || r.ticker.replace(/\.NS$/, '');

export const windowText = (w: readonly string[] | null | undefined) =>
  Array.isArray(w) && w.length === 2 ? `${w[0]} to ${w[1]}` : 'not reported';

// ---- Solvers ----------------------------------------------------------------------------------------------------
export type UsableSolver = SolverResult & { selection: string[]; portfolio: PortfolioOut };

/** True when the solver returned a feasible selection with a share-level portfolio. */
export const isUsable = (s: SolverResult): s is UsableSolver =>
  s.feasible === true && Array.isArray(s.selection) && s.selection.length > 0
  && !!s.portfolio && Array.isArray(s.portfolio.rows) && s.portfolio.rows.length > 0;

/** The chosen solver if usable, else the recommended one, else the first usable one, else null. */
export function pickSolver(r: ResultX, chosen: string | null): UsableSolver | null {
  const usable = (r.solvers ?? []).filter(isUsable);
  return usable.find((s) => s.solver === chosen) ?? usable.find((s) => s.solver === r.recommended) ?? usable[0] ?? null;
}

/** The exact optimum's objective: brute force if it was feasible, else the landscape minimum, else unknown. */
export function exactObjective(r: ResultX): number | null {
  const bf = (r.solvers ?? []).find((s) => s.solver === 'brute_force' && s.feasible && isNum(s.objective));
  if (bf && isNum(bf.objective)) return bf.objective;
  const l = r.landscape;
  return l && isNum(l.f_min) && isNum(l.n_feasible) && l.n_feasible > 0 ? l.f_min : null;
}

/** Same tolerance as the backend verdict: matched when the relative gap is at most 1e-6. */
export const MATCH_TOL = 1e-6;

/** Relative gap above the exact optimum (positive = worse, since the objective is minimised). */
export function gapVsExact(objective: number | null | undefined, exact: number | null): number | null {
  if (!isNum(objective) || !isNum(exact)) return null;
  return (objective - exact) / Math.max(Math.abs(exact), 1e-12);
}

export type MethodClass = 'Exact' | 'Heuristic' | 'Approximate';

export function methodClass(id: SolverResult['solver']): { label: MethodClass; how: string } {
  switch (id) {
    case 'brute_force':
      return { label: 'Exact', how: 'checks every candidate portfolio, so when it succeeds it establishes the true optimum of this problem' };
    case 'relaxation':
      return { label: 'Heuristic', how: 'solves a relaxed version, then rounds to whole picks; no guarantee of optimality' };
    case 'annealing':
      return { label: 'Heuristic', how: 'a randomised search; no guarantee of optimality' };
    default:
      return { label: 'Approximate', how: 'a sampled quantum-circuit search simulated classically; it returns the best feasible sample, with no guarantee of optimality' };
  }
}

/** Stable key for a set of picks, so identical portfolios can be grouped. */
export const selectionKey = (sel: string[]) => [...sel].sort().join(',');

// ---- Generated text -----------------------------------------------------------------------------------------------
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Equal target weights (the optimiser picks stocks; weights are 1/K by construction). */
export function weightsEqual(rows: PortfolioRow[]): boolean {
  const w = rows.map((r) => r.weight).filter(isNum);
  return w.length === rows.length && w.length > 0 && Math.max(...w) - Math.min(...w) < 1e-6;
}

export function portfolioTitle(r: ResultX, solver: SolverResult | null): string {
  const req = r.request;
  const n = solver?.selection?.length ?? req.k;
  const profile = profileForQ(req.risk_aversion);
  const style = profile ? profile.label : `risk aversion ${fmtNum(req.risk_aversion, 2)}`;
  const where = req.tickers == null ? 'NIFTY 50' : null;
  return where ? `Your ${n}-stock ${where} portfolio (${style})` : `Your ${n}-stock portfolio from a custom list (${style})`;
}

/** One sentence describing what the optimiser did, built from the real request and result. */
export function describeRun(r: ResultX, solver: UsableSolver): string {
  const req = r.request;
  const kept = r.screen?.kept?.length ?? 0;
  const dropped = r.screen?.dropped?.length ?? 0;
  const pool = kept + dropped;
  const poolName = req.tickers == null ? 'NIFTY 50' : 'chosen';
  const profile = profileForQ(req.risk_aversion);
  const qubits = r.screen?.qubits?.total ?? r.qubo?.n_vars;
  const k = solver.selection.length;

  const out: string[] = [];
  if (r.screen?.applied && pool > kept && kept > 0) {
    out.push(`Starting from ${pool} ${poolName} stocks with usable price history, a screen kept the ${kept} with the highest Sharpe ratio in the estimation window${isNum(qubits) ? ` so the problem fits ${qubits} qubits` : ''}.`);
  } else if (kept > 0) {
    out.push(`It considered all ${kept} ${poolName} stocks with usable price history.`);
  }

  let rules = `It then looked for the best group of exactly ${k} stocks, weighing estimated return against estimated risk (risk aversion q = ${fmtNum(req.risk_aversion, 2)}${profile ? `, ${profile.label}` : ''})`;
  rules += isNum(req.sector_cap)
    ? `, allowing at most ${plural(req.sector_cap, 'stock', 'stocks')} per sector`
    : ', with no limit per sector';
  if (isNum(req.target_return)) rules += `, and requiring an estimated return of at least ${formatPct(req.target_return)} after costs`;
  const held = Object.keys(req.holdings ?? {}).length;
  if (held > 0) rules += `, counting the cost of selling the ${plural(held, 'holding', 'holdings')} you already own that it does not keep`;
  out.push(`${rules}.`);

  const eq = weightsEqual(solver.portfolio.rows);
  out.push(`${solver.label} supplied this portfolio. It ${eq ? 'splits' : 'allocates'} your ${formatINR(req.capital)} ${eq ? 'equally ' : ''}across the ${k} stocks in whole shares at the last estimation-window prices, investing ${formatINR(solver.portfolio.invested)} and leaving ${formatINR(solver.portfolio.cash_left)} in cash.`);
  return out.join(' ');
}
