"""QUBO -> Ising Hamiltonian for QAOA, with x = (1 - Z) / 2."""
from __future__ import annotations

import numpy as np
from qiskit.quantum_info import SparsePauliOp

from qportfolio.qubo.builder import Qubo


def to_sparse_pauli(qubo: Qubo) -> tuple[SparsePauliOp, float, float]:
    """Return (H, offset, scale) with E_qubo(x) == <H>(z) * scale + offset for z_i = 1 - 2*x_i.

    Qubit i is variable i, so the diagonal of H.to_matrix() at integer index b is the energy of the bitstring
    with x_i = (b >> i) & 1. H is divided by its largest |coefficient| so QAOA angles stay on one scale;
    multiply <H> by `scale` and add `offset` to report energies in QUBO units.
    """
    pair = np.triu(qubo.Q + qubo.Q.T, 1)  # weight of x_i x_j for i < j
    lin = qubo.c + np.diag(qubo.Q)  # x_i^2 = x_i
    # x_i = (1 - z_i)/2 and x_i x_j = (1 - z_i - z_j + z_i z_j)/4
    h = -lin / 2 - (pair + pair.T).sum(axis=1) / 4
    J = pair / 4
    offset = float(qubo.const + lin.sum() / 2 + pair.sum() / 4)

    terms = [("Z", [i], v) for i, v in enumerate(h) if v] + [("ZZ", [int(i), int(j)], J[i, j]) for i, j in zip(*np.nonzero(J))]
    scale = float(max(abs(v) for _, _, v in terms))
    return SparsePauliOp.from_sparse_list([(p, idx, v / scale) for p, idx, v in terms], num_qubits=len(qubo.c)), offset, scale
