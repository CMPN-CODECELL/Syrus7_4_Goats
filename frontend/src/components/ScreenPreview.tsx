import React from 'react';
import { ScreenInfo } from '../api/types';

interface ScreenPreviewProps {
  screenInfo: ScreenInfo | null;
  loading: boolean;
  qubitCap: number;
}

export const ScreenPreview: React.FC<ScreenPreviewProps> = ({ screenInfo, loading, qubitCap }) => {
  if (loading) {
    return (
      <div className="bg-surface border border-line p-4 mb-6 animate-pulse">
        <div className="h-4 bg-line/50 w-1/3 mb-2"></div>
        <div className="h-3 bg-line/30 w-3/4"></div>
      </div>
    );
  }

  if (!screenInfo) return null;

  return (
    <div className={`border p-4 transition-all ${
      screenInfo.applied
        ? 'bg-surface border-line-strong'
        : 'bg-surface border-line'
    }`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className={`text-sm ${screenInfo.applied ? 'text-text font-medium' : 'text-muted'}`}>
              {screenInfo.applied ? 'Pre-Screen Applied' : '✓ Universe Within Qubit Cap'}
            </span>
            <span className="text-xs px-2 py-0.5 bg-bg text-muted border border-line">
              Qubit Cap: {qubitCap}
            </span>
          </div>

          <p className="text-xs text-text mt-1.5 leading-relaxed">
            {screenInfo.rule}
          </p>

          {screenInfo.applied && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-bg border border-line/60">
                <span className="text-muted block text-[10px] font-medium uppercase mb-1">
                  Kept ({screenInfo.kept.length} assets)
                </span>
                <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                  {screenInfo.kept.map(t => (
                    <span key={t} className="px-1.5 py-0.5 bg-surface text-text text-[10px] font-medium">
                      {t.replace('.NS', '')}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-2.5 bg-bg border border-line/60">
                <span className="text-muted block text-[10px] font-medium uppercase mb-1">
                  Screened Out ({screenInfo.dropped.length} assets)
                </span>
                <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                  {screenInfo.dropped.map(t => (
                    <span key={t} className="px-1.5 py-0.5 bg-line/50 text-muted text-[10px]">
                      {t.replace('.NS', '')}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Qubit Split Breakdown Badge */}
        <div className="bg-bg p-3 border border-line text-right shrink-0">
          <div className="label">Qubit Split</div>
          <div className="text-lg font-medium text-text">
            {screenInfo.qubits.total} / {qubitCap}
          </div>
          <div className="text-[10px] text-muted mt-0.5">
            {screenInfo.qubits.assets} Assets + {screenInfo.qubits.slack} Slack
          </div>
        </div>
      </div>
    </div>
  );
};
