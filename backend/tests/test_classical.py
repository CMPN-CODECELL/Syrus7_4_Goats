"""Unit and regression tests for classical portfolio solvers (Team 3, U8)."""
from __future__ import annotations

import math
import sys
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

# Ensure backend root is on sys.path so qportfolio is discoverable
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import numpy as np
import pytest

from qportfolio.classical.annealing import annealing, qubo_flip_delta
from qportfolio.classical.brute_force import _vectorized_objective, brute_force
from qportfolio.classical.relaxation import relaxation


# Reference Problem and Evaluation implementation conforming to CONTRACTS.md §1.1
@dataclass
class Evaluation:
    objective: float
    exp_return: float
    variance: float
    txn_cost: float
    feasible: bool
    violations: list[str]


@dataclass
class Problem:
    tickers: list[str]
    sectors: list[str]
    mu: np.ndarray
    sigma: np.ndarray
    k: int
    q: float
    cost_lin: np.ndarray
    cost_const: float
    sector_cap: int | None = None
    target_return: float | None = None

    def evaluate(self, x: np.ndarray) -> Evaluation:
        x_arr = np.asarray(x, dtype=float)
        k = self.k
        exp_return = float(np.dot(self.mu, x_arr) / k)
        variance = float(x_arr @ self.sigma @ x_arr / (k**2))
        txn_cost = float(np.dot(self.cost_lin, x_arr) + self.cost_const)
        objective = float(self.q * variance - (1.0 - self.q) * (exp_return - txn_cost))

        violations: list[str] = []
        chosen = int(np.sum(x_arr))
        if chosen != k:
            violations.append(f"cardinality: {chosen} != {k}")

        if self.sector_cap is not None:
            counts: dict[str, int] = {}
            for idx, val in enumerate(x_arr):
                if val > 0.5:
                    sec = self.sectors[idx]
                    counts[sec] = counts.get(sec, 0) + 1
            for sec, count in counts.items():
                if count > self.sector_cap:
                    violations.append(f"sector_cap: {sec} {count} > {self.sector_cap}")

        if self.target_return is not None:
            net_ret = exp_return - txn_cost
            if net_ret < self.target_return:
                violations.append(f"target_return: {net_ret:.3f} < {self.target_return:.2f}")

        return Evaluation(
            objective=objective,
            exp_return=exp_return,
            variance=variance,
            txn_cost=txn_cost,
            feasible=len(violations) == 0,
            violations=violations,
        )


# Minimal QUBO stub per CONTRACTS.md §1.3 until U5 lands
@dataclass
class StubQubo:
    Q: np.ndarray
    c: np.ndarray
    const: float
    n_assets: int
    n_slack: int
    labels: list[str] = field(default_factory=list)
    penalties: dict[str, float] = field(default_factory=dict)

    def energy(self, bits: np.ndarray) -> float:
        b = np.asarray(bits, dtype=float)
        return float(b @ self.Q @ b + np.dot(self.c, b) + self.const)


def build_cardinality_qubo(problem: Problem, penalty_a: float = 2.0) -> StubQubo:
    """Build a QUBO with cardinality constraint penalty A * (sum(x) - K)^2."""
    n = len(problem.tickers)
    k = problem.k
    q = problem.q

    # Objective part: q * x'Sigma x / K^2 - (1-q) * (mu'x / K - (cost_lin'x + cost_const))
    # Quadratic term in x: q * Sigma / K^2 + penalty_a * ones(n, n)
    # Note: sum(x_i - K)^2 = sum_i x_i^2 + 2 sum_{i<j} x_i x_j - 2 K sum_i x_i + K^2
    # In x' Q x + c' x:
    Q = (q / (k**2)) * problem.sigma + penalty_a * np.ones((n, n))
    c = -(1.0 - q) * (problem.mu / k - problem.cost_lin) - 2.0 * penalty_a * k * np.ones(n)
    const = (1.0 - q) * problem.cost_const + penalty_a * (k**2)

    # Symmetrize Q
    Q = 0.5 * (Q + Q.T)
    return StubQubo(
        Q=Q,
        c=c,
        const=float(const),
        n_assets=n,
        n_slack=0,
        labels=problem.tickers,
        penalties={"cardinality": penalty_a},
    )


def test_hand_checked_4_asset_brute_force():
    """Verify brute force on a hand-checked 4-asset instance (n=4, K=2, q=0.5)."""
    tickers = ["T1", "T2", "T3", "T4"]
    sectors = ["Tech", "Tech", "Finance", "Finance"]
    mu = np.array([0.20, 0.16, 0.12, 0.08])
    # Diagonal + small correlations
    sigma = np.array([
        [0.04, 0.01, 0.00, 0.00],
        [0.01, 0.05, 0.00, 0.00],
        [0.00, 0.00, 0.03, 0.01],
        [0.00, 0.00, 0.01, 0.02],
    ])
    cost_lin = np.zeros(4)
    cost_const = 0.0
    k = 2
    q = 0.5

    problem = Problem(
        tickers=tickers,
        sectors=sectors,
        mu=mu,
        sigma=sigma,
        k=k,
        q=q,
        cost_lin=cost_lin,
        cost_const=cost_const,
    )

    # Hand computation of objectives for all 6 combinations of 2 assets:
    # {0, 1}: ret=(0.20+0.16)/2=0.18; var=(0.04+0.05+2*0.01)/4=0.11/4=0.0275; F=0.5*0.0275 - 0.5*0.18 = -0.07625
    # {0, 2}: ret=(0.20+0.12)/2=0.16; var=(0.04+0.03)/4=0.07/4=0.0175; F=0.5*0.0175 - 0.5*0.16 = -0.07125
    # {0, 3}: ret=(0.20+0.08)/2=0.14; var=(0.04+0.02)/4=0.06/4=0.0150; F=0.5*0.0150 - 0.5*0.14 = -0.06250
    # {1, 2}: ret=(0.16+0.12)/2=0.14; var=(0.05+0.03)/4=0.08/4=0.0200; F=0.5*0.0200 - 0.5*0.14 = -0.06000
    # {1, 3}: ret=(0.16+0.08)/2=0.12; var=(0.05+0.02)/4=0.07/4=0.0175; F=0.5*0.0175 - 0.5*0.12 = -0.05125
    # {2, 3}: ret=(0.12+0.08)/2=0.10; var=(0.03+0.02+2*0.01)/4=0.07/4=0.0175; F=0.5*0.0175 - 0.5*0.10 = -0.04125
    expected_f_min = -0.07625
    expected_f_max = -0.04125
    expected_f_mean = (-0.07625 - 0.07125 - 0.06250 - 0.06000 - 0.05125 - 0.04125) / 6.0

    res, landscape = brute_force(problem)

    assert res.feasible is True
    assert res.selection == ["T1", "T2"]
    assert res.bitstring == "1100"
    assert pytest.approx(res.objective, rel=1e-5) == expected_f_min
    assert pytest.approx(landscape.f_min, rel=1e-5) == expected_f_min
    assert pytest.approx(landscape.f_max, rel=1e-5) == expected_f_max
    assert pytest.approx(landscape.f_mean, rel=1e-5) == expected_f_mean
    assert len(landscape.selections) == 6
    assert res.runtime_s > 0
    assert res.approx_ratio == 1.0


def test_sector_cap_enforcement():
    """Brute force respects sector caps: landscape counts feasible only, optimum has no violation."""
    tickers = ["T1", "T2", "F1", "F2"]
    sectors = ["Tech", "Tech", "Finance", "Finance"]
    mu = np.array([0.25, 0.20, 0.10, 0.05])
    sigma = np.diag([0.02, 0.03, 0.02, 0.02])
    cost_lin = np.zeros(4)

    # Sector cap = 1: neither {"T1", "T2"} nor {"F1", "F2"} is allowed
    # Allowed: {T1, F1}, {T1, F2}, {T2, F1}, {T2, F2} -> exactly 4 feasible
    problem = Problem(
        tickers=tickers,
        sectors=sectors,
        mu=mu,
        sigma=sigma,
        k=2,
        q=0.5,
        cost_lin=cost_lin,
        cost_const=0.0,
        sector_cap=1,
    )

    res, landscape = brute_force(problem)

    assert res.feasible is True
    assert len(landscape.selections) == 4  # Only 4 feasible
    # Verify no returned selection violates sector cap
    for x in landscape.selections:
        ev = problem.evaluate(x)
        assert ev.feasible is True
        assert len(ev.violations) == 0

    assert res.selection in (["T1", "F1"], ["T1", "F2"], ["T2", "F1"], ["T2", "F2"])


def test_relaxation_convex_instance():
    """On a convex instance, relaxation rounded selection is feasible and objective >= BF optimum."""
    rng = np.random.default_rng(42)
    n = 6
    k = 3
    tickers = [f"STK{i}" for i in range(n)]
    sectors = ["Tech", "Tech", "Finance", "Finance", "Energy", "Energy"]
    mu = rng.uniform(0.08, 0.22, size=n)
    A = rng.normal(0, 0.1, size=(n, n))
    sigma = A @ A.T + 0.01 * np.eye(n)
    cost_lin = np.zeros(n)

    problem = Problem(
        tickers=tickers,
        sectors=sectors,
        mu=mu,
        sigma=sigma,
        k=k,
        q=0.5,
        cost_lin=cost_lin,
        cost_const=0.0,
        sector_cap=2,
    )

    bf_res, _ = brute_force(problem)
    rx_res = relaxation(problem)

    assert rx_res.feasible is True
    assert rx_res.runtime_s > 0
    assert len(rx_res.selection) == k
    assert rx_res.details["rounding"] == "top-K by relaxed value"
    assert len(rx_res.details["relaxed_x"]) == n
    # The discrete optimum from BF must be <= any rounded heuristic objective
    assert rx_res.objective >= bf_res.objective - 1e-9


def test_relaxation_infeasible_reported_honestly():
    """If constraints cannot be satisfied, relaxation reports feasible=False without hidden repair."""
    tickers = ["A", "B", "C"]
    sectors = ["Tech", "Tech", "Tech"]
    mu = np.array([0.1, 0.1, 0.1])
    sigma = 0.04 * np.eye(3)
    # Target return impossible: 5.0 (500%)
    problem = Problem(
        tickers=tickers,
        sectors=sectors,
        mu=mu,
        sigma=sigma,
        k=2,
        q=0.5,
        cost_lin=np.zeros(3),
        cost_const=0.0,
        target_return=5.0,
    )
    rx_res = relaxation(problem)
    assert rx_res.feasible is False
    assert len(rx_res.violations) > 0


def test_qubo_flip_delta_exact():
    """Incremental energy delta must match qubo.energy(s') - qubo.energy(s) exactly."""
    rng = np.random.default_rng(123)
    m = 8
    A = rng.normal(0, 1, size=(m, m))
    Q = 0.5 * (A + A.T)
    c = rng.normal(0, 1, size=m)
    const = 1.5
    qubo = StubQubo(Q=Q, c=c, const=const, n_assets=6, n_slack=2)

    for _ in range(20):
        s = rng.integers(0, 2, size=m, dtype=int)
        for i in range(m):
            delta = qubo_flip_delta(qubo, s, i)
            s_flipped = s.copy()
            s_flipped[i] = 1 - s[i]
            exact_diff = qubo.energy(s_flipped) - qubo.energy(s)
            assert pytest.approx(delta, abs=1e-11) == exact_diff


def test_simulated_annealing_reach_rate():
    """SA with fixed seeds on a 10-asset, K=5 instance reaches the BF optimum in multiple seeds."""
    rng = np.random.default_rng(77)
    n = 10
    k = 5
    tickers = [f"T{i:02d}" for i in range(n)]
    sectors = ["S1", "S1", "S1", "S2", "S2", "S2", "S3", "S3", "S4", "S4"]
    mu = rng.uniform(0.10, 0.30, size=n)
    M = rng.normal(0, 0.05, size=(n, n))
    sigma = M @ M.T + 0.02 * np.eye(n)

    problem = Problem(
        tickers=tickers,
        sectors=sectors,
        mu=mu,
        sigma=sigma,
        k=k,
        q=0.4,
        cost_lin=np.zeros(n),
        cost_const=0.0,
    )

    bf_res, _ = brute_force(problem)
    qubo = build_cardinality_qubo(problem, penalty_a=3.0)

    # Test 10 fixed seeds
    opt_found_count = 0
    seeds = list(range(1, 11))
    for s in seeds:
        res = annealing(problem, qubo, seed=s, sweeps=2500)
        assert res.runtime_s > 0
        if res.feasible and pytest.approx(res.objective, abs=1e-6) == bf_res.objective:
            opt_found_count += 1

    # Record observed reach rate honestly (per PROMPT-1: in at least 5 of 10 seeds)
    print(f"\nSimulated annealing reach rate: {opt_found_count}/10 seeds")
    assert opt_found_count >= 5


def test_vectorized_objective_equals_evaluate():
    """Vectorized numpy objective must equal Problem.evaluate on sampled subsets."""
    rng = np.random.default_rng(999)
    n = 8
    k = 4
    problem = Problem(
        tickers=[f"A{i}" for i in range(n)],
        sectors=["Sec"] * n,
        mu=rng.uniform(0.05, 0.25, size=n),
        sigma=0.05 * np.eye(n) + 0.01,
        k=k,
        q=0.6,
        cost_lin=rng.uniform(0.001, 0.002, size=n),
        cost_const=0.0005,
    )

    # Sample 15 distinct subsets of size k
    sample_subsets = []
    for _ in range(15):
        chosen = rng.choice(n, size=k, replace=False)
        x = np.zeros(n, dtype=int)
        x[chosen] = 1
        sample_subsets.append(x)
    selections = np.array(sample_subsets)

    obj_vec, ret_vec, var_vec, tc_vec = _vectorized_objective(problem, selections)

    for idx, x in enumerate(selections):
        ev = problem.evaluate(x)
        assert pytest.approx(obj_vec[idx], abs=1e-10) == ev.objective
        assert pytest.approx(ret_vec[idx], abs=1e-10) == ev.exp_return
        assert pytest.approx(var_vec[idx], abs=1e-10) == ev.variance
        assert pytest.approx(tc_vec[idx], abs=1e-10) == ev.txn_cost


def test_solvers_consistency_and_runtime():
    """All three solvers return runtime_s > 0 and identical objective for identical selections."""
    tickers = ["T1", "T2", "T3", "T4"]
    sectors = ["S1", "S1", "S2", "S2"]
    mu = np.array([0.20, 0.15, 0.10, 0.05])
    sigma = np.diag([0.04, 0.03, 0.02, 0.01])
    problem = Problem(
        tickers=tickers,
        sectors=sectors,
        mu=mu,
        sigma=sigma,
        k=2,
        q=0.5,
        cost_lin=np.zeros(4),
        cost_const=0.0,
    )

    bf_res, _ = brute_force(problem)
    rx_res = relaxation(problem)
    qubo = build_cardinality_qubo(problem, penalty_a=2.0)
    sa_res = annealing(problem, qubo, seed=42, sweeps=1000)

    assert bf_res.runtime_s > 0
    assert rx_res.runtime_s > 0
    assert sa_res.runtime_s > 0

    # If two solvers pick the same selection, their objectives and numbers must match
    solvers = [bf_res, rx_res, sa_res]
    for i in range(len(solvers)):
        for j in range(i + 1, len(solvers)):
            if solvers[i].bitstring == solvers[j].bitstring:
                assert pytest.approx(solvers[i].objective, abs=1e-9) == solvers[j].objective
                assert pytest.approx(solvers[i].exp_return, abs=1e-9) == solvers[j].exp_return
                assert pytest.approx(solvers[i].variance, abs=1e-9) == solvers[j].variance
                assert pytest.approx(solvers[i].volatility, abs=1e-9) == solvers[j].volatility


def test_brute_force_16_assets_under_2_seconds():
    """Brute force on 16 assets with K=8 (12,870 subsets) must run in under 2 seconds."""
    rng = np.random.default_rng(101)
    n = 16
    k = 8
    tickers = [f"ASSET_{i:02d}" for i in range(n)]
    sectors = [f"SEC_{i % 4}" for i in range(n)]
    mu = rng.uniform(0.05, 0.25, size=n)
    M = rng.normal(0, 0.05, size=(n, n))
    sigma = M @ M.T + 0.01 * np.eye(n)

    problem = Problem(
        tickers=tickers,
        sectors=sectors,
        mu=mu,
        sigma=sigma,
        k=k,
        q=0.5,
        cost_lin=np.zeros(n),
        cost_const=0.0,
    )

    t0 = time.perf_counter()
    res, landscape = brute_force(problem)
    dt = time.perf_counter() - t0

    assert len(landscape.selections) == 12870
    assert res.feasible is True
    print(f"\nBrute force 16 assets K=8 (12,870 subsets) runtime: {dt:.3f} s")
    assert dt < 2.0, f"Brute force took {dt:.2f} s, expected under 2.0 s"
