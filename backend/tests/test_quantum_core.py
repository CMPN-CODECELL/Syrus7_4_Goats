"""U6 core: QAOA ansatz, optimisers, initial-point strategies (no sampling/decoding; that is qaoa.solve)."""
from __future__ import annotations

from itertools import combinations

import numpy as np
import pytest
from qiskit.primitives import StatevectorEstimator, StatevectorSampler
from qiskit.quantum_info import SparsePauliOp, Statevector, state_fidelity

from qportfolio.quantum import ansatz, init_points, optimizers


def make_ising(n: int, seed: int = 1) -> SparsePauliOp:
    """Random Ising Hamiltonian (copied from backend/scripts/smoke.py)."""
    rng = np.random.default_rng(seed)
    terms = []
    for i, j in combinations(range(n), 2):
        if rng.random() < 0.7:
            terms.append(("ZZ", [i, j], float(rng.normal())))
    for i in range(n):
        terms.append(("Z", [i], float(rng.normal())))
    return SparsePauliOp.from_sparse_list(terms, num_qubits=n)


def energy_fn(circ, H):
    est = StatevectorEstimator()
    return lambda x: float(est.run([(circ, H, x)]).result()[0].data.evs)


def sample_counts(circ, x, shots=2048, seed=7):
    meas = circ.copy()
    meas.measure_all()
    res = StatevectorSampler(default_shots=shots, seed=seed).run([meas.assign_parameters(x)]).result()
    return res[0].data.meas.get_counts()


# --------------------------------------------------------------------------
# ansatz
# --------------------------------------------------------------------------
def test_standard_ansatz_is_flat_with_four_params():
    circ = ansatz.build(make_ising(6), reps=2, variant="standard", n_assets=6, k=3)
    assert circ.num_qubits == 6
    assert circ.num_parameters == 4
    assert not set(circ.count_ops()) & {"QAOA", "PauliEvolution"}
    gp, bp = ansatz.split_params(circ)
    assert len(gp) == 2 and len(bp) == 2


@pytest.mark.parametrize("variant,reps", [("standard", 11), ("xy", 11)])
def test_values_bind_by_parameter_not_position(variant, reps):
    # reps=11 makes name-sorting ('β[10]' < 'β[2]') differ from layer order
    circ = ansatz.build(make_ising(4), reps=reps, variant=variant, n_assets=4, k=2)
    gp, bp = ansatz.split_params(circ)
    assert [p.index for p in gp] == list(range(reps))
    assert [p.index for p in bp] == list(range(reps))
    gammas = np.arange(reps) + 0.25
    betas = -(np.arange(reps) + 0.5)
    x = ansatz.assemble_values(circ, gammas, betas)
    bound = dict(zip(circ.parameters, x))
    assert [bound[p] for p in gp] == list(gammas)
    assert [bound[p] for p in bp] == list(betas)
    g2, b2 = ansatz.split_values(circ, x)
    np.testing.assert_array_equal(g2, gammas)
    np.testing.assert_array_equal(b2, betas)


def test_assemble_values_rejects_wrong_depth():
    circ = ansatz.build(make_ising(4), reps=2, variant="standard", n_assets=4, k=2)
    with pytest.raises(ValueError):
        ansatz.assemble_values(circ, np.zeros(3), np.zeros(3))


@pytest.mark.parametrize("n_slack", [0, 2])
def test_xy_ansatz_keeps_hamming_weight_k(n_slack):
    n_assets, k, reps = 6, 3, 2
    circ = ansatz.build(make_ising(n_assets + n_slack, seed=3), reps=reps, variant="xy", n_assets=n_assets, k=k)
    assert circ.num_qubits == n_assets + n_slack
    assert circ.num_parameters == 2 * reps  # one shared beta per layer, slack RX uses the same beta
    assert not set(circ.count_ops()) & {"QAOA", "PauliEvolution"}
    x = ansatz.assemble_values(circ, *init_points.random(reps, seed=5))
    counts = sample_counts(circ, x)
    assert sum(counts.values()) == 2048
    for bs, c in counts.items():
        assert bs[len(bs) - n_assets :].count("1") == k, (bs, c)  # qubit 0 is the rightmost char
    if n_slack:  # slack qubits start in |+>, so they must actually vary
        assert len({bs[:n_slack] for bs in counts}) > 1


@pytest.mark.parametrize("n,k", [(5, 2), (6, 3), (4, 1)])
def test_dicke_circuit_matches_uniform_weight_k_state(n, k):
    amp = np.array([1.0 if bin(i).count("1") == k else 0.0 for i in range(2**n)])
    ideal = Statevector(amp / np.linalg.norm(amp))
    assert state_fidelity(Statevector(ansatz.dicke_circuit(n, k)), ideal) > 1 - 1e-9


# --------------------------------------------------------------------------
# optimisers
# --------------------------------------------------------------------------
class Stop(Exception):
    pass


ALL_OPTS = [optimizers.cobyla, optimizers.nelder_mead, optimizers.spsa]


def test_cobyla_lowers_qaoa_energy_and_history_matches_nfev():
    H = make_ising(6)
    circ = ansatz.build(H, reps=2, variant="standard", n_assets=6, k=3)
    x0 = ansatz.assemble_values(circ, *init_points.random(2, seed=0))
    res = optimizers.cobyla(energy_fn(circ, H), x0, maxiter=60)
    assert res.fun < res.history[0]
    assert len(res.history) == res.nfev
    assert res.nfev <= 60
    assert res.x.shape == x0.shape


@pytest.mark.parametrize("opt", ALL_OPTS)
def test_callback_sees_every_evaluation(opt):
    seen = []
    res = opt(
        lambda x: float(np.sum((x - 1.0) ** 2)),
        np.zeros(3),
        40,
        callback=lambda it, e, x: seen.append((it, e, np.array(x))),
        seed=1,
    )
    assert [s[0] for s in seen] == list(range(1, res.nfev + 1))
    assert [s[1] for s in seen] == res.history
    assert res.nfev == len(res.history) <= 40
    assert res.fun == pytest.approx(float(np.sum((res.x - 1.0) ** 2)))


@pytest.mark.parametrize("opt", ALL_OPTS)
def test_callback_exception_stops_optimiser_and_propagates(opt):
    calls = []

    def fun(x):
        calls.append(1)
        return float(np.sum((x - 1.0) ** 2))

    def cb(it, energy, params):
        if it == 3:
            raise Stop

    with pytest.raises(Stop):
        opt(fun, np.zeros(3), 50, callback=cb, seed=1)
    assert len(calls) == 3


def test_spsa_is_deterministic_for_fixed_seed():
    f = lambda x: float(np.sum((x - 1.0) ** 2))  # noqa: E731
    a = optimizers.spsa(f, np.zeros(4), 60, seed=3)
    b = optimizers.spsa(f, np.zeros(4), 60, seed=3)
    c = optimizers.spsa(f, np.zeros(4), 60, seed=4)
    np.testing.assert_array_equal(a.x, b.x)
    assert a.history == b.history
    assert not np.array_equal(a.x, c.x)


def test_spsa_reduces_a_smooth_objective():
    res = optimizers.spsa(lambda x: float(np.sum((x - 1.0) ** 2)), np.zeros(4), 100, seed=3)
    assert res.fun < 0.5 * res.history[0]


# --------------------------------------------------------------------------
# init points
# --------------------------------------------------------------------------
def test_random_is_seeded_and_in_range():
    g1, b1 = init_points.random(4, seed=11)
    g2, b2 = init_points.random(4, seed=11)
    np.testing.assert_array_equal(g1, g2)
    np.testing.assert_array_equal(b1, b2)
    assert g1.shape == b1.shape == (4,)
    assert np.all((0 <= g1) & (g1 <= np.pi)) and np.all((0 <= b1) & (b1 <= np.pi / 2))


def test_ramp_gamma_up_beta_down():
    g, b = init_points.ramp(3)
    assert np.all(np.diff(g) > 0) and np.all(np.diff(b) < 0)
    np.testing.assert_allclose(g, [0.125, 0.375, 0.625])
    np.testing.assert_allclose(b, [0.625, 0.375, 0.125])


def test_interp_p1_to_p2_matches_zhou_formula():
    g, b = init_points.interp(np.array([0.4]), np.array([0.3]))
    # new[i] = (i/p) old[i-1] + ((p-i)/p) old[i], old[-1] = old[p] = 0, p = 1
    np.testing.assert_allclose(g, [0.4, 0.4])
    np.testing.assert_allclose(b, [0.3, 0.3])


def test_interp_p3_to_p4_matches_zhou_formula():
    g, b = init_points.interp(np.array([0.0, 0.3, 0.9]), np.array([0.9, 0.3, 0.0]))
    np.testing.assert_allclose(g, [0.0, 0.2, 0.5, 0.9])
    np.testing.assert_allclose(b, [0.9, 0.5, 0.2, 0.0])
