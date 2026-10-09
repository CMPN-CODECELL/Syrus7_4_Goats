import React, { useState, useEffect } from 'react';
import { StudySummary, Study } from '../api/types';
import { listStudies, getStudy } from '../api/client';
import { StudyChart } from '../components/StudyChart';

export const Evidence: React.FC = () => {
  const [studiesIndex, setStudiesIndex] = useState<StudySummary[]>([]);
  const [activeStudyId, setActiveStudyId] = useState<string>('');
  const [currentStudy, setCurrentStudy] = useState<Study | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingStudy, setLoadingStudy] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [studyError, setStudyError] = useState<string | null>(null);
  const [studyReload, setStudyReload] = useState(0); // bump to re-fetch the open study

  const fetchStudiesIndex = () => {
    setLoadingList(true);
    setListError(null);
    listStudies()
      .then(res => {
        setStudiesIndex(res);
        if (res.length > 0) setActiveStudyId(res[0].id);
      })
      .catch(err => {
        setListError(err.message || 'Unable to load benchmark study index from backend.');
      })
      .finally(() => setLoadingList(false));
  };

  useEffect(() => {
    fetchStudiesIndex();
  }, []);

  useEffect(() => {
    if (!activeStudyId) return;
    let stale = false; // a slow reply for a study the user already left is ignored
    setLoadingStudy(true);
    setStudyError(null);
    getStudy(activeStudyId)
      .then(res => { if (!stale) setCurrentStudy(res); })
      .catch(err => {
        if (!stale) setStudyError(err.message || `Unable to load study data for ${activeStudyId}.`);
      })
      .finally(() => { if (!stale) setLoadingStudy(false); });
    return () => { stale = true; };
  }, [activeStudyId, studyReload]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-surface border border-line p-6">
        <h1 className="text-xl font-medium text-text mb-2 flex items-center gap-2">
          Empirical Quantum Evidence &amp; Benchmark Studies
        </h1>
        <p className="text-xs text-muted leading-relaxed">
          Systematic benchmark study runs evaluating QAOA circuit depth (p), classical optimizer convergence, parameter initialization (warm-start interp), XY ring mixers, and physical hardware noise simulation.
        </p>
      </div>

      {loadingList ? (
        <div className="p-8 text-center text-xs text-muted bg-surface border border-line">
          Loading evidence study index...
        </div>
      ) : listError ? (
        <div className="bg-surface border border-line-strong p-6 text-center space-y-3">
          <h2 className="text-sm font-medium text-text">⚠ Unable to Load Benchmark Studies</h2>
          <p className="text-xs text-text max-w-md mx-auto">{listError}</p>
          <button
            type="button"
            onClick={fetchStudiesIndex}
            className="px-5 py-2.5 min-h-[44px] bg-text text-bg font-medium text-xs hover:bg-muted transition-all"
          >
            Retry Loading Studies
          </button>
        </div>
      ) : studiesIndex.length === 0 ? (
        <div className="bg-surface border border-line p-8 text-center space-y-2">
          <h2 className="text-sm font-medium text-text">No Studies Available Yet</h2>
          <p className="text-xs text-muted max-w-md mx-auto">
            Benchmark studies are generated offline by <code className="text-text">scripts/run_studies.py</code>. Run it, then reload this page.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Study Selector Tabs */}
          <div className="flex bg-surface p-1.5 border border-line overflow-x-auto gap-1">
            {studiesIndex.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveStudyId(s.id)}
                className={`px-4 py-2 min-h-[44px] text-xs font-medium whitespace-nowrap transition-all flex items-center justify-center ${
                  activeStudyId === s.id
                    ? 'bg-text text-bg'
                    : 'text-muted hover:text-text hover:bg-line/40'
                }`}
              >
                {s.title}
              </button>
            ))}
          </div>

          {/* Active Study View */}
          {loadingStudy ? (
            <div className="p-12 text-center text-xs text-muted bg-surface border border-line space-y-3">
              <p>Loading study dataset...</p>
            </div>
          ) : studyError ? (
            <div className="bg-surface border border-line-strong p-6 text-center space-y-3">
              <h3 className="text-xs font-medium text-text">⚠ Study Unavailable</h3>
              <p className="text-xs text-text break-words">{studyError}</p>
              <button
                type="button"
                onClick={() => setStudyReload(n => n + 1)}
                className="px-5 py-2.5 min-h-[44px] bg-text text-bg font-medium text-xs hover:bg-muted transition-all"
              >
                Retry
              </button>
            </div>
          ) : currentStudy ? (
            <StudyChart study={currentStudy} />
          ) : (
            <div className="p-8 text-center text-xs text-muted bg-surface border border-line">
              Select a study from above to view empirical plots.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
