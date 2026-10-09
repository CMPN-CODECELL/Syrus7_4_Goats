import React, { useMemo } from 'react';
import { Sample } from '../api/types';
import { formatPct, isNum } from '../lib/format';
import { Section, WhatThisMeans } from './ui';
import { ShowData, TableBox, decodeBitstring, formatDecimal } from './ChartParts';

interface BitstringHistogramProps {
  samples: Sample[];
  /** Total probability of the exact optimum over all shots, from qaoa.metrics.p_opt. */
  pOpt?: number | null;
  /** Chance of drawing the optimum by a uniform random pick (baseline), from qaoa.metrics.p_random or qaoa.control.p_opt. */
  pBaseline?: number | null;
  /** Total probability of rule-abiding samples over all shots, from qaoa.metrics.feasible_rate. */
  feasibleRate?: number | null;
  /** Stock order behind each bit (x0 first), only when verified against the solvers' own answers. */
  stockOrder?: string[] | null;
}

type State = 'optimal' | 'feasible' | 'infeasible';

const STATE_LABEL: Record<State, string> = { optimal: '★ Optimal', feasible: 'Feasible', infeasible: 'Infeasible' };
const BAR_CLASS: Record<State, string> = {
  optimal: 'bg-text',
  feasible: 'bg-faint',
  infeasible: 'bg-transparent border border-dashed border-muted'
};

// "Optimal" is read straight from the validated flag; probability never decides it.
const stateOf = (s: Sample): State => (s.optimal ? 'optimal' : s.feasible ? 'feasible' : 'infeasible');

export const BitstringHistogram: React.FC<BitstringHistogramProps> = ({ samples, pOpt, pBaseline, feasibleRate, stockOrder }) => {
  // Every sample the backend sent: its 20 most probable, plus the exact optimum and QAOA's own answer if they were drawn
  const rows = useMemo(
    () =>
      (samples ?? [])
        .filter(s => typeof s.bitstring === 'string' && isNum(s.prob))
        .map(s => ({ ...s, state: stateOf(s) }))
        .sort((a, b) => b.prob - a.prob),
    [samples]
  );

  if (rows.length === 0) {
    return (
      <Section id="evidence-bitstrings" eyebrow="03 · Sampling" title="Probability of Different Portfolios Being Sampled">
        <p className="text-sm text-muted">No samples were recorded for this run.</p>
      </Section>
    );
  }

  const maxProb = Math.max(...rows.map(r => r.prob));
  const shownMass = rows.reduce((t, r) => t + r.prob, 0);
  const hasOptimal = rows.some(r => r.state === 'optimal');
  const n = rows[0].bitstring.length;

  return (
    <Section
      id="evidence-bitstrings"
      eyebrow="03 · Sampling"
      title="Probability of Different Portfolios Being Sampled"
      lead={`After the circuit is tuned it is measured many times. Each measurement returns a string of ${n} ones and zeros: one digit per stock, 1 means the stock is in the portfolio, 0 means it is not, and the first digit (x0) is the first stock. The bars show how often the most common strings appeared.`}
    >
      <div className="bg-surface border border-line p-4 sm:p-5">
        {/* Legend in words: colour is never the only signal */}
        <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 text-xs text-muted">
          {(['optimal', 'feasible', 'infeasible'] as State[]).map(st => (
            <li key={st} className="flex items-start gap-2">
              <span aria-hidden="true" className={`mt-0.5 inline-block h-3 w-5 shrink-0 ${BAR_CLASS[st]}`} />
              <span>
                <span className="text-text">{STATE_LABEL[st]}</span>
                {': '}
                {st === 'optimal'
                  ? 'the exact best portfolio under your rules, confirmed against the exact enumeration. Not the same as the most probable one.'
                  : st === 'feasible'
                    ? 'a valid portfolio that obeys every rule, but not necessarily the best.'
                    : 'breaks at least one rule (for example the wrong number of stocks). Not a usable portfolio.'}
              </span>
            </li>
          ))}
        </ul>

        <ol aria-label="Sampled portfolios ranked by probability" className="space-y-1.5">
          {rows.map(r => {
            const picked = r.bitstring.split('').filter(b => b === '1').length;
            return (
              <li key={r.bitstring} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3">
                <code className="font-mono text-xs text-text">{r.bitstring}</code>
                <div className="h-3.5 bg-line/50" aria-hidden="true">
                  <div className={`h-full ${BAR_CLASS[r.state]}`} style={{ width: `${Math.max((r.prob / maxProb) * 100, 1.5)}%` }} />
                </div>
                <span className="text-xs tabular-nums text-muted whitespace-nowrap text-right min-w-[8.5rem]">
                  <span className="text-text">{formatPct(r.prob, { digits: 2 })}</span>
                  {' · '}
                  {STATE_LABEL[r.state]}
                  <span className="sr-only">, {picked} stocks selected</span>
                </span>
              </li>
            );
          })}
        </ol>
        <p className="mt-2 text-xs text-muted">Bar length is proportional to probability, scaled to the largest bar shown.</p>

        <dl className="mt-4 pt-4 border-t border-line grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-3">
          <div>
            <dt className="label">Shown here</dt>
            <dd className="text-sm text-text">
              {rows.length} strings, together {formatPct(shownMass, { digits: 1 })} of all samples
            </dd>
          </div>
          <div>
            <dt className="label">Exact optimum, all samples</dt>
            <dd className="text-sm text-text">
              {formatPct(pOpt, { digits: 2 })}
              {isNum(pBaseline) && <span className="text-muted"> (random baseline {formatPct(pBaseline, { digits: 2 })})</span>}
            </dd>
          </div>
          <div>
            <dt className="label">Rule-abiding, all samples</dt>
            <dd className="text-sm text-text">{formatPct(feasibleRate, { digits: 1 })}</dd>
          </div>
        </dl>

        {!hasOptimal && (
          <p className="mt-3 text-sm text-muted">
            None of these strings is the exact optimum, so no bar is marked optimal. A high bar is not evidence of optimality.
          </p>
        )}
      </div>

      <WhatThisMeans
        shows="How often each portfolio, written as a string of ones and zeros, came out when the tuned circuit was measured."
        infer="Whether the circuit concentrates probability on a few portfolios, how much of it lands on valid ones, and whether the exact optimum was found at all."
        cannot="That the tallest bar is the best portfolio. Only a bar marked optimal has been checked against the exact enumeration. These strings are samples from a simulation, not an advantage over classical search."
      >
        <ul className="list-disc pl-5 space-y-1">
          <li>
            The list holds the 20 most probable strings, plus the exact optimum and QAOA's own chosen answer when they were drawn but are less common than
            those 20. Everything else is left out, which is why the bars add up to far less than 100%.
          </li>
          <li>
            Feasible means every rule holds: exactly K stocks, the sector limit, and the optional target return. Infeasible strings are kept in the sample
            statistics because the circuit produces them.
          </li>
          <li>
            Optimal means the string's objective equals the lowest objective found by checking every feasible portfolio, within 1e-9. It is read from the
            backend's validated flag, never from the height of the bar.
          </li>
        </ul>
      </WhatThisMeans>

      <ShowData>
        <TableBox maxHeight>
          <table className="w-full text-xs num text-left">
            <thead>
              <tr className="border-b border-line">
                <th className="py-2 pr-3">Bitstring</th>
                <th className="py-2 pr-3 text-right">Probability</th>
                <th className="py-2 pr-3">State</th>
                <th className="py-2 pr-3 text-right">Objective</th>
                <th className="py-2">Stocks in portfolio</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const names = decodeBitstring(r.bitstring, stockOrder ?? null);
                return (
                  <tr key={r.bitstring} className="border-b border-line">
                    <td className="py-2 pr-3 font-mono text-text">{r.bitstring}</td>
                    <td className="py-2 pr-3 text-right">{formatPct(r.prob, { digits: 3 })}</td>
                    <td className="py-2 pr-3 text-text">{STATE_LABEL[r.state]}</td>
                    <td className="py-2 pr-3 text-right">{r.objective === null ? '—' : formatDecimal(r.objective, 5)}</td>
                    <td className="py-2 text-muted">
                      {names ? names.join(', ') : `${r.bitstring.split('').filter(b => b === '1').length} selected`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableBox>
      </ShowData>
    </Section>
  );
};
