// Stress Test page: the market crash what-ifs for the latest run's portfolio, reachable from the sidebar.
import { useState } from 'react';
import type { RunResult } from '../api/types';
import { StressTest } from '../components/StressTest';
import { HistoricalReplay } from '../components/HistoricalReplay';

export function StressPage({ result, onGo }: { result: RunResult | null; onGo: () => void }) {
  const options = result?.solvers.filter((s) => s.feasible && s.portfolio?.rows.length) ?? [];
  const [pick, setPick] = useState<string | null>(null);
  const solver = options.find((s) => s.solver === (pick ?? result?.recommended)) ?? options[0];

  if (!result || !solver) {
    return (
      <section className="bg-surface border border-line p-6 max-w-2xl space-y-3">
        <h2 className="text-text">Market crash stress test</h2>
        <p className="text-muted">
          See how your portfolio might hold up in a market crash, a volatility spike or a sector shock. Run the optimiser first, then come back here.
        </p>
        <button type="button" onClick={onGo} className="px-4 py-2 bg-text text-bg text-sm uppercase hover:opacity-80">
          Go to Optimise
        </button>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <label className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted">Portfolio from</span>
        <select value={solver.solver} onChange={(e) => setPick(e.target.value)} className="border px-2 py-1">
          {options.map((s) => (
            <option key={s.solver} value={s.solver}>{s.label}{s.solver === result.recommended ? ' (recommended)' : ''}</option>
          ))}
        </select>
        <span className="text-muted">· {solver.portfolio?.rows.map((r) => r.symbol ?? r.ticker).join(', ')}</span>
      </label>
      <StressTest key={`${result.run_id}-${solver.solver}`} solver={solver} betas={result.betas} />
      <HistoricalReplay result={result} />
    </div>
  );
}
