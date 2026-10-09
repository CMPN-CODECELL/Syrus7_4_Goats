import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Universe,
  RunRequest,
  ScreenInfo,
  QaoaSettings,
  JobStatus,
  RunResult
} from '../api/types';
import { getUniverse, postScreen, startRun, getRun, cancelRun } from '../api/client';
import { DataBanner } from '../components/DataBanner';
import { UniversePicker } from '../components/UniversePicker';
import { ConstraintsForm } from '../components/ConstraintsForm';
import { AdvancedQaoa } from '../components/AdvancedQaoa';
import { ScreenPreview } from '../components/ScreenPreview';
import { RunProgress } from '../components/RunProgress';
import { MetricCards } from '../components/MetricCards';
import { PortfolioTable } from '../components/PortfolioTable';
import { SolverTable } from '../components/SolverTable';
import { FrontierChart } from '../components/FrontierChart';
import { ConvergenceChart } from '../components/ConvergenceChart';
import { BitstringHistogram } from '../components/BitstringHistogram';
import { HonestyPanel } from '../components/HonestyPanel';
import { OutOfSample } from '../components/OutOfSample';

const DEFAULT_QAOA: QaoaSettings = {
  variant: 'standard',
  reps: 2,
  optimizer: 'COBYLA',
  init: 'ramp',
  shots: 4096,
  maxiter: 150,
  noise: false,
  seed: 7
};

export const Optimise: React.FC = () => {
  // Universe & API Status
  const [universe, setUniverse] = useState<Universe | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loadingUniverse, setLoadingUniverse] = useState(true);

  // Form State
  const [selectedTickers, setSelectedTickers] = useState<string[] | null>(null);
  const [k, setK] = useState<number>(5);
  const [riskAversion, setRiskAversion] = useState<number>(0.5);
  const [sectorCap, setSectorCap] = useState<number | null>(2);
  const [targetReturn, setTargetReturn] = useState<number | null>(null);
  const [capital, setCapital] = useState<number>(1000000);
  const [holdingsText, setHoldingsText] = useState('');
  const [qaoaSettings, setQaoaSettings] = useState<QaoaSettings>(DEFAULT_QAOA);
  const qubitCap = 12; // contract default: a live run stays under a minute (16 is allowed but takes ~3 min)

  // Pre-screen State
  const [screenInfo, setScreenInfo] = useState<ScreenInfo | null>(null);
  const [screenLoading, setScreenLoading] = useState<boolean>(false);

  // Job & Execution State
  const [activeJobStatus, setActiveJobStatus] = useState<JobStatus | null>(null);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [selectedSolverKey, setSelectedSolverKey] = useState<string>('brute_force');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Pending poll timeout, and the one job we are polling. A reply for any other job (after cancel, a new run or unmount) is dropped.
  const pollTimerRef = useRef<number | null>(null);
  const activeJobRef = useRef<string | null>(null);
  const rightPanelRef = useRef<HTMLDivElement | null>(null);

  const fetchUniverseData = useCallback(async () => {
    setLoadingUniverse(true);
    setApiError(null);
    try {
      const data = await getUniverse();
      setUniverse(data);
    } catch (err: any) {
      setApiError(err.message || 'Unable to connect to Quantum Backend API.');
    } finally {
      setLoadingUniverse(false);
    }
  }, []);

  useEffect(() => {
    fetchUniverseData();
  }, [fetchUniverseData]);

  // Holdings textarea: one "SYMBOL shares" per line -> {"TCS.NS": 52}, or an error message
  const holdings = useMemo((): Record<string, number> | string => {
    const known = new Set(universe?.assets.map(a => a.ticker));
    const out: Record<string, number> = {};
    for (const line of holdingsText.split('\n').map(l => l.trim()).filter(Boolean)) {
      const [sym, count, ...rest] = line.toUpperCase().split(/[\s,:=]+/);
      const ticker = sym.includes('.') ? sym : `${sym}.NS`;
      const shares = Number(count);
      if (rest.length || !known.has(ticker) || !Number.isInteger(shares) || shares <= 0) {
        return `Cannot read holdings line "${line}". Use one NIFTY 50 symbol and a whole number of shares per line, e.g. "TCS 52".`;
      }
      out[ticker] = shares;
    }
    return out;
  }, [holdingsText, universe]);

  // Construct current RunRequest payload
  const buildRunRequest = useCallback((): RunRequest => {
    return {
      tickers: selectedTickers,
      k,
      risk_aversion: riskAversion,
      sector_cap: sectorCap,
      target_return: targetReturn,
      capital,
      holdings: typeof holdings === 'string' ? {} : holdings,
      qubit_cap: qubitCap,
      qaoa: qaoaSettings
    };
  }, [selectedTickers, k, riskAversion, sectorCap, targetReturn, capital, holdings, qubitCap, qaoaSettings]);

  // Pre-screen preview: debounced, and a reply for an outdated form is ignored
  useEffect(() => {
    if (!universe) return;
    let stale = false;
    const timer = window.setTimeout(() => {
      setScreenLoading(true);
      postScreen(buildRunRequest())
        .then(res => { if (!stale) setScreenInfo(res); })
        .catch(() => { if (!stale) setScreenInfo(null); })
        .finally(() => { if (!stale) setScreenLoading(false); });
    }, 300);
    return () => { stale = true; clearTimeout(timer); };
  }, [universe, buildRunRequest]);

  const stopPolling = () => {
    if (pollTimerRef.current !== null) clearTimeout(pollTimerRef.current);
    pollTimerRef.current = null;
    activeJobRef.current = null;
  };

  // Clear polling timer on unmount
  useEffect(() => stopPolling, []);

  // Set default solver selection when result arrives
  useEffect(() => {
    if (runResult) {
      setSelectedSolverKey(runResult.recommended || runResult.solvers[0]?.solver || 'brute_force');
    }
  }, [runResult]);

  // Poll every 500 ms; the next request starts only after the previous reply, so replies never overlap
  // A single failed poll is retried; three in a row end the run with the error message.
  const startPolling = (jobId: string, failures = 0) => {
    activeJobRef.current = jobId;
    pollTimerRef.current = window.setTimeout(async () => {
      try {
        const status = await getRun(jobId);
        if (activeJobRef.current !== jobId) return;
        if (status.state === 'queued' || status.state === 'running') {
          setActiveJobStatus(status);
          startPolling(jobId);
          return;
        }
        stopPolling();
        if (status.state === 'done' && !status.result) {
          setActiveJobStatus({ ...status, state: 'error', error: 'The run finished but the server sent no result.' });
          return;
        }
        setActiveJobStatus(status);
        if (status.state === 'done') setRunResult(status.result);
      } catch (err: any) {
        if (activeJobRef.current !== jobId) return;
        if (failures < 2) {
          startPolling(jobId, failures + 1);
          return;
        }
        stopPolling();
        setActiveJobStatus(prev => prev ? { ...prev, state: 'error', error: err.message } : null);
      }
    }, 500);
  };

  // Submit Run Handler
  const handleStartRun = async () => {
    setValidationError(null);
    setRunResult(null);
    setActiveJobStatus(null);

    if (k < 2 || k > 15) {
      setValidationError('Cardinality (K) must be between 2 and 15 stocks.');
      return;
    }
    if (riskAversion < 0 || riskAversion > 1) {
      setValidationError('Risk aversion (q) must be between 0.0 and 1.0.');
      return;
    }
    if (qaoaSettings.shots < 256 || qaoaSettings.shots > 20000) {
      setValidationError('Shots must be between 256 and 20,000.');
      return;
    }
    const nStocks = selectedTickers?.length ?? universe?.assets.filter(a => !a.excluded_reason).length ?? 0;
    if (k > nStocks) {
      setValidationError(`You picked ${nStocks} stocks, so a portfolio of ${k} cannot be built. Add stocks or lower K.`);
      return;
    }
    if (typeof holdings === 'string') {
      setValidationError(holdings);
      return;
    }

    stopPolling();
    const req = buildRunRequest();
    try {
      const { job_id } = await startRun(req);
      setActiveJobStatus({
        job_id,
        state: 'queued',
        progress: 0,
        stage: 'Initializing solver pipeline...',
        convergence: [],
        elapsed_s: 0,
        result: null,
        error: null
      });
      startPolling(job_id);
      // On a phone the progress panel sits below the form: bring it into view
      if (window.matchMedia('(max-width: 1023px)').matches) {
        rightPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (err: any) {
      setValidationError(`Could not start the run: ${err.message}`);
    }
  };

  // Cancel Handler
  const handleCancel = async () => {
    if (!activeJobStatus) return;
    stopPolling();

    try {
      const status = await cancelRun(activeJobStatus.job_id);
      setActiveJobStatus(status);
    } catch (err: any) {
      setActiveJobStatus(prev => prev ? { ...prev, state: 'cancelled', stage: 'Cancelled' } : null);
    }
  };

  if (loadingUniverse) {
    return (
      <div className="p-12 text-center text-xs text-muted space-y-3">
        <div className="w-8 h-8 border-2 border-peach border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p>Connecting to Quantum Portfolio Backend...</p>
      </div>
    );
  }

  if (apiError) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-wine/30 border border-wine rounded-2xl text-center space-y-4 shadow-panel">
        <div className="text-2xl">⚠️</div>
        <h2 className="text-base font-bold text-[#FF8A8A]">Could not load the stock list</h2>
        <p className="text-xs text-text break-words">{apiError}</p>
        <button
          type="button"
          onClick={fetchUniverseData}
          className="px-5 py-2.5 min-h-[44px] bg-peach text-ink font-bold text-xs rounded-xl hover:bg-peach/90 transition-all shadow"
        >
          Retry
        </button>
      </div>
    );
  }

  const selectedSolver = runResult?.solvers.find(s => s.solver === selectedSolverKey) || runResult?.solvers[0];

  return (
    <div className="space-y-6">
      {/* Top Market Data Banner */}
      <DataBanner
        source={universe?.source}
        asOf={universe?.as_of}
        estWindow={runResult?.data.est_window}
        testWindow={runResult?.data.test_window}
        notes={runResult?.data.notes}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Panel: Inputs & Form */}
        <div className="lg:col-span-6 space-y-6 min-w-0">
          <UniversePicker
            assets={universe?.assets || []}
            selectedTickers={selectedTickers}
            onChange={setSelectedTickers}
          />

          <ConstraintsForm
            k={k}
            setK={setK}
            riskAversion={riskAversion}
            setRiskAversion={setRiskAversion}
            sectorCap={sectorCap}
            setSectorCap={setSectorCap}
            targetReturn={targetReturn}
            setTargetReturn={setTargetReturn}
            capital={capital}
            setCapital={setCapital}
            holdingsText={holdingsText}
            setHoldingsText={setHoldingsText}
          />

          <AdvancedQaoa
            settings={qaoaSettings}
            onChange={setQaoaSettings}
          />

          {/* Validation Error Banner */}
          {validationError && (
            <div className="p-4 bg-wine/40 border border-wine rounded-2xl text-xs text-[#FF8A8A] font-medium flex items-center gap-2">
              <span>🛑</span> {validationError}
            </div>
          )}

          {/* Action Button */}
          <button
            type="button"
            onClick={handleStartRun}
            disabled={activeJobStatus?.state === 'running' || activeJobStatus?.state === 'queued'}
            className={`w-full py-4 px-6 min-h-[48px] text-sm font-extrabold rounded-2xl shadow-panel transition-all transform active:scale-[0.99] flex items-center justify-center space-x-2 ${
              activeJobStatus?.state === 'running' || activeJobStatus?.state === 'queued'
                ? 'bg-line text-muted cursor-not-allowed opacity-60'
                : 'bg-hero-bar text-ink hover:opacity-95 text-text font-bold border border-peach/40 cursor-pointer'
            }`}
          >
            <span>🚀 Run Quantum Portfolio Optimization</span>
          </button>
        </div>

        {/* Right Panel: Pre-screen, Execution State & U13 Full Results */}
        <div ref={rightPanelRef} className="lg:col-span-6 space-y-6 scroll-mt-4 min-w-0">
          {/* Live Qubit Pre-screen Preview */}
          <ScreenPreview
            screenInfo={screenInfo}
            loading={screenLoading && !screenInfo}
            qubitCap={qubitCap}
          />

          {/* Active Job Progress Panel */}
          {(activeJobStatus?.state === 'queued' || activeJobStatus?.state === 'running') && (
            <RunProgress
              jobStatus={activeJobStatus}
              onCancel={handleCancel}
            />
          )}

          {/* Job Error State */}
          {activeJobStatus?.state === 'error' && (
            <div className="p-5 bg-wine/40 border border-wine rounded-2xl text-xs space-y-2">
              <h3 className="font-bold text-[#FF8A8A] flex items-center gap-2">
                <span>❌</span> The run failed
              </h3>
              <p className="text-text text-xs leading-relaxed break-words">
                {activeJobStatus.error || 'The server reported an error.'}
              </p>
              {/feasible/i.test(activeJobStatus.error || '') && (
                <p className="text-muted text-[11px]">
                  Try more stocks, a lower number of picks (K) or a looser sector limit.
                </p>
              )}
              <button
                type="button"
                onClick={handleStartRun}
                className="px-4 py-2 min-h-[44px] bg-peach text-ink font-bold text-xs rounded-xl hover:bg-peach/90 transition-all shadow"
              >
                Retry
              </button>
            </div>
          )}

          {/* Job Cancelled State */}
          {activeJobStatus?.state === 'cancelled' && (
            <div className="p-4 bg-line/30 border border-line rounded-2xl text-xs text-muted flex items-center justify-between">
              <span>Run was cancelled. Input form is ready for a new optimization run.</span>
              <button
                onClick={() => setActiveJobStatus(null)}
                className="text-peach font-bold underline min-h-[44px] flex items-center px-2"
              >
                Reset
              </button>
            </div>
          )}

          {/* U13 Full Results Display */}
          {runResult && selectedSolver && (
            <div className="space-y-6">
              {/* Metric Cards */}
              <MetricCards solver={selectedSolver} />

              {/* Portfolio Asset Allocation Table */}
              <PortfolioTable
                solvers={runResult.solvers}
                recommendedSolverId={runResult.recommended}
                selectedSolverKey={selectedSolverKey}
                onSelectSolver={setSelectedSolverKey}
              />

              {/* Solver Comparison Matrix */}
              <SolverTable
                solvers={runResult.solvers}
                recommendedId={runResult.recommended}
                selectedSolverKey={selectedSolverKey}
                onSelectSolver={setSelectedSolverKey}
              />

              {/* Efficient Frontier Chart */}
              <FrontierChart
                frontier={runResult.frontier}
                solvers={runResult.solvers}
                selectedSolverKey={selectedSolverKey}
                onSelectSolver={setSelectedSolverKey}
              />

              {/* Convergence Chart */}
              <ConvergenceChart
                convergence={runResult.qaoa.convergence}
              />

              {/* Bitstring Sample Distribution Histogram */}
              <BitstringHistogram
                samples={runResult.qaoa.samples}
              />

              {/* Honesty Verdict Panel */}
              <HonestyPanel
                verdict={runResult.verdict}
                qaoaResult={runResult.qaoa}
              />

              {/* Out of Sample Backtest Table */}
              <OutOfSample
                solvers={runResult.solvers}
                nifty50Benchmark={runResult.benchmarks?.nifty50}
                testWindow={runResult.data.test_window}
              />
            </div>
          )}

          {!runResult && !activeJobStatus && (
            <div className="p-8 bg-panel/40 border border-dashed border-line rounded-2xl text-center text-xs text-muted space-y-2">
              <div className="text-xl text-slate">📊</div>
              <div className="font-bold text-text">No Active Optimization Run</div>
              <p>Pick your stocks and settings, then press "Run Quantum Portfolio Optimization" to run QAOA and the classical solvers side by side.</p>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Mobile Cancel Banner during active run (U15) */}
      {activeJobStatus && (activeJobStatus.state === 'running' || activeJobStatus.state === 'queued') && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-panel/95 backdrop-blur-md border-t border-peach/40 p-3 px-4 shadow-panel flex items-center justify-between sm:hidden animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-peach animate-ping"></span>
            <span className="text-xs font-bold text-text truncate max-w-[190px]">
              {activeJobStatus.stage || 'Optimizing...'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 min-h-[44px] bg-red/20 text-[#FF8A8A] border border-red/40 hover:bg-wine text-xs font-bold rounded-xl transition-all flex items-center justify-center"
          >
            Cancel Run
          </button>
        </div>
      )}
    </div>
  );
};
