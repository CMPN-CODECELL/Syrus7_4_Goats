"""Studies reader endpoint service (CONTRACTS.md §2.7).

Reads precomputed quantum studies from backend/data/studies/*.json.
"""
from __future__ import annotations

import json
from pathlib import Path

from qportfolio.contracts import Study, StudySummary

_DEFAULT_STUDIES_DIR = Path(__file__).resolve().parents[2] / "data" / "studies"


def get_studies_dir(custom_dir: Path | str | None = None) -> Path:
    """Resolve the studies directory."""
    if custom_dir is not None:
        return Path(custom_dir)
    return _DEFAULT_STUDIES_DIR


def list_studies(studies_dir: Path | str | None = None) -> list[StudySummary]:
    """List summary info for all available studies.

    Returns:
        list[StudySummary]: List of study summaries or empty list if none exist.
    """
    directory = get_studies_dir(studies_dir)
    if not directory.exists() or not directory.is_dir():
        return []

    summaries: list[StudySummary] = []
    for path in sorted(directory.glob("*.json")):
        try:
            content = path.read_text(encoding="utf-8")
            data = json.loads(content)
            study_id = str(data.get("id") or path.stem)
            title = str(data.get("title") or path.stem)
            summary = str(data.get("summary") or data.get("description") or "")
            summaries.append(StudySummary(id=study_id, title=title, summary=summary))
        except Exception:
            continue

    return summaries


def get_study(study_id: str, studies_dir: Path | str | None = None) -> Study | None:
    """Retrieve full study details by id.

    Returns:
        Study | None: Verified Study model or None if not found or invalid.
    """
    directory = get_studies_dir(studies_dir)
    if not directory.exists() or not directory.is_dir():
        return None

    path = directory / f"{study_id}.json"
    if not path.exists() or not path.is_file():
        return None

    try:
        content = path.read_text(encoding="utf-8")
        return Study.model_validate_json(content)
    except Exception:
        return None
