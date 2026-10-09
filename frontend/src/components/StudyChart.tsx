import React from 'react';
import { Study, StudyInstance } from '../api/types';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ErrorBar } from 'recharts';
import { CHART_COLORS, getSeriesStyle } from '../lib/chartColors';
import { isNum } from '../lib/format';
import { WhatThisMeans } from './ui';
import { MarkerGlyph, SolverMarker } from './SolverMarker';
import { ShowData, TableBox, niceScale } from './ChartParts';

interface StudyChartProps {
  study: Study;
}

// The saved study instance also records maxiter; the shared API type predates it
type InstanceWithMaxiter = StudyInstance & { maxiter?: number };

const fmt = (v: unknown) => (isNum(v) ? (Math.abs(v) >= 100 ? v.toFixed(1) : v.toFixed(4)) : String(v ?? '—'));

export const StudyChart: React.FC<StudyChartProps> = ({ study }) => {
  const series = study.series ?? [];
  const instance = (study.instance ?? {}) as Partial<InstanceWithMaxiter>;
  const seeds = instance.seeds ?? [];
  const nInstances = seeds.length;
  // With a single instance there is no spread to show: an error bar of 0 would claim certainty
  const showSpread = nInstances > 1;
  const lowerIsBetter = /^\s*1\s*[-−]/.test(study.y_label ?? '');

  // Rows keyed by x. Series are keyed s0, s1, ... so a label with a dot or bracket can never break the data lookup.
  const xValues = Array.from(new Set(series.flatMap(s => s.points.map(p => p.x)))).sort((a, b) => a - b);
  const chartData = xValues.map(x => {
    const row: Record<string, number> = { x };
    series.forEach((s, i) => {
      const pt = s.points.find(p => p.x === x);
      if (pt && isNum(pt.y)) {
        row[`s${i}`] = pt.y;
        if (showSpread && isNum(pt.yerr)) row[`s${i}_err`] = pt.yerr;
      }
    });
    return row;
  });

  const ys = series.flatMap(s => s.points.flatMap(p => (isNum(p.y) ? [p.y - (showSpread && isNum(p.yerr) ? p.yerr : 0), p.y + (showSpread && isNum(p.yerr) ? p.yerr : 0)] : [])));
  const y = niceScale(Math.min(...ys), Math.max(...ys), 5);

  return (
    <article className="bg-surface border border-line p-4 sm:p-5 space-y-5" aria-labelledby={`study-${study.id}`}>
      <header className="border-b border-line pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 id={`study-${study.id}`}>{study.title}</h3>
          <p className="text-sm text-muted mt-1 leading-relaxed max-w-2xl break-words">{study.description}</p>
        </div>
        <div className="shrink-0 sm:text-right">
          <span className="label block">Generated</span>
          <span className="text-sm text-text">{study.generated_at}</span>
          <span className="text-xs text-muted block">Compute time {isNum(Number(study.wall_time_s)) ? Number(study.wall_time_s).toFixed(1) : '—'} s</span>
        </div>
      </header>

      {/* Settings: what was run, so the figures can be reproduced */}
      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3 text-sm">
        <div>
          <dt className="label">Instances</dt>
          <dd className="text-text">{nInstances > 0 ? `${nInstances} (seeds ${seeds.join(', ')})` : '—'}</dd>
        </div>
        <div>
          <dt className="label">Stocks / holdings</dt>
          <dd className="text-text">
            {instance.n_assets ?? '—'} / K = {instance.k ?? '—'}
          </dd>
        </div>
        <div>
          <dt className="label">Risk setting q</dt>
          <dd className="text-text">{instance.q ?? '—'}</dd>
        </div>
        <div>
          <dt className="label">Shots · max iterations</dt>
          <dd className="text-text">
            {instance.shots ?? '—'} · {instance.maxiter ?? '—'}
          </dd>
        </div>
      </dl>

      {/* Legend in words, outside the SVG so it wraps on a phone */}
      <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-text">
        {series.map((s, idx) => (
          <li key={idx} className="flex items-center gap-2">
            <SolverMarker style={getSeriesStyle(idx)} />
            {s.label}
          </li>
        ))}
      </ul>

      <div>
        <p className="text-xs text-muted mb-1">↑ {study.y_label}{lowerIsBetter ? ' (lower is better)' : ''}</p>
        <div
          role="img"
          aria-label={`Line chart of ${study.y_label} against ${study.x_label}. ${series.map(s => `${s.label}: ${s.points.map(p => `${p.x} gives ${fmt(p.y)}`).join(', ')}`).join('. ')}.`}
          className="h-64 w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
              <XAxis
                dataKey="x"
                type="number"
                domain={['dataMin', 'dataMax']}
                ticks={xValues.length <= 8 ? xValues : undefined}
                allowDecimals={false}
                stroke={CHART_COLORS.axis}
                tick={{ fill: CHART_COLORS.tick }}
                fontSize={11}
                padding={{ left: 12, right: 12 }}
              />
              <YAxis
                domain={y.domain}
                ticks={y.ticks}
                tickFormatter={(v: number) => (y.step < 0.1 ? v.toFixed(2) : v.toFixed(1))}
                stroke={CHART_COLORS.axis}
                tick={{ fill: CHART_COLORS.tick }}
                fontSize={11}
                width={46}
              />
              <Tooltip
                isAnimationActive={false}
                contentStyle={{ backgroundColor: '#000000', borderColor: CHART_COLORS.lineStrong, borderRadius: 0, fontSize: '12px', color: '#FFFFFF' }}
                labelFormatter={(val: unknown) => `${study.x_label}: ${val}`}
                formatter={(val: unknown, name: unknown) => [fmt(val), String(name)]}
              />
              {series.map((s, idx) => {
                const st = getSeriesStyle(idx);
                return (
                  <Line
                    key={idx}
                    type="linear"
                    name={s.label}
                    dataKey={`s${idx}`}
                    stroke={st.color}
                    strokeWidth={2}
                    strokeDasharray={st.dashed ? '6 4' : undefined}
                    dot={(p: { cx?: number; cy?: number; index?: number }) => (
                      <MarkerGlyph key={`d-${idx}-${p.index}`} style={st} cx={p.cx as number} cy={p.cy as number} />
                    )}
                    activeDot={(p: { cx?: number; cy?: number; index?: number }) => (
                      <MarkerGlyph key={`a-${idx}-${p.index}`} style={st} cx={p.cx as number} cy={p.cy as number} scale={1.4} />
                    )}
                    isAnimationActive={false}
                  >
                    {showSpread && <ErrorBar dataKey={`s${idx}_err`} stroke={st.color} width={4} />}
                  </Line>
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-muted text-center">{study.x_label} →</p>
        <p className="text-xs text-muted mt-1">
          {showSpread
            ? `Each point is the mean over ${nInstances} instances; the bars show the sample standard deviation across them.`
            : 'This study used a single instance, so there is no spread to show and each point is one run.'}
        </p>
      </div>

      <WhatThisMeans
        shows={`${study.y_label} for each setting of "${study.x_label}", measured offline on ${nInstances > 0 ? `${nInstances} small test instance${nInstances === 1 ? '' : 's'}` : 'small test instances'}.${lowerIsBetter ? ' Lower is better.' : ''}`}
        infer={
          showSpread
            ? 'Which setting did better on average on these test instances, and whether the gap is larger than the spread between instances.'
            : 'How the settings compare on this one test instance.'
        }
        cannot="That the same pattern holds for your own stocks, at larger sizes or on real quantum hardware. Differences smaller than the error bars, or from very few instances, are not reliable."
      >
        <ul className="list-disc pl-5 space-y-1">
          <li>These are precomputed runs, generated once on {study.generated_at}. They are not recomputed from your portfolio.</li>
          <li>Instances use fixed random seeds, so the numbers reproduce. QAOA noiseless simulation is used unless the notes say otherwise.</li>
        </ul>
      </WhatThisMeans>

      {(study.notes ?? []).length > 0 && (
        <div>
          <p className="label mb-1">Notes and execution environment</p>
          <ul className="list-disc pl-5 text-xs text-muted space-y-1">
            {study.notes.map((n, i) => (
              <li key={i} className="break-words">{n}</li>
            ))}
          </ul>
        </div>
      )}

      <ShowData>
        <TableBox>
          <table className="w-full text-xs num text-left">
            <thead>
              <tr className="border-b border-line">
                <th className="py-2 pr-3">Series</th>
                <th className="py-2 pr-3 text-right">{study.x_label}</th>
                <th className="py-2 text-right">{showSpread ? 'Mean ± spread' : 'Value'}</th>
              </tr>
            </thead>
            <tbody>
              {series.flatMap((s, i) =>
                s.points.map((p, j) => (
                  <tr key={`${i}-${j}`} className="border-b border-line">
                    <td className="py-2 pr-3 text-text">
                      <span className="inline-block mr-2 align-middle"><SolverMarker style={getSeriesStyle(i)} /></span>
                      {s.label}
                    </td>
                    <td className="py-2 pr-3 text-right">{p.x}</td>
                    <td className="py-2 text-right">
                      {fmt(p.y)}
                      {showSpread && isNum(p.yerr) ? ` ± ${fmt(p.yerr)}` : ''}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </TableBox>
      </ShowData>
    </article>
  );
};
