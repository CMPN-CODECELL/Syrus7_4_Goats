"""Metrics for QAOA solutions against the exact feasible landscape."""
from __future__ import annotations

from typing import Any

try:
    from qportfolio.contracts import Landscape, QaoaMetrics, Sample
except ImportError:
    from dataclasses import dataclass, field

    @dataclass
    class Sample:
        bitstring: str
        prob: float
        objective: float | None = None
        feasible: bool = False
        optimal: bool = False

    @dataclass
    class QaoaMetrics:
        approx_ratio: float
        p_opt: float
        p_random: float
        feasible_rate: float
        top_samples: list[Sample] = field(default_factory=list)


def qaoa_metrics(samples: list[Sample], landscape: Any) -> QaoaMetrics:
    """Calculate QAOA comparison metrics against the feasible landscape.

    Follows Brandhofer et al. (arXiv:2207.10555 Eq. 8):
    - approx_ratio: expected value of r over samples, weighted by prob;
      for a feasible sample r = (f_max - F) / (f_max - f_min) using feasible-only bounds;
      r = 0 for infeasible samples.
    - p_opt: total probability of optimal samples (matching f_min within 1e-9).
    - p_random: 1 / |feasible| selections in landscape.
    - feasible_rate: total probability of feasible samples.
    - top_samples: top 20 samples by probability, annotated feasible and optimal.

    Args:
        samples: List of bitstring Sample objects from QAOA.
        landscape: Feasible Landscape from brute-force solver.

    Returns:
        QaoaMetrics: Computed metric summaries.
    """
    if not samples:
        n_feas = len(landscape.selections) if hasattr(landscape, "selections") else 0
        p_random = 1.0 / n_feas if n_feas > 0 else 0.0
        return QaoaMetrics(
            approx_ratio=0.0,
            p_opt=0.0,
            p_random=float(p_random),
            feasible_rate=0.0,
            top_samples=[],
        )

    f_min = float(landscape.f_min)
    f_max = float(landscape.f_max)
    f_range = f_max - f_min
    has_range = abs(f_range) > 1e-12

    n_feas = len(landscape.selections) if hasattr(landscape, "selections") else 0
    p_random = 1.0 / n_feas if n_feas > 0 else 0.0

    total_approx_ratio = 0.0
    feasible_rate = 0.0
    p_opt = 0.0

    annotated_samples: list[Sample] = []
    for s in samples:
        # Determine optimality with 1e-9 tolerance for ties
        is_opt = bool(
            s.optimal
            or (s.feasible and s.objective is not None and abs(s.objective - f_min) <= 1e-9)
        )
        if s.feasible:
            feasible_rate += s.prob
            if is_opt:
                p_opt += s.prob

            if s.objective is not None:
                if has_range:
                    r = (f_max - s.objective) / f_range
                    r = max(0.0, min(1.0, r))
                else:
                    r = 1.0
            else:
                r = 0.0
        else:
            r = 0.0

        total_approx_ratio += s.prob * r

        annotated_samples.append(
            Sample(
                bitstring=s.bitstring,
                prob=float(s.prob),
                objective=s.objective,
                feasible=bool(s.feasible),
                optimal=is_opt,
            )
        )

    # Top 20 samples sorted by probability descending
    top_samples = sorted(annotated_samples, key=lambda s: s.prob, reverse=True)[:20]

    return QaoaMetrics(
        approx_ratio=float(max(0.0, min(1.0, total_approx_ratio))),
        p_opt=float(max(0.0, min(1.0, p_opt))),
        p_random=float(p_random),
        feasible_rate=float(max(0.0, min(1.0, feasible_rate))),
        top_samples=top_samples,
    )
