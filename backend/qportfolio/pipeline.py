"""Pipeline entry point (CONTRACTS.md 1.5). Stub until U10: returns the example result."""
from __future__ import annotations

import threading
from collections.abc import Callable
from pathlib import Path

from .contracts import JobStatus, RunRequest, RunResult

EXAMPLE = Path(__file__).resolve().parents[2] / "contracts" / "api-examples" / "job_done.json"


class Cancelled(Exception):
    pass


def run(request: RunRequest, on_progress: Callable[[float, str, dict | None], None] | None = None,
        cancel: threading.Event | None = None) -> RunResult:
    if cancel is not None and cancel.is_set():
        raise Cancelled
    return JobStatus.model_validate_json(EXAMPLE.read_text(encoding="utf-8")).result
