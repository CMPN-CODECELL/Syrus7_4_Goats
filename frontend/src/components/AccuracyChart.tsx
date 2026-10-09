import React from 'react';
import { RunResult } from '../api/types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine, Cell } from 'recharts';
import { CHART_COLORS, getSolverStyle, SeriesStyle } from '../lib/chartColors';
import { formatPct, isNum } from '../lib/format';
import { Section, WhatThisMeans } from './ui';
import { MarkerGlyph } from './SolverMarker';
import {
  ShowData,
  TableBox,
  answerAccuracy,
  formatDecimal,
  isExactOptimum,
  joinNames,
  readControl,
  readMetrics
} from './ChartParts';

// Columns run brute force, relaxation, annealing, QAOA
const SOLVER_ORDER = ['brute_force', 'relaxation', 'annealing', 'qaoa'];
const orderOf = (key: string) => {
  const i = SOLVER_ORDER.findIndex(p => key.includes(p));
  return i < 0 ? SOLVER_ORDER.length : i;
};

// Short x-axis names so four columns fit at 375 px; the data table has the full labels
const SHORT_NAME: Record<string, string> = {
  brute_force: 'Brute force',
  relaxation: 'Relaxation',
  annealing: 'Annealing',
  qaoa_standard: 'QAOA',
  qaoa_xy: 'QAOA (XY)'
};

/** One group of columns: series a (white or solver tone) and an optional series b (the random baseline). */
interface Col {
  name: string;
  style?: SeriesStyle;
  a: number;
  aText: string[];
  aFill: string;
  aMuted?: boolean;
  b?: number;
  bText?: string[];
}

function wrap(text: string, maxChars: number): string[] {
  const lines: string[] = [];
  for (const word of text.split(' ')) {
    const last = lines[lines.length - 1];
    if (last !== undefined && last.length + 1 + word.length <= maxChars) lines[lines.length - 1] = `${last} ${word}`;
    else lines.push(word);
  }
  return lines;
}

// X-axis name, wrapped, with the solver marker above it when there is one
const nameTick = (rows: Col[], maxChars: number) => (props: { x?: string | number; y?: string | number; payload?: { value?: unknown } }) => {
  const row = rows.find(r => r.name === props.payload?.value);
  const x = Number(props.x);
  const y = Number(props.y);
  if (!row || !isNum(x) || !isNum(y)) return <g />;
  const first = row.style ? 28 : 15;
  return (
    <g transform={`translate(${x},${y})`}>
      {row.style && <MarkerGlyph style={row.style} cx={0} cy={12} scale={0.75} />}
      <text textAnchor="middle" fill={CHART_COLORS.text} fontSize={11}>
        {wrap(row.name, maxChars).map((line, i) => (
          <tspan key={i} x={0} y={first + i * 13}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
};

// Value printed on top of each column; several short lines stack upwards
const valueLabel = (rows: Col[], key: 'a' | 'b') => (props: { x?: number | string; y?: number | string; width?: number | string; index?: number }) => {
  const row = rows[props.index ?? -1];
  const lines = key === 'a' ? row?.aText : row?.bText;
  if (!row || !lines || !isNum(Number(props.x)) || !isNum(Number(props.y))) return <g />;
  const cx = Number(props.x) + Number(props.width) / 2;
  const top = Number(props.y);
  return (
    <text textAnchor="middle" fontSize={11} fontWeight={500} fill={key === 'a' && row.aMuted ? CHART_COLORS.muted : CHART_COLORS.text}>
      {lines.map((line, i) => (
        <tspan key={i} x={cx} y={top - 5 - (lines.length - 1 - i) * 12}>
          {line}
        </tspan>
      ))}
    </text>
  );
};

const ColumnChart: React.FC<{
  rows: Col[];
  height: number;
  top: number;
  xHeight: number;
  maxChars: number;
  hasB?: boolean;
  exactLine?: boolean;
  ariaLabel: string;
}> = ({ rows, height, top, xHeight, maxChars, hasB, exactLine, ariaLabel }) => (
  <div role="img" aria-label={ariaLabel} className="w-full" style={{ height }}>
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={rows} margin={{ top, right: 8, left: 0, bottom: 0 }} barGap={2} barCategoryGap="18%">
        <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} />
        <XAxis dataKey="name" interval={0} height={xHeight} tickLine={false} stroke={CHART_COLORS.axis} tick={nameTick(rows, maxChars)} />
        <YAxis
          domain={[0, 100]}
          ticks={[0, 25, 50, 75, 100]}
          tickFormatter={(v: number) => `${v}%`}
          width={42}
          stroke={CHART_COLORS.axis}
          tick={{ fill: CHART_COLORS.tick }}
          fontSize={11}
        />
        {exactLine && (
          <ReferenceLine
            y={100}
            stroke={CHART_COLORS.text}
            strokeDasharray="4 3"
            ifOverflow="visible"
            label={(p: { viewBox?: { x: number; y: number; width: number } }) =>
              p.viewBox ? (
                <text x={p.viewBox.x + p.viewBox.width} y={p.viewBox.y - 24} textAnchor="end" fontSize={11} fill={CHART_COLORS.text}>
                  100% = exact optimum
                </text>
              ) : (
                <g />
              )
            }
          />
        )}
        <Bar dataKey="a" maxBarSize={44} isAnimationActive={false} background={{ fill: CHART_COLORS.line }} label={valueLabel(rows, 'a')}>
          {rows.map((r, i) => (
            <Cell key={i} fill={r.aFill} stroke={r.aFill} />
          ))}
        </Bar>
        {hasB && (
          <Bar dataKey="b" maxBarSize={44} isAnimationActive={false} fill={CHART_COLORS.baseline} stroke={CHART_COLORS.baseline} label={valueLabel(rows, 'b')} />
        )}
      </BarChart>
    </ResponsiveContainer>
  </div>
);

/** 100 only for the exact optimum; anything else is capped at 99.9 so rounding never claims exactness. */
function accuracyText(acc: number, exact: boolean): string {
  if (exact) return '100%';
  return `${Math.min(99.9, acc).toFixed(1)}%`;
}

const pct2 = (v: number) => formatPct(v, { digits: 2 });

function compare(a: number, b: number): 'above' | 'below' | 'level with' {
  if (Math.abs(a - b) <= 1e-12) return 'level with';
  return a > b ? 'above' : 'below';
}

export const AccuracyChart: React.FC<{ result: RunResult }> = ({ result }) => {
  const { landscape, solvers } = result;
  if (!landscape || !solvers || solvers.length === 0) return null;
  const { approxRatio, pOpt, pRandom, feasibleRate } = readMetrics(result.qaoa);
  const control = readControl(result.qaoa);
  const noise = result.qaoa?.noise ?? null;

  const solverData = [...solvers]
    .sort((a, b) => orderOf(a.solver) - orderOf(b.solver))
    .map(s => ({
      s,
      name: s.label,
      acc: answerAccuracy(s, landscape.f_min, landscape.f_max),
      exact: s.feasible && isExactOptimum(s.objective, landscape.f_min),
      style: getSolverStyle(s.solver)
    }));

  // A solver with no feasible answer gets a 0 column labelled in words
  const solverRows: Col[] = solverData.map(d => ({
    name: SHORT_NAME[d.s.solver] ?? d.name,
    style: d.style,
    a: d.acc ?? 0,
    aText: d.acc === null ? ['no feasible', 'answer'] : [accuracyText(d.acc, d.exact)],
    aFill: d.style.color,
    aMuted: d.acc === null
  }));

  const exactNames = solverData.filter(d => d.exact).map(d => d.name);
  const partial = solverData.filter(d => d.acc !== null && !d.exact);
  const none = solverData.filter(d => d.acc === null);
  const accuracySummary = [
    exactNames.length === solverData.length
      ? 'Every method found the exact optimum.'
      : exactNames.length
        ? `${joinNames(exactNames)} found the exact optimum.`
        : 'No method found the exact optimum.',
    ...partial.map(d => `${d.name} reached ${accuracyText(d.acc!, false)} of the way from the worst to the best rule-abiding portfolio.`),
    none.length ? `${joinNames(none.map(d => d.name))} found no feasible answer.` : ''
  ]
    .filter(Boolean)
    .join(' ');

  // Sampling quality: QAOA beside what the same number of uniform random draws would score
  const clamp = (v: number) => Math.min(100, Math.max(0, v * 100));
  const baseAccuracy = isNum(control?.approx_ratio) ? control!.approx_ratio : null;
  const baseFeasible = isNum(control?.feasible_rate) ? control!.feasible_rate : null;
  const baseOpt = isNum(control?.p_opt) ? control!.p_opt : isNum(pRandom) ? pRandom : null;

  const metricDefs: { name: string; qaoa: number | null; base: number | null }[] = [
    { name: 'Expected accuracy (approx. ratio)', qaoa: approxRatio, base: baseAccuracy },
    { name: 'Feasible rate (obeys all rules)', qaoa: feasibleRate, base: baseFeasible },
    { name: 'P(optimum)', qaoa: pOpt, base: baseOpt }
  ];
  const metricRows: Col[] = metricDefs
    .filter(m => m.qaoa !== null)
    .map(m => ({
      name: m.name,
      a: clamp(m.qaoa as number),
      aText: [pct2(m.qaoa as number)],
      aFill: CHART_COLORS.qaoa_standard,
      b: m.base === null ? undefined : clamp(m.base),
      bText: m.base === null ? undefined : [pct2(m.base)]
    }));
  const hasBaseline = metricRows.some(r => r.b !== undefined);

  const samplingSummary = metricDefs
    .filter(m => m.qaoa !== null && m.base !== null)
    .map(m => `${m.name.split(' (')[0]}: QAOA ${pct2(m.qaoa as number)}, ${compare(m.qaoa as number, m.base as number)} the random baseline of ${pct2(m.base as number)}`)
    .join('; ');

  return (
    <Section
      id="evidence-accuracy"
      eyebrow="04 · Accuracy"
      title="How Close to the Best"
      lead="Because this problem is small, the exact best portfolio under your rules can be found by checking every option. That gives every method an answer key to be marked against."
    >
      <div className="space-y-10">
        {/* Chart 1: answer accuracy */}
        <div>
          <h3 className="mb-1">Answer accuracy</h3>
          <p className="text-sm text-muted mb-3">
            100% is the exact optimum, the best portfolio there is under your rules. 0% is the worst portfolio that still obeys them.
          </p>
          <div className="bg-surface border border-line p-4 sm:p-5">
            <ColumnChart
              rows={solverRows}
              height={300}
              top={46}
              xHeight={62}
              maxChars={11}
              exactLine
              ariaLabel={`Answer accuracy per method: ${solverRows.map(r => `${r.name} ${r.aText.join(' ')}`).join(', ')}`}
            />
            <p className="mt-3 text-sm text-text break-words">{accuracySummary}</p>
          </div>
          <WhatThisMeans
            shows="How close each method's final portfolio is to the best possible portfolio, on a scale from the worst rule-abiding portfolio (0%) to the exact optimum (100%)."
            infer="Which methods reached the exact optimum on this instance and how far the others fell short."
            cannot="That a method will match the optimum on other instances or at larger sizes, or that the best portfolio under past data will earn a good return in future."
          >
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Accuracy = (objective − f_max) ÷ (f_min − f_max) × 100, clamped to 0–100. Here f_min = {formatDecimal(landscape.f_min, 5)} (lowest objective,
                the exact optimum) and f_max = {formatDecimal(landscape.f_max, 5)} (highest objective among the {landscape.n_feasible} rule-abiding
                portfolios).
              </li>
              <li>
                A method counts as exact only when its objective equals f_min within 1e-9. The scale is relative to the span between best and worst, so a
                small gap in objective can look large when that span is narrow.
              </li>
              <li>A method with no rule-abiding answer is shown as 0% and labelled "no feasible answer".</li>
            </ul>
          </WhatThisMeans>
          <ShowData>
            <TableBox>
              <table className="w-full text-xs num text-left">
                <thead>
                  <tr className="border-b border-line">
                    <th className="py-2 pr-3">Method</th>
                    <th className="py-2 pr-3 text-right">Accuracy</th>
                    <th className="py-2 text-right">Objective</th>
                  </tr>
                </thead>
                <tbody>
                  {solverData.map(d => (
                    <tr key={d.s.solver} className="border-b border-line">
                      <td className="py-2 pr-3 text-text">{d.name}</td>
                      <td className="py-2 pr-3 text-right text-text">{d.acc === null ? 'no feasible answer' : accuracyText(d.acc, d.exact)}</td>
                      <td className="py-2 text-right">{formatDecimal(d.s.objective, 5)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td className="py-2 pr-3 text-muted">Exact optimum (f_min) / worst feasible (f_max)</td>
                    <td className="py-2 pr-3 text-right text-muted">100% / 0%</td>
                    <td className="py-2 text-right text-muted">
                      {formatDecimal(landscape.f_min, 5)} / {formatDecimal(landscape.f_max, 5)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </TableBox>
          </ShowData>
        </div>

        {/* Chart 2: QAOA sampling quality */}
        {metricRows.length > 0 && (
          <div>
            <h3 className="mb-1">QAOA sampling quality</h3>
            <p className="text-sm text-muted mb-3">
              Each group compares QAOA's samples with what the same number of purely random draws would score. All bars share one 0–100% scale, so very small
              probabilities appear as thin slivers: read the printed values.
            </p>
            <div className="bg-surface border border-line p-4 sm:p-5">
              <ul className="flex flex-wrap items-center gap-x-5 gap-y-1 mb-2 text-xs text-muted">
                <li className="flex items-center gap-2">
                  <span aria-hidden="true" className="inline-block h-3 w-3 bg-text" /> QAOA
                </li>
                {hasBaseline && (
                  <li className="flex items-center gap-2">
                    <span aria-hidden="true" className="inline-block h-3 w-3" style={{ backgroundColor: CHART_COLORS.baseline }} />
                    {control ? 'Uniform random baseline (same number of draws)' : 'Random baseline (P(optimum) only)'}
                  </li>
                )}
              </ul>
              <ColumnChart
                rows={metricRows}
                height={290}
                top={28}
                xHeight={56}
                maxChars={15}
                hasB={hasBaseline}
                ariaLabel={`QAOA sampling quality: ${metricRows
                  .map(r => `${r.name} QAOA ${r.aText[0]}${r.bText ? `, random baseline ${r.bText[0]}` : ''}`)
                  .join('; ')}`}
              />
              {samplingSummary && <p className="mt-3 text-sm text-text break-words">{samplingSummary}.</p>}
              {!control && (
                <p className="mt-2 text-xs text-muted">
                  This result has no uniform-random control for accuracy or feasible rate, so only P(optimum) has a baseline.
                </p>
              )}
            </div>
            <WhatThisMeans
              shows="Three measures of the quality of QAOA's samples, each placed beside the score that random guessing would get."
              infer="Whether the tuned circuit produced better portfolios, or more valid ones, than chance would. A bar at or below the baseline means it did not."
              cannot="That QAOA beats classical solvers, or that these small-instance figures hold at larger sizes. Matching the random baseline is not a sign of a quantum advantage."
            >
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  Expected accuracy: the average accuracy over all samples, counting an invalid sample as 0. Feasible rate: the share of samples that obey every
                  rule. P(optimum): the share of samples that are the exact optimum.
                </li>
                <li>
                  {control
                    ? 'The baseline is what the same number of uniform random draws from the same sample space would score (qaoa.control).'
                    : `With no uniform-random control in the result, the P(optimum) baseline is 1 ÷ the number of rule-abiding portfolios (${landscape.n_feasible}). That is a pick made only among valid portfolios, so it is a generous baseline for a sampler that also draws invalid ones.`}
                </li>
                {noise && (
                  <li>
                    These figures are the noise-free sampling. With simulated hardware noise ({noise.backend}) the same circuit scored accuracy{' '}
                    {pct2(noise.noisy.approx_ratio)}, feasible rate {pct2(noise.noisy.feasible_rate)} and P(optimum) {pct2(noise.noisy.p_opt)}.
                  </li>
                )}
              </ul>
            </WhatThisMeans>
            <ShowData>
              <TableBox>
                <table className="w-full text-xs num text-left">
                  <thead>
                    <tr className="border-b border-line">
                      <th className="py-2 pr-3">Measure</th>
                      <th className="py-2 pr-3 text-right">QAOA</th>
                      <th className="py-2 text-right">Random baseline</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metricRows.map(r => (
                      <tr key={r.name} className="border-b border-line last:border-0">
                        <td className="py-2 pr-3 text-text">{r.name}</td>
                        <td className="py-2 pr-3 text-right text-text">{r.aText[0]}</td>
                        <td className="py-2 text-right text-text">{r.bText ? r.bText[0] : 'not available'}</td>
                      </tr>
                    ))}
                    {noise && (
                      <tr className="border-t border-line">
                        <td className="py-2 pr-3 text-muted">QAOA with simulated noise: accuracy / feasible / P(optimum)</td>
                        <td className="py-2 pr-3 text-right text-muted" colSpan={2}>
                          {pct2(noise.noisy.approx_ratio)} / {pct2(noise.noisy.feasible_rate)} / {pct2(noise.noisy.p_opt)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </TableBox>
            </ShowData>
          </div>
        )}
      </div>
    </Section>
  );
};
