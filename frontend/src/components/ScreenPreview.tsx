import React from 'react';
import { ScreenInfo } from '../api/types';
import { formatInt } from '../lib/format';
import { Eyebrow } from './ui';

interface ScreenPreviewProps {
  screenInfo: ScreenInfo | null;
  loading: boolean;
  /** The server's message when the preview could not be built (for example, no portfolio fits the rules). */
  error?: string | null;
  qubitCap: number;
}

/** Stocks available versus shortlisted, and how many qubits that needs. */
export const ScreenPreview: React.FC<ScreenPreviewProps> = ({ screenInfo, loading, error, qubitCap }) => {
  if (error) {
    return (
      <div role="alert" className="border border-loss p-4 text-sm text-text">
        <p className="font-medium"><span aria-hidden="true">⚠ </span>The shortlist could not be built for these settings.</p>
        <p className="mt-1 break-words">{error}</p>
        <p className="mt-1 text-muted">
          The server rejects settings that no portfolio can satisfy, for example too few stocks for K, an industry limit that is too tight, a minimum return that is too high, or a qubit cap that is too small. Edit the settings and the preview updates.
        </p>
      </div>
    );
  }

  if (loading || !screenInfo) {
    return (
      <div className="border border-line bg-surface p-4" role="status" aria-live="polite">
        <Eyebrow>Stock shortlist</Eyebrow>
        <p className="mt-1 text-sm text-muted">
          {loading
            ? 'Checking how many stocks and qubits these settings need…'
            : 'The shortlist preview appears once the settings are valid. Fix the issues listed above.'}
        </p>
      </div>
    );
  }

  const { applied, kept, dropped, qubits, rule } = screenInfo;
  const shortlisted = applied ? kept.length : qubits.assets;
  const available = applied ? kept.length + dropped.length : qubits.assets;

  return (
    <div className="border border-line bg-surface p-4">
      <Eyebrow>Stock shortlist</Eyebrow>
      <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <p className="text-2xl font-medium tabular-nums text-text">{formatInt(available)}</p>
          <p className="text-sm text-muted">stocks available</p>
        </div>
        <div>
          <p className="text-2xl font-medium tabular-nums text-text">{formatInt(shortlisted)}</p>
          <p className="text-sm text-muted">shortlisted for the optimiser</p>
        </div>
        <div>
          <p className="text-2xl font-medium tabular-nums text-text">{qubits.total} <span className="text-base text-muted">of {qubitCap} qubits</span></p>
          <p className="text-sm text-muted">{qubits.assets} stock + {qubits.slack} slack</p>
        </div>
      </div>

      <p className="mt-3 max-w-prose text-sm leading-relaxed text-text">
        {applied
          ? rule
          : `All ${available} stocks fit within the ${qubitCap}-qubit cap, so none were screened out.`}
      </p>
      {applied && (
        <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted">
          Screening keeps the simulated quantum circuit small. It uses past data only, so a screened-out stock is simply not considered in this run.
        </p>
      )}

      {applied && (
        <details className="mt-3">
          <summary className="flex min-h-[44px] cursor-pointer items-center text-sm text-text">See which stocks were kept and screened out</summary>
          <div className="mt-2 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div className="border border-line bg-bg p-3">
              <p className="font-mono text-xs uppercase tracking-[0.08em] text-muted">Shortlisted ({kept.length})</p>
              <p className="mt-1 text-text">{kept.map((t) => t.replace('.NS', '')).join(', ')}</p>
            </div>
            <div className="border border-line bg-bg p-3">
              <p className="font-mono text-xs uppercase tracking-[0.08em] text-muted">Screened out ({dropped.length})</p>
              <p className="mt-1 text-muted">{dropped.map((t) => t.replace('.NS', '')).join(', ')}</p>
            </div>
          </div>
        </details>
      )}
    </div>
  );
};
