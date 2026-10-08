import React from 'react';
import { Study } from '../api/types';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
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

  const chartData = xValues.map(x => {
    const row: Record<string, any> = { x };
    study.series.forEach(s => {
      const pt = s.points.find(p => p.x === x);
      if (pt) {
        row[s.label] = pt.y;
        if (pt.yerr !== null && pt.yerr !== undefined) {
          row[`${s.label}_err`] = pt.yerr;
        }
      }
    });
    return row;
  });

  return (
    <div className="bg-panel border border-line rounded-2xl p-6 shadow-panel mb-6 space-y-5">
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
          <span className="text-[10px] text-muted block mt-0.5">Wall time: {study.wall_time_s.toFixed(1)} s</span>
        </div>
      </div>

      {/* Multi-Series Recharts LineChart */}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#384358" opacity={0.5} />
            <XAxis
              dataKey="x"
              stroke="#A9B3C9"
              fontSize={11}
              label={{ value: study.x_label, position: 'insideBottom', offset: -12, fill: '#A9B3C9', fontSize: 11 }}
            />
            <YAxis
              stroke="#A9B3C9"
              fontSize={11}
              label={{ value: study.y_label, angle: -90, position: 'insideLeft', offset: 10, fill: '#A9B3C9', fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#242F49', borderColor: '#384358', borderRadius: '8px', fontSize: '11px', color: '#F4EFEA' }}
              labelFormatter={(val) => `${study.x_label}: ${val}`}
            />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', color: '#F4EFEA' }} />

            {study.series.map((s, idx) => (
              <Line
                key={s.label}
                type="monotone"
                dataKey={s.label}
                stroke={SERIES_COLOR_LIST[idx % SERIES_COLOR_LIST.length]}
                strokeWidth={2.5}
                dot={{ r: 3.5, fill: SERIES_COLOR_LIST[idx % SERIES_COLOR_LIST.length] }}
                activeDot={{ r: 6, fill: SERIES_COLOR_LIST[idx % SERIES_COLOR_LIST.length], stroke: '#161E2F', strokeWidth: 2 }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
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
            Seeds: [{study.instance.seeds.join(', ')}]
          </div>
        </div>

        <div className="bg-ink/50 p-3.5 rounded-xl border border-line/60">
          <span className="text-[10px] text-muted uppercase font-bold block mb-1">Notes &amp; Execution Environment</span>
          <ul className="list-disc list-inside text-muted text-[11px] space-y-1">
            {study.notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
