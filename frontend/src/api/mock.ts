// Mock mode replays contracts/api-examples/*.json, so any drift between types.ts and CONTRACTS.md shows up here first.
// QAOA seed 13 replays job_error.json; seed 14 turns the QAOA solver into the "no feasible sample" case.
import type { Universe, RunRequest, ScreenInfo, JobStatus, RunResult, Study, StudySummary } from './types';
import universe from '../../../contracts/api-examples/universe.json';
import screen from '../../../contracts/api-examples/screen.json';
import running from '../../../contracts/api-examples/job_running.json';
import done from '../../../contracts/api-examples/job_done.json';
import failed from '../../../contracts/api-examples/job_error.json';
import studiesIndex from '../../../contracts/api-examples/studies_index.json';
import depthStudy from '../../../contracts/api-examples/study_depth.json';

const RUN_SECONDS = 5;
const SLACK = 4; // slack bits in the example payloads
const jobs = new Map<string, { start: number; req: RunRequest; cancelled: boolean }>();

const ok = <T>(value: unknown) => Promise.resolve(value as T);

export function mockGetUniverse(): Promise<Universe> {
  return ok(universe);
}

export function mockPostScreen(req: RunRequest): Promise<ScreenInfo> {
  const n = req.tickers?.length ?? universe.assets.filter(a => !a.excluded_reason).length;
  if (n + SLACK > req.qubit_cap) return ok(screen);
  return ok({ applied: false, rule: '', kept: [], dropped: [], qubits: { assets: n, slack: SLACK, total: n + SLACK } });
}

export function mockStartRun(req: RunRequest): Promise<{ job_id: string }> {
  const job_id = Math.random().toString(36).slice(2, 8);
  jobs.set(job_id, { start: Date.now(), req, cancelled: false });
  return ok({ job_id });
}

function noFeasibleResult(): RunResult {
  const r = structuredClone(done.result) as unknown as RunResult;
  r.solvers = r.solvers.map(s => s.kind !== 'quantum' ? s : {
    ...s, selection: null, bitstring: null, objective: null, exp_return: null, volatility: null, variance: null,
    txn_cost: null, feasible: false, approx_ratio: null, p_opt: null, feasible_rate: 0, portfolio: null, oos: null
  });
  r.qaoa.samples = r.qaoa.samples.map(s => ({ ...s, objective: null, feasible: false, optimal: false }));
  r.qaoa.metrics = { ...r.qaoa.metrics, approx_ratio: 0, p_opt: 0, feasible_rate: 0 };
  r.verdict = {
    level: 'no-feasible',
    headline: 'QAOA sampled no feasible portfolio.',
    details: ['None of the 4096 samples met every constraint, so QAOA reports no selection.']
  };
  return r;
}

export function mockGetRun(jobId: string): Promise<JobStatus> {
  const job = jobs.get(jobId);
  if (!job) return Promise.reject(new Error(`Unknown job ${jobId}.`));
  const elapsed_s = (Date.now() - job.start) / 1000;
  if (job.cancelled) return ok({ ...running, job_id: jobId, state: 'cancelled', stage: 'Cancelled', elapsed_s });
  if (job.req.qaoa.seed === 13) return ok({ ...failed, job_id: jobId });

  const progress = elapsed_s / RUN_SECONDS;
  if (progress >= 1) {
    const result = job.req.qaoa.seed === 14 ? noFeasibleResult() : done.result;
    return ok({ ...done, job_id: jobId, elapsed_s, result });
  }
  const total = done.convergence.length;
  const convergence = done.convergence.slice(0, Math.max(1, Math.round(progress * total)));
  return ok({
    ...running, job_id: jobId, progress, elapsed_s, convergence,
    stage: `Optimising QAOA parameters (iteration ${convergence.length} of ${total})`
  });
}

export function mockCancelRun(jobId: string): Promise<JobStatus> {
  const job = jobs.get(jobId);
  if (job) job.cancelled = true;
  return mockGetRun(jobId);
}

export function mockListStudies(): Promise<StudySummary[]> {
  return ok(studiesIndex);
}

export function mockGetStudy(id: string): Promise<Study> {
  const summary = studiesIndex.find(s => s.id === id);
  if (!summary) return Promise.reject(new Error(`Unknown study ${id}.`));
  if (id === 'depth') return ok(depthStudy);
  // Only study_depth.json exists; other ids reuse its numbers, labelled as such.
  return ok({ ...depthStudy, id, title: summary.title, notes: [...depthStudy.notes, 'Mock: reuses the depth study numbers.'] });
}
