// A. Portfolio summary: the portfolio comes first. Title, sentence and numbers are all generated from the run.
import { formatINR, formatInt, isNum } from '../../lib/format';
import { Section, Status } from '../ui';
import { Fact } from './parts';
import {
  describeRun, isUsable, portfolioTitle, selectionKey, windowText, type ResultX, type UsableSolver,
} from './model';

export function PortfolioSummary({ result, solver, onPick }: {
  result: ResultX;
  solver: UsableSolver | null;
  onPick: (solverId: string) => void;
}) {
  const solvers = result.solvers ?? [];
  const usable = solvers.filter(isUsable);
  const title = portfolioTitle(result, solver);

  if (!solver) {
    return (
      <Section id="portfolio-summary" eyebrow="Your result" title={title}>
        <Status error>
          No method returned a feasible portfolio for these settings, so there is no allocation to show. Loosen a constraint
          (for example raise the sector limit or lower the target return) and run again. The verification section below
          lists what each method found.
        </Status>
      </Section>
    );
  }

  const capital = result.request.capital;
  const p = solver.portfolio;
  const txnRupees = isNum(solver.txn_cost) && isNum(capital) ? solver.txn_cost * capital : null;
  const allSame = usable.length > 1 && new Set(usable.map((s) => selectionKey(s.selection))).size === 1;
  const unusable = solvers.filter((s) => !isUsable(s));

  return (
    <Section id="portfolio-summary" eyebrow="Your result" title={title} lead={describeRun(result, solver)}>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 md:grid-cols-4">
        <Fact label="Amount" value={formatINR(capital)} />
        <Fact label="Holdings" value={`${formatInt(solver.selection.length)} stocks`} />
        <Fact label="Invested" value={formatINR(p.invested)} />
        <Fact label="Uninvested cash" value={formatINR(p.cash_left)} hint="Left over after buying whole shares" />
        <Fact label="Transaction costs" value={formatINR(txnRupees)} hint="Estimated, from assumed buy and sell rates" />
        <Fact label="Snapshot date" value={result.data?.as_of ?? '—'} hint={result.data?.source ? `Price data: ${result.data.source}` : undefined} />
        <Fact label="Estimation window" value={windowText(result.data?.est_window)} hint="History the optimiser learned from" />
        <Fact label="Test window" value={windowText(result.data?.test_window)} hint="Later period used only to check the picks" />
      </dl>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
        <label htmlFor="portfolio-solver" className="text-muted">Portfolio from</label>
        <select
          id="portfolio-solver"
          value={solver.solver}
          onChange={(e) => onPick(e.target.value)}
          className="min-h-[44px] border bg-bg px-2 text-sm"
        >
          {solvers.map((s) => (
            <option key={s.solver} value={s.solver} disabled={!isUsable(s)}>
              {s.label}{s.solver === result.recommended ? ' (recommended)' : ''}{isUsable(s) ? '' : ' (no feasible portfolio)'}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-1 space-y-1 text-xs text-muted">
        {allSame && <p>All {usable.length} methods that found a feasible portfolio chose the same stocks, so this choice does not change the allocation.</p>}
        {unusable.length > 0 && <p>No feasible portfolio from: {unusable.map((s) => s.label).join(', ')}.</p>}
      </div>
    </Section>
  );
}
