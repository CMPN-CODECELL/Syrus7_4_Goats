import React, { useState, useEffect } from 'react';
import { StudySummary } from '../api/types';
import { listStudies } from '../api/client';

export const Evidence: React.FC = () => {
  const [studies, setStudies] = useState<StudySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listStudies()
      .then(res => setStudies(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-panel border border-line rounded-2xl p-6 shadow-panel">
        <h1 className="text-xl font-bold text-text mb-2 flex items-center gap-2">
          <span className="text-peach">📊</span> Empirical Quantum Evidence &amp; Depth Benchmark Studies
        </h1>
        <p className="text-xs text-muted leading-relaxed">
          Systematic study runs measuring QAOA performance under circuit depth scaling, optimizer convergence, parameter warm-starts, XY mixers, and noise simulation.
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-muted bg-panel border border-line rounded-2xl animate-pulse">
          Loading evidence studies list...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {studies.map(s => (
            <div key={s.id} className="p-5 bg-panel border border-line hover:border-peach/40 rounded-2xl shadow-panel transition-all">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-sm text-peach">{s.title}</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-ink text-muted border border-line">
                  ID: {s.id}
                </span>
              </div>
              <p className="text-xs text-text/90 leading-relaxed mb-4">
                {s.summary}
              </p>
              <div className="p-3 bg-ink/50 rounded-xl border border-line/60 text-[11px] text-muted flex items-center justify-between">
                <span>Detailed plots and instance metrics will render in U13 integration view.</span>
                <span className="text-peach font-bold text-xs">Ready</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
