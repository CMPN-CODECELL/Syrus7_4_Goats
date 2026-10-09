import React from 'react';
import { LandscapeSummary, QaoaResult, SolverResult } from '../api/types';
import { getSolverStyle } from '../lib/chartColors';
import { formatPct, isNum } from '../lib/format';
import { Section, WhatThisMeans } from './ui';
import { SolverMarker } from './SolverMarker';
import {
  TableBox,
  formatDecimal,
  formatSeconds,
  isExactOptimum,
  joinNames,
  readControl,
  readMetrics,
  shortTicker,
  solverKind
} from './ChartParts';

interface SolverTableProps {
  solvers: SolverResult[];
  recommendedId: string;
  selectedSolverKey: string;
  onSelectSolver?: (key: string) => void;
  /** Needed for the "exact optimum?" column: f_min is the lowest objective over all rule-abiding portfolios. */
  landscape?: LandscapeSummary | null;
  /** Needed for the QAOA sampling column and its random baseline. */
  qaoa?: QaoaResult | null;
}

const th = 'py-2.5 px-3 align-bottom';

export const SolverTable: React.FC<SolverTableProps> = ({ solvers, recommendedId, selectedSolverKey, onSelectSolver, landscape, qaoa }) => {
  const fMin = landscape?.f_min ?? null;
  const metrics = readMetrics(qaoa);
  const control = readControl(qaoa);
  const baseOpt = isNum(control?.p_opt) ? control!.p_opt : metrics.pRandom;

  const exactNames = (solvers ?? []).filter(s => s.feasible && isExactOptimum(s.objective, fMin)).map(s => s.label);
  const timed = (solvers ?? []).filter(s => isNum(s.runtime_s));
  const fastest = timed.length ? timed.reduce((a, b) => (b.runtime_s < a.runtime_s ? b : a)) : null;
  const brute = (solvers ?? []).find(s => s.solver === 'brute_force');
  const quantum = (solvers ?? []).filter(s => s.kind === 'quantum');

  // Sentences are built from this run's numbers only
  const notes: string[] = [];
  if (isNum(fMin)) {
    notes.push(
      exactNames.length === 0
        ? 'No method reached the exact optimum.'
        : exactNames.length === solvers.length
          ? 'Every method reached the exact optimum objective.'
          : `${joinNames(exactNames)} reached the exact optimum objective.`
    );
  }
  if (fastest) notes.push(`Fastest: ${fastest.label}, ${formatSeconds(fastest.runtime_s)}.`);
  if (brute && quantum.length) {
    for (const q of quantum) {
      const sameAnswer = isExactOptimum(q.objective, fMin);
      notes.push(
        `${q.label} took ${formatSeconds(q.runtime_s)} against ${formatSeconds(brute.runtime_s)} for brute force${sameAnswer ? ', which found the same optimum' : ''}. ` +
          `QAOA's time is a classical simulation of the circuit, so it says nothing about real quantum hardware speed.`
      );
    }
  }

  if (!solvers || solvers.length === 0) {
    return (
      <Section id="evidence-methods" eyebrow="05 · Methods" title="Compare Optimization Methods">
        <p className="text-sm text-muted">No solver results are available for this run.</p>
      </Section>
    );
  }

  return (
    <Section
      id="evidence-methods"
      eyebrow="05 · Methods"
      title="Compare Optimization Methods"
      lead="Every method below answered the same question: which stocks to hold, under the same rules, on the same data. Only the exact method is guaranteed to find the best answer."
    >
      <div className="bg-surface border border-line p-4 sm:p-5">
        <TableBox>
          <table className="w-full min-w-[56rem] text-left text-xs text-text">
            <thead>
              <tr className="border-b border-line">
                <th className={`${th} sticky left-0 bg-surface`}>Method</th>
                <th className={th}>Type</th>
                <th className={th}>Feasible</th>
                <th className={`${th} text-right`}>Objective</th>
                <th className={`${th} text-right`}>Runtime</th>
                <th className={`${th} text-right`}>Est. return</th>
                <th className={`${th} text-right`}>Volatility</th>
                <th className={th}>Exact optimum?</th>
                <th className={th}>Sampling stats</th>
              </tr>
            </thead>
            <tbody>
              {solvers.map(s => {
                const isSel = s.solver === selectedSolverKey;
                const kind = solverKind(s.solver);
                const exact = s.feasible && isExactOptimum(s.objective, fMin);
                const isQaoa = s.kind === 'quantum';
                const own = isQaoa && qaoa?.solver === s.solver;
                return (
                  <tr key={s.solver} className={`border-b border-line align-top ${isSel ? 'bg-line' : ''}`}>
                    <td className={`py-3 px-3 sticky left-0 ${isSel ? 'bg-line' : 'bg-surface'}`}>
                      <button
                        type="button"
                        onClick={() => onSelectSolver?.(s.solver)}
                        disabled={!onSelectSolver}
                        aria-pressed={isSel}
                        className="flex items-start gap-2 min-h-[44px] text-left disabled:cursor-default"
                      >
                        <span className="pt-0.5"><SolverMarker style={getSolverStyle(s.solver)} /></span>
                        <span>
                          <span className={`block ${isSel ? 'font-medium' : ''} text-text`}>{s.label}</span>
                          {s.solver === recommendedId && <span className="label text-text">Recommended</span>}
                          {isSel && <span className="label block text-muted">Selected</span>}
                        </span>
                      </button>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-text">{kind.kind}</span>
                    </td>
                    <td className="py-3 px-3">
                      {s.feasible && s.selection !== null ? 'Yes' : 'No feasible answer'}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums">{formatDecimal(s.objective, 5)}</td>
                    <td className="py-3 px-3 text-right tabular-nums">{formatSeconds(s.runtime_s)}</td>
                    <td className="py-3 px-3 text-right tabular-nums">{formatPct(s.exp_return)}</td>
                    <td className="py-3 px-3 text-right tabular-nums">{formatPct(s.volatility)}</td>
                    <td className="py-3 px-3">
                      {!isNum(fMin) ? '—' : !s.feasible ? 'No feasible answer' : exact ? 'Yes' : 'No'}
                    </td>
                    <td className="py-3 px-3 text-muted tabular-nums">
                      {isQaoa ? (
                        <div className="space-y-0.5">
                          <div>
                            <span className="text-text">P(optimum) {formatPct(s.p_opt, { digits: 2 })}</span>
                            {own && isNum(baseOpt) && <span> vs random {formatPct(baseOpt, { digits: 2 })}</span>}
                          </div>
                          <div>Feasible rate {formatPct(s.feasible_rate)}</div>
                          <div>Accuracy {formatPct(s.approx_ratio)}</div>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableBox>

        {notes.length > 0 && <p className="mt-3 text-sm text-text break-words">{notes.join(' ')}</p>}

        <dl className="mt-4 pt-4 border-t border-line grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs text-muted">
          {(['Exact', 'Approximate', 'Heuristic', 'Quantum-sampled'] as const).map(k => {
            const present = solvers.find(s => solverKind(s.solver).kind === k);
            if (!present) return null;
            return (
              <div key={k}>
                <dt className="inline text-text">{k}: </dt>
                <dd className="inline">{solverKind(present.solver).why}</dd>
              </div>
            );
          })}
        </dl>
      </div>

      <WhatThisMeans
        shows="Every method's answer to the same problem, with the numbers that matter first: is it valid, how good, how fast, and did it reach the exact optimum."
        infer="Which methods matched the exact optimum on this instance and how their run times compare. If the exact method is both fastest and correct, nothing is gained by the others here."
        cannot="That one method is better in general. This is one small instance, so it does not show that any method scales, and QAOA's time is a simulation on a classical computer."
      >
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Objective = q × variance − (1 − q) × (return − transaction cost), where q is your risk setting. Lower is better. Return and volatility are
            annualised estimation-window figures for the equal-weight portfolio, before transaction costs.
          </li>
          <li>
            "Exact optimum?" is Yes when the objective equals the lowest objective over all rule-abiding portfolios
            {isNum(fMin) ? ` (${formatDecimal(fMin, 5)})` : ''}, within 1e-9.
          </li>
          <li>
            Sampling stats apply to QAOA only: P(optimum) is the share of samples that are the exact optimum, Feasible rate the share that obey all rules,
            and Accuracy the average accuracy over all samples. "vs random" is the baseline from drawing uniformly at random.
          </li>
          <li>The returned answer of QAOA is the best rule-abiding portfolio among its samples, so it can be exact even when P(optimum) is small.</li>
        </ul>
      </WhatThisMeans>

      <details className="group mt-4 border-t border-line">
        <summary className="label cursor-pointer min-h-[44px] flex items-center gap-2 list-none [&::-webkit-details-marker]:hidden">
          <span aria-hidden="true" className="inline-block text-faint group-open:rotate-90">▸</span>
          Full technical table
        </summary>
        <div className="pb-2">
          <TableBox>
            <table className="w-full min-w-[64rem] text-left text-xs">
              <thead>
                <tr className="border-b border-line">
                  <th className={th}>Solver key</th>
                  <th className={th}>Kind</th>
                  <th className={th}>Bitstring</th>
                  <th className={th}>Stocks chosen</th>
                  <th className={`${th} text-right`}>Objective (unrounded)</th>
                  <th className={`${th} text-right`}>Variance</th>
                  <th className={`${th} text-right`}>Transaction cost</th>
                  <th className={th}>Rule violations</th>
                  <th className={`${th} text-right`}>Runtime</th>
                  <th className={th}>Solver details</th>
                </tr>
              </thead>
              <tbody>
                {solvers.map(s => (
                  <tr key={s.solver} className="border-b border-line align-top">
                    <td className="py-2.5 px-3 font-mono text-text">{s.solver}</td>
                    <td className="py-2.5 px-3">{s.kind}</td>
                    <td className="py-2.5 px-3 font-mono">{s.bitstring ?? '—'}</td>
                    <td className="py-2.5 px-3">{s.selection ? s.selection.map(shortTicker).join(', ') : '—'}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums">{isNum(s.objective) ? s.objective.toString() : '—'}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums">{formatDecimal(s.variance, 5)}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums">{formatPct(s.txn_cost, { digits: 3 })}</td>
                    <td className="py-2.5 px-3">{s.violations && s.violations.length ? s.violations.join('; ') : 'none'}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums">{formatSeconds(s.runtime_s)}</td>
                    <td className="py-2.5 px-3 text-muted break-words">
                      {Object.entries(s.details ?? {}).length === 0
                        ? '—'
                        : Object.entries(s.details ?? {})
                            .map(([key, v]) => `${key}: ${Array.isArray(v) ? `[${v.length} values]` : typeof v === 'object' && v !== null ? '{…}' : String(v)}`)
                            .join('; ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableBox>
        </div>
      </details>
    </Section>
  );
};
