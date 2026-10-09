import React, { useMemo } from 'react';
import { ConvergencePoint } from '../api/types';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { CHART_COLORS } from '../lib/chartColors';
import { formatPct, formatInt, isNum } from '../lib/format';
import { Section, WhatThisMeans } from './ui';
import { ShowData, TableBox, niceScale, formatDecimal } from './ChartParts';

interface ConvergenceChartProps {
  convergence: ConvergencePoint[];
  /** Heading of the full view. Ignored when `live` is set. */
  title?: string;
  /** Overrides the small label above the heading. */
  eyebrow?: string;
  /**
   * Compact view for a run in progress: the curve so far and a one-line caption, with no heading, no verdict on
   * whether it has levelled off, and no data table. Pass the running job's convergence.
   */
  live?: boolean;
}

export interface ConvergenceReading {
  n: number;
  first: number;
  last: number;
  lowest: number;
  lowestIter: number;
  window: number;
  tailRange: number;
  totalRange: number;
  /** null when there are too few points to judge */
  settled: boolean | null;
}

/** Share of the whole range the curve may still move in its final stretch before we stop calling it levelled off. */
const SETTLED_SHARE = 0.02;
const MIN_POINTS_TO_JUDGE = 10;

/** Plain statistics of the curve. The judgement is only about this run's curve, never about the global optimum. */
export function readConvergence(points: ConvergencePoint[]): ConvergenceReading | null {
  const pts = points.filter(p => isNum(p.energy) && isNum(p.iter));
  if (pts.length === 0) return null;
  const energies = pts.map(p => p.energy);
  const lowest = Math.min(...energies);
  const lowestIter = pts[energies.indexOf(lowest)].iter;
  const window = Math.min(pts.length - 1, Math.max(5, Math.round(pts.length * 0.2)));
  const tail = energies.slice(-Math.max(window, 1));
  const tailRange = Math.max(...tail) - Math.min(...tail);
  const totalRange = Math.max(...energies) - lowest;
  const settled =
    pts.length < MIN_POINTS_TO_JUDGE ? null : totalRange <= 0 ? true : tailRange <= SETTLED_SHARE * totalRange;
  return { n: pts.length, first: energies[0], last: energies[energies.length - 1], lowest, lowestIter, window, tailRange, totalRange, settled };
}

export const ConvergenceChart: React.FC<ConvergenceChartProps> = ({
  convergence,
  title = 'How the Quantum Optimizer Improved',
  eyebrow = '02 · Optimiser',
  live = false
}) => {
  const points = useMemo(() => (convergence ?? []).filter(p => isNum(p.energy) && isNum(p.iter)), [convergence]);
  const reading = useMemo(() => readConvergence(points), [points]);

  if (!reading) {
    if (live) return null;
    return (
      <Section id="evidence-convergence" eyebrow={eyebrow} title={title}>
        <p className="text-sm text-muted">No iteration data was recorded for this run.</p>
      </Section>
    );
  }

  const y = niceScale(reading.lowest, reading.lowest + reading.totalRange, 4);
  const dots = points.length <= 40;

  const chart = (
    <>
      <p className="text-xs text-muted mb-1">↓ Average objective value ⟨H⟩ (lower is better)</p>
      <div
        role="img"
        aria-label={`Line chart of the objective value over ${reading.n} optimiser iterations. It starts at ${formatDecimal(reading.first)}, ends at ${formatDecimal(reading.last)} and reaches its lowest value, ${formatDecimal(reading.lowest)}, at iteration ${reading.lowestIter}.`}
        className={live ? 'h-48 w-full' : 'h-60 sm:h-72 w-full'}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 6, right: 14, left: 0, bottom: 4 }}>
            <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
            <XAxis
              dataKey="iter"
              type="number"
              domain={['dataMin', 'dataMax']}
              allowDecimals={false}
              stroke={CHART_COLORS.axis}
              tick={{ fill: CHART_COLORS.tick }}
              fontSize={11}
              tickLine={false}
            />
            <YAxis
              domain={y.domain}
              ticks={y.ticks}
              tickFormatter={(v: number) => formatDecimal(v, y.step < 0.1 ? 2 : 1)}
              stroke={CHART_COLORS.axis}
              tick={{ fill: CHART_COLORS.tick }}
              fontSize={11}
              tickLine={false}
              width={46}
            />
            <Tooltip
              isAnimationActive={false}
              contentStyle={{ backgroundColor: '#000000', borderColor: CHART_COLORS.lineStrong, borderRadius: 0, fontSize: '12px', color: '#FFFFFF' }}
              labelFormatter={(iter: unknown) => `Iteration ${iter}`}
              formatter={(val: unknown) => [formatDecimal(Number(val), 5), 'Objective ⟨H⟩']}
            />
            <Line
              type="linear"
              dataKey="energy"
              stroke={CHART_COLORS.qaoa_standard}
              strokeWidth={2}
              dot={dots ? { r: 2.5, fill: CHART_COLORS.qaoa_standard, stroke: CHART_COLORS.qaoa_standard } : false}
              activeDot={{ r: 5, fill: CHART_COLORS.qaoa_standard, stroke: '#000000', strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-muted text-center">Optimiser iteration →</p>
    </>
  );

  if (live) {
    return (
      <div>
        {chart}
        <p className="mt-2 text-xs text-muted" role="status" aria-live="polite">
          Live: iteration {formatInt(reading.n)}, objective so far {formatDecimal(reading.last, 4)} (lowest {formatDecimal(reading.lowest, 4)}).
          The run is not finished, so the curve may still change.
        </p>
      </div>
    );
  }

  const verdict =
    reading.settled === null
      ? `Only ${reading.n} iterations were recorded, too few to say whether the curve has levelled off.`
      : reading.settled
        ? `Over the last ${reading.window} iterations the value moved by ${formatDecimal(reading.tailRange, 5)}, which is ${formatPct(reading.totalRange > 0 ? reading.tailRange / reading.totalRange : 0)} of the full range seen. The curve has levelled off, which suggests the optimiser had converged for this run.`
        : `Over the last ${reading.window} iterations the value still moved by ${formatDecimal(reading.tailRange, 5)}, which is ${formatPct(reading.tailRange / reading.totalRange)} of the full range seen. The curve had not clearly levelled off when the run stopped, so more iterations might have changed it.`;

  return (
    <Section
      id="evidence-convergence"
      eyebrow={eyebrow}
      title={title}
      lead="The quantum circuit has adjustable angles. A classical optimiser tries new angles again and again, and this curve is the circuit's average objective value after each try."
    >
      <div className="bg-surface border border-line p-4 sm:p-5">
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3 mb-4">
          <div>
            <dt className="label">Iterations</dt>
            <dd className="text-lg tabular-nums">{formatInt(reading.n)}</dd>
          </div>
          <div>
            <dt className="label">Start</dt>
            <dd className="text-lg tabular-nums">{formatDecimal(reading.first)}</dd>
          </div>
          <div>
            <dt className="label">Final</dt>
            <dd className="text-lg tabular-nums">{formatDecimal(reading.last)}</dd>
          </div>
          <div>
            <dt className="label">Lowest (iteration {reading.lowestIter})</dt>
            <dd className="text-lg tabular-nums">{formatDecimal(reading.lowest)}</dd>
          </div>
        </dl>
        {chart}
        <p className="mt-3 text-sm text-text">{verdict}</p>
      </div>

      <WhatThisMeans
        shows="The circuit's average objective value, ⟨H⟩, after each optimiser iteration. Lower means the circuit's samples are, on average, better portfolios."
        infer="Whether the optimiser was still improving when it stopped. A flat tail suggests this run had converged."
        cannot="That a flat curve means the best possible answer was found. A flat curve can also be stuck in a poor local minimum, and this value is an average over all samples, not the best portfolio."
      >
        <ul className="list-disc pl-5 space-y-1">
          <li>
            The vertical value is the expectation of the QUBO objective, penalties included, so samples that break a rule pull the average up. It is not the
            objective of the final portfolio.
          </li>
          <li>
            The optimiser may restart from slightly different angles (up to three starts share the iteration budget), and a deeper circuit may be stepped up
            in stages, so the curve can jump back up where a new start begins.
          </li>
          <li>
            "Levelled off" here means the last {reading.window} iterations moved by at most {formatPct(SETTLED_SHARE, { digits: 0 })} of the range the curve
            covered. It describes this run's curve only.
          </li>
        </ul>
      </WhatThisMeans>

      <ShowData>
        <TableBox maxHeight>
          <table className="w-full text-xs num text-left">
            <thead>
              <tr className="border-b border-line">
                <th className="py-2 pr-3">Iteration</th>
                <th className="py-2 text-right">Objective ⟨H⟩</th>
              </tr>
            </thead>
            <tbody>
              {points.map(p => (
                <tr key={p.iter} className="border-b border-line">
                  <td className="py-1.5 pr-3 text-text">{p.iter}</td>
                  <td className="py-1.5 text-right">{formatDecimal(p.energy, 5)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableBox>
      </ShowData>
    </Section>
  );
};
