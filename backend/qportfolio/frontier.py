"""Efficient frontier generation: continuous Markowitz sweep and discrete Pareto frontier."""
from __future__ import annotations

import math
from typing import Any

import cvxpy as cp
import numpy as np

try:
    from qportfolio.contracts import Frontier
except ImportError:
    from dataclasses import dataclass

    @dataclass
    class Frontier:
        continuous: list[dict[str, float]]
        discrete: list[dict[str, Any]]


def _solve_continuous_weights(
    market_subset: Any, n_targets: int = 25
) -> list[tuple[np.ndarray, float, float]]:
    """Solve the continuous long-only mean-variance frontier and return portfolio weights.

    Sweeps return targets between the minimum-variance portfolio return and the
    maximum asset return. Minimises w' Sigma w subject to sum(w) == 1, w >= 0, mu' w >= R.

    Args:
        market_subset: Object with tickers, mu, sigma.
        n_targets: Number of target returns to sweep (default 25).

    Returns:
        list of (w, risk, ret) tuples where w is the (n,) weights vector.
    """
    mu = np.asarray(market_subset.mu, dtype=float)
    sigma = np.asarray(market_subset.sigma, dtype=float)
    n = len(mu)

    # 1. Global Minimum Variance Portfolio (MVP)
    w_var = cp.Variable(n)
    mvp_prob = cp.Problem(
        cp.Minimize(cp.quad_form(w_var, cp.psd_wrap(sigma))),
        [cp.sum(w_var) == 1, w_var >= 0],
    )
    mvp_prob.solve()
    if w_var.value is not None:
        w_mvp = np.maximum(0.0, np.array(w_var.value, dtype=float).flatten())
        w_mvp /= np.sum(w_mvp)
        r_min = float(np.dot(mu, w_mvp))
    else:
        r_min = float(np.min(mu))

    r_max = float(np.max(mu))
    if r_max <= r_min:
        targets = np.full(n_targets, r_min)
    else:
        targets = np.linspace(r_min, r_max, n_targets)

    results: list[tuple[np.ndarray, float, float]] = []
    for target in targets:
        w = cp.Variable(n)
        prob = cp.Problem(
            cp.Minimize(cp.quad_form(w, cp.psd_wrap(sigma))),
            [cp.sum(w) == 1, w >= 0, mu @ w >= target],
        )
        try:
            prob.solve()
        except Exception:
            continue

        if w.value is not None and prob.status in (cp.OPTIMAL, cp.OPTIMAL_INACCURATE):
            weights = np.maximum(0.0, np.array(w.value, dtype=float).flatten())
            s = np.sum(weights)
            if s > 0:
                weights /= s
            variance = float(weights @ sigma @ weights)
            risk = float(math.sqrt(max(0.0, variance)))
            ret = float(np.dot(mu, weights))
            results.append((weights, risk, ret))

    return results


def frontier(market_subset: Any, landscape: Any) -> Frontier:
    """Generate the continuous Markowitz frontier and discrete K-of-n Pareto frontier.

    Args:
        market_subset: Market subset object with tickers, mu, sigma.
        landscape: Feasible Landscape from brute-force enumeration.

    Returns:
        Frontier: Object containing `continuous` and `discrete` frontier points.
    """
    # 1. Continuous frontier (sweep of 25 return targets)
    solved_weights = _solve_continuous_weights(market_subset, n_targets=25)
    continuous_points: list[dict[str, float]] = [
        {"risk": round(risk, 6), "ret": round(ret, 6)} for _, risk, ret in solved_weights
    ]

    # 2. Discrete K-of-n equal-weight Pareto frontier
    tickers = list(market_subset.tickers)
    n = len(tickers)

    candidate_points: list[dict[str, Any]] = []
    if hasattr(landscape, "selections") and len(landscape.selections) > 0:
        for idx in range(len(landscape.selections)):
            sel_bits = landscape.selections[idx]
            var = float(landscape.variances[idx])
            ret = float(landscape.returns[idx])
            risk = float(math.sqrt(max(0.0, var)))
            selection = [tickers[j] for j in range(n) if sel_bits[j] == 1]
            candidate_points.append({"risk": risk, "ret": ret, "selection": selection})

    # Filter for non-dominated Pareto points
    # Point A dominates point B if risk_A <= risk_B and ret_A >= ret_B (with at least one strict inequality)
    discrete_points: list[dict[str, Any]] = []
    for i, p_a in enumerate(candidate_points):
        dominated = False
        for j, p_b in enumerate(candidate_points):
            if i == j:
                continue
            # Check if p_b dominates p_a
            # Lower risk is better, higher return is better
            b_risk_better = p_b["risk"] <= p_a["risk"] + 1e-9
            b_ret_better = p_b["ret"] >= p_a["ret"] - 1e-9
            b_strictly_better = (p_b["risk"] < p_a["risk"] - 1e-9) or (
                p_b["ret"] > p_a["ret"] + 1e-9
            )

            if b_risk_better and b_ret_better and b_strictly_better:
                dominated = True
                break
            # Handle exact ties: keep the one with lower index
            if (
                abs(p_b["risk"] - p_a["risk"]) <= 1e-9
                and abs(p_b["ret"] - p_a["ret"]) <= 1e-9
                and j < i
            ):
                dominated = True
                break

        if not dominated:
            discrete_points.append({
                "risk": round(p_a["risk"], 6),
                "ret": round(p_a["ret"], 6),
                "selection": p_a["selection"],
            })

    # Sort discrete points by risk ascending
    discrete_points.sort(key=lambda pt: (pt["risk"], pt["ret"]))

    return Frontier(continuous=continuous_points, discrete=discrete_points)
