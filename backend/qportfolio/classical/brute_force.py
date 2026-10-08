"""Exact brute-force solver and feasible landscape generation."""
from __future__ import annotations

import itertools
import math
import time
from typing import TYPE_CHECKING, Any

import numpy as np

try:
    from qportfolio.contracts import Landscape, SolverResult
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

    @dataclass
    class Landscape:
        selections: np.ndarray  # (F, n) 0/1
        objectives: np.ndarray  # (F,)
        returns: np.ndarray  # (F,)
        variances: np.ndarray  # (F,)
        f_min: float
        f_max: float
        f_mean: float
        optimum: np.ndarray  # (n,)


def _vectorized_objective(problem: Any, selections: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """Vectorized calculation of expected returns, variances, transaction costs, and objectives.

    Args:
        problem: Problem instance with mu, sigma, k, q, cost_lin, cost_const.
        selections: (M, n) binary matrix of asset selections.

    Returns:
        tuple of (objectives, returns, variances, txn_costs), all shape (M,).
    """
    k = problem.k
    q = problem.q
    returns = np.asarray((selections @ problem.mu) / k, dtype=float)
    variances = np.asarray(np.sum((selections @ problem.sigma) * selections, axis=1) / (k**2), dtype=float)
    txn_costs = np.asarray(selections @ problem.cost_lin + problem.cost_const, dtype=float)
    objectives = np.asarray(q * variances - (1.0 - q) * (returns - txn_costs), dtype=float)
    return objectives, returns, variances, txn_costs


def brute_force(problem: Any) -> tuple[SolverResult, Landscape]:
    """Enumerate all K-combinations of assets and evaluate feasibility and objective.

    Uses `problem.evaluate` for feasibility and objective evaluation.
    Produces the full landscape over feasible selections only.

    Args:
        problem: Problem instance conforming to CONTRACTS.md §1.1.

    Returns:
        tuple[SolverResult, Landscape]: exact best feasible result and the landscape.
    """
    t0 = time.perf_counter()
    n = len(problem.tickers)
    k = problem.k

    feasible_selections: list[np.ndarray] = []
    feasible_objectives: list[float] = []
    feasible_returns: list[float] = []
    feasible_variances: list[float] = []
    feasible_txn_costs: list[float] = []

    # Enumerate all combinations of size K
    for combo in itertools.combinations(range(n), k):
        x = np.zeros(n, dtype=int)
        x[list(combo)] = 1
        ev = problem.evaluate(x)
        if ev.feasible:
            feasible_selections.append(x)
            feasible_objectives.append(ev.objective)
            feasible_returns.append(ev.exp_return)
            feasible_variances.append(ev.variance)
            feasible_txn_costs.append(ev.txn_cost)

    runtime_s = max(time.perf_counter() - t0, 1e-6)

    if not feasible_selections:
        # Honest reporting: no feasible solution exists
        empty_landscape = Landscape(
            selections=np.empty((0, n), dtype=int),
            objectives=np.array([], dtype=float),
            returns=np.array([], dtype=float),
            variances=np.array([], dtype=float),
            f_min=float("inf"),
            f_max=float("-inf"),
            f_mean=float("nan"),
            optimum=np.zeros(n, dtype=int),
        )
        res = SolverResult(
            solver="brute_force",
            label="Brute force (exact)",
            kind="classical",
            selection=None,
            bitstring=None,
            objective=None,
            exp_return=None,
            volatility=None,
            variance=None,
            txn_cost=None,
            feasible=False,
            violations=["no feasible selection found"],
            runtime_s=runtime_s,
            approx_ratio=1.0,
            details={},
        )
        return res, empty_landscape

    selections_arr = np.array(feasible_selections, dtype=int)
    objectives_arr = np.array(feasible_objectives, dtype=float)
    returns_arr = np.array(feasible_returns, dtype=float)
    variances_arr = np.array(feasible_variances, dtype=float)

    best_idx = int(np.argmin(objectives_arr))
    optimum_x = selections_arr[best_idx]
    f_min = float(objectives_arr[best_idx])
    f_max = float(np.max(objectives_arr))
    f_mean = float(np.mean(objectives_arr))

    selection = [problem.tickers[i] for i in range(n) if optimum_x[i] == 1]
    bitstring = "".join(str(int(b)) for b in optimum_x)
    exp_return = float(returns_arr[best_idx])
    variance = float(variances_arr[best_idx])
    volatility = float(math.sqrt(max(0.0, variance)))
    txn_cost = float(feasible_txn_costs[best_idx])

    landscape = Landscape(
        selections=selections_arr,
        objectives=objectives_arr,
        returns=returns_arr,
        variances=variances_arr,
        f_min=f_min,
        f_max=f_max,
        f_mean=f_mean,
        optimum=optimum_x,
    )

    result = SolverResult(
        solver="brute_force",
        label="Brute force (exact)",
        kind="classical",
        selection=selection,
        bitstring=bitstring,
        objective=f_min,
        exp_return=exp_return,
        volatility=volatility,
        variance=variance,
        txn_cost=txn_cost,
        feasible=True,
        violations=[],
        runtime_s=runtime_s,
        approx_ratio=1.0,
        details={},
    )
    return result, landscape
