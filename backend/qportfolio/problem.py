"""The portfolio problem and its single exact judge (CONTRACTS.md 1.1). Never re-implement either elsewhere."""
from __future__ import annotations

from collections import Counter
from dataclasses import dataclass

import numpy as np


@dataclass
class Evaluation:
    objective: float  # F(x) = q*x'Σx/K² − (1−q)*(μ'x/K − tc(x)), no penalties
    exp_return: float  # μ'x/K
    variance: float  # x'Σx/K²
    txn_cost: float  # tc(x) = cost_lin·x + cost_const
    feasible: bool
    violations: list[str]


@dataclass
class Problem:
    tickers: list[str]
    sectors: list[str]
    mu: np.ndarray  # (n,) annualised expected log return
    sigma: np.ndarray  # (n, n) annualised covariance
    k: int
    q: float  # risk aversion in [0, 1]
    cost_lin: np.ndarray  # (n,) fraction of capital
    cost_const: float
    sector_cap: int | None
    target_return: float | None  # min net (after cost) return of the equal-weight pick

    def evaluate(self, x: np.ndarray) -> Evaluation:
        x = np.asarray(x, dtype=float)
        exp_return = float(self.mu @ x / self.k)
        variance = float(x @ self.sigma @ x / self.k**2)
        txn_cost = float(self.cost_lin @ x + self.cost_const)
        objective = self.q * variance - (1 - self.q) * (exp_return - txn_cost)

        violations = []
        picked = int(x.sum())
        if picked != self.k:
            violations.append(f"cardinality: {picked} != {self.k}")
        if self.sector_cap is not None:
            per_sector = Counter(s for s, xi in zip(self.sectors, x) if xi)
            violations += [f"sector_cap: {s} {n} > {self.sector_cap}"
                           for s, n in per_sector.items() if n > self.sector_cap]
        net = exp_return - txn_cost
        if self.target_return is not None and net < self.target_return:
            violations.append(f"target_return: {net:.3f} < {self.target_return:.3f}")
        return Evaluation(objective, exp_return, variance, txn_cost, not violations, violations)
