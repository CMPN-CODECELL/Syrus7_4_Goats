import React from 'react';
import { Study } from '../api/types';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ErrorBar } from 'recharts';
import { CHART_COLORS } from '../lib/chartColors';

interface StudyChartProps {
  study: Study;
}

const SERIES_COLOR_LIST = [
  CHART_COLORS.qaoa_standard,
  CHART_COLORS.qaoa_xy,
  CHART_COLORS.slate,
  CHART_COLORS.annealing,
  CHART_COLORS.brute_force
];

export const StudyChart: React.FC<StudyChartProps> = ({ study }) => {
  // Transform multi-series into Recharts flattened rows
  // Map points by x coordinate
  const xValues = Array.from(
    new Set(study.series.flatMap(s => s.points.map(p => p.x)))
  ).sort((a, b) => a - b);

  // Series are keyed s0, s1, ... so a label with a dot or bracket can never break the data lookup
  const chartData = xValues.map(x => {
    const row: Record<string, any> = { x };
    study.series.forEach((s, i) => {
      const pt = s.points.find(p => p.x === x);
      if (pt) {
        row[`s${i}`] = pt.y;
        if (pt.yerr !== null && pt.yerr !== undefined) {
          row[`s${i}_err`] = pt.yerr;
        }
      }
    });
    return row;
  });
  const fmt = (v: any) => (typeof v === 'number' ? v.toFixed(4) : String(v));

  return (
    <div className="bg-panel border border-line rounded-2xl p-4 sm:p-6 shadow-panel mb-6 space-y-5">
      {/* Study Header */}
      <div className="border-b border-line pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-text flex items-center gap-2">
            <span className="text-peach">✦</span> {study.title}
          </h2>
          <p className="text-xs text-muted mt-1 leading-relaxed max-w-2xl">
            {study.description}
          </p>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[10px] text-muted uppercase font-bold block">Generated</span>
          <span className="text-xs font-mono font-bold text-peach">{study.generated_at}</span>
          <span className="text-[10px] text-muted block mt-0.5">Wall time: {Number(study.wall_time_s).toFixed(1)} s</span>
        </div>
      </div>

      {/* Legend in words, outside the SVG so it wraps on a phone */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-text">
        {study.series.map((s, idx) => (
          <span key={idx} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: SERIES_COLOR_LIST[idx % SERIES_COLOR_LIST.length] }}></span>
            {s.label}
          </span>
        ))}
      </div>
      <p className="text-[11px] text-muted -mt-2">Vertical axis: {study.y_label}. Error bars show the spread over instances.</p>

      {/* Multi-Series Recharts LineChart */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#384358" opacity={0.5} />
            <XAxis dataKey="x" stroke="#A9B3C9" fontSize={11} />
            <YAxis stroke="#A9B3C9" fontSize={11} width={48} />
            <Tooltip
              contentStyle={{ backgroundColor: '#242F49', borderColor: '#384358', borderRadius: '8px', fontSize: '11px', color: '#F4EFEA' }}
              labelFormatter={(val: any) => `x = ${val}`}
              formatter={(val: any, name: any) => [fmt(val), name]}
            />

            {study.series.map((s, idx) => (
              <Line
                key={idx}
                type="monotone"
                name={s.label}
                dataKey={`s${idx}`}
                stroke={SERIES_COLOR_LIST[idx % SERIES_COLOR_LIST.length]}
                strokeWidth={2.5}
                dot={{ r: 3.5, fill: SERIES_COLOR_LIST[idx % SERIES_COLOR_LIST.length] }}
                activeDot={{ r: 6, fill: SERIES_COLOR_LIST[idx % SERIES_COLOR_LIST.length], stroke: '#161E2F', strokeWidth: 2 }}
                isAnimationActive={false}
              >
                <ErrorBar dataKey={`s${idx}_err`} stroke={SERIES_COLOR_LIST[idx % SERIES_COLOR_LIST.length]} width={4} />
              </Line>
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[11px] text-muted text-center -mt-3">Horizontal axis: {study.x_label}</p>

      {/* Plain table of the plotted values, so single-point series are readable too */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-text">
          <thead>
            <tr className="border-b border-line/60 text-[11px] text-muted uppercase font-bold tracking-wider">
              <th className="py-2 px-3">Series</th>
              <th className="py-2 px-3 text-right">x</th>
              <th className="py-2 px-3 text-right">Mean ± spread</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/40">
            {study.series.flatMap((s, i) =>
              s.points.map((p, j) => (
                <tr key={`${i}-${j}`}>
                  <td className="py-2 px-3 font-bold">
                    <span className="inline-block w-2.5 h-2.5 rounded-full mr-2 align-middle" style={{ backgroundColor: SERIES_COLOR_LIST[i % SERIES_COLOR_LIST.length] }}></span>
                    {s.label}
                  </td>
                  <td className="py-2 px-3 text-right font-mono">{p.x}</td>
                  <td className="py-2 px-3 text-right font-mono">
                    {fmt(p.y)}{p.yerr !== null && p.yerr !== undefined ? ` ± ${fmt(p.yerr)}` : ''}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Instance Metadata Footer & Notes */}
      <div className="pt-4 border-t border-line grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="bg-ink/50 p-3.5 rounded-xl border border-line/60">
          <span className="text-[10px] text-muted uppercase font-bold block mb-1">Instance Configuration</span>
          <div className="grid grid-cols-2 gap-2 text-text font-mono text-[11px]">
            <div>Assets: <strong>{study.instance.n_assets}</strong></div>
            <div>Cardinality K: <strong>{study.instance.k}</strong></div>
            <div>Risk q: <strong>{study.instance.q}</strong></div>
            <div>Shots: <strong>{study.instance.shots}</strong></div>
          </div>
          <div className="text-[10px] text-muted mt-2">
            Seeds: [{(study.instance.seeds ?? []).join(', ')}]
          </div>
        </div>

        <div className="bg-ink/50 p-3.5 rounded-xl border border-line/60">
          <span className="text-[10px] text-muted uppercase font-bold block mb-1">Notes &amp; Execution Environment</span>
          <ul className="list-disc list-inside text-muted text-[11px] space-y-1">
            {(study.notes ?? []).map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
