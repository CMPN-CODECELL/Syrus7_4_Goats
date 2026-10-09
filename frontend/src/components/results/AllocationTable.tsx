// C. Allocation: the main element. A sortable table, a totals block that reconciles with the capital,
// a note on deviation from equal weights, and a CSS-only bar list of each position's share of capital.
import { useMemo, useState } from 'react';
import type { SolverResult } from '../../api/types';
import { formatINR, formatInt, formatPct, isNum } from '../../lib/format';
import { WhatThisMeans } from '../ui';
import { ScrollTable, TD, TDR } from './parts';
import { formatPrice, symbolOf, weightsEqual } from './model';

type SortKey = 'symbol' | 'name' | 'sector' | 'weight' | 'shares' | 'price' | 'value';
type Dir = 'asc' | 'desc';

const COLUMNS: { key: SortKey; label: string; numeric: boolean }[] = [
  { key: 'symbol', label: 'Symbol', numeric: false },
  { key: 'name', label: 'Company', numeric: false },
  { key: 'sector', label: 'Sector', numeric: false },
  { key: 'weight', label: 'Weight', numeric: true },
  { key: 'shares', label: 'Whole shares', numeric: true },
  { key: 'price', label: 'Price', numeric: true },
  { key: 'value', label: 'Position value', numeric: true },
];

interface AllocationTableProps {
  solver: SolverResult;
  /** Capital of the run. Falls back to invested plus cash when omitted. */
  capital?: number | null;
  /** End of the estimation window: the date of the prices used to buy shares. */
  priceDate?: string | null;
}

export function AllocationTable({ solver, capital, priceDate }: AllocationTableProps) {
  const [sort, setSort] = useState<{ key: SortKey; dir: Dir }>({ key: 'value', dir: 'desc' });
  const p = solver.portfolio;
  const rows = p?.rows ?? [];

  const sorted = useMemo(() => {
    const col = COLUMNS.find((c) => c.key === sort.key)!;
    const val = (r: (typeof rows)[number]) => (sort.key === 'symbol' ? symbolOf(r) : r[sort.key]);
    const out = [...rows].sort((a, b) => {
      const x = val(a), y = val(b);
      return col.numeric ? (Number(x) || 0) - (Number(y) || 0) : String(x ?? '').localeCompare(String(y ?? ''));
    });
    return sort.dir === 'asc' ? out : out.reverse();
  }, [rows, sort]);

  if (!p || rows.length === 0) return null;

  const invested = p.invested;
  const cash = p.cash_left;
  const cap = isNum(capital) ? capital : invested + cash;
  const rowsTotal = rows.reduce((t, r) => t + (isNum(r.value) ? r.value : 0), 0);

  // Reconciliation: the rows must add up to "invested", and invested plus cash must equal the capital.
  const capDiff = isNum(cap) && isNum(invested) && isNum(cash) ? cap - (invested + cash) : null;
  const rowDiff = isNum(invested) ? rowsTotal - invested : null;
  const unreconciled = [capDiff, rowDiff].some((d) => isNum(d) && Math.abs(d) >= 1);

  // Deviation from equal weights caused by whole-share rounding.
  const k = rows.length;
  const eq = weightsEqual(rows);
  const shares = rows.map((r) => (isNum(cap) && cap > 0 && isNum(r.value) ? r.value / cap : null)).filter(isNum);
  const minShare = shares.length ? Math.min(...shares) : null;
  const maxShare = shares.length ? Math.max(...shares) : null;
  const unbought = rows.filter((r) => r.shares === 0);

  const onSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: COLUMNS.find((c) => c.key === key)!.numeric ? 'desc' : 'asc' }));

  // Bars are drawn to scale: a full bar is the largest share rounded up to the next 5% of capital.
  const cashShare = isNum(cap) && cap > 0 ? cash / cap : null;
  const top = Math.max(maxShare ?? 0, cashShare ?? 0);
  const scale = Math.max(0.05, Math.ceil(top * 20) / 20);

  return (
    <div>
      <ScrollTable label="Allocation table">
        <table className="w-full min-w-[46rem] text-sm">
          <thead>
            <tr className="border-b border-line">
              {COLUMNS.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  aria-sort={sort.key === c.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                  className={`px-1 py-0 font-normal ${c.numeric ? 'text-right' : 'text-left'}`}
                >
                  <button
                    type="button"
                    onClick={() => onSort(c.key)}
                    className={`inline-flex min-h-[44px] items-center gap-1 px-2 font-mono text-[11px] uppercase tracking-[0.08em] text-muted hover:text-text ${c.numeric ? 'flex-row-reverse' : ''}`}
                  >
                    <span>{c.label}{c.key === 'price' && priceDate ? ` (as of ${priceDate})` : ''}</span>
                    <span aria-hidden="true" className="w-3 text-text">{sort.key === c.key ? (sort.dir === 'asc' ? '↑' : '↓') : ''}</span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {sorted.map((r) => (
              <tr key={r.ticker}>
                <th scope="row" className={`${TD} text-left font-mono text-sm font-normal`}>{symbolOf(r)}</th>
                <td className={TD}>{r.name || '—'}</td>
                <td className={TD}>{r.sector || '—'}</td>
                <td className={TDR}>{formatPct(r.weight)}</td>
                <td className={TDR}>{formatInt(r.shares)}</td>
                <td className={TDR}>{formatPrice(r.price)}</td>
                <td className={TDR}>{formatINR(r.value)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-line-strong">
            <tr>
              <th scope="row" colSpan={6} className={`${TD} text-left font-normal`}>Total invested</th>
              <td className={TDR}>{formatINR(invested)}</td>
            </tr>
            <tr>
              <th scope="row" colSpan={6} className={`${TD} text-left font-normal`}>Uninvested cash</th>
              <td className={TDR}>{formatINR(cash)}</td>
            </tr>
            <tr className="border-t border-line">
              <th scope="row" colSpan={6} className={`${TD} text-left font-medium`}>Your capital</th>
              <td className={`${TDR} font-medium`}>{formatINR(cap)}</td>
            </tr>
          </tfoot>
        </table>
      </ScrollTable>
      {unreconciled && (
        <p className="mt-1 text-xs text-muted">
          Rounding difference {formatINR(Math.abs(capDiff !== null && Math.abs(capDiff) >= 1 ? capDiff : rowDiff ?? 0))}: the amounts above do not add up exactly
          {capDiff !== null && Math.abs(capDiff) >= 1 ? ' to your capital' : ' to the invested total'}.
        </p>
      )}

      <p className="mt-3 text-sm text-muted">
        {eq ? `Target weights are equal at ${formatPct(1 / k)} each (1 in ${k}). ` : 'Target weights are as returned by the optimiser. '}
        {minShare !== null && maxShare !== null && (
          <>
            Because only whole shares can be bought, the amount in each stock ranges from {formatPct(minShare, { digits: 2 })} to {formatPct(maxShare, { digits: 2 })} of your capital
            {eq ? ', so the portfolio is close to, but not exactly, equally weighted' : ''}.
          </>
        )}
        {unbought.length > 0 && <> {unbought.map(symbolOf).join(', ')} could not be bought because one share costs more than its budget.</>}
        {' '}Prices are adjusted closing prices{priceDate ? ` on ${priceDate}` : ''} (the end of the estimation window), not live quotes, so real purchases would use different prices.
      </p>

      <h3 className="mt-6 mb-2 font-display text-lg uppercase font-light">Share of your capital</h3>
      <ul aria-label="Each position and the cash left, as a share of your capital" className="space-y-1">
        {sorted.map((r) => {
          const s = isNum(cap) && cap > 0 && isNum(r.value) ? r.value / cap : null;
          return (
            <li key={r.ticker} className="grid grid-cols-[5.5rem_1fr_4rem] items-center gap-2 text-sm">
              <span className="truncate font-mono text-xs">{symbolOf(r)}</span>
              <span aria-hidden="true" className="block h-3 bg-line">
                <span className="block h-full bg-text" style={{ width: `${s === null ? 0 : Math.min(100, (s / scale) * 100)}%` }} />
              </span>
              <span className="text-right tabular-nums">{formatPct(s)}</span>
            </li>
          );
        })}
        <li className="grid grid-cols-[5.5rem_1fr_4rem] items-center gap-2 text-sm text-muted">
          <span className="font-mono text-xs">Cash</span>
          <span aria-hidden="true" className="block h-3 bg-line">
            <span className="block h-full border border-line-strong" style={{ width: `${cashShare === null ? 0 : Math.min(100, (cashShare / scale) * 100)}%` }} />
          </span>
          <span className="text-right tabular-nums">{formatPct(cashShare)}</span>
        </li>
      </ul>
      <p className="mt-1 text-xs text-muted">Bars are drawn to scale: a full bar is {formatPct(scale, { digits: 0 })} of your capital. Filled bars are stocks; the outlined bar is cash.</p>

      <WhatThisMeans
        shows="How your capital would be split across the chosen stocks in whole shares, using the last prices of the estimation window."
        infer="How concentrated the portfolio is, how much sits in each sector, and how much cash is left over."
        cannot="That these exact share counts can be bought today, or that the portfolio will gain value. Prices move, so real trades will differ from these figures. Estimates are not guarantees."
      />
    </div>
  );
}
