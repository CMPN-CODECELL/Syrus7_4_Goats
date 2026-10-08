"""Declared pre-screen ranking NIFTY 50 assets to fit quantum hardware budget.

Ranks candidates by estimation-window Sharpe ratio, enforces sector candidate caps,
and balances asset and slack qubits to satisfy the target qubit budget.
"""
from __future__ import annotations

import math
from collections import Counter
from dataclasses import dataclass

import numpy as np

from qportfolio.data.risk import RF, Market


@dataclass
class QubitsInfo:
    """Breakdown of variables between asset picks and constraint slack bits."""

    assets: int
    slack: int
    total: int


@dataclass
class ScreenInfo:
    """Pre-screen outcome and explanation matching TEAMS/CONTRACTS.md §2.4."""

    applied: bool
    rule: str
    kept: list[str]
    dropped: list[str]
    qubits: QubitsInfo


def prescreen(
    market: Market,
    k: int,
    qubit_budget: int = 16,
    sector_cap: int | None = None,
    rf: float = RF,
) -> ScreenInfo:
    """Pre-screen assets by estimation-window Sharpe ratio to fit within qubit budget.

    Args:
        market: Verified Market from build_market (estimation window only).
        k: Portfolio cardinality target.
        qubit_budget: Available qubit cap (defaults to 16).
        sector_cap: Maximum picks permitted per sector (None = unconstrained).
        rf: Risk-free rate for Sharpe ratio calculation (defaults to RF=0.0557).

    Returns:
        ScreenInfo: Contains kept and dropped tickers, slack calculation, and rule description.

    Raises:
        ValueError: If remaining assets after screening cannot satisfy cardinality K.
    """
    tickers = market.tickers
    n_assets = len(tickers)

    if n_assets == 0:
        raise ValueError("Cannot screen empty market universe")

    # 1. Map tickers to sectors
    ticker_sector = {t: market.sectors[i] for i, t in enumerate(tickers)}

    # 2. Compute estimation-window Sharpe ratio for each ticker
    sharpes: dict[str, float] = {}
    for i, t in enumerate(tickers):
      mu_i = float(market.mu[i])
      var_i = float(market.sigma[i, i])
      vol_i = math.sqrt(max(var_i, 1e-12))
      sharpes[t] = (mu_i - rf) / vol_i

    # Sort descending by Sharpe ratio
    sorted_tickers = sorted(tickers, key=lambda t: sharpes[t], reverse=True)

    # 3. Helper to calculate slack bits for sector cap inequality constraints
    def _compute_slack(candidate_list: list[str]) -> int:
        if sector_cap is None:
            return 0
        counts = Counter(ticker_sector[t] for t in candidate_list)
        # Each sector with candidates > sector_cap needs ceil(log2(sector_cap + 1)) slack bits
        bits_per_constrained_sector = math.ceil(math.log2(sector_cap + 1))
        return sum(
            bits_per_constrained_sector
            for count in counts.values()
            if count > sector_cap
        )

    # 4. Check if the universe already fits without pre-screening
    full_slack = _compute_slack(tickers)
    if n_assets + full_slack <= qubit_budget:
        return ScreenInfo(
            applied=False,
            rule="",
            kept=[],
            dropped=[],
            qubits=QubitsInfo(
                assets=n_assets,
                slack=full_slack,
                total=n_assets + full_slack,
            ),
        )

    # 5. Apply sector candidate cap: keep at most sector_cap + 1 per sector
    if sector_cap is not None:
        candidates: list[str] = []
        sector_seen: Counter[str] = Counter()
        for t in sorted_tickers:
            sec = ticker_sector[t]
            if sector_seen[sec] < sector_cap + 1:
                candidates.append(t)
                sector_seen[sec] += 1
    else:
        candidates = list(sorted_tickers)

    # 6. Reduce candidates until assets + slack <= qubit_budget
    while candidates and (len(candidates) + _compute_slack(candidates) > qubit_budget):
        candidates.pop()

    kept = list(candidates)
    dropped = [t for t in sorted_tickers if t not in kept]
    slack_bits = _compute_slack(kept)
    total_qubits = len(kept) + slack_bits

    # 7. Validation: must retain at least K assets
    if len(kept) < k:
        raise ValueError(
            f"Qubit budget {qubit_budget} is too small to select K={k} assets "
            f"after pre-screening (only {len(kept)} assets fit with {slack_bits} slack bits)"
        )

    # 8. Human-readable rule explanation in the style of CONTRACTS §2.4
    sector_phrase = f"max {sector_cap + 1} per sector, " if sector_cap is not None else ""
    rule = (
        f"Kept the {len(kept)} stocks with the highest estimation-window Sharpe ratio "
        f"({market.windows.est_start} to {market.windows.est_end}, rf {rf*100:.2f}%), "
        f"{sector_phrase}to fit {qubit_budget} qubits ({len(kept)} assets + {slack_bits} slack)."
    )

    return ScreenInfo(
        applied=True,
        rule=rule,
        kept=kept,
        dropped=dropped,
        qubits=QubitsInfo(assets=len(kept), slack=slack_bits, total=total_qubits),
    )
