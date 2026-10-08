"""U5: QUBO builder, constraint registry, penalty tuning, Ising conversion."""
from __future__ import annotations

import math
import time
from itertools import combinations

import numpy as np
import pytest

from qportfolio.problem import Problem
from qportfolio.qubo.builder import build_qubo
from qportfolio.qubo.constraints import REGISTRY, Term, equality
from qportfolio.qubo.ising import to_sparse_pauli
from qportfolio.qubo.penalty import tune_penalties


def make_problem(n=6, k=3, *, sectors=None, cap=None, target=None, q=0.5, seed=0, zero=False) -> Problem:
    rng = np.random.default_rng(seed)
    a = rng.normal(size=(n, n)) * 0.15
    z = np.zeros(n)
    return Problem(
        tickers=[f"T{i}.NS" for i in range(n)],
        sectors=sectors or [f"S{i}" for i in range(n)],
        mu=z if zero else rng.uniform(0.03, 0.25, n),
        sigma=np.zeros((n, n)) if zero else a @ a.T + 0.01 * np.eye(n),
        k=k,
        q=q,
        cost_lin=z if zero else rng.uniform(0.0, 0.004, n),
        cost_const=0.0 if zero else 0.002,
        sector_cap=cap,
        target_return=target,
    )


def states(m: int) -> np.ndarray:
    """All 2^m bit rows; variable i is bit i of the row index (Qiskit's little-endian index)."""
    return (np.arange(2**m)[:, None] >> np.arange(m)) & 1


def median_net(p: Problem) -> float:
    nets = []
    for sel in combinations(range(len(p.tickers)), p.k):
        ev = p.evaluate(np.isin(np.arange(len(p.tickers)), sel).astype(float))
        nets.append(ev.exp_return - ev.txn_cost)
    return float(np.median(nets))


def best_over_slack(qubo) -> np.ndarray:
    """Per asset selection, the lowest energy over all slack settings (slack sits above the asset bits)."""
    return qubo.energies_all().reshape(-1, 2**qubo.n_assets).min(axis=0)


SECTORS8 = ["A", "A", "A", "B", "B", "C", "C", "D"]


@pytest.mark.parametrize("k", [2, 3, 5])
def test_cardinality_penalty_is_not_double_counted(k):
    a = 1.7
    qubo = build_qubo(make_problem(6, k, zero=True), {"cardinality": a})
    pop = states(6).sum(axis=1)
    np.testing.assert_allclose(qubo.energies_all(), a * (pop - k) ** 2, atol=1e-12)
    assert set(np.flatnonzero(qubo.energies_all() == qubo.energies_all().min())) == set(np.flatnonzero(pop == k))
    pair = qubo.Q[0, 1] + qubo.Q[1, 0]
    assert pair == pytest.approx(2 * a)  # the reference repo wrote 4A here


def test_qubo_is_symmetric_with_labels_assets_first():
    p = make_problem(8, 3, sectors=SECTORS8, cap=2, target=median_net(make_problem(8, 3)))
    qubo = build_qubo(p, dict.fromkeys(["cardinality", "sector_cap", "target_return"], 2.0))
    m = qubo.n_assets + qubo.n_slack
    assert qubo.Q.shape == (m, m) and qubo.c.shape == (m,)
    np.testing.assert_allclose(qubo.Q, qubo.Q.T, atol=1e-15)
    assert qubo.labels[: qubo.n_assets] == p.tickers and len(qubo.labels) == m
    assert qubo.n_slack == 2 + 3  # sector A (3 candidates > cap 2) + the 3-bit return slack


@pytest.mark.parametrize("extras", [False, True])
def test_ising_energy_matches_qubo_for_every_state(extras):
    base = make_problem(6, 3)
    p = make_problem(6, 3, sectors=["A", "A", "A", "B", "B", "C"], cap=2, target=median_net(base)) if extras else base
    pens = dict.fromkeys(["cardinality", "sector_cap", "target_return"] if extras else ["cardinality"], 0.9)
    qubo = build_qubo(p, pens)
    m = qubo.n_assets + qubo.n_slack
    H, offset, scale = to_sparse_pauli(qubo)

    assert H.num_qubits == m
    assert np.abs(H.coeffs).max() == pytest.approx(1.0)
    diag = H.to_matrix(sparse=True).diagonal().real
    energies = qubo.energies_all()
    np.testing.assert_allclose(diag * scale + offset, energies, atol=1e-9)
    # energy() agrees with the vectorised energies_all() on every state
    np.testing.assert_allclose([qubo.energy(b) for b in states(m)], energies, atol=1e-12)


@pytest.mark.parametrize("with_target", [False, True])
def test_qubo_energy_equals_objective_at_best_slack(with_target):
    base = make_problem(7, 3, seed=3)
    p = make_problem(7, 3, sectors=SECTORS8[:7], cap=2, target=median_net(base) if with_target else None, seed=3)
    w = 3.0
    qubo = build_qubo(p, dict.fromkeys(["cardinality", "sector_cap", "target_return"], w))
    assert qubo.n_slack == (5 if with_target else 2)
    best = best_over_slack(qubo)

    n_feasible = 0
    for sel, x in enumerate(states(7)):
        ev = p.evaluate(x)
        assert best[sel] >= ev.objective - 1e-9  # a penalty never lowers the energy
        if ev.feasible:
            n_feasible += 1
            # integer slack is exact; the 3-bit return slack leaves at most (step/2)^2 per unit weight
            assert best[sel] - ev.objective <= (w / 4 if with_target else 0.0) + 1e-9
        elif not with_target:
            assert best[sel] >= ev.objective + w - 1e-9  # integer violations cost at least one unit
    assert n_feasible > 0


def test_tuned_penalty_clears_the_infeasible_threshold():
    base = make_problem(8, 3, seed=5)
    p = make_problem(8, 3, sectors=SECTORS8, cap=2, target=median_net(base), seed=5)
    pens = tune_penalties(p)
    assert set(pens) == {"cardinality", "sector_cap", "target_return"}
    assert build_qubo(p).penalties == pens  # penalties=None means tuned

    evals = [p.evaluate(x) for x in states(8)]
    feas = np.array([e.feasible for e in evals])
    f = np.array([e.objective for e in evals])
    threshold = 0.5 * (f[feas].min() + f[feas].mean())

    assert best_over_slack(build_qubo(p, pens))[~feas].min() >= threshold - 1e-9
    lam = pens["cardinality"]
    if lam > 0.6 * (f[feas].max() - f[feas].min()):  # above the first rung (0.5x spread), so the rung below must fail
        half = {k: v / 2 for k, v in pens.items()}
        assert best_over_slack(build_qubo(p, half))[~feas].min() < threshold


def test_tuning_with_no_feasible_selection_raises():
    p = make_problem(6, 3, target=10.0)
    with pytest.raises(ValueError, match="feasible"):
        tune_penalties(p)


def test_registering_a_constraint_needs_no_builder_or_solver_change(monkeypatch):
    p = make_problem(6, 3)
    banned = np.eye(6)[1]  # "exclude ticker T1.NS"
    monkeypatch.setitem(REGISTRY, "exclude_ticker", Term("equality", lambda _: [equality("exclude T1.NS", banned, 0.0)]))

    qubo = build_qubo(p)
    assert "exclude_ticker" in qubo.penalties and qubo.n_slack == 0
    heavy = {**qubo.penalties, "exclude_ticker": 1e3}
    e = build_qubo(p, heavy).energies_all()
    assert states(6)[int(np.argmin(e))][1] == 0


@pytest.mark.parametrize("cap", range(1, 8))
def test_sector_cap_slack_bits_are_ceil_log2(cap):
    n = cap + 1 + 2
    sectors = ["A"] * (cap + 1) + ["B", "C"]  # only A has more candidates than the cap
    qubo = build_qubo(make_problem(n, 2, sectors=sectors, cap=cap), {"cardinality": 1.0, "sector_cap": 1.0})
    assert qubo.n_slack == math.ceil(math.log2(cap + 1))
    assert all(label.startswith("slack:sector_cap:A") for label in qubo.labels[n:])


def test_sector_at_or_below_the_cap_gets_no_slack():
    qubo = build_qubo(make_problem(3, 2, sectors=["A", "A", "B"], cap=2), {"cardinality": 1.0, "sector_cap": 1.0})
    assert qubo.n_slack == 0


def test_more_than_16_variables_raises_naming_the_count():
    p = make_problem(15, 3, sectors=["A"] * 5 + [f"S{i}" for i in range(10)], cap=3)  # 15 + 2 slack bits = 17
    with pytest.raises(ValueError, match="17"):
        build_qubo(p, {"cardinality": 1.0, "sector_cap": 1.0})


def test_twelve_asset_build_with_caps_target_and_tuning_is_fast():
    n = 12
    sectors = ["A", "A"] + [f"S{i}" for i in range(n - 2)]
    p = make_problem(n, 4, sectors=sectors, cap=1, seed=9)
    p.target_return = median_net(p)
    times = []
    for _ in range(3):  # best of three: the first call pays one-off numpy/import costs, and CI boxes are noisy
        t0 = time.perf_counter()
        qubo = build_qubo(p)
        times.append(time.perf_counter() - t0)
    assert min(times) < 1.0
    assert qubo.n_assets + qubo.n_slack == 16
