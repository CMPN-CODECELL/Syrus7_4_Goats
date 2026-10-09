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
import { getSolverStyle } from '../lib/chartColors';
import { SolverMarker } from '../components/SolverMarker';

const DEFAULT_QAOA: QaoaSettings = {
  variant: 'xy',
  reps: 2,
  optimizer: 'COBYLA',
  init: 'ramp',
  shots: 2048,
  maxiter: 80,
  noise: false,
  seed: 7
};

interface Preset {
  id: string;
  label: string;
  desc: string;
  k: number;
  q: number;
  sectorCap: number | null;
  targetReturn: number | null;
}

const PRESETS: Preset[] = [
  {
    id: 'balanced',
    label: 'Balanced Baseline',
    desc: 'Standard Fall Fest Setup',
    k: 5,
    q: 0.5,
    sectorCap: 2,
    targetReturn: null
  },
  {
    id: 'defensive',
    label: 'Min-Variance (Defensive)',
    desc: 'Focus on Low Volatility',
    k: 6,
    q: 0.85,
    sectorCap: 2,
    targetReturn: null
  },
  {
    id: 'growth',
    label: 'Maximum Growth',
    desc: 'Focus on Sharpe & Return',
    k: 4,
    q: 0.2,
    sectorCap: 2,
    targetReturn: null
  },
  {
    id: 'diversified',
    label: 'High Diversification',
    desc: 'Broader Market Spread',
    k: 8,
    q: 0.5,
    sectorCap: 3,
    targetReturn: null
  }
];

export const Optimise: React.FC = () => {
  // Stage Flow State: 'configure' = full setup screen, 'results' = full results workspace
  const [activeStage, setActiveStage] = useState<'configure' | 'results'>('configure');
  const [resultsTab, setResultsTab] = useState<'overview' | 'solvers' | 'quantum' | 'all'>('overview');

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
  const qubitCap = 12; // contract default: max 16

  // Pre-screen State
  const [screenInfo, setScreenInfo] = useState<ScreenInfo | null>(null);
  const [screenLoading, setScreenLoading] = useState<boolean>(false);

  // Job & Execution State
  const [activeJobStatus, setActiveJobStatus] = useState<JobStatus | null>(null);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [selectedSolverKey, setSelectedSolverKey] = useState<string>('brute_force');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Pending poll timer
  const pollTimerRef = useRef<number | null>(null);
  const activeJobRef = useRef<string | null>(null);

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

  // Holdings textarea parser
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

  // Construct RunRequest
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

  // Pre-screen preview: debounced
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

  useEffect(() => stopPolling, []);

  // Update default solver when result arrives
  useEffect(() => {
    if (runResult) {
      setSelectedSolverKey(runResult.recommended || runResult.solvers[0]?.solver || 'brute_force');
    }
  }, [runResult]);

  // Poll loop
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
        if (status.state === 'done') {
          setRunResult(status.result);
          setActiveStage('results');
        }
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

  // Submit Run
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

      // Transition immediately to results stage to show live progress
      setActiveStage('results');
      startPolling(job_id);
    } catch (err: any) {
      setValidationError(`Could not start the run: ${err.message}`);
    }
  };

  // Cancel Run
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

  // Keyboard shortcut Ctrl+Enter to trigger run
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (activeJobStatus?.state !== 'running' && activeJobStatus?.state !== 'queued') {
          handleStartRun();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeJobStatus, handleStartRun]);

  const applyPreset = (preset: Preset) => {
    setK(preset.k);
    setRiskAversion(preset.q);
    setSectorCap(preset.sectorCap);
    setTargetReturn(preset.targetReturn);
  };

  if (loadingUniverse) {
    return (
      <div className="p-16 text-center text-xs text-muted space-y-3 bg-surface border border-line">
        <div className="w-6 h-6 border-2 border-accent-blue border-t-transparent animate-spin mx-auto"></div>
        <p>Connecting to Portfolio-Pulse Backend (NIFTY 50 Universe)...</p>
      </div>
    );
  }

  if (apiError) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-surface border border-line-strong text-center space-y-4">
        <h2 className="text-base font-medium text-text flex items-center justify-center gap-2">
          <span>⚠ Could not connect to Backend</span>
        </h2>
        <p className="text-xs text-muted break-words">{apiError}</p>
        <button
          type="button"
          onClick={fetchUniverseData}
          className="px-5 py-2.5 min-h-[44px] bg-text text-bg font-medium text-xs hover:bg-muted transition-all"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const selectedSolver = runResult?.solvers.find(s => s.solver === selectedSolverKey) || runResult?.solvers[0];
  const isJobRunning = activeJobStatus?.state === 'running' || activeJobStatus?.state === 'queued';

  return (
    <div className="space-y-6">
      {/* Top Market Context Data Banner */}
      <DataBanner
        source={universe?.source}
        asOf={universe?.as_of}
        estWindow={runResult?.data.est_window}
        testWindow={runResult?.data.test_window}
        notes={runResult?.data.notes}
      />

      {/* =========================================================================
          STAGE 1: DEDICATED FULL-SCREEN FORMULATION & CONFIGURATION
          ========================================================================= */}
      {activeStage === 'configure' && (
        <div className="space-y-6">
          {/* Stage 1 Header Ribbon */}
          <div className="bg-surface border border-line p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 bg-accent-blue"></span>
                <h2 className="text-base font-medium text-text uppercase tracking-wide">
                  Portfolio-Pulse — Formulation &amp; Optimization Setup
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-bg text-muted border border-line">
                  STAGE 1 OF 2
                </span>
              </div>
              <p className="text-xs text-muted mt-1">
                Configure your NIFTY 50 asset universe, Markowitz risk parameters, and Qiskit QAOA circuit options.
              </p>
            </div>

            {/* If results already exist, allow one-click jump back to results */}
            {runResult && (
              <button
                type="button"
                onClick={() => setActiveStage('results')}
                className="px-4 py-2 bg-surface-elevated text-text hover:text-white border border-accent-blue/50 text-xs font-medium uppercase tracking-wider transition-colors flex items-center space-x-2 self-start md:self-auto"
              >
                <span>View Latest Results</span>
                <span className="text-accent-blue-hover font-mono">→</span>
              </button>
            )}
          </div>

          {/* Quick Presets Bar */}
          <div className="bg-surface border border-line p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="label text-[10px] text-muted">QUICK FORMULATION PRESETS</span>
              <span className="text-[10px] text-faint">Click to apply standard risk &amp; cardinality configs</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRESETS.map((p) => {
                const isCurrent = k === p.k && Math.abs(riskAversion - p.q) < 0.01;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className={`p-3 text-left border transition-all ${isCurrent
                      ? 'bg-surface-elevated border-accent-blue/80 text-white'
                      : 'bg-bg border-line hover:border-line-strong text-muted hover:text-text'
                      }`}
                  >
                    <div className="text-xs font-medium text-text flex items-center justify-between">
                      <span>{p.label}</span>
                      {isCurrent && <span className="w-1.5 h-1.5 bg-accent-blue rounded-full"></span>}
                    </div>
                    <div className="text-[10px] text-muted mt-0.5 truncate">{p.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Validation Error Alert */}
          {validationError && (
            <div className="p-4 bg-loss/10 border border-loss text-xs text-text font-medium flex items-start gap-2.5">
              <span className="text-loss shrink-0 font-bold text-sm">⚠</span>
              <div>
                <strong className="block text-loss">Validation Warning</strong>
                <span>{validationError}</span>
              </div>
            </div>
          )}

          {/* Main 2-Column Full-Width Grid for Inputs */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Column A: Asset Universe & Portfolio Constraints */}
            <div className="lg:col-span-7 space-y-6">
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
            </div>

            {/* Column B: Live Qubit Budget & Quantum Engine Settings */}
            <div className="lg:col-span-5 space-y-6">
              <ScreenPreview
                screenInfo={screenInfo}
                loading={screenLoading && !screenInfo}
                qubitCap={qubitCap}
              />

              <AdvancedQaoa
                settings={qaoaSettings}
                onChange={setQaoaSettings}
              />

              {/* Execution Summary Breakdown Card */}
              <div className="bg-surface border border-line p-5 space-y-3">
                <h3 className="text-xs font-medium text-text uppercase tracking-wider flex items-center gap-2">
                  <span>Execution Specification</span>
                </h3>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-line/40">
                    <span className="text-muted">Target Portfolio Cardinality:</span>
                    <span className="text-text font-mono font-medium">{k} stocks</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-line/40">
                    <span className="text-muted">Risk Aversion Parameter (q):</span>
                    <span className="text-text font-mono font-medium">{riskAversion.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-line/40">
                    <span className="text-muted">Estimated Qubit Allocation:</span>
                    <span className="text-text font-mono font-medium">
                      {screenInfo ? `${screenInfo.qubits.total} / ${qubitCap} qubits` : 'Calculating...'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-line/40">
                    <span className="text-muted">Quantum Solver Pipeline:</span>
                    <span className="text-text font-mono font-medium">
                      QAOA ({qaoaSettings.variant.toUpperCase()}, p={qaoaSettings.reps})
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted">Classical Baselines:</span>
                    <span className="text-text font-mono font-medium">Brute Force, CVXPY, Annealing</span>
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="button"
                    onClick={handleStartRun}
                    disabled={isJobRunning}
                    className="w-full py-4 px-6 min-h-[48px] bg-text text-bg hover:bg-accent-blue hover:text-white transition-all text-xs font-medium uppercase tracking-wider border border-text flex items-center justify-center space-x-2"
                  >
                    <span>Run Portfolio-Pulse Optimization Pipeline</span>
                    <span className="text-[10px] opacity-75 font-mono">[Ctrl+↵]</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          STAGE 2: FULL-SCREEN QUANTITATIVE RESULTS DASHBOARD
          ========================================================================= */}
      {activeStage === 'results' && (
        <div className="space-y-6">
          {/* Persistent Top Parameters & Navigation Ribbon */}
          <div className="bg-surface border border-line p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-16 z-20 shadow-md">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-2.5 h-2.5 bg-gain"></span>
                <h2 className="text-sm font-medium text-text uppercase tracking-wide">
                  Portfolio-Pulse — Quantitative Results Dashboard
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-bg text-muted border border-line">
                  STAGE 2 OF 2
                </span>
                {runResult?.recommended && (
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-accent-blue/15 text-accent-blue-hover border border-accent-blue/40 uppercase">
                    Recommended: {runResult.recommended}
                  </span>
                )}
              </div>

              {/* Formulation Parameters Badges */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted">
                <span>Picks: <strong className="text-text font-mono">K = {k}</strong></span>
                <span className="text-line-strong">•</span>
                <span>Risk: <strong className="text-text font-mono">q = {riskAversion.toFixed(2)}</strong></span>
                <span className="text-line-strong">•</span>
                <span>Capital: <strong className="text-text font-mono">₹{capital.toLocaleString('en-IN')}</strong></span>
                <span className="text-line-strong">•</span>
                <span>Circuit: <strong className="text-text font-mono">QAOA (p={qaoaSettings.reps})</strong></span>
              </div>
            </div>

            {/* Actions: Edit Parameters or Rerun */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setActiveStage('configure')}
                className="px-4 py-2.5 bg-surface-elevated text-text hover:text-white border border-line-strong hover:border-accent-blue/60 text-xs font-medium uppercase tracking-wider transition-colors flex items-center space-x-2"
                title="Return to Stage 1 to modify stocks or constraints"
              >
                <span>← Edit Parameters</span>
              </button>

              <button
                type="button"
                onClick={handleStartRun}
                disabled={isJobRunning}
                className="px-4 py-2.5 bg-text text-bg hover:bg-accent-blue hover:text-white transition-all text-xs font-medium uppercase tracking-wider border border-text flex items-center space-x-1.5"
                title="Execute a fresh run with current parameters"
              >
                <span>Rerun</span>
                <span className="text-[10px] opacity-75 font-mono">[↵]</span>
              </button>
            </div>
          </div>

          {/* Active Job Progress (During Execution) */}
          {isJobRunning && activeJobStatus && (
            <div className="space-y-4">
              <RunProgress
                jobStatus={activeJobStatus}
                onCancel={handleCancel}
              />
            </div>
          )}

          {/* Job Error State */}
          {activeJobStatus?.state === 'error' && (
            <div className="p-6 bg-surface border border-loss/80 text-xs space-y-4">
              <h3 className="font-medium text-text flex items-center gap-2 text-sm">
                <span className="text-loss text-base">⚠</span> The Optimization Run Encountered an Error
              </h3>
              <p className="text-text-dim text-xs leading-relaxed break-words bg-bg p-4 border border-line font-mono">
                {activeJobStatus.error || 'The server reported an error during execution.'}
              </p>
              {/feasible/i.test(activeJobStatus.error || '') && (
                <p className="text-muted text-xs">
                  Hint: Try selecting more candidate stocks, a lower cardinality (K), or a looser sector cap.
                </p>
              )}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveStage('configure')}
                  className="px-5 py-2.5 bg-surface-elevated text-text border border-line-strong hover:border-accent-blue font-medium text-xs uppercase"
                >
                  Adjust Parameters
                </button>
                <button
                  type="button"
                  onClick={handleStartRun}
                  className="px-5 py-2.5 bg-text text-bg font-medium text-xs hover:bg-muted transition-all uppercase"
                >
                  Retry Execution
                </button>
              </div>
            </div>
          )}

          {/* Completed Results Display */}
          {runResult && selectedSolver && (
            <div className="space-y-6">
              {/* Results Sub-Navigation Bar & Global Solver Switcher */}
              <div className="bg-surface border border-line p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* View Category Tabs */}
                <div className="flex bg-bg p-1 border border-line gap-1 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setResultsTab('overview')}
                    className={`px-3 py-1.5 text-xs font-medium uppercase tracking-wider transition-all whitespace-nowrap ${resultsTab === 'overview'
                      ? 'bg-surface-elevated text-white border border-accent-blue/50'
                      : 'text-muted hover:text-text'
                      }`}
                  >
                    Overview &amp; Allocation
                  </button>
                  <button
                    type="button"
                    onClick={() => setResultsTab('solvers')}
                    className={`px-3 py-1.5 text-xs font-medium uppercase tracking-wider transition-all whitespace-nowrap ${resultsTab === 'solvers'
                      ? 'bg-surface-elevated text-white border border-accent-blue/50'
                      : 'text-muted hover:text-text'
                      }`}
                  >
                    Solver Benchmarks
                  </button>
                  <button
                    type="button"
                    onClick={() => setResultsTab('quantum')}
                    className={`px-3 py-1.5 text-xs font-medium uppercase tracking-wider transition-all whitespace-nowrap ${resultsTab === 'quantum'
                      ? 'bg-surface-elevated text-white border border-accent-blue/50'
                      : 'text-muted hover:text-text'
                      }`}
                  >
                    Quantum Diagnostics
                  </button>
                  <button
                    type="button"
                    onClick={() => setResultsTab('all')}
                    className={`px-3 py-1.5 text-xs font-medium uppercase tracking-wider transition-all whitespace-nowrap ${resultsTab === 'all'
                      ? 'bg-surface-elevated text-white border border-accent-blue/50'
                      : 'text-muted hover:text-text'
                      }`}
                  >
                    Complete Report (All)
                  </button>
                </div>

                {/* Global Solver Switcher */}
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  <span className="label text-[10px] text-faint hidden lg:inline mr-1">ACTIVE SOLVER:</span>
                  <div className="flex bg-bg p-1 border border-line gap-1">
                    {runResult.solvers.map((s) => {
                      const isSelected = s.solver === selectedSolverKey;
                      const style = getSolverStyle(s.solver);
                      return (
                        <button
                          key={s.solver}
                          type="button"
                          onClick={() => setSelectedSolverKey(s.solver)}
                          className={`px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-all flex items-center space-x-1.5 ${isSelected
                            ? 'bg-surface-elevated text-white border border-accent-blue/60'
                            : 'text-muted hover:text-text'
                            }`}
                        >
                          <SolverMarker style={style} size={9} />
                          <span>{s.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* TAB 1: OVERVIEW & ALLOCATION */}
              {(resultsTab === 'overview' || resultsTab === 'all') && (
                <div className="space-y-6">
                  {/* Executive KPI Cards */}
                  <MetricCards solver={selectedSolver} />

                  {/* Portfolio Holdings & Asset Allocation */}
                  <PortfolioTable
                    solvers={runResult.solvers}
                    recommendedSolverId={runResult.recommended}
                    selectedSolverKey={selectedSolverKey}
                    onSelectSolver={setSelectedSolverKey}
                  />

                  {/* Markowitz Efficient Frontier */}
                  <FrontierChart
                    frontier={runResult.frontier}
                    solvers={runResult.solvers}
                    selectedSolverKey={selectedSolverKey}
                    onSelectSolver={setSelectedSolverKey}
                  />
                </div>
              )}

              {/* TAB 2: SOLVER BENCHMARKS */}
              {(resultsTab === 'solvers' || resultsTab === 'all') && (
                <div className="space-y-6">
                  {/* Solver Comparison Matrix */}
                  <SolverTable
                    solvers={runResult.solvers}
                    recommendedId={runResult.recommended}
                    selectedSolverKey={selectedSolverKey}
                    onSelectSolver={setSelectedSolverKey}
                  />

                  {/* Out of Sample Backtest Table */}
                  <OutOfSample
                    solvers={runResult.solvers}
                    nifty50Benchmark={runResult.benchmarks?.nifty50}
                    testWindow={runResult.data.test_window}
                  />
                </div>
              )}

              {/* TAB 3: QUANTUM DIAGNOSTICS */}
              {(resultsTab === 'quantum' || resultsTab === 'all') && (
                <div className="space-y-6">
                  {/* Side-by-side or stacked Quantum Curves */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    <ConvergenceChart
                      convergence={runResult.qaoa.convergence}
                    />

                    <BitstringHistogram
                      samples={runResult.qaoa.samples}
                    />
                  </div>

                  {/* Honesty Verdict Panel */}
                  <HonestyPanel
                    verdict={runResult.verdict}
                    qaoaResult={runResult.qaoa}
                  />
                </div>
              )}
            </div>
          )}

          {/* Idle / No Result state inside Stage 2 */}
          {!runResult && !isJobRunning && activeJobStatus?.state !== 'error' && (
            <div className="bg-surface border border-line p-12 text-center space-y-4">
              <h3 className="text-sm font-medium text-text uppercase tracking-wider">
                No Active Optimization Result
              </h3>
              <p className="text-xs text-muted max-w-md mx-auto">
                Return to the formulation stage to configure your parameters and launch a run.
              </p>
              <button
                type="button"
                onClick={() => setActiveStage('configure')}
                className="px-6 py-2.5 bg-text text-bg hover:bg-accent-blue hover:text-white font-medium text-xs uppercase transition-colors"
              >
                Go to Formulation Setup
              </button>
            </div>
          )}
        </div>
      )}

      {/* Sticky Mobile Cancel Banner during active run */}
      {isJobRunning && activeJobStatus && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-line-strong p-3 px-4 flex items-center justify-between sm:hidden">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-accent-blue animate-pulse"></span>
            <span className="text-xs font-medium text-text truncate max-w-[190px]">
              {activeJobStatus.stage || 'Optimizing...'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 min-h-[44px] bg-surface text-text border border-line-strong hover:bg-line text-xs font-medium transition-all flex items-center justify-center"
          >
            Cancel Run
          </button>
        </div>
      )}
    </div>
  );
};

export default Optimise;
