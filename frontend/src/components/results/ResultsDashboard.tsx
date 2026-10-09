// The results dashboard: the portfolio first, the algorithms second. Takes no props; reads the latest run from
// useRun(). Everything shown comes from result.request / result (the run that produced it), never from the live form.
import { useState } from 'react';
import { useRun } from '../../state/run';
import { Section } from '../ui';
import { OutOfSample } from '../OutOfSample';
import { AllocationTable } from './AllocationTable';
import { KeyMetrics } from './KeyMetrics';
import { PortfolioSummary } from './PortfolioSummary';
import { ResultSummary } from './ResultSummary';
import { WhySelected } from './WhySelected';
import { asResultX, pickSolver } from './model';

export function ResultsDashboard() {
  const { result, isStale } = useRun();
  // The viewer's choice of solver applies to one run only; a new run falls back to the recommended solver.
  const [pick, setPick] = useState<{ runId: string; solver: string } | null>(null);

  if (!result) return null;
  const r = asResultX(result);
  const solver = pickSolver(r, pick && pick.runId === r.run_id ? pick.solver : null);
  const req = r.request;
  const priceDate = r.data?.est_window?.[1] ?? null;

  return (
    <>
      {isStale && (
        <div role="status" className="mb-6 border border-line-strong p-3 text-sm">
          These results are from your earlier settings. You have changed settings since, so they may not match what is selected now. Run again to update them.
        </div>
      )}

      <div>
        <div data-tour="results">
          <PortfolioSummary result={r} solver={solver} onPick={(id) => setPick({ runId: r.run_id, solver: id })} />
        </div>

        <div data-tour="verdict">
          <ResultSummary result={r} />
        </div>

        {solver && (
          <>
            <Section
              id="key-metrics"
              eyebrow="Key numbers"
              title="How the portfolio looks"
              lead="Estimates from historical prices, not predictions."
            >
              <KeyMetrics
                solver={solver}
                capital={req?.capital}
                estWindow={r.data?.est_window}
                testWindow={r.data?.test_window}
                holdingsCount={Object.keys(req?.holdings ?? {}).length}
                priceDate={priceDate}
              />
            </Section>

            <Section
              id="allocation"
              eyebrow="Allocation"
              title="What to hold"
              lead="Whole shares of each chosen stock, with the cash left over."
            >
              <AllocationTable solver={solver} capital={req?.capital} priceDate={priceDate} />
            </Section>

            <Section
              id="why-selected"
              eyebrow="Reasoning"
              title="Why these stocks"
              lead="Only figures the backend computed for this run are shown."
            >
              <WhySelected result={r} solver={solver} />
            </Section>

            <OutOfSample
              solvers={r.solvers ?? []}
              nifty50Benchmark={r.benchmarks?.nifty50}
              testWindow={r.data?.test_window}
              recommendedSolverId={r.recommended}
            />
          </>
        )}
      </div>
    </>
  );
}
