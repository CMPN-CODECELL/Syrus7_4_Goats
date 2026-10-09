// E. Plain-English result summary and honesty report. Every statement is generated from the run's own fields;
// nothing is claimed as feasible, exact or optimal unless a field says so.
import { formatInt, formatPct, isNum } from '../../lib/format';
import { Section } from '../ui';
import { HonestyPanel } from '../HonestyPanel';
import { Badge, ScrollTable, TD, TDR, TH, THR } from './parts';
import {
  exactObjective, fmtSeconds, gapVsExact, isUsable, methodClass, MATCH_TOL, type ResultX,
} from './model';
import type { SolverResult } from '../../api/types';

interface Answer { yes: 'yes' | 'no' | 'unknown'; headline: string; detail: string[] }

/** Did QAOA find the exact optimum? Answered only from the solver fields and the exact reference. */
function qaoaAnswer(r: ResultX, exact: number | null): Answer {
  const q = (r.solvers ?? []).find((s) => s.kind === 'quantum');
  const shots = r.request?.qaoa?.shots;
  if (!q) return { yes: 'unknown', headline: 'QAOA is not part of this result.', detail: [] };

  const detail: string[] = [];
  const samples = r.qaoa?.samples ?? [];
  const top = samples.length ? samples.reduce((a, b) => (b.prob > a.prob ? b : a)) : null;
  if (top) {
    detail.push(top.optimal
      ? 'Its single most probable bitstring was the exact optimum.'
      : top.feasible
        ? 'Its single most probable bitstring was feasible but not the optimum.'
        : 'Its single most probable bitstring was infeasible.');
  }
  const best = isNum(shots)
    ? `QAOA reports the best feasible portfolio among its ${formatInt(shots)} sampled shots.`
    : 'QAOA reports the best feasible portfolio among its sampled shots.';

  if (!isUsable(q)) {
    const rate = isNum(q.feasible_rate) ? q.feasible_rate : r.qaoa?.metrics?.feasible_rate;
    return {
      yes: 'no',
      headline: 'QAOA did not return a feasible portfolio.',
      detail: [
        `No sampled bitstring met every constraint that was set. Share of feasible shots: ${formatPct(rate, { digits: 2 })}.`,
        ...(q.violations?.length ? [`Reported violations: ${q.violations.join('; ')}.`] : []),
      ],
    };
  }
  const gap = gapVsExact(q.objective, exact);
  if (gap === null) {
    return {
      yes: 'unknown',
      headline: 'QAOA returned a feasible portfolio, but this result has no exact optimum to compare it with.',
      detail: [best, ...detail],
    };
  }
  if (Math.abs(gap) <= MATCH_TOL) {
    return {
      yes: 'yes',
      headline: 'QAOA\'s best feasible sample has the same objective value as the exact optimum.',
      detail: [best, ...detail],
    };
  }
  if (gap < 0) {
    return {
      yes: 'unknown',
      headline: 'QAOA reports a lower objective than the exact reference, which should not happen. Treat this result with caution.',
      detail: [best],
    };
  }
  return {
    yes: 'no',
    headline: `QAOA's best feasible sample scores ${formatPct(gap, { digits: 1 })} worse than the exact optimum (lower objective is better).`,
    detail: [best, ...detail],
  };
}

/** One line per solver: what it returned, judged against the exact optimum. Never says "optimal" without a check. */
function outcome(s: SolverResult, exact: number | null, nFeasible: number | null): string {
  if (!isUsable(s)) {
    if (s.violations?.length) return `Infeasible: ${s.violations.join('; ')}`;
    return s.kind === 'quantum' ? 'Infeasible: no sampled bitstring met every constraint' : 'Infeasible: no feasible portfolio found';
  }
  const gap = gapVsExact(s.objective, exact);
  if (s.solver === 'brute_force') {
    return `Feasible. Exact optimum${isNum(nFeasible) ? ` among ${formatInt(nFeasible)} feasible portfolios` : ''}, found by checking all of them.`;
  }
  if (gap === null) return 'Feasible. No exact optimum available to compare against.';
  if (Math.abs(gap) <= MATCH_TOL) return 'Feasible. Same objective value as the exact optimum.';
  return gap > 0 ? `Feasible, but ${formatPct(gap, { digits: 1 })} worse than the exact optimum.` : 'Feasible. Objective is below the exact reference (unexpected).';
}

const ANSWER_TAG: Record<Answer['yes'], string> = { yes: 'Yes', no: 'No', unknown: 'Not established' };

export function ResultSummary({ result }: { result: ResultX }) {
  const solvers = result.solvers ?? [];
  const exact = exactObjective(result);
  const nFeasible = isNum(result.landscape?.n_feasible) ? result.landscape.n_feasible : null;
  const answer = qaoaAnswer(result, exact);
  const req = result.request;
  const kept = result.screen?.kept ?? [];
  const keptSet = new Set(kept);

  const bf = solvers.find((s) => s.solver === 'brute_force');
  const q = solvers.find((s) => s.kind === 'quantum');

  // Same-instance check: all picks come from the shortlist and hold exactly K stocks.
  const picks = solvers.filter(isUsable);
  const allFromShortlist = picks.every((s) => s.selection.every((t) => keptSet.has(t)));
  const allSizeK = picks.every((s) => s.selection.length === req.k);

  const nVars = result.qubo?.n_vars;
  const seed = result.qaoa?.circuit?.seed;

  const limits: string[] = [];
  if (isNum(nVars)) {
    limits.push(`Small instance: ${formatInt(nVars)} binary variables (${formatInt(result.qubo?.n_assets)} stocks plus ${formatInt(result.qubo?.n_slack)} slack), simulated on a classical computer. A result at this size does not show how QAOA would scale.`);
  }
  if (bf && q) {
    limits.push(`Runtime: brute force took ${fmtSeconds(bf.runtime_s)} and QAOA took ${fmtSeconds(q.runtime_s)}. At this size an exact classical search is fast, so no speed benefit is claimed.`);
  }
  if (isNum(seed)) limits.push(`One run with one random seed (${seed}): a single run cannot show how reliably QAOA reaches the optimum. The Evidence tab has multi-seed studies.`);
  limits.push('Returns and volatility are estimates from historical prices. They are not forecasts or guarantees.');
  for (const n of result.data?.notes ?? []) limits.push(`Data note: ${n}`);
  for (const [t, why] of Object.entries(result.data?.excluded ?? {})) limits.push(`Excluded ${t}: ${why}`);

  return (
    <Section
      id="honesty-report"
      eyebrow="Verification"
      title="What the solvers found"
      lead="Generated from this run's own results. Nothing here is a fixed message."
    >
      <div className="border border-line-strong bg-surface p-4">
        <p className="font-mono text-xs uppercase tracking-[0.08em] text-muted">Did QAOA find the exact optimum?</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <Badge>{ANSWER_TAG[answer.yes]}</Badge>
          <p className="text-base">{answer.headline}</p>
        </div>
        {answer.detail.length > 0 && (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
            {answer.detail.map((d) => <li key={d}>{d}</li>)}
          </ul>
        )}
      </div>

      <h3 className="mt-6 mb-2 font-display text-lg uppercase font-light">Each method, and how far to trust it</h3>
      <ScrollTable label="Result of each solver">
        <table className="w-full min-w-[40rem] text-sm">
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className={TH}>Method</th>
              <th scope="col" className={TH}>Type</th>
              <th scope="col" className={TH}>Result</th>
              <th scope="col" className={THR}>Runtime</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {solvers.map((s) => {
              const cls = methodClass(s.solver);
              return (
                <tr key={s.solver}>
                  <th scope="row" className={`${TD} text-left font-normal`}>
                    {s.label}
                    {s.solver === result.recommended && <span className="block text-xs text-muted">recommended</span>}
                  </th>
                  <td className={TD}>
                    {cls.label}
                    <span className="block max-w-[16rem] text-xs text-muted">{cls.how}</span>
                  </td>
                  <td className={TD}>{outcome(s, exact, nFeasible)}</td>
                  <td className={TDR}>{fmtSeconds(s.runtime_s)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </ScrollTable>
      {isNum(exact) && (
        <p className="mt-1 text-xs text-muted">
          Exact means checked against every candidate. Heuristic and approximate methods can miss the optimum, so each result is compared with the exact one above.
        </p>
      )}

      {result.qaoa && (
        <div className="mt-6">
          <HonestyPanel verdict={result.verdict} qaoaResult={result.qaoa} shots={req?.qaoa?.shots} nFeasible={nFeasible} />
        </div>
      )}

      <h3 className="mt-6 mb-2 font-display text-lg uppercase font-light">Same problem for every method?</h3>
      <p className="text-sm">
        {picks.length === 0
          ? 'No method returned a feasible portfolio, so there is nothing to check.'
          : allFromShortlist && allSizeK
            ? `Yes. All ${solvers.length} methods belong to one run (${result.run_id}) with one set of settings (K = ${req.k}, q = ${req.risk_aversion}${isNum(req.sector_cap) ? `, sector limit ${req.sector_cap}` : ''}) and one shortlist of ${formatInt(kept.length)} stocks. Every portfolio returned holds exactly ${req.k} stocks, all from that shortlist.`
            : 'Not confirmed. At least one returned portfolio is not exactly K stocks from the shortlist, so the methods may not have solved the same problem.'}
      </p>

      <h3 className="mt-6 mb-2 font-display text-lg uppercase font-light">Limits</h3>
      <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
        {limits.map((l) => <li key={l}>{l}</li>)}
      </ul>

      <p className="mt-4 border border-line-strong p-3 font-mono text-sm uppercase tracking-[0.08em]">
        No quantum advantage is claimed.
      </p>
    </Section>
  );
}
