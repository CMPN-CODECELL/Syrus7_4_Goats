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
    <div className="bg-surface border border-line-strong p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 bg-text"></span>
            <h2 className="text-base font-medium text-text">
              Executing QAOA &amp; Classical Solvers
            </h2>
          </div>
          <p className="text-xs text-muted mt-1">
            Job ID: <code className=" text-text">{jobStatus.job_id}</code> | Elapsed: <strong className="text-text">{jobStatus.elapsed_s.toFixed(1)} s</strong>
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 min-h-[44px] bg-surface text-text border border-line-strong hover:bg-line hover:text-text text-xs font-medium transition-all self-start sm:self-auto flex items-center justify-center"
        >
          Cancel Optimization
        </button>
      </div>

      {/* Progress Bar & Stage Info */}
      <div className="mb-5">
        <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
          <span className="text-text">{jobStatus.stage}</span>
          <span className="text-text font-medium">{percent}%</span>
        </div>
        <div className="w-full bg-bg h-3 p-0.5 border border-line overflow-hidden">
          <div
            className="bg-text h-full transition-all ease-out"
            style={{ width: `${percent}%` }}
          ></div>
        </div>
      </div>

      {/* Live Convergence Curve */}
      {convergence.length > 0 && (
        <div className="bg-bg border border-line p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-medium text-text flex items-center gap-1.5">
              Live Energy Convergence
            </h3>
            <span className="text-[10px] text-muted">
              Latest Energy: <strong className="text-text">{convergence[convergence.length - 1].energy.toFixed(4)}</strong>
            </span>
          </div>

          {/* Recharts container with explicit height wrapper */}
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={convergence} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="iter" stroke="#A3A3A3" tick={{ fill: '#A3A3A3' }} fontSize={10} tickLine={false} />
                <YAxis stroke="#A3A3A3" tick={{ fill: '#A3A3A3' }} fontSize={10} tickLine={false} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0A0A0A', borderColor: '#6B6B6B', borderRadius: 0, fontSize: '11px', color: '#FFFFFF' }}
                  labelFormatter={(label: any) => `Iteration ${label}`}
                  formatter={(val: any) => [Number(val).toFixed(5), 'Energy F(x)']}
                />
                <Line
                  type="monotone"
                  dataKey="energy"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                  dot={{ r: 2, fill: '#FFFFFF' }}
                  activeDot={{ r: 5, fill: '#FFFFFF', stroke: '#000000', strokeWidth: 2 }}
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
