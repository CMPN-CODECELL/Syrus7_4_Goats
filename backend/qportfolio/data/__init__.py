"""Data layer for Quantum Portfolio Optimiser.

Exports:
- load_universe: Loads 50 NIFTY 50 assets.
- load_prices: Loads adjusted close prices from cache/snapshot/live.
- build_market: Builds Market structure with mu, sigma, test returns, and provenance.
- Asset, PriceData, Windows, Market: Core dataclasses.
- RF, C_BUY, C_SELL, DEFAULT_WINDOWS: Standard project constants.
"""
from __future__ import annotations

from qportfolio.data.prices import PriceData, load_prices
from qportfolio.data.risk import (
    C_BUY,
    C_SELL,
    DEFAULT_WINDOWS,
    RF,
    Market,
    Windows,
    build_market,
)
from qportfolio.data.universe import Asset, load_universe

__all__ = [
    "Asset",
    "C_BUY",
    "C_SELL",
    "DEFAULT_WINDOWS",
    "Market",
    "PriceData",
    "RF",
    "Windows",
    "build_market",
    "load_prices",
    "load_universe",
]
