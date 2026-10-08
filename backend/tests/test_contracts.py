import json
from pathlib import Path

import pytest
from pydantic import TypeAdapter

from qportfolio.contracts import (JobStatus, RunRequest, RunResult, ScreenInfo, Study, StudySummary,
                                  Universe)
from qportfolio.pipeline import run

EXAMPLES = Path(__file__).resolve().parents[2] / "contracts" / "api-examples"
BANNED = ("advantage", "outperforms classical", "quantum speedup")


@pytest.mark.parametrize("name, model", [
    ("universe", Universe),
    ("run_request", RunRequest),
    ("screen", ScreenInfo),
    ("job_running", JobStatus),
    ("job_done", JobStatus),
    ("job_error", JobStatus),
    ("studies_index", list[StudySummary]),
    ("study_depth", Study),
])
def test_example_parses_and_round_trips(name: str, model: type) -> None:
    text = (EXAMPLES / f"{name}.json").read_text(encoding="utf-8")
    adapter = TypeAdapter(model)
    # Equal dump means the model has every JSON field and no stray ones (pydantic ignores extras on parse).
    assert adapter.dump_python(adapter.validate_json(text), mode="json") == json.loads(text)
    assert not any(b in text.lower() for b in BANNED)


def test_stub_pipeline_returns_valid_run_result() -> None:
    result = run(RunRequest())
    assert RunResult.model_validate(result.model_dump()) == result
