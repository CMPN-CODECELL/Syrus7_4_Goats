import React, { useState, useEffect } from 'react';
import { StudySummary, Study, Frontier } from '../api/types';
import { listStudies, getStudy } from '../api/client';
import { useRun } from '../state/run';
import { Card, Eyebrow, Section, Status } from '../components/ui';
import { formatPct, formatInt, isNum } from '../lib/format';
import { StudyChart } from '../components/StudyChart';
import { FrontierChart } from '../components/FrontierChart';
import { ConvergenceChart } from '../components/ConvergenceChart';
import { BitstringHistogram } from '../components/BitstringHistogram';
import { AccuracyChart } from '../components/AccuracyChart';
import { SolverTable } from '../components/SolverTable';
import { readControl, readMetrics, verifiedStockOrder } from '../components/ChartParts';

const EMPTY_FRONTIER: Frontier = { continuous: [], discrete: [] };

const primaryButton =
  'inline-flex items-center justify-center px-5 py-2.5 min-h-[44px] bg-text text-bg font-medium text-sm hover:bg-muted';

interface EvidenceProps {
  /** Switch to the Optimize tab. Without it the button falls back to a "#optimize" link. */
  onGoOptimize?: () => void;
}

export const Evidence: React.FC<EvidenceProps> = ({ onGoOptimize }) => {
  const { result, isStale, running } = useRun();

  // Solver picked on this page, remembered per run so a new run starts from its recommendation
  const [pick, setPick] = useState<{ runId: string; key: string } | null>(null);

  // Precomputed benchmark studies
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
        setListError(err.message || 'Unable to load the benchmark study index from the backend.');
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

  const solvers = result?.solvers ?? [];
  const selectedKey =
    result && pick && pick.runId === result.run_id && solvers.some(s => s.solver === pick.key)
      ? pick.key
      : result?.recommended ?? solvers[0]?.solver ?? '';
  const onSelectSolver = (key: string) => result && setPick({ runId: result.run_id, key });

  const metrics = readMetrics(result?.qaoa);
  const control = readControl(result?.qaoa);
  const req = result?.request;

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <div className="mb-6">
        <Eyebrow>Evidence</Eyebrow>
        <p className="mt-1 text-sm text-muted max-w-prose">
          The charts and tables behind your latest result: how the portfolio sits against the alternatives, how the quantum optimiser behaved, and how every
          method compares. Benchmark studies from earlier offline runs follow at the end.
        </p>
      </div>

      {!result ? (
        <Card className="space-y-3">
          <h2 className="text-xl">Run an optimization to see this run's evidence</h2>
          <p className="text-sm text-muted max-w-prose">
            {running
              ? 'A run is in progress. Its evidence appears here when it finishes.'
              : 'These charts are drawn from the result of a run you start on the Optimize tab. Nothing is shown until there is a result.'}
          </p>
          {onGoOptimize ? (
            <button type="button" onClick={onGoOptimize} className={primaryButton}>
              Go to Optimize
            </button>
          ) : (
            <a href="#optimize" className={primaryButton}>
              Go to Optimize
            </a>
          )}
        </Card>
      ) : (
        <>
          {/* Which run this is, so an old result is never mistaken for the current settings */}
          <div className="space-y-3">
            {isStale && (
              <div role="status" className="border border-line-strong p-3 text-sm text-text">
                Your settings changed after this run. The evidence below belongs to the earlier run, not to what is selected now. Run again to refresh it.
              </div>
            )}
            {running && !isStale && (
              <div role="status" className="border border-line-strong p-3 text-sm text-text">
                A new run is in progress. The evidence below is from the previous run until it finishes.
              </div>
            )}
            <Card>
              <Eyebrow>This run</Eyebrow>
              <dl className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-3 text-sm">
                <div>
                  <dt className="label">Snapshot date</dt>
                  <dd className="text-text">{result.data?.as_of ?? '—'}</dd>
                </div>
                <div>
                  <dt className="label">Estimation window</dt>
                  <dd className="text-text">
                    {result.data?.est_window ? `${result.data.est_window[0]} to ${result.data.est_window[1]}` : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="label">Stocks solved</dt>
                  <dd className="text-text">
                    {formatInt(result.qubo?.n_assets)} ({formatInt(result.qubo?.n_vars)} qubits)
                  </dd>
                </div>
                <div>
                  <dt className="label">Feasible portfolios</dt>
                  <dd className="text-text">{formatInt(result.landscape?.n_feasible)}</dd>
                </div>
                <div>
                  <dt className="label">Holdings K</dt>
                  <dd className="text-text">{req?.k ?? '—'}</dd>
                </div>
                <div>
                  <dt className="label">Risk aversion q</dt>
                  <dd className="text-text">{req?.risk_aversion ?? '—'}</dd>
                </div>
                <div>
                  <dt className="label">Sector cap</dt>
                  <dd className="text-text">{req?.sector_cap ?? 'none'}</dd>
                </div>
                <div>
                  <dt className="label">Target return</dt>
                  <dd className="text-text">{isNum(req?.target_return) ? formatPct(req?.target_return) : 'none'}</dd>
                </div>
                <div className="col-span-2 md:col-span-4">
                  <dt className="label">QAOA settings</dt>
                  <dd className="text-text">
                    {req?.qaoa
                      ? `${req.qaoa.variant} mixer · depth ${req.qaoa.reps} · ${req.qaoa.optimizer} · ${req.qaoa.init} start · ${formatInt(req.qaoa.shots)} shots · max ${formatInt(req.qaoa.maxiter)} iterations · seed ${req.qaoa.seed}${req.qaoa.noise ? ' · noise simulated' : ''}`
                      : '—'}
                  </dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-muted">
                All methods ran on this one instance: the same stocks, data window, K, risk setting and rules. Return and volatility figures come from the
                estimation window, so they are in-sample and before transaction costs.
              </p>
            </Card>
          </div>

          <FrontierChart
            frontier={result.frontier ?? EMPTY_FRONTIER}
            solvers={solvers}
            selectedSolverKey={selectedKey}
            onSelectSolver={onSelectSolver}
          />

          <ConvergenceChart convergence={result.qaoa?.convergence ?? []} />

          <BitstringHistogram
            samples={result.qaoa?.samples ?? []}
            pOpt={metrics.pOpt}
            pBaseline={isNum(control?.p_opt) ? control!.p_opt : metrics.pRandom}
            feasibleRate={metrics.feasibleRate}
            stockOrder={verifiedStockOrder(result)}
          />

          <AccuracyChart result={result} />

          <SolverTable
            solvers={solvers}
            recommendedId={result.recommended}
            selectedSolverKey={selectedKey}
            onSelectSolver={onSelectSolver}
            landscape={result.landscape}
            qaoa={result.qaoa}
          />
        </>
      )}

      <Section
        id="evidence-studies"
        eyebrow="06 · Benchmarks"
        title="Benchmark studies"
        lead="These studies were precomputed offline over several random, fixed-seed test instances. They show how QAOA settings behave on small test problems and are not recomputed from your portfolio. Each study lists its own instances, seeds and maximum iterations."
      >
        {loadingList ? (
          <Status>Loading the list of benchmark studies...</Status>
        ) : listError ? (
          <div className="space-y-3">
            <Status error>Could not load the benchmark studies. {listError}</Status>
            <button type="button" onClick={fetchStudiesIndex} className={primaryButton}>
              Retry loading studies
            </button>
          </div>
        ) : studiesIndex.length === 0 ? (
          <Card className="space-y-2">
            <h3>No studies available yet</h3>
            <p className="text-sm text-muted max-w-prose">
              Benchmark studies are generated offline by <code className="text-text">scripts/run_studies.py</code>. Run it, then reload this page.
            </p>
          </Card>
        ) : (
          <div className="space-y-5">
            <div role="group" aria-label="Choose a benchmark study" className="flex flex-wrap gap-2">
              {studiesIndex.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveStudyId(s.id)}
                  aria-pressed={activeStudyId === s.id}
                  className={`px-4 py-2 min-h-[44px] text-sm border ${
                    activeStudyId === s.id ? 'bg-text text-bg border-text' : 'border-line-strong text-muted hover:text-text'
                  }`}
                >
                  {s.title}
                </button>
              ))}
            </div>

            {loadingStudy ? (
              <Status>Loading study data...</Status>
            ) : studyError ? (
              <div className="space-y-3">
                <Status error>Study unavailable. {studyError}</Status>
                <button type="button" onClick={() => setStudyReload(n => n + 1)} className={primaryButton}>
                  Retry
                </button>
              </div>
            ) : currentStudy ? (
              <StudyChart study={currentStudy} />
            ) : (
              <p className="text-sm text-muted">Select a study above to see its results.</p>
            )}
          </div>
        )}
      </Section>
    </div>
  );
};
