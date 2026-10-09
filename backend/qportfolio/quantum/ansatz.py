"""QAOA ansatz builders (standard and XY/Dicke), flattened for fast V2-primitive evaluation.

Patterns are the verified ones from backend/scripts/smoke.py (checks a and c) and docs/research/08-env-spike.md.

Parameters are bound by ``Parameter`` object, never by position: use ``split_params`` /
``assemble_values`` / ``split_values`` to go between (gammas, betas) arrays and the value array
that ``StatevectorEstimator`` / ``assign_parameters`` expect (``circuit.parameters`` order).
"""
from __future__ import annotations

from typing import Literal

import numpy as np
from qiskit import QuantumCircuit
from qiskit.circuit import Parameter
from qiskit.circuit.library import QAOAAnsatz, RYGate, XXPlusYYGate
from qiskit.quantum_info import SparsePauliOp

_GAMMA = "γ"
_BETA = "β"


def flatten(circ: QuantumCircuit) -> QuantumCircuit:
    """Decompose until no composite QAOA / PauliEvolution blocks remain.

    PERF + COMPAT: StatevectorEstimator on the raw QAOAAnsatz (PauliEvolutionGate) is ~25x slower
    and Aer primitives reject it ('unknown instruction: QAOA').
    """
    for _ in range(6):
        if not set(circ.count_ops()) & {"QAOA", "PauliEvolution"}:
            break
        circ = circ.decompose()
    return circ


def dicke_circuit(n: int, k: int) -> QuantumCircuit:
    """Deterministic Dicke state |D^n_k> (Baertschi & Eidenbenz 2019), O(nk) gates."""

    def gate_i(qc: QuantumCircuit, m: int) -> None:
        qc.cx(m - 2, m - 1)
        qc.cry(2 * np.arccos(np.sqrt(1 / m)), m - 1, m - 2)
        qc.cx(m - 2, m - 1)

    def gate_ii(qc: QuantumCircuit, m: int, l: int) -> None:
        qc.cx(m - l - 1, m - 1)
        theta = 2 * np.arccos(np.sqrt(l / m))
        qc.append(RYGate(theta).control(2, annotated=False), [m - 1, m - l, m - l - 1])
        qc.cx(m - l - 1, m - 1)

    def scs(qc: QuantumCircuit, m: int, kk: int) -> None:
        gate_i(qc, m)
        for l in range(2, kk + 1):
            gate_ii(qc, m, l)

    qc = QuantumCircuit(n, name=f"Dicke({n},{k})")
    qc.x(range(n - k, n))
    for m in range(n, k, -1):
        scs(qc, m, k)
    for m in range(k, 1, -1):
        scs(qc, m, m - 1)
    return qc


def _ring_pairs(n: int) -> list[tuple[int, int]]:
    """Ring pairs ordered (even layer)(odd layer)(closing pair); pairs inside a layer commute."""
    pairs = [(i, i + 1) for i in range(0, n - 1, 2)] + [(i, i + 1) for i in range(1, n - 1, 2)]
    if n > 2:
        pairs.append((n - 1, 0))
    return pairs


def build(
    H: SparsePauliOp,
    reps: int,
    variant: Literal["standard", "xy"],
    n_assets: int,
    k: int,
) -> QuantumCircuit:
    """Flattened parameterised QAOA circuit for cost operator ``H`` (asset qubits first, then slack)."""
    if variant == "standard":
        circ = QAOAAnsatz(cost_operator=H, reps=reps)
    elif variant == "xy":
        m = H.num_qubits
        slack = list(range(n_assets, m))
        init = QuantumCircuit(m, name="DickeInit")
        init.compose(dicke_circuit(n_assets, k), list(range(n_assets)), inplace=True)
        if slack:
            init.h(slack)
        beta = Parameter("beta_xy")  # one shared beta per layer; QAOAAnsatz replicates it as β[0..reps-1]
        mix = QuantumCircuit(m, name="XYmixer")
        for i, j in _ring_pairs(n_assets):
            mix.append(XXPlusYYGate(2 * beta, 0.0), [i, j])
        if slack:
            mix.rx(2 * beta, slack)
        circ = QAOAAnsatz(cost_operator=H, reps=reps, initial_state=init, mixer_operator=mix)
    else:
        raise ValueError(f"unknown ansatz variant {variant!r}")
    return flatten(circ)


def split_params(circuit: QuantumCircuit) -> tuple[list[Parameter], list[Parameter]]:
    """(gammas, betas) Parameter objects, each ordered by layer index."""
    gammas = sorted((p for p in circuit.parameters if p.vector.name == _GAMMA), key=lambda p: p.index)
    betas = sorted((p for p in circuit.parameters if p.vector.name == _BETA), key=lambda p: p.index)
    return gammas, betas


def assemble_values(circuit: QuantumCircuit, gammas, betas) -> np.ndarray:
    """Value array aligned with ``circuit.parameters`` from per-layer gamma and beta arrays."""
    gp, bp = split_params(circuit)
    if len(gp) != len(gammas) or len(bp) != len(betas):
        raise ValueError(
            f"circuit has {len(gp)} gammas / {len(bp)} betas, got {len(gammas)} / {len(betas)}"
        )
    by_param = {**dict(zip(gp, gammas)), **dict(zip(bp, betas))}
    return np.array([by_param[p] for p in circuit.parameters], dtype=float)


def split_values(circuit: QuantumCircuit, x) -> tuple[np.ndarray, np.ndarray]:
    """Inverse of ``assemble_values``: a value array in ``circuit.parameters`` order -> (gammas, betas)."""
    by_param = dict(zip(circuit.parameters, np.asarray(x, dtype=float)))
    gp, bp = split_params(circuit)
    return np.array([by_param[p] for p in gp]), np.array([by_param[p] for p in bp])
