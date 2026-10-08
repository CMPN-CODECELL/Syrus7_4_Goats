"""Constraint registry (KTD3). A new constraint is a new REGISTRY entry; the builder and the solvers do not change."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, Literal

import numpy as np

from qportfolio.problem import Problem

Quad = tuple[np.ndarray, np.ndarray, float]  # (Q (n,n), c (n,), const) over the asset bits


@dataclass(frozen=True)
class Row:
    """One linear constraint a.x + w.s = b over the asset bits x and its own slack bits s.

    The builder penalises it as weight * ((a.x + w.s - b) / scale)^2, so `scale` is one unit of violation.
    """

    label: str
    a: np.ndarray
    b: float
    w: np.ndarray  # slack-bit weights; empty for an equality
    scale: float = 1.0


@dataclass(frozen=True)
class Term:
    """kind "objective": build(problem) -> Quad.  kind "equality" / "inequality": build(problem) -> list[Row]."""

    kind: Literal["objective", "equality", "inequality"]
    build: Callable[[Problem], Quad | list[Row]]


def equality(label: str, a: np.ndarray, b: float) -> Row:
    return Row(label, np.asarray(a, float), float(b), np.zeros(0))


def inequality(label: str, a: np.ndarray, b: float, bits: int, step: float = 1.0, scale: float = 1.0) -> Row:
    """a.x <= b, made an equality with `bits` slack bits of weights step * 2^k."""
    return Row(label, np.asarray(a, float), float(b), step * 2.0 ** np.arange(bits), scale)


def _risk(p: Problem) -> Quad:
    return p.q * p.sigma / p.k**2, np.zeros(len(p.tickers)), 0.0


def _expected_return(p: Problem) -> Quad:
    return np.zeros_like(p.sigma), -(1 - p.q) * p.mu / p.k, 0.0


def _txn_cost(p: Problem) -> Quad:  # tc(x) = cost_lin.x + cost_const enters F as +(1 - q) * tc(x)
    return np.zeros_like(p.sigma), (1 - p.q) * p.cost_lin, (1 - p.q) * p.cost_const


def _cardinality(p: Problem) -> list[Row]:
    return [equality("cardinality", np.ones(len(p.tickers)), p.k)]


def _sector_cap(p: Problem) -> list[Row]:
    if p.sector_cap is None:
        return []
    cap = int(p.sector_cap)
    rows = []
    for s in dict.fromkeys(p.sectors):
        a = np.array([t == s for t in p.sectors], float)
        if a.sum() > cap:  # bit_length(cap) == ceil(log2(cap + 1)), exactly
            rows.append(inequality(f"sector_cap:{s}", a, cap, bits=cap.bit_length()))
    return rows


def _target_return(p: Problem) -> list[Row]:
    if p.target_return is None:
        return []
    a = p.cost_lin - p.mu / p.k  # net return >= R  <=>  a.x <= -R - cost_const
    b = -p.target_return - p.cost_const
    span = max(b - np.sort(a)[: p.k].sum(), 1e-9)  # largest slack any K-pick can need
    step = span / 7  # 3 bits cover 0..7 steps
    return [inequality("target_return", a, b, bits=3, step=step, scale=step)]


REGISTRY: dict[str, Term] = {
    "risk": Term("objective", _risk),
    "return": Term("objective", _expected_return),
    "txn_cost": Term("objective", _txn_cost),
    "cardinality": Term("equality", _cardinality),
    "sector_cap": Term("inequality", _sector_cap),
    "target_return": Term("inequality", _target_return),
}


def active_rows(problem: Problem) -> dict[str, list[Row]]:
    """Rows of every constraint entry that applies to this problem, keyed by registry name."""
    rows = {name: t.build(problem) for name, t in REGISTRY.items() if t.kind != "objective"}
    return {name: r for name, r in rows.items() if r}
