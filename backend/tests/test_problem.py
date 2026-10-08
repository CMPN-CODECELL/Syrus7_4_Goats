from dataclasses import replace

import numpy as np
import pytest

from qportfolio.problem import Problem

BASE = Problem(
    tickers=["A.NS", "B.NS", "C.NS", "D.NS"],
    sectors=["Tech", "Tech", "Bank", "Bank"],
    mu=np.array([0.10, 0.20, 0.15, 0.05]),
    sigma=np.array([
        [0.04, 0.01, 0.00, 0.00],
        [0.01, 0.09, 0.02, 0.00],
        [0.00, 0.02, 0.16, 0.03],
        [0.00, 0.00, 0.03, 0.25],
    ]),
    k=2,
    q=0.4,
    cost_lin=np.zeros(4),
    cost_const=0.0,
    sector_cap=None,
    target_return=None,
)
PICK_BC = np.array([0, 1, 1, 0])


def test_objective_matches_hand_computation():
    # x'Sx = 0.09 + 0.16 + 2*0.02 = 0.29; mu'x = 0.35
    ev = BASE.evaluate(PICK_BC)
    assert ev.variance == pytest.approx(0.29 / 4)
    assert ev.exp_return == pytest.approx(0.35 / 2)
    assert ev.objective == pytest.approx(0.4 * 0.29 / 4 - 0.6 * 0.35 / 2)  # -0.076
    assert ev.feasible and ev.violations == []


def test_transaction_cost_enters_objective():
    p = replace(BASE, cost_lin=np.full(4, 0.002), cost_const=0.001)
    ev = p.evaluate(PICK_BC)
    assert ev.txn_cost == pytest.approx(0.005)
    assert ev.objective == pytest.approx(0.4 * 0.29 / 4 - 0.6 * (0.175 - 0.005))


def test_k_plus_one_picks_violate_cardinality():
    ev = BASE.evaluate(np.array([1, 1, 1, 0]))
    assert not ev.feasible
    assert ev.violations == ["cardinality: 3 != 2"]


def test_sector_cap_names_the_sector():
    ev = replace(BASE, sector_cap=1).evaluate(np.array([1, 1, 0, 0]))
    assert not ev.feasible
    assert ev.violations == ["sector_cap: Tech 2 > 1"]


def test_target_return_above_net_return_is_infeasible():
    ev = replace(BASE, target_return=0.2).evaluate(PICK_BC)  # net return is 0.175
    assert not ev.feasible
    assert ev.violations == ["target_return: 0.175 < 0.200"]
