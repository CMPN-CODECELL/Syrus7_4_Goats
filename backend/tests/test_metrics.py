"""Unit and regression tests for metrics, frontier, and verdict (Team 3, U9)."""
from __future__ import annotations

import math
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

# Ensure backend root is on sys.path
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import numpy as np
import pytest

from qportfolio.classical.brute_force import brute_force
from qportfolio.frontier import _solve_continuous_weights, frontier
from qportfolio.metrics import Sample, qaoa_metrics
from qportfolio.verdict import BANNED_PHRASES, verdict


@dataclass
class LandscapeStub:
    selections: np.ndarray
    objectives: np.ndarray
    returns: np.ndarray
    variances: np.ndarray
    f_min: float
    f_max: float
    f_mean: float
    optimum: np.ndarray


@dataclass
class MarketSubsetStub:
    tickers: list[str]
    sectors: list[str]
    mu: np.ndarray
    sigma: np.ndarray


@dataclass
class SolverResultStub:
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
    details: dict[str, Any] = field(default_factory=dict)


def test_all_samples_on_optimum():
    """When all samples are on the optimum, approx_ratio = 1.0 and p_opt = 1.0."""
    landscape = LandscapeStub(
        selections=np.array([[1, 0], [0, 1]]),
        objectives=np.array([-0.10, -0.02]),
        returns=np.array([0.15, 0.10]),
        variances=np.array([0.02, 0.03]),
        f_min=-0.10,
        f_max=-0.02,
        f_mean=-0.06,
        optimum=np.array([1, 0]),
    )

    samples = [
        Sample(bitstring="10", prob=0.6, objective=-0.10, feasible=True, optimal=True),
        Sample(bitstring="10", prob=0.4, objective=-0.10, feasible=True, optimal=True),
    ]

    metrics = qaoa_metrics(samples, landscape)

    assert pytest.approx(metrics.approx_ratio, abs=1e-9) == 1.0
    assert pytest.approx(metrics.p_opt, abs=1e-9) == 1.0
    assert pytest.approx(metrics.feasible_rate, abs=1e-9) == 1.0
    assert pytest.approx(metrics.p_random, abs=1e-9) == 0.5  # 1 / 2 feasible states


def test_all_samples_infeasible():
    """When all samples are infeasible, approx_ratio = 0.0, feasible_rate = 0.0, and verdict is no-feasible."""
    landscape = LandscapeStub(
        selections=np.array([[1, 0], [0, 1]]),
        objectives=np.array([-0.05, 0.02]),
        returns=np.array([0.12, 0.08]),
        variances=np.array([0.01, 0.02]),
        f_min=-0.05,
        f_max=0.02,
        f_mean=-0.015,
        optimum=np.array([1, 0]),
    )

    samples = [
        Sample(bitstring="00", prob=0.7, objective=None, feasible=False, optimal=False),
        Sample(bitstring="11", prob=0.3, objective=None, feasible=False, optimal=False),
    ]

    metrics = qaoa_metrics(samples, landscape)

    assert pytest.approx(metrics.approx_ratio, abs=1e-9) == 0.0
    assert pytest.approx(metrics.feasible_rate, abs=1e-9) == 0.0
    assert pytest.approx(metrics.p_opt, abs=1e-9) == 0.0

    qaoa_sol = SolverResultStub(
        solver="qaoa_standard",
        label="QAOA (standard)",
        kind="quantum",
        selection=None,
        bitstring=None,
        objective=None,
        exp_return=None,
        volatility=None,
        variance=None,
        txn_cost=None,
        feasible=False,
        violations=["no feasible sample"],
        runtime_s=1.2,
    )
    solvers = [qaoa_sol]

    v = verdict(solvers, landscape, metrics)
    assert v.level == "no-feasible"
    assert "no feasible" in v.headline.lower()


def test_approx_ratio_hand_computed_landscape():
    """Approximation ratio uses feasible-only f_min and f_max and matches hand computation."""
    # Landscape: f_min = -0.20, f_max = 0.10 -> range = 0.30
    landscape = LandscapeStub(
        selections=np.array([[1, 0, 0], [0, 1, 0], [0, 0, 1]]),
        objectives=np.array([-0.20, -0.05, 0.10]),
        returns=np.array([0.20, 0.15, 0.10]),
        variances=np.array([0.03, 0.02, 0.01]),
        f_min=-0.20,
        f_max=0.10,
        f_mean=-0.05,
        optimum=np.array([1, 0, 0]),
    )

    # Sample 1: F = -0.20 -> r = (0.10 - (-0.20)) / 0.30 = 1.0, prob = 0.5
    # Sample 2: F = -0.05 -> r = (0.10 - (-0.05)) / 0.30 = 0.15 / 0.30 = 0.5, prob = 0.3
    # Sample 3: Infeasible -> r = 0.0, prob = 0.2
    # Expected approx_ratio = 0.5 * 1.0 + 0.3 * 0.5 + 0.2 * 0.0 = 0.50 + 0.15 = 0.65
    samples = [
        Sample(bitstring="100", prob=0.5, objective=-0.20, feasible=True, optimal=True),
        Sample(bitstring="010", prob=0.3, objective=-0.05, feasible=True, optimal=False),
        Sample(bitstring="111", prob=0.2, objective=0.35, feasible=False, optimal=False),
    ]

    metrics = qaoa_metrics(samples, landscape)

    assert pytest.approx(metrics.approx_ratio, abs=1e-9) == 0.65
    assert pytest.approx(metrics.p_opt, abs=1e-9) == 0.5
    assert pytest.approx(metrics.feasible_rate, abs=1e-9) == 0.8
    assert pytest.approx(metrics.p_random, abs=1e-9) == 1.0 / 3.0
    assert len(metrics.top_samples) == 3


def test_verdict_banned_phrases_across_all_levels():
    """Honesty gate: Verdict text for all levels and qaoa=None must contain zero banned phrases."""
    landscape = LandscapeStub(
        selections=np.array([[1, 0], [0, 1]]),
        objectives=np.array([-0.10, 0.05]),
        returns=np.array([0.15, 0.10]),
        variances=np.array([0.02, 0.03]),
        f_min=-0.10,
        f_max=0.05,
        f_mean=-0.025,
        optimum=np.array([1, 0]),
    )
    bf_solver = SolverResultStub(
        solver="brute_force",
        label="Brute force (exact)",
        kind="classical",
        selection=["A"],
        bitstring="10",
        objective=-0.10,
        exp_return=0.15,
        volatility=math.sqrt(0.02),
        variance=0.02,
        txn_cost=0.001,
        feasible=True,
        violations=[],
        runtime_s=0.05,
    )

    # 1. Level 'matched'
    qaoa_matched = SolverResultStub(
        solver="qaoa_standard",
        label="QAOA",
        kind="quantum",
        selection=["A"],
        bitstring="10",
        objective=-0.10,
        exp_return=0.15,
        volatility=math.sqrt(0.02),
        variance=0.02,
        txn_cost=0.001,
        feasible=True,
        violations=[],
        runtime_s=1.2,
    )
    metrics_matched = qaoa_metrics(
        [Sample(bitstring="10", prob=1.0, objective=-0.10, feasible=True, optimal=True)],
        landscape,
    )
    v_matched = verdict([bf_solver, qaoa_matched], landscape, metrics_matched)
    assert v_matched.level == "matched"

    # 2. Level 'near' (gap <= 1%)
    # -0.0995 vs -0.10 -> gap = 0.0005 / 0.10 = 0.005 (0.5%)
    qaoa_near = SolverResultStub(
        solver="qaoa_standard",
        label="QAOA",
        kind="quantum",
        selection=["B"],
        bitstring="01",
        objective=-0.0995,
        exp_return=0.149,
        volatility=0.14,
        variance=0.02,
        txn_cost=0.001,
        feasible=True,
        violations=[],
        runtime_s=1.5,
    )
    v_near = verdict([bf_solver, qaoa_near], landscape, metrics_matched)
    assert v_near.level == "near"

    # 3. Level 'worse' (gap > 1%)
    # -0.08 vs -0.10 -> gap = 0.02 / 0.10 = 0.20 (20%)
    qaoa_worse = SolverResultStub(
        solver="qaoa_standard",
        label="QAOA",
        kind="quantum",
        selection=["B"],
        bitstring="01",
        objective=-0.08,
        exp_return=0.13,
        volatility=0.14,
        variance=0.02,
        txn_cost=0.001,
        feasible=True,
        violations=[],
        runtime_s=1.5,
    )
    v_worse = verdict([bf_solver, qaoa_worse], landscape, metrics_matched)
    assert v_worse.level == "worse"

    # 4. Level 'no-feasible'
    qaoa_infeas = SolverResultStub(
        solver="qaoa_standard",
        label="QAOA",
        kind="quantum",
        selection=None,
        bitstring=None,
        objective=None,
        exp_return=None,
        volatility=None,
        variance=None,
        txn_cost=None,
        feasible=False,
        violations=["no feasible bitstrings"],
        runtime_s=1.1,
    )
    v_no_feas = verdict([bf_solver, qaoa_infeas], landscape, None)
    assert v_no_feas.level == "no-feasible"

    # 5. qaoa = None handling
    v_none = verdict([bf_solver], landscape, None)
    assert v_none.level == "no-feasible"

    # Verify every single verdict text against BANNED_PHRASES
    all_verdicts = [v_matched, v_near, v_worse, v_no_feas, v_none]
    for vd in all_verdicts:
        text_corpus = f"{vd.headline} " + " ".join(vd.details)
        lower_corpus = text_corpus.lower()
        for banned in BANNED_PHRASES:
            assert banned not in lower_corpus, f"Found banned phrase '{banned}' in verdict: {text_corpus}"


def test_continuous_frontier_weights_sum_to_one():
    """Every continuous frontier point has weights summing to 1 and each >= 0."""
    tickers = ["T1", "T2", "T3", "T4"]
    mu = np.array([0.20, 0.16, 0.12, 0.08])
    sigma = np.array([
        [0.04, 0.01, 0.00, 0.00],
        [0.01, 0.05, 0.00, 0.00],
        [0.00, 0.00, 0.03, 0.01],
        [0.00, 0.00, 0.01, 0.02],
    ])
    market = MarketSubsetStub(tickers=tickers, sectors=["S1", "S1", "S2", "S2"], mu=mu, sigma=sigma)

    weights_list = _solve_continuous_weights(market, n_targets=25)
    assert len(weights_list) > 0

    for w, risk, ret in weights_list:
        assert len(w) == 4
        assert pytest.approx(float(np.sum(w)), abs=1e-5) == 1.0
        assert np.all(w >= -1e-6), f"Weights had negative values: {w}"
        assert risk >= 0.0


def test_discrete_pareto_frontier_non_dominated():
    """Every point on the discrete Pareto frontier is strictly non-dominated."""
    tickers = ["A", "B", "C", "D"]
    market = MarketSubsetStub(
        tickers=tickers,
        sectors=["S"] * 4,
        mu=np.array([0.20, 0.15, 0.10, 0.05]),
        sigma=0.04 * np.eye(4),
    )

    # 4 feasible selections with distinct risk and returns
    # p1: risk=0.10, ret=0.20 (best)
    # p2: risk=0.12, ret=0.18 (dominated by p1 since risk is higher and ret is lower)
    # p3: risk=0.08, ret=0.12 (Pareto optimal: lower risk than p1, lower return)
    # p4: risk=0.15, ret=0.10 (dominated by both p1 and p3)
    landscape = LandscapeStub(
        selections=np.array([[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]),
        objectives=np.array([-0.1, -0.05, 0.0, 0.05]),
        returns=np.array([0.20, 0.18, 0.12, 0.10]),
        variances=np.array([0.10**2, 0.12**2, 0.08**2, 0.15**2]),
        f_min=-0.1,
        f_max=0.05,
        f_mean=-0.025,
        optimum=np.array([1, 0, 0, 0]),
    )

    fr = frontier(market, landscape)

    assert len(fr.continuous) == 25
    # Only p1 and p3 should be on the discrete Pareto frontier
    assert len(fr.discrete) == 2
    # Verify non-domination between all returned discrete points
    for i, p_a in enumerate(fr.discrete):
        for j, p_b in enumerate(fr.discrete):
            if i != j:
                # p_b cannot dominate p_a
                b_dominates_a = (
                    p_b["risk"] <= p_a["risk"]
                    and p_b["ret"] >= p_a["ret"]
                    and (p_b["risk"] < p_a["risk"] or p_b["ret"] > p_a["ret"])
                )
                assert not b_dominates_a, f"Point {p_b} dominates {p_a}"


def test_real_nifty50_market_pipeline_integration():
    """U15 integration test on real NIFTY 50 snapshot market data."""
    from qportfolio.classical.annealing import annealing
    from qportfolio.classical.brute_force import brute_force
    from qportfolio.classical.relaxation import relaxation
    from qportfolio.data import build_market
    from tests.test_classical import Problem, build_cardinality_qubo

    # Real 10-asset universe from NIFTY 50 snapshot
    test_tickers = [
        "TCS.NS",
        "INFY.NS",
        "RELIANCE.NS",
        "HDFCBANK.NS",
        "ICICIBANK.NS",
        "ITC.NS",
        "SBIN.NS",
        "LT.NS",
        "BHARTIARTL.NS",
        "HINDUNILVR.NS",
    ]
    market = build_market(test_tickers)
    assert len(market.tickers) == 10

    problem = Problem(
        tickers=market.tickers,
        sectors=market.sectors,
        mu=market.mu,
        sigma=market.sigma,
        k=5,
        q=0.5,
        cost_lin=np.full(10, 0.001187),
        cost_const=0.0005,
        sector_cap=2,
    )

    # 1. Classical baselines
    bf_res, landscape = brute_force(problem)
    assert bf_res.feasible is True
    assert bf_res.runtime_s > 0
    assert len(bf_res.selection) == 5

    rx_res = relaxation(problem)
    assert rx_res.feasible is True
    assert rx_res.runtime_s > 0

    qubo = build_cardinality_qubo(problem, penalty_a=3.0)
    sa_res = annealing(problem, qubo, seed=42, sweeps=1500)
    assert sa_res.runtime_s > 0

    # 2. Frontier
    fr = frontier(market, landscape)
    assert len(fr.continuous) == 25
    assert len(fr.discrete) > 0
    # Discrete frontier must include or match the exact optimum
    discrete_selections = [set(p["selection"]) for p in fr.discrete]
    assert set(bf_res.selection) in discrete_selections

    # 3. QAOA simulated distributions across all 4 levels
    # Case A: Matched
    s_opt = Sample(
        bitstring=bf_res.bitstring,
        prob=0.8,
        objective=bf_res.objective,
        feasible=True,
        optimal=True,
    )
    s_sub = Sample(
        bitstring="0101010101",
        prob=0.2,
        objective=bf_res.objective + 0.01,
        feasible=True,
        optimal=False,
    )
    qaoa_sol_matched = SolverResultStub(
        solver="qaoa_standard",
        label="QAOA",
        kind="quantum",
        selection=bf_res.selection,
        bitstring=bf_res.bitstring,
        objective=bf_res.objective,
        exp_return=bf_res.exp_return,
        volatility=bf_res.volatility,
        variance=bf_res.variance,
        txn_cost=bf_res.txn_cost,
        feasible=True,
        violations=[],
        runtime_s=12.5,
    )
    m_matched = qaoa_metrics([s_opt, s_sub], landscape)
    assert pytest.approx(m_matched.p_random, abs=1e-9) == 1.0 / len(landscape.selections)
    v_matched = verdict([bf_res, rx_res, sa_res, qaoa_sol_matched], landscape, m_matched)
    assert v_matched.level == "matched"

    # Case B: Near (within 1%)
    near_obj = bf_res.objective + 0.005 * abs(bf_res.objective)
    qaoa_sol_near = SolverResultStub(
        solver="qaoa_standard",
        label="QAOA",
        kind="quantum",
        selection=bf_res.selection,
        bitstring=bf_res.bitstring,
        objective=near_obj,
        exp_return=bf_res.exp_return,
        volatility=bf_res.volatility,
        variance=bf_res.variance,
        txn_cost=bf_res.txn_cost,
        feasible=True,
        violations=[],
        runtime_s=12.5,
    )
    v_near = verdict([bf_res, rx_res, sa_res, qaoa_sol_near], landscape, m_matched)
    assert v_near.level == "near"

    # Case C: Worse (> 1%)
    worse_obj = bf_res.objective + 0.10 * abs(bf_res.objective)
    qaoa_sol_worse = SolverResultStub(
        solver="qaoa_standard",
        label="QAOA",
        kind="quantum",
        selection=bf_res.selection,
        bitstring=bf_res.bitstring,
        objective=worse_obj,
        exp_return=bf_res.exp_return,
        volatility=bf_res.volatility,
        variance=bf_res.variance,
        txn_cost=bf_res.txn_cost,
        feasible=True,
        violations=[],
        runtime_s=12.5,
    )
    v_worse = verdict([bf_res, rx_res, sa_res, qaoa_sol_worse], landscape, m_matched)
    assert v_worse.level == "worse"

    # Case D: Infeasible
    s_infeas = [Sample(bitstring="1111111111", prob=1.0, objective=None, feasible=False, optimal=False)]
    m_infeas = qaoa_metrics(s_infeas, landscape)
    qaoa_sol_infeas = SolverResultStub(
        solver="qaoa_standard",
        label="QAOA",
        kind="quantum",
        selection=None,
        bitstring=None,
        objective=None,
        exp_return=None,
        volatility=None,
        variance=None,
        txn_cost=None,
        feasible=False,
        violations=["no feasible sample"],
        runtime_s=10.0,
    )
    v_infeas = verdict([bf_res, rx_res, sa_res, qaoa_sol_infeas], landscape, m_infeas)
    assert v_infeas.level == "no-feasible"

    # Banned phrase check across all generated verdicts
    for v in [v_matched, v_near, v_worse, v_infeas]:
        combined_text = f"{v.headline} " + " ".join(v.details)
        for banned in BANNED_PHRASES:
            assert banned not in combined_text.lower(), f"Banned phrase '{banned}' in verdict: {combined_text}"


def test_constraints_variations_and_honesty():
    """Verify solver and verdict honesty across constraint variations (K, caps, target return, holdings)."""
    from qportfolio.classical.brute_force import brute_force
    from qportfolio.classical.relaxation import relaxation
    from qportfolio.data import build_market
    from tests.test_classical import Problem

    market = build_market(["TCS.NS", "INFY.NS", "RELIANCE.NS", "HDFCBANK.NS", "ICICIBANK.NS", "ITC.NS"])
    n = 6

    # Variation 1: K=3, sector cap=1
    p1 = Problem(
        tickers=market.tickers,
        sectors=market.sectors,
        mu=market.mu,
        sigma=market.sigma,
        k=3,
        q=0.5,
        cost_lin=np.zeros(n),
        cost_const=0.0,
        sector_cap=1,
    )
    bf1, land1 = brute_force(p1)
    rx1 = relaxation(p1)

    assert bf1.feasible is True
    # Every selection in landscape must have at most 1 pick per sector
    for sel in land1.selections:
        ev = p1.evaluate(sel)
        assert ev.feasible is True
        assert len(ev.violations) == 0

    # Variation 2: Target return set
    target_ret = float(np.mean(market.mu))
    p2 = Problem(
        tickers=market.tickers,
        sectors=market.sectors,
        mu=market.mu,
        sigma=market.sigma,
        k=3,
        q=0.5,
        cost_lin=np.zeros(n),
        cost_const=0.0,
        target_return=target_ret,
    )
    bf2, land2 = brute_force(p2)
    # If feasible selections exist, verify target return is satisfied
    if bf2.feasible:
        assert bf2.exp_return >= target_ret - 1e-9

    # Variation 3: Holdings transaction costs
    # Holding TCS.NS and INFY.NS
    cost_lin = np.zeros(n)
    cost_lin[0] = 0.001187  # TCS
    cost_lin[1] = 0.001187  # INFY
    cost_const = 0.0005
    p3 = Problem(
        tickers=market.tickers,
        sectors=market.sectors,
        mu=market.mu,
        sigma=market.sigma,
        k=2,
        q=0.5,
        cost_lin=cost_lin,
        cost_const=cost_const,
    )
    bf3, land3 = brute_force(p3)
    assert bf3.feasible is True
    assert bf3.txn_cost > 0.0
