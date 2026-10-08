import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  const [qaoaSettings, setQaoaSettings] = useState<QaoaSettings>(DEFAULT_QAOA);
  const qubitCap = 16;

  // Pre-screen State
  const [screenInfo, setScreenInfo] = useState<ScreenInfo | null>(null);
  const [screenLoading, setScreenLoading] = useState<boolean>(false);

  // Job & Execution State
  const [activeJobStatus, setActiveJobStatus] = useState<JobStatus | null>(null);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const pollTimerRef = useRef<number | null>(null);

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

  // Construct current RunRequest payload
  const buildRunRequest = useCallback((): RunRequest => {
    return {
      tickers: selectedTickers,
      k,
      risk_aversion: riskAversion,
      sector_cap: sectorCap,
      target_return: targetReturn,
      capital,
      holdings: {},
      qubit_cap: qubitCap,
      qaoa: qaoaSettings
    };
  }, [selectedTickers, k, riskAversion, sectorCap, targetReturn, capital, qubitCap, qaoaSettings]);

  // Trigger Pre-screen API call on form changes
  useEffect(() => {
    if (!universe) return;

    const req = buildRunRequest();
    setScreenLoading(true);
    postScreen(req)
      .then(res => setScreenInfo(res))
      .catch(() => setScreenInfo(null))
      .finally(() => setScreenLoading(false));
  }, [universe, buildRunRequest]);

  // Clear polling timer on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current !== null) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, []);

  // Handle Polling Loop
  const startPolling = (jobId: string) => {
    if (pollTimerRef.current !== null) {
      clearInterval(pollTimerRef.current);
    }

    pollTimerRef.current = window.setInterval(async () => {
      try {
        const status = await getRun(jobId);
        setActiveJobStatus(status);

        if (status.state === 'done') {
          if (pollTimerRef.current !== null) clearInterval(pollTimerRef.current);
          setRunResult(status.result);
        } else if (status.state === 'error' || status.state === 'cancelled') {
          if (pollTimerRef.current !== null) clearInterval(pollTimerRef.current);
        }
      } catch (err: any) {
        if (pollTimerRef.current !== null) clearInterval(pollTimerRef.current);
        setActiveJobStatus(prev => prev ? { ...prev, state: 'error', error: err.message } : null);
      }
    }, 500);
  };

  // Submit Run Handler
  const handleStartRun = async () => {
    setValidationError(null);
    setRunResult(null);

    // Validation limits from §2.2
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
    } catch (err: any) {
      setValidationError(`Failed to submit job: ${err.message}`);
    }
  };

  // Cancel Handler
  const handleCancel = async () => {
    if (!activeJobStatus) return;
    if (pollTimerRef.current !== null) clearInterval(pollTimerRef.current);

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
        <h2 className="text-base font-bold text-red">Backend Connection Offline</h2>
        <p className="text-xs text-muted font-mono">{apiError}</p>
        <p className="text-xs text-text">
          Ensure FastAPI backend is running on <code className="text-peach font-mono">http://localhost:8000</code> or launch with <code className="text-peach font-mono">VITE_USE_MOCKS=1</code> for offline mock mode.
        </p>
        <button
          onClick={fetchUniverseData}
          className="px-5 py-2.5 bg-peach text-ink font-bold text-xs rounded-xl hover:bg-peach/90 transition-all shadow"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Market Data Banner */}
      <DataBanner
        source={universe?.source}
        asOf={universe?.as_of}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Panel: Inputs & Form */}
        <div className="lg:col-span-6 space-y-6">
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
          />

          <AdvancedQaoa
            settings={qaoaSettings}
            onChange={setQaoaSettings}
          />

          {/* Validation Error Banner */}
          {validationError && (
            <div className="p-4 bg-wine/40 border border-wine rounded-2xl text-xs text-red font-medium flex items-center gap-2">
              <span>🛑</span> {validationError}
            </div>
          )}

          {/* Action Button */}
          <button
            type="button"
            onClick={handleStartRun}
            disabled={activeJobStatus?.state === 'running' || activeJobStatus?.state === 'queued'}
            className={`w-full py-4 px-6 text-sm font-extrabold rounded-2xl shadow-panel transition-all transform active:scale-[0.99] flex items-center justify-center space-x-2 ${
              activeJobStatus?.state === 'running' || activeJobStatus?.state === 'queued'
                ? 'bg-line text-muted cursor-not-allowed opacity-60'
                : 'bg-hero-bar text-ink hover:opacity-95 text-text font-bold border border-peach/40 cursor-pointer'
            }`}
          >
            <span>🚀 Run Quantum Portfolio Optimization</span>
          </button>
        </div>

        {/* Right Panel: Pre-screen, Active Execution & Results Slot */}
        <div className="lg:col-span-6 space-y-6">
          {/* Live Qubit Pre-screen Preview */}
          <ScreenPreview
            screenInfo={screenInfo}
            loading={screenLoading}
            qubitCap={qubitCap}
          />

          {/* Active Job Progress Panel */}
          {activeJobStatus && activeJobStatus.state !== 'done' && (
            <RunProgress
              jobStatus={activeJobStatus}
              onCancel={handleCancel}
            />
          )}

          {/* Job Error State */}
          {activeJobStatus?.state === 'error' && (
            <div className="p-5 bg-wine/40 border border-wine rounded-2xl text-xs space-y-2">
              <h3 className="font-bold text-red flex items-center gap-2">
                <span>❌</span> Optimization Failed
              </h3>
              <p className="text-text font-mono text-[11px] leading-relaxed">
                {activeJobStatus.error}
              </p>
            </div>
          )}

          {/* Job Cancelled State */}
          {activeJobStatus?.state === 'cancelled' && (
            <div className="p-4 bg-line/30 border border-line rounded-2xl text-xs text-muted flex items-center justify-between">
              <span>Run was cancelled. Input form is ready for a new optimization run.</span>
              <button
                onClick={() => setActiveJobStatus(null)}
                className="text-peach font-bold underline"
              >
                Reset
              </button>
            </div>
          )}

          {/* U13 Results Slot Container */}
          <div id="u13-results-slot" className="min-h-[200px]">
            {runResult ? (
              <div className="p-6 bg-panel border border-peach/50 rounded-2xl shadow-panel space-y-3">
                <div className="flex items-center justify-between border-b border-line pb-3">
                  <h3 className="text-sm font-bold text-peach flex items-center gap-2">
                    <span>✨</span> Optimization Complete (Run ID: {runResult.run_id})
                  </h3>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-peach/10 text-peach border border-peach/30">
                    QAOA + 3 Baselines Evaluated
                  </span>
                </div>
                <div className="p-4 bg-ink/60 rounded-xl border border-line text-xs space-y-2">
                  <div className="font-bold text-text">{runResult.verdict.headline}</div>
                  <ul className="list-disc list-inside text-muted text-[11px] space-y-1">
                    {runResult.verdict.details.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
                <div className="text-[11px] text-muted italic text-center pt-2">
                  [U13 Slot: Full Portfolio Breakdown, Efficient Frontier Chart, Bitstring Histogram &amp; Out-of-Sample metrics render here in U13]
                </div>
              </div>
            ) : !activeJobStatus ? (
              <div className="p-8 bg-panel/40 border border-dashed border-line rounded-2xl text-center text-xs text-muted space-y-2">
                <div className="text-xl text-slate">📊</div>
                <div className="font-bold text-text">No Active Optimization Run</div>
                <p>Configure parameters on the left and click "Run Quantum Portfolio Optimization" to launch QAOA and classical benchmarks.</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
