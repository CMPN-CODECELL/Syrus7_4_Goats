"""Penalty tuning by brute force over the QUBO (KTD4; Brandhofer et al. Eq. 11)."""
from __future__ import annotations

import numpy as np

from qportfolio.problem import Problem
from qportfolio.qubo.builder import all_states, build_qubo
from qportfolio.qubo.constraints import active_rows


def tune_penalties(problem: Problem) -> dict[str, float]:
    """One shared weight for every active constraint, from a doubling schedule starting at 0.5x the objective spread.

    Returns the smallest rung where the lowest energy of any infeasible asset selection (best slack) is
    >= (F_min + F_mean_feasible) / 2. Feasibility is always Problem.evaluate's, never re-derived here.
    Rows are scaled to one unit of violation (constraints.Row.scale), so a shared weight is comparable across terms.
    """
    names = list(active_rows(problem))
    n = len(problem.tickers)
    zero = build_qubo(problem, dict.fromkeys(names, 0.0)).energies_all()
    unit = build_qubo(problem, dict.fromkeys(names, 1.0)).energies_all()
    # Slack bits sit above the asset bits, and the objective ignores them. Every penalty is linear in the shared
    # weight, so E(selection, slack) = obj[selection] + weight * pen[selection, slack].
    obj = zero.reshape(-1, 2**n)[0]
    pen = (unit - zero).reshape(-1, 2**n).min(axis=0)  # best slack per selection

    evals = [problem.evaluate(x) for x in all_states(n)]
    feasible = np.array([e.feasible for e in evals])
    if not feasible.any():
        raise ValueError("no feasible selection: nothing to tune the penalties against")
    f = np.array([e.objective for e in evals])[feasible]
    threshold = (f.min() + f.mean()) / 2

    weight = 0.5 * (f.max() - f.min()) or 0.5  # a zero spread (one feasible state) would never grow
    for _ in range(64):
        if (obj + weight * pen)[~feasible].min() >= threshold:
            return dict.fromkeys(names, float(weight))
        weight *= 2
    raise RuntimeError("penalty tuning did not converge: an infeasible selection carries no penalty")


tune = tune_penalties  # the plan's name for it
