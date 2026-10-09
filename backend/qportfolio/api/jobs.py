"""Background job runner for portfolio optimization runs (KTD13).

Provides in-process background execution via ThreadPoolExecutor(max_workers=1)
with an in-memory job store guarded by a threading.Lock, cooperative cancellation,
and live progress tracking.
"""
from __future__ import annotations

import logging
import re
import threading
import time
import uuid
from concurrent.futures import Future, ThreadPoolExecutor
from typing import Any, Callable

from qportfolio.contracts import ConvergencePoint, JobStatus, RunRequest, RunResult
from qportfolio.pipeline import Cancelled, run as pipeline_run

logger = logging.getLogger(__name__)


class Job:
    """Internal job tracking record."""

    def __init__(self, job_id: str, request: RunRequest) -> None:
        self.job_id = job_id
        self.request = request
        self.state: str = "queued"
        self.progress: float = 0.0
        self.stage: str = "Queued"
        self.convergence: list[ConvergencePoint] = []
        self.start_time: float | None = None
        self.end_time: float | None = None
        self.result: RunResult | None = None
        self.error: str | None = None
        self.cancel_event: threading.Event = threading.Event()
        self.future: Future | None = None

    def get_elapsed_s(self) -> float:
        if self.start_time is None:
            return 0.0
        if self.end_time is not None:
            return round(self.end_time - self.start_time, 2)
        return round(time.time() - self.start_time, 2)

    def to_status(self) -> JobStatus:
        return JobStatus(
            job_id=self.job_id,
            state=self.state,  # type: ignore[arg-type]
            progress=self.progress,
            stage=self.stage,
            convergence=list(self.convergence),
            elapsed_s=self.get_elapsed_s(),
            result=self.result,
            error=self.error,
        )


class JobRunner:
    """Manages background jobs and pipeline execution."""

    def __init__(self, max_workers: int = 1, run_fn: Callable[..., RunResult] | None = None) -> None:
        self._lock = threading.Lock()
        self._jobs: dict[str, Job] = {}
        self._executor = ThreadPoolExecutor(max_workers=max_workers)
        self._run_fn = run_fn or pipeline_run

    def submit(self, request: RunRequest) -> str:
        """Submit a RunRequest for background processing. Returns job_id."""
        job_id = uuid.uuid4().hex[:8]
        job = Job(job_id=job_id, request=request)
        with self._lock:
            self._jobs[job_id] = job
            job.future = self._executor.submit(self._execute_job, job)
        return job_id

    def get(self, job_id: str) -> JobStatus | None:
        """Get current status of a job. Returns None if unknown."""
        with self._lock:
            job = self._jobs.get(job_id)
            if job is None:
                return None
            return job.to_status()

    def cancel(self, job_id: str) -> JobStatus | None:
        """Cancel a running or queued job. Returns updated JobStatus or None if unknown."""
        with self._lock:
            job = self._jobs.get(job_id)
            if job is None:
                return None
            job.cancel_event.set()
            if job.future and not job.future.running():
                job.future.cancel()
            job.state = "cancelled"
            job.stage = "Cancelled"
            if job.end_time is None:
                job.end_time = time.time()
            return job.to_status()

    def _execute_job(self, job: Job) -> None:
        """Worker function executing in background thread."""
        with self._lock:
            if job.cancel_event.is_set() or job.state == "cancelled":
                job.state = "cancelled"
                job.stage = "Cancelled"
                job.end_time = time.time()
                return
            job.state = "running"
            job.start_time = time.time()
            job.stage = "Starting execution"

        def on_progress(fraction: float, stage: str, convergence_point: dict[str, Any] | None = None) -> None:
            with self._lock:
                if job.cancel_event.is_set():
                    return
                job.progress = max(0.0, min(1.0, float(fraction)))
                job.stage = stage
                if convergence_point is not None:
                    job.convergence.append(
                        ConvergencePoint(
                            iter=int(convergence_point["iter"]),
                            energy=float(convergence_point["energy"]),
                        )
                    )

        try:
            result = self._run_fn(
                job.request,
                on_progress=on_progress,
                cancel=job.cancel_event,
            )
            with self._lock:
                if job.cancel_event.is_set():
                    job.state = "cancelled"
                    job.stage = "Cancelled"
                    job.result = None
                else:
                    job.state = "done"
                    job.progress = 1.0
                    job.stage = "Completed"
                    job.result = result
                job.end_time = time.time()
        except Cancelled:
            with self._lock:
                job.state = "cancelled"
                job.stage = "Cancelled"
                job.result = None
                job.end_time = time.time()
        except Exception as exc:
            logger.exception("Pipeline error for job %s: %s", job.job_id, exc)
            with self._lock:
                if job.cancel_event.is_set():
                    job.state = "cancelled"
                    job.stage = "Cancelled"
                    job.result = None
                else:
                    job.state = "error"
                    job.stage = "Failed"
                    job.result = None
                    raw_msg = str(exc).strip()
                    # Clean out tracebacks or local file paths from error string
                    clean_msg = re.sub(r"[A-Za-z]:\\[^\s]+", "", raw_msg)
                    clean_msg = re.sub(r"/[^\s]+", "", clean_msg).strip()
                    if not clean_msg:
                        clean_msg = "An error occurred during portfolio optimization."
                    job.error = clean_msg
                job.end_time = time.time()


# Singleton runner used by default by the FastAPI application
job_runner = JobRunner()
