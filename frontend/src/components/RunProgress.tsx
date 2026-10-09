import React from 'react';
import { JobStatus } from '../api/types';
import { Btn } from './wizard/fields';

interface RunProgressProps {
  jobStatus: JobStatus;
  onCancel: () => void;
}

/** The stage text and the progress bar are exactly what the server reported: nothing is estimated here. */
export const RunProgress: React.FC<RunProgressProps> = ({ jobStatus, onCancel }) => {
  const fraction = Number.isFinite(jobStatus.progress) ? Math.min(1, Math.max(0, jobStatus.progress)) : 0;
  const percent = Math.round(fraction * 100);

  return (
    <div className="border border-line-strong bg-surface p-4 sm:p-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <h3 className="text-xl">Optimizing your portfolio</h3>
          <p className="mt-1 text-sm text-muted">
            Elapsed {jobStatus.elapsed_s.toFixed(1)} s · job <span className="font-mono">{jobStatus.job_id}</span>
          </p>
        </div>
        <Btn onClick={onCancel} className="self-start">Cancel run</Btn>
      </div>

      <div className="mt-4">
        <p role="status" aria-live="polite" className="text-base text-text">{jobStatus.stage}</p>
        <div className="mt-2 flex items-center gap-3">
          <div
            role="progressbar"
            aria-label="Run progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            aria-valuetext={`${percent} percent. ${jobStatus.stage}`}
            className="h-3 flex-1 border border-line-strong bg-bg"
          >
            <div className="h-full bg-text" style={{ width: `${percent}%` }} />
          </div>
          <span className="w-12 text-right text-sm tabular-nums text-text">{percent}%</span>
        </div>
        <p className="mt-2 text-sm text-muted">The stage text and progress bar are reported by the server, not estimated here.</p>
      </div>
    </div>
  );
};
