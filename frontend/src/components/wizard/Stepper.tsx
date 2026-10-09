// The visible progress indicator and the always-on summary of the current selections.
import type { Asset, RunRequest } from '../../api/types';
import { formatINR, formatINRCompact, formatPct, isNum } from '../../lib/format';
import { profileForQ } from '../../lib/riskProfiles';
import type { WizardStep } from '../../state/validate';
import { pickedTickers } from '../../state/validate';

const STEPS: { n: WizardStep; label: string }[] = [
  { n: 1, label: 'Build' },
  { n: 2, label: 'Preferences' },
  { n: 3, label: 'Review' },
  { n: 4, label: 'Run' },
];

export function Stepper({ step, maxStep, onGo }: { step: WizardStep; maxStep: WizardStep; onGo: (s: WizardStep) => void }) {
  return (
    <nav aria-label="Optimize steps">
      <ol className="grid grid-cols-4 gap-1 sm:gap-2">
        {STEPS.map(({ n, label }) => {
          const current = n === step;
          const reachable = n <= maxStep;
          const done = n < step;
          return (
            <li key={n}>
              <button
                type="button"
                disabled={!reachable}
                aria-current={current ? 'step' : undefined}
                onClick={() => onGo(n)}
                className={`flex min-h-[44px] w-full flex-col items-center justify-center gap-0.5 border px-1 py-1 sm:flex-row sm:gap-2 ${
                  current
                    ? 'border-text bg-text text-bg'
                    : reachable
                      ? 'border-line-strong bg-bg text-text hover:border-text'
                      : 'border-line bg-bg text-faint'
                }`}
              >
                <span className="font-mono text-xs" aria-hidden="true">{done ? '✓' : n}</span>
                <span className="text-xs sm:text-sm">
                  <span className="sr-only">Step {n} of 4: </span>{label}
                  {done && <span className="sr-only"> (completed)</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export interface SummaryRow {
  key: string;
  label: string;
  value: string;
  step: WizardStep;
}

/** One place that words the current selections, used by the summary bar and the review step. */
export function buildSummary(config: RunRequest, assets: Asset[], research: boolean): SummaryRow[] {
  const profile = profileForQ(config.risk_aversion);
  const available = assets.filter((a) => !a.excluded_reason).length;
  const picks = pickedTickers(config.tickers, assets).length;
  const held = Object.keys(config.holdings).length;
  const q = Number.isFinite(config.risk_aversion) ? config.risk_aversion : NaN;
  return [
    { key: 'amount', label: 'Investment amount', step: 1,
      value: isNum(config.capital) && config.capital > 0 ? `${formatINR(config.capital)} (${formatINRCompact(config.capital)})` : 'Not valid' },
    { key: 'universe', label: 'Stock universe', step: 1,
      value: config.tickers === null ? `NIFTY 50, all ${available} stocks with data` : `Your own list of ${picks} stocks` },
    { key: 'k', label: 'Number of holdings (K)', step: 1, value: isNum(config.k) ? `${config.k} companies` : 'Not valid' },
    { key: 'risk', label: 'Risk preference', step: 2,
      value: `${profile ? profile.label : 'Custom q'}${research ? ` (q = ${Number.isFinite(q) ? q : 'not valid'})` : ''}` },
    { key: 'sector', label: 'Industry limit', step: 2,
      value: config.sector_cap === null ? 'No limit' : `At most ${config.sector_cap} per industry` },
    { key: 'target', label: 'Minimum estimated return', step: 2,
      value: config.target_return === null ? 'None' : `At least ${formatPct(config.target_return)} a year, after costs` },
    { key: 'holdings', label: 'Existing holdings', step: 2,
      value: held > 0 ? `${held} stock${held === 1 ? '' : 's'}` : 'None, starting from cash' },
  ];
}

const SHORT: Record<string, string> = {
  amount: 'Amount', universe: 'Universe', k: 'Holdings', risk: 'Risk', sector: 'Industry limit', target: 'Min. return', holdings: 'Existing',
};

/** A compact, always-visible summary of what is selected so far. */
export function SummaryBar({ rows, stale }: { rows: SummaryRow[]; stale: boolean }) {
  const short = (r: SummaryRow) => {
    switch (r.key) {
      case 'amount': return r.value.split(' (')[0];
      case 'universe': return r.value.startsWith('NIFTY') ? 'NIFTY 50' : r.value.replace('Your own list of ', '');
      case 'k': return r.value.replace(' companies', '');
      case 'sector': return r.value.replace('At most ', '').replace(' per industry', '');
      case 'target': return r.value === 'None' ? 'None' : r.value.replace('At least ', '').replace(' a year, after costs', '');
      case 'holdings': return r.value.startsWith('None') ? 'None' : r.value;
      default: return r.value;
    }
  };
  return (
    <section aria-label="Your selections so far" className="border border-line bg-surface p-3">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4 lg:grid-cols-7">
        {rows.map((r) => (
          <div key={r.key} className="min-w-0">
            <dt className="font-mono text-xs uppercase tracking-[0.08em] text-muted">{SHORT[r.key]}</dt>
            <dd className="truncate text-sm text-text" title={r.value}>{short(r)}</dd>
          </div>
        ))}
      </dl>
      {stale && (
        <p className="mt-2 border-t border-line pt-2 text-sm text-text">
          <span aria-hidden="true">⚠ </span>Settings changed since your last results. Those results are out of date.
        </p>
      )}
    </section>
  );
}
