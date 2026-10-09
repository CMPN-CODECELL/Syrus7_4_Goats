// Single source of truth for the run configuration, the mode, and the latest results.
// RunProvider owns the polling, cancel and retry logic. Other code reads it through useRun() and must not change this interface.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { JobStatus, QaoaSettings, RunRequest, RunResult } from '../api/types';
import { cancelRun, getRun, startRun } from '../api/client';
import { validateConfig } from './validate';

export type Mode = 'simple' | 'research';

export interface RunState {
  /** The configuration the next run will submit. Simple and Research modes edit this same object. */
  config: RunRequest;
  setConfig: (patch: Partial<RunRequest>) => void;
  mode: Mode;
  setMode: (m: Mode) => void;
  /** The latest polled job status while a run is queued or running. */
  job: JobStatus | null;
  running: boolean;
  /** The result of the last completed run, and the exact config that produced it. */
  result: RunResult | null;
  resultConfig: RunRequest | null;
  /** True when config has changed since `result` was produced. The UI must flag stale results. */
  isStale: boolean;
  /** A plain-language error from the last run (infeasible, timeout, server), or null. */
  error: string | null;
  run: () => Promise<void>;
  cancel: () => void;
  retry: () => void;
}

export const RunContext = createContext<RunState | null>(null);

export function useRun(): RunState {
  const ctx = useContext(RunContext);
  if (!ctx) throw new Error('useRun must be used inside <RunProvider>');
  return ctx;
}

const DEFAULT_QAOA: QaoaSettings = {
  variant: 'xy',
  reps: 2,
  optimizer: 'COBYLA',
  init: 'ramp',
  shots: 2048,
  maxiter: 80,
  noise: false,
  seed: 7,
};

/** What a first-time user starts with. `tickers: null` means every NIFTY 50 stock that has data. */
export const DEFAULT_CONFIG: RunRequest = {
  tickers: null,
  k: 4,
  risk_aversion: 0.5,
  sector_cap: 2,
  target_return: null,
  capital: 1_000_000,
  holdings: {},
  qubit_cap: 12, // a live run stays under a minute; 16 is allowed but takes about 3 minutes
  qaoa: DEFAULT_QAOA,
};

const POLL_MS = 500;
const POLL_RETRIES = 2; // a failed poll is retried twice; the third failure in a row ends the run

/** Deep equality for plain config data. Object.is, so two NaNs (an unreadable field) compare equal. */
function sameValue(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) || Array.isArray(b)) {
    return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((v, i) => sameValue(v, b[i]));
  }
  const ka = Object.keys(a as object);
  const kb = Object.keys(b as object);
  return ka.length === kb.length && ka.every((key) => key in (b as object) && sameValue((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]));
}

/** Adds a plain next step to the errors users can act on. */
function explain(message: string): string {
  const m = message.trim() || 'The server reported an error.';
  if (/feasible/i.test(m)) return `${m} Try more stocks, a lower number of holdings (K) or a looser industry limit.`;
  if (/time(d)?[ -]?out/i.test(m)) return `${m} Try fewer stocks, a lower circuit depth or fewer iterations, then run again.`;
  return m;
}

const cloneConfig = (c: RunRequest): RunRequest => JSON.parse(JSON.stringify(c)) as RunRequest;

export function RunProvider({ children }: { children: ReactNode }) {
  const [config, setConfigState] = useState<RunRequest>(DEFAULT_CONFIG);
  const [mode, setMode] = useState<Mode>('simple');
  const [job, setJob] = useState<JobStatus | null>(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [resultConfig, setResultConfig] = useState<RunRequest | null>(null);
  const [error, setError] = useState<string | null>(null);

  const configRef = useRef<RunRequest>(DEFAULT_CONFIG); // always the latest config, so run() never submits an old one
  const submittedRef = useRef<RunRequest | null>(null); // the exact config of the run in flight
  const busyRef = useRef(false); // true from the moment run() starts until the run ends: blocks a double submit
  const timerRef = useRef<number | null>(null); // the pending poll
  const activeJobRef = useRef<string | null>(null); // the one job we poll; a reply for any other job is dropped

  const setConfig = useCallback((patch: Partial<RunRequest>) => {
    const next = { ...configRef.current, ...patch };
    configRef.current = next;
    setConfigState(next);
  }, []);

  const stopPolling = useCallback(() => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = null;
    activeJobRef.current = null;
  }, []);

  useEffect(() => stopPolling, [stopPolling]);

  const finish = useCallback(() => {
    busyRef.current = false;
    setRunning(false);
  }, []);

  // Poll every 500 ms; the next request starts only after the previous reply, so replies never overlap.
  const poll = useCallback((jobId: string, failures = 0) => {
    activeJobRef.current = jobId;
    timerRef.current = window.setTimeout(async () => {
      try {
        const status = await getRun(jobId);
        if (activeJobRef.current !== jobId) return;
        if (status.state === 'queued' || status.state === 'running') {
          setJob(status);
          poll(jobId);
          return;
        }
        stopPolling();
        if (status.state === 'done' && !status.result) {
          const message = 'The run finished but the server sent no result.';
          setJob({ ...status, state: 'error', error: message });
          setError(message);
        } else if (status.state === 'done' && status.result) {
          setJob(status);
          setResult(status.result);
          setResultConfig(submittedRef.current);
        } else if (status.state === 'error') {
          setJob(status);
          setError(explain(status.error ?? ''));
        } else {
          setJob(status); // cancelled
        }
        finish();
      } catch (err) {
        if (activeJobRef.current !== jobId) return;
        if (failures < POLL_RETRIES) {
          poll(jobId, failures + 1);
          return;
        }
        stopPolling();
        const message = err instanceof Error ? err.message : 'Lost contact with the server.';
        setJob((prev) => (prev ? { ...prev, state: 'error', error: message } : null));
        setError(explain(message));
        finish();
      }
    }, POLL_MS);
  }, [finish, stopPolling]);

  const run = useCallback(async () => {
    if (busyRef.current) return; // a run is already starting or in flight
    const submitted = cloneConfig(configRef.current);
    const issues = validateConfig(submitted);
    if (issues.length > 0) {
      setError(issues[0].message);
      return;
    }
    busyRef.current = true;
    stopPolling();
    setError(null);
    setResult(null);
    setResultConfig(null);
    setJob(null);
    setRunning(true);
    submittedRef.current = submitted;
    try {
      const { job_id } = await startRun(submitted);
      setJob({
        job_id,
        state: 'queued',
        progress: 0,
        stage: 'Submitted. Waiting for the server to report progress.',
        convergence: [],
        elapsed_s: 0,
        result: null,
        error: null,
      });
      poll(job_id);
    } catch (err) {
      setError(`Could not start the run: ${err instanceof Error ? err.message : 'unknown error'}`);
      finish();
    }
  }, [finish, poll, stopPolling]);

  const cancel = useCallback(() => {
    const jobId = activeJobRef.current;
    if (!jobId) return;
    stopPolling();
    setJob((prev) => (prev ? { ...prev, stage: 'Cancelling' } : prev));
    cancelRun(jobId)
      .then((status) => setJob(status))
      .catch(() => setJob((prev) => (prev ? { ...prev, state: 'cancelled', stage: 'Cancelled' } : prev)))
      .finally(finish);
  }, [finish, stopPolling]);

  const retry = useCallback(() => {
    void run();
  }, [run]);

  const isStale = result !== null && resultConfig !== null && !sameValue(config, resultConfig);

  const value = useMemo<RunState>(() => ({
    config, setConfig, mode, setMode, job, running, result, resultConfig, isStale, error, run, cancel, retry,
  }), [config, setConfig, mode, job, running, result, resultConfig, isStale, error, run, cancel, retry]);

  return <RunContext.Provider value={value}>{children}</RunContext.Provider>;
}
