import {
  Universe,
  RunRequest,
  ScreenInfo,
  JobStatus,
  Study,
  StudySummary
} from './types';

import {
  mockGetUniverse,
  mockPostScreen,
  mockStartRun,
  mockGetRun,
  mockCancelRun,
  mockListStudies,
  mockGetStudy
} from './mock';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === '1';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `HTTP Error ${res.status}: ${res.statusText}`;
    try {
      const data = await res.json();
      if (data.detail) {
        errorMsg = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
      }
    } catch {
      // Ignore JSON parse error on non-JSON body
    }
    throw new Error(errorMsg);
  }
  return res.json() as Promise<T>;
}

export async function getUniverse(): Promise<Universe> {
  if (USE_MOCKS) return mockGetUniverse();
  const res = await fetch('/api/universe');
  return handleResponse<Universe>(res);
}

export async function postScreen(req: RunRequest): Promise<ScreenInfo> {
  if (USE_MOCKS) return mockPostScreen(req);
  const res = await fetch('/api/screen', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req)
  });
  return handleResponse<ScreenInfo>(res);
}

export async function startRun(req: RunRequest): Promise<{ job_id: string }> {
  if (USE_MOCKS) return mockStartRun(req);
  const res = await fetch('/api/runs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req)
  });
  return handleResponse<{ job_id: string }>(res);
}

export async function getRun(jobId: string): Promise<JobStatus> {
  if (USE_MOCKS) return mockGetRun(jobId);
  const res = await fetch(`/api/runs/${jobId}`);
  return handleResponse<JobStatus>(res);
}

export async function cancelRun(jobId: string): Promise<JobStatus> {
  if (USE_MOCKS) return mockCancelRun(jobId);
  const res = await fetch(`/api/runs/${jobId}`, {
    method: 'DELETE'
  });
  return handleResponse<JobStatus>(res);
}

export async function listStudies(): Promise<StudySummary[]> {
  if (USE_MOCKS) return mockListStudies();
  const res = await fetch('/api/studies');
  return handleResponse<StudySummary[]>(res);
}

export async function getStudy(id: string): Promise<Study> {
  if (USE_MOCKS) return mockGetStudy(id);
  const res = await fetch(`/api/studies/${id}`);
  return handleResponse<Study>(res);
}
