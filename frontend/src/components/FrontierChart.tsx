import React, { useMemo } from 'react';
import { Frontier, SolverResult } from '../api/types';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { CHART_COLORS, getSolverStyle } from '../lib/chartColors';
import { formatPct, isNum } from '../lib/format';
import { Section, WhatThisMeans } from './ui';
import { MarkerGlyph, SolverMarker } from './SolverMarker';
import { ShowData, TableBox, niceScale, shortTicker, joinNames } from './ChartParts';

interface FrontierChartProps {
  frontier: Frontier;
  solvers: SolverResult[];
  selectedSolverKey: string;
  onSelectSolver?: (key: string) => void;
}

interface Plotted {
  key: string;
  label: string;
  risk: number;
  ret: number;
}

// Solvers whose portfolios have identical coordinates are drawn as nested outlines so none is hidden
const NEST_SCALES = [2.1, 1.6, 1.15, 0.75, 0.5];
const SAME_POINT = 1e-9;

export const FrontierChart: React.FC<FrontierChartProps> = ({ frontier, solvers, selectedSolverKey, onSelectSolver }) => {
  // Only the points the backend computed. They are sorted by volatility for the table, never smoothed or filled in.
  const continuous = useMemo(
    () =>
      (frontier?.continuous ?? [])
        .filter(p => isNum(p.risk) && isNum(p.ret))
        .sort((a, b) => a.risk - b.risk)
        .map((p, i) => ({ risk: p.risk, ret: p.ret, name: `Continuous frontier, point ${i + 1}` })),
    [frontier]
  );
  const discrete = useMemo(
    () =>
      (frontier?.discrete ?? [])
        .filter(p => isNum(p.risk) && isNum(p.ret))
        .sort((a, b) => a.risk - b.risk)
        .map(p => ({
          risk: p.risk,
          ret: p.ret,
          selection: p.selection ?? [],
          name: `Discrete frontier: ${(p.selection ?? []).map(shortTicker).join(', ')}`
        })),
    [frontier]
  );

  const plotted: Plotted[] = (solvers ?? [])
    .filter(s => isNum(s.volatility) && isNum(s.exp_return) && s.selection !== null && s.feasible)
    .map(s => ({ key: s.solver, label: s.label, risk: s.volatility as number, ret: s.exp_return as number }));
  const unplotted = (solvers ?? []).filter(s => !plotted.some(p => p.key === s.solver));

  // Group solvers that sit on the same point
  const groups: Plotted[][] = [];
  for (const p of plotted) {
    const g = groups.find(g => Math.abs(g[0].risk - p.risk) < SAME_POINT && Math.abs(g[0].ret - p.ret) < SAME_POINT);
    if (g) g.push(p);
    else groups.push([p]);
  }

  const all = [...continuous, ...discrete, ...plotted];
  const x = niceScale(Math.min(...all.map(p => p.risk)), Math.max(...all.map(p => p.risk)));
  const y = niceScale(Math.min(...all.map(p => p.ret)), Math.max(...all.map(p => p.ret)));
  const digits = (step: number) => (step < 0.01 ? 1 : 0);

  const selectedPlot = plotted.find(p => p.key === selectedSolverKey);
  const selectGroup = (g: Plotted[]) => {
    if (!onSelectSolver) return;
    const at = g.findIndex(m => m.key === selectedSolverKey);
    onSelectSolver(g[(at + 1) % g.length].key);
  };

  const ariaLabel = `Scatter chart. Horizontal: annualised volatility. Vertical: estimated annual return, in-sample. ${continuous.length} continuous frontier points, ${discrete.length} discrete frontier points and ${plotted.length} solver portfolios.${selectedPlot ? ` Selected: ${selectedPlot.label}, volatility ${formatPct(selectedPlot.risk)}, return ${formatPct(selectedPlot.ret)}.` : ''}`;

  const hasAnything = continuous.length + discrete.length + plotted.length > 0;

  return (
    <Section
      id="evidence-frontier"
      eyebrow="01 · Risk and return"
      title="Risk-Return Analysis"
      lead="Every dot is a portfolio placed by how variable its past returns were (across) and how much return the same past data estimates (up). Further up and further left is better on these two measures only."
    >
      <div className="bg-surface border border-line p-4 sm:p-5">
        {!hasAnything ? (
          <p className="text-sm text-muted">No frontier points were computed for this run.</p>
        ) : (
          <>
            <p className="text-xs text-muted mb-1">↑ Estimated annual return (in-sample, before costs)</p>
            <div role="img" aria-label={ariaLabel} className="h-72 sm:h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 14, left: 0, bottom: 4 }}>
                  <CartesianGrid stroke={CHART_COLORS.grid} />
                  <XAxis
                    type="number"
                    dataKey="risk"
                    name="Annualised volatility"
                    domain={x.domain}
                    ticks={x.ticks}
                    tickFormatter={(v: number) => formatPct(v, { digits: digits(x.step) })}
                    stroke={CHART_COLORS.axis}
                    tick={{ fill: CHART_COLORS.tick }}
                    fontSize={11}
                  />
                  <YAxis
                    type="number"
                    dataKey="ret"
                    name="Estimated annual return"
                    domain={y.domain}
                    ticks={y.ticks}
                    tickFormatter={(v: number) => formatPct(v, { digits: digits(y.step) })}
                    stroke={CHART_COLORS.axis}
                    tick={{ fill: CHART_COLORS.tick }}
                    fontSize={11}
                    width={46}
                  />
                  <Tooltip
                    cursor={false}
                    isAnimationActive={false}
                    content={({ active, payload }) => {
                      const p = active ? (payload?.[0]?.payload as { name?: string; risk: number; ret: number } | undefined) : undefined;
                      if (!p) return null;
                      return (
                        <div className="bg-bg border border-line-strong px-3 py-2 text-xs text-text max-w-64">
                          <div className="font-medium mb-0.5 break-words">{p.name}</div>
                          <div className="text-muted">
                            Volatility {formatPct(p.risk)} · Return {formatPct(p.ret)}
                          </div>
                        </div>
                      );
                    }}
                  />

                  {/* Continuous frontier: the computed points only, small solid dots */}
                  <Scatter
                    name="Continuous frontier"
                    data={continuous}
                    isAnimationActive={false}
                    shape={(p: { cx?: number; cy?: number }) =>
                      isNum(p.cx) && isNum(p.cy) ? <circle cx={p.cx} cy={p.cy} r={3} fill={CHART_COLORS.frontierContinuous} /> : <g />
                    }
                  />

                  {/* Discrete frontier: the computed K-stock points only, open rings */}
                  <Scatter
                    name="Discrete frontier"
                    data={discrete}
                    isAnimationActive={false}
                    shape={(p: { cx?: number; cy?: number }) =>
                      isNum(p.cx) && isNum(p.cy) ? (
                        <circle cx={p.cx} cy={p.cy} r={3.5} fill="#000000" stroke={CHART_COLORS.frontierDiscrete} strokeWidth={1.5} />
                      ) : (
                        <g />
                      )
                    }
                  />

                  {/* Solver portfolios, one marker per solver (nested when they coincide), a ring around the selected one */}
                  {groups.map(g => {
                    const hasSelected = g.some(m => m.key === selectedSolverKey);
                    return (
                      <Scatter
                        key={g.map(m => m.key).join('+')}
                        name={joinNames(g.map(m => m.label))}
                        data={[{ risk: g[0].risk, ret: g[0].ret, name: joinNames(g.map(m => m.label)) }]}
                        isAnimationActive={false}
                        onClick={() => selectGroup(g)}
                        shape={(p: { cx?: number; cy?: number }) => {
                          if (!isNum(p.cx) || !isNum(p.cy)) return <g />;
                          const nested = g.length > 1;
                          const outer = NEST_SCALES[0];
                          return (
                            <g>
                              {hasSelected && (
                                <circle
                                  cx={p.cx}
                                  cy={p.cy}
                                  r={(nested ? outer : 1) * 7.5 + 4}
                                  fill="none"
                                  stroke={CHART_COLORS.text}
                                  strokeWidth={1.5}
                                  strokeDasharray="3 2"
                                />
                              )}
                              {g.map((m, i) => (
                                <MarkerGlyph
                                  key={m.key}
                                  style={getSolverStyle(m.key)}
                                  cx={p.cx as number}
                                  cy={p.cy as number}
                                  scale={nested ? NEST_SCALES[Math.min(i, NEST_SCALES.length - 1)] : 1.15}
                                  hollow={nested && i < g.length - 1 ? true : undefined}
                                />
                              ))}
                            </g>
                          );
                        }}
                      />
                    );
                  })}
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted text-center">Annualised volatility (historical variability) →</p>

            {/* Legend: every marker, in words, as real buttons so a solver can be selected without a mouse */}
            <div className="mt-4 space-y-3">
              <p className="label">Legend</p>
              <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted">
                <li className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="-8 -8 16 16" aria-hidden="true"><circle r="3" fill={CHART_COLORS.frontierContinuous} /></svg>
                  Continuous frontier ({continuous.length} computed points)
                </li>
                <li className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="-8 -8 16 16" aria-hidden="true"><circle r="3.5" fill="#000000" stroke={CHART_COLORS.frontierDiscrete} strokeWidth="1.5" /></svg>
                  Discrete frontier ({discrete.length} computed K-stock portfolios)
                </li>
                <li className="flex items-center gap-2">
                  <svg width="18" height="18" viewBox="-10 -10 20 20" aria-hidden="true"><circle r="8" fill="none" stroke={CHART_COLORS.text} strokeWidth="1.5" strokeDasharray="3 2" /></svg>
                  Dashed ring: the selected portfolio
                </li>
              </ul>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {plotted.map(p => {
                  const isSel = p.key === selectedSolverKey;
                  return (
                    <li key={p.key}>
                      <button
                        type="button"
                        onClick={() => onSelectSolver?.(p.key)}
                        disabled={!onSelectSolver}
                        aria-pressed={isSel}
                        className={`w-full min-h-[44px] flex items-center gap-2 border px-3 py-2 text-left text-xs ${
                          isSel ? 'border-text text-text bg-line' : 'border-line text-muted hover:text-text hover:border-line-strong'
                        }`}
                      >
                        <SolverMarker style={getSolverStyle(p.key)} />
                        <span className="flex-1 min-w-0 break-words">{p.label}</span>
                        <span className="text-faint whitespace-nowrap tabular-nums">
                          {formatPct(p.risk)} / {formatPct(p.ret)}
                        </span>
                        {isSel && <span className="label text-text">Selected</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
              {groups.some(g => g.length > 1) && (
                <p className="text-xs text-muted">
                  {groups
                    .filter(g => g.length > 1)
                    .map(g => `${joinNames(g.map(m => m.label))} chose the same portfolio, so their markers share one point and are drawn nested.`)
                    .join(' ')}
                </p>
              )}
              {unplotted.length > 0 && (
                <p className="text-xs text-text">
                  Not plotted, no feasible answer: {joinNames(unplotted.map(s => s.label))}.
                </p>
              )}
            </div>
          </>
        )}
      </div>

      <div className="mt-4 border border-line p-4 text-sm text-muted space-y-2">
        <p>
          <span className="text-text">What is a frontier?</span> Of all the portfolios that were computed, the frontier keeps only the ones that no other
          portfolio beats on both measures at once: nothing computed has more estimated return for the same or lower volatility.
        </p>
        <p>
          <span className="text-text">Its limits.</span> Both axes come from past prices in the estimation window, so they describe what already happened,
          before transaction costs. They are not a forecast. The continuous frontier is a textbook calculation over the solved stocks that ignores the number
          of holdings and sector limits, so portfolios that follow your rules usually sit below it. A point on the frontier is not automatically right for you,
          because the optimiser also weighs your risk preference and costs.
        </p>
      </div>

      <WhatThisMeans
        shows="Each portfolio's past volatility and the return that past data estimates for it, with every solver's answer marked on top."
        infer="Whether a solver's pick is close to the best computed trade-off between return and volatility, and whether different solvers chose the same portfolio."
        cannot="That any portfolio will earn its estimated return, that a point between two computed points is achievable (none were calculated there), or that the highest point is the best choice."
      >
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Continuous frontier: long-only, fully invested weights that minimise variance for each of 25 return targets, from the minimum-variance
            portfolio's return up to the highest single-stock return. No cardinality, sector or cost constraints.
          </li>
          <li>
            Discrete frontier: every rule-abiding K-stock, equal-weight selection found by the exact enumeration, keeping only those that no other selection
            beats on both volatility and return.
          </li>
          <li>
            Solver markers use the same two measures for the equal-weight portfolio each solver returned. The solver objective also includes transaction
            costs and your risk setting, so a chosen portfolio need not lie on the discrete frontier.
          </li>
          <li>Return is the annualised mean over the estimation window. Volatility is the annualised standard deviation of the same data.</li>
        </ul>
      </WhatThisMeans>

      <ShowData>
        <TableBox maxHeight>
          <table className="w-full text-xs num text-left">
            <thead>
              <tr className="border-b border-line">
                <th className="py-2 pr-3">Series</th>
                <th className="py-2 pr-3 text-right">Volatility</th>
                <th className="py-2 pr-3 text-right">Est. return</th>
                <th className="py-2">Stocks</th>
              </tr>
            </thead>
            <tbody>
              {plotted.map(p => (
                <tr key={p.key} className="border-b border-line">
                  <td className="py-2 pr-3 text-text">{p.label}{p.key === selectedSolverKey ? ' (selected)' : ''}</td>
                  <td className="py-2 pr-3 text-right">{formatPct(p.risk, { digits: 2 })}</td>
                  <td className="py-2 pr-3 text-right">{formatPct(p.ret, { digits: 2 })}</td>
                  <td className="py-2 text-muted">{solvers.find(s => s.solver === p.key)?.selection?.map(shortTicker).join(', ') ?? '—'}</td>
                </tr>
              ))}
              {discrete.map((p, i) => (
                <tr key={`d${i}`} className="border-b border-line">
                  <td className="py-2 pr-3 text-muted">Discrete frontier {i + 1}</td>
                  <td className="py-2 pr-3 text-right">{formatPct(p.risk, { digits: 2 })}</td>
                  <td className="py-2 pr-3 text-right">{formatPct(p.ret, { digits: 2 })}</td>
                  <td className="py-2 text-muted">{p.selection.map(shortTicker).join(', ')}</td>
                </tr>
              ))}
              {continuous.map((p, i) => (
                <tr key={`c${i}`} className="border-b border-line">
                  <td className="py-2 pr-3 text-muted">Continuous frontier {i + 1}</td>
                  <td className="py-2 pr-3 text-right">{formatPct(p.risk, { digits: 2 })}</td>
                  <td className="py-2 pr-3 text-right">{formatPct(p.ret, { digits: 2 })}</td>
                  <td className="py-2 text-muted">—</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableBox>
      </ShowData>
    </Section>
  );
};
