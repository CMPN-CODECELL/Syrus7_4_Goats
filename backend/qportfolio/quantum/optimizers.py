"""Classical optimisers for the QAOA parameter loop: COBYLA and Nelder-Mead (scipy) and our own seeded SPSA.

All three share one signature ``(fun, x0, maxiter, callback=None, seed=None) -> Result``:

- ``maxiter`` is a budget of objective evaluations (so ``Result.nfev <= maxiter`` for every optimiser).
- ``callback(iter, energy, params)`` is called after EVERY evaluation with ``iter`` = evaluations so far (1-based).
  If it raises, the exception propagates out of the optimiser untouched; that is how cancellation works.
- ``seed`` only matters for SPSA; COBYLA and Nelder-Mead are deterministic.
"""
from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass

import numpy as np
from scipy.optimize import minimize

Objective = Callable[[np.ndarray], float]
Callback = Callable[[int, float, np.ndarray], None]


@dataclass
class Result:
    x: np.ndarray
    fun: float
    history: list[float]  # energy of every evaluation, in order; len(history) == nfev
    nfev: int


def _tracked(fun: Objective, callback: Callback | None) -> tuple[Objective, list[float]]:
    history: list[float] = []

    def tracked(x) -> float:
        x = np.array(x, dtype=float)
        energy = float(fun(x))
        history.append(energy)
        if callback is not None:
            callback(len(history), energy, x)
        return energy

    return tracked, history


def _scipy(method: str, options: dict, fun: Objective, x0, callback: Callback | None) -> Result:
    tracked, history = _tracked(fun, callback)
    res = minimize(tracked, np.asarray(x0, dtype=float), method=method, options=options)
    return Result(np.asarray(res.x, dtype=float), float(res.fun), history, len(history))


def cobyla(fun: Objective, x0, maxiter: int, callback: Callback | None = None, seed: int | None = None) -> Result:
    return _scipy("COBYLA", {"maxiter": maxiter}, fun, x0, callback)


def nelder_mead(fun: Objective, x0, maxiter: int, callback: Callback | None = None, seed: int | None = None) -> Result:
    return _scipy("Nelder-Mead", {"maxiter": maxiter, "maxfev": maxiter}, fun, x0, callback)


def spsa(fun: Objective, x0, maxiter: int, callback: Callback | None = None, seed: int | None = None) -> Result:
    """Simultaneous-perturbation stochastic approximation; 2 evaluations per step plus one at the end."""
    a, c, alpha, gamma = 0.2, 0.1, 0.602, 0.101
    A = 0.1 * maxiter
    tracked, history = _tracked(fun, callback)
    rng = np.random.default_rng(seed)
    x = np.array(x0, dtype=float)
    for k in range((maxiter - 1) // 2):
        ak = a / (A + k + 1) ** alpha
        ck = c / (k + 1) ** gamma
        delta = rng.choice([-1.0, 1.0], size=x.shape)
        grad = (tracked(x + ck * delta) - tracked(x - ck * delta)) / (2 * ck) * delta  # 1/delta == delta
        x = x - ak * grad
    return Result(x, tracked(x), history, len(history))
