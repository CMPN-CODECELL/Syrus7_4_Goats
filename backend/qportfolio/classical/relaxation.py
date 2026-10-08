"""Continuous QP relaxation with top-K rounding."""
from __future__ import annotations

import math
import time
from typing import Any

import cvxpy as cp
import numpy as np

try:
    from qportfolio.contracts import SolverResult
except ImportError:
    from dataclasses import dataclass, field

    @dataclass
    class SolverResult:
        solver: str
        label: str
        kind: str
        selection: list[str] | None
        bitstring: str | None
        objective: float | None
        exp_return: float | None
        volatility: float | None
        variance: float | None
        txn_cost: float | None
        feasible: bool
        violations: list[str]
        runtime_s: float
        approx_ratio: float | None = None
        p_opt: float | None = None
        feasible_rate: float | None = None
        portfolio: dict[str, Any] | None = None
        oos: dict[str, Any] | None = None
        details: dict[str, Any] = field(default_factory=dict)


def relaxation(problem: Any) -> SolverResult:
    """Solve continuous convex relaxation of portfolio problem and round to top-K picks.

    Minimises q * x'Sigma x / K^2 - (1-q)*(mu'x / K - (cost_lin.x + cost_const))
    subject to 0 <= x <= 1, sum(x) == K, sector caps, and optional target return.
    Rounds by taking top-K assets of relaxed x (ties broken by lowest index).
    Evaluates the rounded vector strictly via `problem.evaluate`.
    Does not perform silent repair if the rounded vector is infeasible.

    Args:
        problem: Problem instance.

    Returns:
        SolverResult: Result of rounded relaxation.
    """
    t0 = time.perf_counter()
    n = len(problem.tickers)
    k = problem.k
    q = problem.q

    x = cp.Variable(n)
    variance_term = cp.quad_form(x, cp.psd_wrap(problem.sigma)) / (k**2)
    net_return_term = (problem.mu @ x) / k - (problem.cost_lin @ x + problem.cost_const)
    objective = cp.Minimize(q * variance_term - (1.0 - q) * net_return_term)

    constraints = [x >= 0, x <= 1, cp.sum(x) == k]

    if problem.sector_cap is not None:
        sectors = problem.sectors
        for s in set(sectors):
            sec_indices = [i for i, sec in enumerate(sectors) if sec == s]
            if len(sec_indices) > problem.sector_cap:
                constraints.append(cp.sum(x[sec_indices]) <= problem.sector_cap)

    if problem.target_return is not None:
        constraints.append(net_return_term >= problem.target_return)

    prob = cp.Problem(objective, constraints)
    try:
        prob.solve()
    except Exception as exc:  # noqa: BLE001
        runtime_s = max(time.perf_counter() - t0, 1e-6)
        return SolverResult(
            solver="relaxation",
            label="Relaxation + rounding",
            kind="classical",
            selection=None,
            bitstring=None,
            objective=None,
            exp_return=None,
            volatility=None,
            variance=None,
            txn_cost=None,
            feasible=False,
            violations=[f"solver error: {exc}"],
            runtime_s=runtime_s,
            approx_ratio=None,
            details={"relaxed_x": [], "rounding": "top-K by relaxed value"},
        )

    if x.value is None or prob.status not in (cp.OPTIMAL, cp.OPTIMAL_INACCURATE):
        runtime_s = max(time.perf_counter() - t0, 1e-6)
        return SolverResult(
            solver="relaxation",
            label="Relaxation + rounding",
            kind="classical",
            selection=None,
            bitstring=None,
            objective=None,
            exp_return=None,
            volatility=None,
            variance=None,
            txn_cost=None,
            feasible=False,
            violations=[f"continuous relaxation infeasible: status={prob.status}"],
            runtime_s=runtime_s,
            approx_ratio=None,
            details={"relaxed_x": [], "rounding": "top-K by relaxed value"},
        )

    relaxed_x = np.array(x.value, dtype=float).flatten()

    # Round by top-K of relaxed x, ties broken by lowest index
    chosen_indices = sorted(range(n), key=lambda i: (-relaxed_x[i], i))[:k]
    rounded_x = np.zeros(n, dtype=int)
    rounded_x[chosen_indices] = 1

    # Exact evaluation using problem.evaluate (no silent repair)
    ev = problem.evaluate(rounded_x)
    runtime_s = max(time.perf_counter() - t0, 1e-6)

    selection = [problem.tickers[i] for i in range(n) if rounded_x[i] == 1]
    bitstring = "".join(str(int(b)) for b in rounded_x)
    variance = float(ev.variance)
    volatility = float(math.sqrt(max(0.0, variance)))

    details = {
        "relaxed_x": [float(val) for val in relaxed_x],
        "rounding": "top-K by relaxed value",
    }

    return SolverResult(
        solver="relaxation",
        label="Relaxation + rounding",
        kind="classical",
        selection=selection,
        bitstring=bitstring,
        objective=float(ev.objective),
        exp_return=float(ev.exp_return),
        volatility=volatility,
        variance=variance,
        txn_cost=float(ev.txn_cost),
        feasible=bool(ev.feasible),
        violations=list(ev.violations),
        runtime_s=runtime_s,
        approx_ratio=None,
        details=details,
    )
