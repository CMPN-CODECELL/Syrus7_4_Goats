"""Simulated annealing on QUBO energy landscape."""
from __future__ import annotations

import math
import time
from typing import Any

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


def qubo_flip_delta(qubo: Any, s: np.ndarray, i: int) -> float:
    """Calculate the incremental QUBO energy delta for flipping bit i.

    Given E(s) = s' Q s + c' s + const, and s'[i] = 1 - s[i],
    Delta E = E(s') - E(s).
    Verified to equal qubo.energy(s_flipped) - qubo.energy(s).

    Args:
        qubo: QUBO object with Q (m, m), c (m,), const.
        s: Current (m,) binary array.
        i: Variable index to flip.

    Returns:
        float: Exact change in QUBO energy.
    """
    delta_s = 1 - 2 * int(s[i])
    # Since Q is symmetric, s' Q s' - s' Q s = delta_s * (2 * (Q @ s)[i] + Q[i, i] * delta_s)
    q_s_i = float(np.dot(qubo.Q[i], s))
    delta_e = delta_s * (2.0 * q_s_i + float(qubo.Q[i, i]) * delta_s + float(qubo.c[i]))
    return float(delta_e)


def annealing(problem: Any, qubo: Any, seed: int = 7, sweeps: int = 2000) -> SolverResult:
    """Solve the portfolio problem via simulated annealing on the QUBO.

    Performs single-flip Metropolis updates across all QUBO variables (assets + slack)
    using a geometric cooling temperature schedule.
    Tracks the best state observed, extracts the asset bits, and evaluates
    them strictly via `problem.evaluate`.
    Does not perform silent repair if the result is infeasible.

    Args:
        problem: Problem instance conforming to CONTRACTS.md §1.1.
        qubo: Qubo object with Q, c, const, n_assets, n_slack.
        seed: Random seed for reproducibility (default 7).
        sweeps: Number of full sweeps (each sweep proposes m single flips).

    Returns:
        SolverResult: Result from decoded best state.
    """
    t0 = time.perf_counter()
    rng = np.random.default_rng(seed)

    m = len(qubo.c)
    n_assets = qubo.n_assets

    # Initial state: random binary
    s = rng.integers(0, 2, size=m, dtype=int)
    cur_energy = float(qubo.energy(s))
    best_state = s.copy()
    best_energy = cur_energy

    # Geometric temperature schedule
    t_start = 2.0
    t_end = 0.001
    total_steps = max(1, sweeps * m)
    cool_factor = (t_end / t_start) ** (1.0 / total_steps)
    temp = t_start

    # Simulated annealing loop
    for _ in range(total_steps):
        i = int(rng.integers(0, m))
        delta_e = qubo_flip_delta(qubo, s, i)

        # Metropolis acceptance rule
        if delta_e <= 0.0 or (temp > 1e-12 and math.exp(-delta_e / temp) > rng.random()):
            s[i] = 1 - s[i]
            cur_energy += delta_e
            if cur_energy < best_energy:
                best_energy = cur_energy
                best_state = s.copy()

        temp *= cool_factor

    # Extract asset bits and evaluate with problem.evaluate
    x_assets = best_state[:n_assets]
    ev = problem.evaluate(x_assets)
    runtime_s = max(time.perf_counter() - t0, 1e-6)

    selection = [problem.tickers[i] for i in range(n_assets) if x_assets[i] == 1]
    bitstring = "".join(str(int(b)) for b in x_assets)
    variance = float(ev.variance)
    volatility = float(math.sqrt(max(0.0, variance)))

    details = {
        "seed": seed,
        "sweeps": sweeps,
    }

    return SolverResult(
        solver="annealing",
        label="Simulated annealing",
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
