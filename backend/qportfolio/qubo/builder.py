"""Assemble one QUBO from the registry: objective terms, then a penalty per constraint row (KTD2, KTD3, KTD5)."""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from qportfolio.problem import Problem
from qportfolio.qubo.constraints import REGISTRY, active_rows

MAX_VARS = 16  # KTD5: the FakeGuadalupeV2 size


def all_states(m: int) -> np.ndarray:
    """(2^m, m) 0/1 table. Variable i is bit i of the row index, matching Qiskit's little-endian basis index."""
    return (np.arange(2**m)[:, None] >> np.arange(m)) & 1


@dataclass
class Qubo:
    """E(x) = x'Qx + c'x + const over m = n_assets + n_slack bits; assets first, then slack."""

    Q: np.ndarray
    c: np.ndarray
    const: float
    n_assets: int
    n_slack: int
    labels: list[str]
    penalties: dict[str, float]

    def energy(self, bits: np.ndarray) -> float:
        b = np.asarray(bits, float)
        return float(b @ self.Q @ b + self.c @ b + self.const)

    def energies_all(self) -> np.ndarray:
        b = all_states(len(self.c)).astype(float)
        return np.einsum("bi,bi->b", b @ self.Q, b) + b @ self.c + self.const


def build_qubo(problem: Problem, penalties: dict[str, float] | None = None) -> Qubo:
    """penalties maps registry names to weights; None tunes them (penalty.tune_penalties)."""
    n = len(problem.tickers)
    rows = active_rows(problem)
    n_slack = sum(len(r.w) for rs in rows.values() for r in rs)
    if n + n_slack > MAX_VARS:
        raise ValueError(f"QUBO needs {n + n_slack} variables ({n} assets + {n_slack} slack bits); the cap is {MAX_VARS}")
    if penalties is None:
        from qportfolio.qubo.penalty import tune_penalties  # penalty.py builds QUBOs, so import late

        penalties = tune_penalties(problem)

    m = n + n_slack
    Q, c, const = np.zeros((m, m)), np.zeros(m), 0.0
    for term in REGISTRY.values():
        if term.kind == "objective":
            Qo, co, k0 = term.build(problem)
            Q[:n, :n] += Qo
            c[:n] += co
            const += k0

    labels = list(problem.tickers)
    for name, rs in rows.items():
        for r in rs:
            v = np.zeros(m)
            v[:n] = r.a
            v[len(labels) : len(labels) + len(r.w)] = r.w
            labels += [f"slack:{r.label}[{k}]" for k in range(len(r.w))]
            g = penalties[name] / r.scale**2
            # g*(v.z - b)^2 with z binary: every pair gets Q_ij + Q_ji = 2*g*v_i*v_j, nothing doubled
            Q += g * np.outer(v, v)
            c -= 2 * g * r.b * v
            const += g * r.b**2

    return Qubo((Q + Q.T) / 2, c, const, n, n_slack, labels, {name: float(penalties[name]) for name in rows})
