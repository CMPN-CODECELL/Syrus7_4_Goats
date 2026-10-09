import React from 'react';
import { JobStatus } from '../api/types';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface RunProgressProps {
  jobStatus: JobStatus;
  onCancel: () => void;
}

export const RunProgress: React.FC<RunProgressProps> = ({ jobStatus, onCancel }) => {
  const percent = Math.round((jobStatus.progress || 0) * 100);
  const convergence = jobStatus.convergence || [];

  return (
    <div className="bg-panel border border-peach/40 rounded-2xl p-6 shadow-panel mb-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-peach animate-ping"></span>
            <h2 className="text-base font-bold text-text">
              Executing QAOA &amp; Classical Solvers
            </h2>
          </div>
          <p className="text-xs text-muted mt-1">
            Job ID: <code className="font-mono text-peach">{jobStatus.job_id}</code> | Elapsed: <strong className="text-text">{jobStatus.elapsed_s.toFixed(1)} s</strong>
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 min-h-[44px] bg-red/20 text-[#FF8A8A] border border-red/40 hover:bg-wine hover:text-text text-xs font-bold rounded-xl transition-all self-start sm:self-auto flex items-center justify-center"
        >
          Cancel Optimization
        </button>
      </div>

      {/* Progress Bar & Stage Info */}
      <div className="mb-5">
        <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
          <span className="text-peach">{jobStatus.stage}</span>
          <span className="text-text font-mono font-bold">{percent}%</span>
        </div>
        <div className="w-full bg-ink rounded-full h-3 p-0.5 border border-line overflow-hidden">
          <div
            className="bg-hero-bar h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${percent}%` }}
          ></div>
        </div>
      </div>

      {/* Live Convergence Curve */}
      {convergence.length > 0 && (
        <div className="bg-ink/60 border border-line rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-text flex items-center gap-1.5">
              <span>📈</span> Live Energy Convergence
            </h3>
            <span className="text-[10px] text-muted font-mono">
              Latest Energy: <strong className="text-peach">{convergence[convergence.length - 1].energy.toFixed(4)}</strong>
            </span>
          </div>

          {/* Recharts container with explicit height wrapper */}
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={convergence} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#384358" opacity={0.5} />
                <XAxis dataKey="iter" stroke="#A9B3C9" fontSize={10} tickLine={false} />
                <YAxis stroke="#A9B3C9" fontSize={10} tickLine={false} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#242F49', borderColor: '#384358', borderRadius: '8px', fontSize: '11px', color: '#F4EFEA' }}
                  labelFormatter={(label: any) => `Iteration ${label}`}
                  formatter={(val: any) => [Number(val).toFixed(5), 'Energy F(x)']}
                />
                <Line
                  type="monotone"
                  dataKey="energy"
                  stroke="#FFA586"
                  strokeWidth={2}
                  dot={{ r: 2, fill: '#FFA586' }}
                  activeDot={{ r: 5, fill: '#FFA586', stroke: '#161E2F', strokeWidth: 2 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
