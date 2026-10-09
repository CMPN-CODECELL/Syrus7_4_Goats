// Small presentational pieces shared by the results components. Monochrome, square corners, no emoji.
import type { ReactNode } from 'react';
import { formatPct, trend } from '../../lib/format';

/** A return or gain: green with ▲ and +, red with ▼ and −. The sign and arrow mean colour is never the only signal. */
export function Gain({ value, digits = 1 }: { value: number | null | undefined; digits?: number }) {
  const { tone, arrow } = trend(value);
  return (
    <span className={`${tone} tabular-nums`}>
      {arrow && <span aria-hidden="true">{arrow} </span>}
      {formatPct(value, { sign: true, digits })}
    </span>
  );
}

/** A small label/value pair for use inside a <dl>. */
export function Fact({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="min-w-0 border-t border-line pt-2">
      <dt className="font-mono text-xs uppercase tracking-[0.08em] text-muted">{label}</dt>
      <dd className="mt-0.5 break-words text-base tabular-nums">{value}</dd>
      {hint && <dd className="mt-0.5 text-xs text-muted">{hint}</dd>}
    </div>
  );
}

export function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block border border-line-strong px-2 py-0.5 font-mono text-xs uppercase tracking-[0.08em] text-text">
      {children}
    </span>
  );
}

/** Shown wherever an optional backend field is absent. Never replaced by a made-up value. */
export function NotComputed() {
  return <span className="italic text-muted">not computed for this run</span>;
}

/** Horizontal-scroll wrapper for wide tables: a visible hint on small screens and a keyboard-focusable region. */
export function ScrollTable({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-xs text-muted sm:hidden">Scroll sideways to see every column.</p>
      <div role="region" aria-label={label} tabIndex={0} className="overflow-x-auto border border-line">
        {children}
      </div>
    </div>
  );
}

export const TH = 'px-3 py-2 text-left font-normal whitespace-nowrap';
export const THR = 'px-3 py-2 text-right font-normal whitespace-nowrap';
export const TD = 'px-3 py-2 align-top';
export const TDR = 'px-3 py-2 text-right align-top tabular-nums';
