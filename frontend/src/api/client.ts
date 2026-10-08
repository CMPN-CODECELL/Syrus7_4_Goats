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
  try {
    const res = await fetch('/api/universe');
    return await handleResponse<Universe>(res);
  } catch (err) {
    console.warn('API connection failed, using mock data fallback:', err);
    return mockGetUniverse();
  }
}

export async function postScreen(req: RunRequest): Promise<ScreenInfo> {
  if (USE_MOCKS) return mockPostScreen(req);
  try {
    const res = await fetch('/api/screen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req)
    });
    return await handleResponse<ScreenInfo>(res);
  } catch (err) {
    console.warn('API connection failed, using mock screen fallback:', err);
    return mockPostScreen(req);
  }
}

export async function startRun(req: RunRequest): Promise<{ job_id: string }> {
  if (USE_MOCKS) return mockStartRun(req);
  try {
    const res = await fetch('/api/runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req)
    });
    return await handleResponse<{ job_id: string }>(res);
  } catch (err) {
    console.warn('API connection failed, using mock startRun fallback:', err);
    return mockStartRun(req);
  }
}

export async function getRun(jobId: string): Promise<JobStatus> {
  if (USE_MOCKS) return mockGetRun(jobId);
  try {
    const res = await fetch(`/api/runs/${jobId}`);
    return await handleResponse<JobStatus>(res);
  } catch (err) {
    console.warn('API connection failed, using mock getRun fallback:', err);
    return mockGetRun(jobId);
  }
}

export async function cancelRun(jobId: string): Promise<JobStatus> {
  if (USE_MOCKS) return mockCancelRun(jobId);
  try {
    const res = await fetch(`/api/runs/${jobId}`, {
      method: 'DELETE'
    });
    return await handleResponse<JobStatus>(res);
  } catch (err) {
    console.warn('API connection failed, using mock cancelRun fallback:', err);
    return mockCancelRun(jobId);
  }
}

export async function listStudies(): Promise<StudySummary[]> {
  if (USE_MOCKS) return mockListStudies();
  try {
    const res = await fetch('/api/studies');
    return await handleResponse<StudySummary[]>(res);
  } catch (err) {
    console.warn('API connection failed, using mock listStudies fallback:', err);
    return mockListStudies();
  }
}

export async function getStudy(id: string): Promise<Study> {
  if (USE_MOCKS) return mockGetStudy(id);
  try {
    const res = await fetch(`/api/studies/${id}`);
    return await handleResponse<Study>(res);
  } catch (err) {
    console.warn('API connection failed, using mock getStudy fallback:', err);
    return mockGetStudy(id);
  }
}
