// Small pieces shared by the Evidence charts: the "Show data" disclosure, axis scaling, solver classification and
// null-safe readers for optional parts of the run payload.
import React from 'react';
import type { QaoaResult, RunResult, SolverResult } from '../api/types';
import { isNum } from '../lib/format';

/** Native disclosure holding a chart's data table. Keyboard- and touch-friendly, no script. */
export const ShowData: React.FC<{ label?: string; children: React.ReactNode }> = ({ label = 'Show data', children }) => (
  <details className="group mt-4 border-t border-line">
    <summary className="label cursor-pointer min-h-[44px] flex items-center gap-2 list-none [&::-webkit-details-marker]:hidden">
      <span aria-hidden="true" className="inline-block text-faint group-open:rotate-90">▸</span>
      {label}
    </summary>
    <div className="pb-2 space-y-4">{children}</div>
  </details>
);

/** A data table that scrolls inside its own box, so a wide table never scrolls the page. */
export const TableBox: React.FC<{ children: React.ReactNode; maxHeight?: boolean }> = ({ children, maxHeight = false }) => (
  <div className={`overflow-x-auto ${maxHeight ? 'max-h-72 overflow-y-auto' : ''}`}>{children}</div>
);

/** Round a data range outwards to tidy tick values (1, 2 or 5 times a power of ten). */
export function niceScale(min: number, max: number, target = 5, padFraction = 0.06): { domain: [number, number]; ticks: number[]; step: number } {
  if (!isNum(min) || !isNum(max)) return { domain: [0, 1], ticks: [0, 1], step: 1 };
  let lo = min;
  let hi = max;
  if (hi === lo) {
    const pad = Math.abs(hi) * 0.1 || 0.1;
    lo -= pad;
    hi += pad;
  } else {
    const pad = (hi - lo) * padFraction;
    lo -= pad;
    hi += pad;
  }
  const raw = (hi - lo) / target;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
  const start = Math.floor(lo / step) * step;
  const end = Math.ceil(hi / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= end + step / 2; v += step) ticks.push(Number(v.toPrecision(12)));
  return { domain: [Number(start.toPrecision(12)), Number(end.toPrecision(12))], ticks, step };
}

/** Seconds with enough digits to tell 0.017 s from 0.14 s. */
export const formatSeconds = (x: number | null | undefined): string =>
  !isNum(x) ? '—' : `${x < 0.1 ? x.toFixed(3) : x.toFixed(2)} s`;

/** Plain decimal for objectives and energies. */
export const formatDecimal = (x: number | null | undefined, digits = 4): string => (isNum(x) ? x.toFixed(digits) : '—');

/** Ticker without the exchange suffix: "BEL.NS" -> "BEL". */
export const shortTicker = (t: string): string => t.replace(/\.NS$/, '');

/** Exact-optimum test used everywhere on this page: the solver's objective equals the enumerated minimum within 1e-9. */
export const isExactOptimum = (objective: number | null | undefined, fMin: number | null | undefined): boolean =>
  isNum(objective) && isNum(fMin) && Math.abs(objective - fMin) <= 1e-9;

/**
 * Answer accuracy, 0 to 100: 100 is the exact optimum (lowest objective f_min), 0 is the worst rule-abiding portfolio
 * (f_max). Null when the solver found no feasible answer.
 */
export function answerAccuracy(s: Pick<SolverResult, 'objective' | 'feasible'>, fMin: number, fMax: number): number | null {
  if (!s.feasible || !isNum(s.objective) || !isNum(fMin) || !isNum(fMax)) return null;
  const span = fMin - fMax;
  const pct = span === 0 ? (s.objective <= fMin + 1e-9 ? 100 : 0) : ((s.objective - fMax) / span) * 100;
  return Math.min(100, Math.max(0, pct));
}

export type SolverKind = 'Exact' | 'Approximate' | 'Heuristic' | 'Quantum-sampled';

/** How much to trust a result: exact enumerations are guarantees, the others are not. */
export function solverKind(key: string): { kind: SolverKind; why: string } {
  if (key.includes('brute')) return { kind: 'Exact', why: 'Checks every portfolio that obeys the rules, so its answer is the true optimum for this instance.' };
  if (key.includes('relax')) return { kind: 'Approximate', why: 'Solves an easier continuous version, then rounds to whole stocks. No guarantee of the optimum.' };
  if (key.includes('anneal')) return { kind: 'Heuristic', why: 'Randomised search that usually finds a good answer. No guarantee of the optimum.' };
  return { kind: 'Quantum-sampled', why: 'Samples portfolios from a simulated QAOA circuit and keeps the best rule-abiding sample. No guarantee of the optimum.' };
}

/** What the same number of uniform random draws would score. Only present in newer payloads. */
export interface ControlStats {
  p_opt?: number | null;
  feasible_rate?: number | null;
  approx_ratio?: number | null;
}

export function readControl(qaoa: QaoaResult | null | undefined): ControlStats | null {
  const c = (qaoa as { control?: ControlStats | null } | null | undefined)?.control;
  return c && typeof c === 'object' ? c : null;
}

/** QAOA metrics with every field checked: a payload without a landscape can send nulls. */
export function readMetrics(qaoa: QaoaResult | null | undefined) {
  const m = (qaoa?.metrics ?? {}) as Record<string, unknown>;
  const num = (v: unknown): number | null => (isNum(v) ? v : null);
  return {
    approxRatio: num(m.approx_ratio),
    pOpt: num(m.p_opt),
    pRandom: num(m.p_random),
    feasibleRate: num(m.feasible_rate)
  };
}

/**
 * Stock order behind a bitstring (x0 first). The screened list is used only when it reproduces every solver's own
 * bitstring-to-selection pair in this payload, so a wrong guess can never put a wrong name on a bit.
 */
export function verifiedStockOrder(result: RunResult | null | undefined): string[] | null {
  const kept = result?.screen?.kept;
  if (!result || !Array.isArray(kept) || kept.length === 0) return null;
  const pairs = (result.solvers ?? []).filter(s => s.bitstring && Array.isArray(s.selection));
  if (pairs.length === 0) return null;
  for (const s of pairs) {
    if (s.bitstring!.length !== kept.length) return null;
    const decoded = kept.filter((_, i) => s.bitstring![i] === '1');
    const chosen = new Set(s.selection!);
    if (decoded.length !== chosen.size || decoded.some(t => !chosen.has(t))) return null;
  }
  return kept;
}

/** Decode a bitstring into ticker symbols using a verified order, or null when the order is unknown. */
export function decodeBitstring(bits: string, order: string[] | null): string[] | null {
  if (!order || bits.length !== order.length) return null;
  return order.filter((_, i) => bits[i] === '1').map(shortTicker);
}

/** Join names as "A, B and C". */
export function joinNames(names: string[]): string {
  return names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}
