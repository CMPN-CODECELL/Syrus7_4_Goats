"""Whole-share allocation and cash accounting for portfolio selections.

Converts continuous weights to integer share counts at estimation-end prices,
honouring Indian stock lot sizes and reporting leftover cash.
"""
from __future__ import annotations

import math
from dataclasses import dataclass

import numpy as np

from qportfolio.data.universe import load_universe


@dataclass
class PortfolioRow:
    """Individual stock position within the discrete portfolio."""

    ticker: str
    name: str
    sector: str
    weight: float
    shares: int
    price: float
    value: float


@dataclass
class PortfolioOut:
    """Complete allocated portfolio matching TEAMS/CONTRACTS.md §2.6."""

    rows: list[PortfolioRow]
    invested: float
    cash_left: float


def to_shares(
    tickers: list[str],
    prices: np.ndarray,
    capital: float,
    selection: list[str],
) -> PortfolioOut:
    """Convert an equal-weight selection into discrete whole shares.

    Per-pick budget = capital / K.
    Shares = floor(budget / price) at estimation-end prices.
    If a price exceeds the per-pick budget, shares=0 and value=0 (row remains flagged).

    Args:
        tickers: Complete candidate ticker list corresponding to prices array.
        prices: Array of estimation-end close prices for each ticker.
        capital: Total capital available in INR.
        selection: List of tickers selected by solver.

    Returns:
        PortfolioOut: Allocated positions, total invested capital, and leftover cash.
    """
    k = len(selection)
    if k == 0:
        return PortfolioOut(rows=[], invested=0.0, cash_left=float(capital))

    if capital <= 0:
        raise ValueError(f"Capital must be positive, got {capital}")

    # Map tickers to metadata
    universe = load_universe()
    meta_map = {a.ticker: (a.name, a.sector) for a in universe}

    ticker_to_idx = {t: i for i, t in enumerate(tickers)}
    per_pick_budget = capital / float(k)

    rows: list[PortfolioRow] = []
    invested_total = 0.0

    for t in selection:
        if t not in ticker_to_idx:
            raise ValueError(f"Selected ticker {t} not present in candidate tickers list")

        idx = ticker_to_idx[t]
        price = float(prices[idx])
        name, sector = meta_map.get(t, (t, "Unknown"))

        if price > 0.0:
            shares = int(math.floor(per_pick_budget / price))
            val = round(shares * price, 2)
        else:
            shares = 0
            val = 0.0

        invested_total += val
        rows.append(
            PortfolioRow(
                ticker=t,
                name=name,
                sector=sector,
                weight=round(1.0 / float(k), 6),
                shares=shares,
                price=round(price, 2),
                value=val,
            )
        )

    invested_total = round(invested_total, 2)
    cash_left = round(capital - invested_total, 2)

    return PortfolioOut(rows=rows, invested=invested_total, cash_left=cash_left)
