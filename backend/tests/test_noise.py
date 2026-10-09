"""U7 circuit-level noise layer: FakeGuadalupeV2 noisy sampling / energy vs the ideal simulators."""
from __future__ import annotations

from itertools import combinations

import numpy as np
import pytest
from qiskit.circuit.library import QAOAAnsatz
from qiskit.primitives import StatevectorEstimator
from qiskit.quantum_info import SparsePauliOp

from qportfolio.quantum import noise

SHOTS = 4096
SEED = 7


def make_ising(n: int, seed: int = 1) -> SparsePauliOp:
    """Random Ising Hamiltonian: ZZ couplings (dense-ish) + Z fields (as in scripts/smoke.py)."""
    rng = np.random.default_rng(seed)
    terms = []
    for i, j in combinations(range(n), 2):
        if rng.random() < 0.7:
            terms.append(("ZZ", [i, j], float(rng.normal())))
    for i in range(n):
        terms.append(("Z", [i], float(rng.normal())))
    return SparsePauliOp.from_sparse_list(terms, num_qubits=n)


def flatten(circ):
    """Decompose until no composite QAOA / PauliEvolution blocks remain (Aer rejects them)."""
    for _ in range(6):
        if not set(circ.count_ops()) & {"QAOA", "PauliEvolution"}:
            break
        circ = circ.decompose()
    return circ


def tv_distance(a: dict[str, int], b: dict[str, int]) -> float:
    na, nb = sum(a.values()), sum(b.values())
    return 0.5 * sum(abs(a.get(k, 0) / na - b.get(k, 0) / nb) for k in set(a) | set(b))


@pytest.fixture(scope="module")
def inst6():
    H = make_ising(6)
    circ = flatten(QAOAAnsatz(cost_operator=H, reps=1))
    values = np.array([0.45, 0.8])  # p=1 -> two parameters
    assert circ.num_parameters == len(values)
    return H, circ, values


def test_backend_is_built_once():
    first = noise.backend()
    second = noise.backend()
    assert first is second
    fake, nm, pm = first
    assert noise.BACKEND_NAME == "FakeGuadalupeV2"
    assert fake.num_qubits == 16
    assert nm is not None and pm is not None


def test_noisy_energy_differs_from_ideal_and_is_finite(inst6):
    H, circ, values = inst6
    e_ideal = float(StatevectorEstimator().run([(circ, H, values)]).result()[0].data.evs)
    energy = noise.make_noisy_energy(circ, H)
    e_noisy = energy(values)
    assert isinstance(e_noisy, float)
    assert np.isfinite(e_noisy)
    assert abs(e_noisy - e_ideal) > 1e-6
    assert abs(e_noisy - e_ideal) < 0.5  # same ballpark: noise perturbs the energy, parameters are not scrambled


def test_sample_noisy_counts_sum_to_shots_with_6_char_keys(inst6):
    _, circ, values = inst6
    counts = noise.sample_noisy(circ, values, SHOTS, SEED)
    assert sum(counts.values()) == SHOTS
    assert all(len(k) == 6 and set(k) <= {"0", "1"} for k in counts)


def test_sample_noisy_is_reproducible_for_a_fixed_seed(inst6):
    _, circ, values = inst6
    assert noise.sample_noisy(circ, values, 512, SEED) == noise.sample_noisy(circ, values, 512, SEED)


def test_noisy_and_ideal_distributions_differ(inst6):
    _, circ, values = inst6
    ideal = noise.sample_ideal(circ, values, SHOTS, SEED)
    noisy = noise.sample_noisy(circ, values, SHOTS, SEED)
    assert sum(ideal.values()) == SHOTS
    assert all(len(k) == 6 for k in ideal)
    assert tv_distance(noisy, ideal) > 0
    # the gap exceeds plain shot noise (two ideal runs with different seeds)
    assert tv_distance(noisy, ideal) > tv_distance(ideal, noise.sample_ideal(circ, values, SHOTS, SEED + 1))


def test_transpile_stats_reports_positive_depth_and_two_qubit_gates(inst6):
    _, circ, _ = inst6
    stats = noise.transpile_stats(circ)
    assert set(stats) == {"depth", "two_qubit_gates", "qubits"}
    assert stats["depth"] > 0
    assert stats["two_qubit_gates"] > 0
    assert stats["qubits"] <= 16


def test_16_qubit_circuit_transpiles_and_samples():
    n = 16
    H = make_ising(n)
    circ = flatten(QAOAAnsatz(cost_operator=H, reps=1))
    values = np.array([0.45, 0.8])
    stats = noise.transpile_stats(circ)
    assert 0 < stats["qubits"] <= 16
    counts = noise.sample_noisy(circ, values, 256, SEED)
    assert sum(counts.values()) == 256
    assert all(len(k) == n for k in counts)
