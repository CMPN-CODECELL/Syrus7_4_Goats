import React, { useState, useEffect } from 'react';
import { StudySummary, Study } from '../api/types';
import { listStudies, getStudy } from '../api/client';
import { StudyChart } from '../components/StudyChart';

export const Evidence: React.FC = () => {
  const [studiesIndex, setStudiesIndex] = useState<StudySummary[]>([]);
  const [activeStudyId, setActiveStudyId] = useState<string>('depth');
  const [currentStudy, setCurrentStudy] = useState<Study | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingStudy, setLoadingStudy] = useState(false);

  useEffect(() => {
    listStudies()
      .then(res => {
        setStudiesIndex(res);
        if (res.length > 0) setActiveStudyId(res[0].id);
      })
      .catch(err => console.error(err))
      .finally(() => setLoadingList(false));
  }, []);

  useEffect(() => {
    if (!activeStudyId) return;
    setLoadingStudy(true);
    getStudy(activeStudyId)
      .then(res => setCurrentStudy(res))
      .catch(err => console.error(err))
      .finally(() => setLoadingStudy(false));
  }, [activeStudyId]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-panel border border-line rounded-2xl p-6 shadow-panel">
        <h1 className="text-xl font-bold text-text mb-2 flex items-center gap-2">
          <span className="text-peach">📊</span> Empirical Quantum Evidence &amp; Benchmark Studies
        </h1>
        <p className="text-xs text-muted leading-relaxed">
          Systematic benchmark study runs evaluating QAOA circuit depth (p), classical optimizer convergence, parameter initialization (warm-start interp), XY ring mixers, and physical hardware noise simulation.
        </p>
      </div>

      {loadingList ? (
        <div className="p-8 text-center text-xs text-muted bg-panel border border-line rounded-2xl animate-pulse">
          Loading evidence study index...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Study Selector Tabs */}
          <div className="flex bg-panel p-1.5 rounded-2xl border border-line overflow-x-auto shadow-panel gap-1">
            {studiesIndex.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveStudyId(s.id)}
                className={`px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
                  activeStudyId === s.id
                    ? 'bg-peach text-ink shadow'
                    : 'text-muted hover:text-text hover:bg-line/40'
                }`}
              >
                {s.title}
              </button>
            ))}
          </div>

          {/* Active Study View */}
          {loadingStudy ? (
            <div className="p-12 text-center text-xs text-muted bg-panel border border-line rounded-2xl space-y-3">
              <div className="w-6 h-6 border-2 border-peach border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p>Loading study dataset...</p>
            </div>
          ) : currentStudy ? (
            <StudyChart study={currentStudy} />
          ) : (
            <div className="p-8 text-center text-xs text-muted bg-panel border border-line rounded-2xl">
              Select a study from above to view empirical plots.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
