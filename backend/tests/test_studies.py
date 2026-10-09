"""U14: the studies script writes a schema-valid Study file."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

from qportfolio.contracts import Study

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "run_studies.py"


def test_quick_depth_study_is_schema_valid(tmp_path):
    subprocess.run([sys.executable, str(SCRIPT), "--quick", "--out", str(tmp_path), "--only", "depth"],
                   check=True, timeout=600)
    study = Study.model_validate_json((tmp_path / "depth.json").read_text(encoding="utf-8"))
    assert study.id == "depth" and len(study.series) == 2
    assert all(len(s.points) == 2 for s in study.series)  # quick mode: p = 1, 2
