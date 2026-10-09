// Market crash stress tests: three what-if scenarios on the chosen portfolio, computed from this run's own numbers.
// Betas and volatility come from the estimation window only. These are estimates, not predictions.
import { useMemo, useState } from 'react';
import type { SolverResult } from '../api/types';
import { formatINR, formatPct } from '../lib/format';

const Z95 = 1.645; // one-sided 95% normal quantile

function Slider({ label, value, min, max, step, onChange, show }: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; show: string;
}) {
  return (
    <label className="block text-sm">
      <span className="flex justify-between"><span className="text-muted">{label}</span><span className="font-medium">{show}</span></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full mt-1" />
    </label>
  );
}

function Loss({ pct, amount }: { pct: number; amount: number }) {
  return (
    <p className="mt-3 text-2xl font-medium text-loss">
      ▼ {formatPct(-pct, { sign: true })} <span className="text-base">(−{formatINR(amount)})</span>
    </p>
  );
}

export function StressTest({ solver, betas }: { solver: SolverResult; betas?: Record<string, number> | null }) {
  const rows = solver.portfolio?.rows ?? [];
  const invested = solver.portfolio?.invested ?? 0;
  const [drop, setDrop] = useState(20);
  const [volX, setVolX] = useState(2);
  const sectors = useMemo(() => {
    const m = new Map<string, number>();
    rows.forEach((r) => m.set(r.sector, (m.get(r.sector) ?? 0) + r.value / invested));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows, invested]);
  const [sector, setSector] = useState<string | null>(null);
  const [sectorDrop, setSectorDrop] = useState(25);

  if (!rows.length || invested <= 0) return null;

  // 1. Market-wide crash: portfolio beta times the market fall.
  const known = rows.filter((r) => betas?.[r.ticker] !== undefined);
  const beta = rows.reduce((s, r) => s + (r.value / invested) * (betas?.[r.ticker] ?? 1), 0);
  const crash = Math.max(0, beta * drop / 100);

  // 2. Volatility spike: 95% one-month loss bound, normal vs stressed volatility.
  const vol = solver.volatility ?? 0;
  const monthLoss = (k: number) => Math.min(1, Z95 * vol * k / Math.sqrt(12));

  // 3. Sector shock: one sector falls, the rest is unchanged.
  const [topName, topW] = sectors[0];
  const chosen = sector ?? topName;
  const chosenW = sectors.find(([s]) => s === chosen)?.[1] ?? 0;
  const sectorLoss = chosenW * sectorDrop / 100;

  return (
    <section className="bg-surface border border-line p-4 sm:p-5 space-y-4" aria-labelledby="stress-title">
      <div>
        <h3 id="stress-title" className="text-base text-text">Market crash stress test</h3>
        <p className="text-sm text-muted mt-1">
          How this portfolio of {formatINR(invested)} might hold up in a bad market, before you invest real money.
          What-if estimates from historical data, not predictions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-bg border border-line p-4">
          <h4 className="text-sm">1. Market-wide crash</h4>
          <Slider label="The market falls by" value={drop} min={5} max={40} step={5} onChange={setDrop} show={`${drop}%`} />
          <Loss pct={crash} amount={invested * crash} />
          <p className="text-sm text-muted mt-2">
            Value after the fall: {formatINR(invested * (1 - crash))}. Your portfolio moves about {beta.toFixed(2)}× the market
            {beta > 1.05 ? ', so it would fall more than the market' : beta < 0.95 ? ', so it would fall less than the market' : ', about the same as the market'}.
          </p>
          <details className="text-xs text-muted mt-2">
            <summary className="cursor-pointer">How this is worked out</summary>
            Loss = portfolio beta × market fall. Beta is each stock's sensitivity to the equal-weight average of your stock list,
            from the estimation window only{known.length < rows.length ? '; stocks without a beta count as 1.0' : ''}. In real crashes,
            stocks tend to fall together, so actual losses can be larger.
          </details>
        </div>

        <div className="bg-bg border border-line p-4">
          <h4 className="text-sm">2. Volatility spike</h4>
          <div className="mt-1 flex gap-2" role="group" aria-label="How much more prices swing">
            {[1.5, 2, 3].map((k) => (
              <button key={k} type="button" onClick={() => setVolX(k)} aria-pressed={volX === k}
                className={`px-3 py-1 border text-sm ${volX === k ? 'border-accent-blue text-accent-blue-hover' : 'border-line-strong text-muted'}`}>
                {k}× swings
              </button>
            ))}
          </div>
          <Loss pct={monthLoss(volX)} amount={invested * monthLoss(volX)} />
          <p className="text-sm text-muted mt-2">
            Bad month (1 in 20) if prices swing {volX}× more than usual. In a normal market it is {formatPct(monthLoss(1))} ({formatINR(invested * monthLoss(1))}).
            Yearly volatility rises from {formatPct(vol)} to {formatPct(vol * volX)}.
          </p>
          <details className="text-xs text-muted mt-2">
            <summary className="cursor-pointer">How this is worked out</summary>
            95% one-month loss bound = 1.645 × yearly volatility × multiplier ÷ √12, assuming normal returns. Real markets have fatter tails.
          </details>
        </div>

        <div className="bg-bg border border-line p-4">
          <h4 className="text-sm">3. Sector-specific shock</h4>
          <label className="block text-sm mt-1">
            <span className="text-muted">Sector that falls</span>
            <select value={chosen} onChange={(e) => setSector(e.target.value)} className="w-full mt-1 border px-2 py-1">
              {sectors.map(([s, w]) => <option key={s} value={s}>{s} ({formatPct(w, { digits: 0 })} of portfolio)</option>)}
            </select>
          </label>
          <Slider label="It falls by" value={sectorDrop} min={5} max={50} step={5} onChange={setSectorDrop} show={`${sectorDrop}%`} />
          <Loss pct={sectorLoss} amount={invested * sectorLoss} />
          <p className="text-sm text-muted mt-2">
            {formatPct(chosenW, { digits: 0 })} of your money is in {chosen}; the rest is assumed unchanged.
            {topW > 0.4 ? ` Warning: ${formatPct(topW, { digits: 0 })} sits in one sector (${topName}), which is a large concentration.` : ` Your largest sector is ${formatPct(topW, { digits: 0 })} (${topName}).`}
          </p>
        </div>
      </div>
    </section>
  );
}
