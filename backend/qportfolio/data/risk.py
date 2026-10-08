"""Risk model and Market builder for NIFTY 50.

Missing data handling:
Gaps up to 3 days are forward-filled using ffill(limit=3).
Any remaining date rows with NaN returns across the kept universe are dropped
to maintain synchronous estimation without look-ahead bias.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

import numpy as np
import pandas as pd

from qportfolio.data.prices import load_prices
from qportfolio.data.universe import load_universe

# Frozen constants from TEAMS/CONTRACTS.md §1.2
RF: float = 0.0557
C_BUY: float = 0.001187
C_SELL: float = 0.001037


@dataclass(frozen=True)
class Windows:
    """Estimation and test date windows."""

    est_start: str = "2023-10-01"
    est_end: str = "2025-09-30"
    test_start: str = "2025-10-01"
    test_end: str = "2026-09-30"


DEFAULT_WINDOWS = Windows()


@dataclass
class Market:
    """Complete market data structure consumed by solvers and pipeline."""

    tickers: list[str]  # solved universe after exclusion, length n
    sectors: list[str]  # same order as tickers
    mu: np.ndarray  # (n,) annualised expected log returns
    sigma: np.ndarray  # (n, n) annualised covariance matrix, symmetric PSD
    est_end_prices: np.ndarray  # (n,) last estimation-window close prices
    test_returns: pd.DataFrame  # simple daily returns over test window
    benchmark_test_returns: pd.Series  # simple daily returns for ^NSEI
    excluded: dict[str, str] = field(default_factory=dict)  # ticker -> reason
    filled: dict[str, int] = field(default_factory=dict)  # ticker -> ffill count
    windows: Windows = DEFAULT_WINDOWS
    source: str = "snapshot"
    as_of: str = "2026-10-07"

    def subset(self, sub_tickers: list[str]) -> Market:
        """Return a sub-Market containing only the requested tickers in the given order."""
        for t in sub_tickers:
            if t not in self.tickers:
                raise ValueError(f"Ticker {t} not present in Market (available: {self.tickers})")

        idx = [self.tickers.index(t) for t in sub_tickers]
        sub_sectors = [self.sectors[i] for i in idx]
        sub_mu = self.mu[idx].copy()
        sub_sigma = self.sigma[np.ix_(idx, idx)].copy()
        sub_est_end = self.est_end_prices[idx].copy()
        sub_test_returns = self.test_returns[sub_tickers].copy()
        sub_filled = {t: self.filled[t] for t in sub_tickers if t in self.filled}

        return Market(
            tickers=list(sub_tickers),
            sectors=sub_sectors,
            mu=sub_mu,
            sigma=sub_sigma,
            est_end_prices=sub_est_end,
            test_returns=sub_test_returns,
            benchmark_test_returns=self.benchmark_test_returns.copy(),
            excluded=dict(self.excluded),
            filled=sub_filled,
            windows=self.windows,
            source=self.source,
            as_of=self.as_of,
        )


def build_market(
    tickers: list[str] | None = None,
    windows: Windows = DEFAULT_WINDOWS,
    prices_df: pd.DataFrame | None = None,
    source: str | None = None,
    as_of: str | None = None,
) -> Market:
    """Build a leak-free Market from prices and universe definitions.

    Strictly separates estimation and test windows:
    - Estimation: windows.est_start to windows.est_end (inclusive)
    - Test: windows.test_start to windows.test_end (inclusive)
    Nothing in or after the test window influences mu, sigma, or est_end_prices (AE4).

    Args:
        tickers: Universe of tickers to build market for. Defaults to all 50 NIFTY 50 stocks.
        windows: Windows specification (defaults to DEFAULT_WINDOWS).
        prices_df: Optional pre-loaded close prices (for testing / mocking).
        source: Optional source tag ("cache", "snapshot", "live").
        as_of: Optional as_of date string.

    Returns:
        Market: Verified Market instance.
    """
    # 1. Resolve Universe & Sectors
    universe_assets = load_universe()
    sector_map = {a.ticker: a.sector for a in universe_assets}

    if tickers is None:
        raw_tickers = [a.ticker for a in universe_assets]
    else:
        raw_tickers = list(tickers)

    # 2. Load Prices if not provided
    if prices_df is None:
        needed_tickers = raw_tickers + (["^NSEI"] if "^NSEI" not in raw_tickers else [])
        price_data = load_prices(tickers=needed_tickers)
        all_prices = price_data.close.copy()
        market_source = price_data.source
        market_as_of = price_data.as_of
    else:
        all_prices = prices_df.copy()
        market_source = source or "custom"
        market_as_of = as_of or (pd.to_datetime(all_prices.index[-1]).strftime("%Y-%m-%d") if not all_prices.empty else "")

    # Ensure index is DatetimeIndex
    if not isinstance(all_prices.index, pd.DatetimeIndex):
        all_prices.index = pd.to_datetime(all_prices.index)
    if all_prices.index.tz is not None:
        all_prices.index = all_prices.index.tz_localize(None)

    # 3. Slice estimation and test windows strictly by date
    est_start_dt = pd.to_datetime(windows.est_start)
    est_end_dt = pd.to_datetime(windows.est_end)
    test_start_dt = pd.to_datetime(windows.test_start)
    test_end_dt = pd.to_datetime(windows.test_end)

    est_prices = all_prices.loc[(all_prices.index >= est_start_dt) & (all_prices.index <= est_end_dt)].copy()
    test_prices = all_prices.loc[(all_prices.index >= test_start_dt) & (all_prices.index <= test_end_dt)].copy()

    if est_prices.empty:
        raise ValueError(f"No price data found in estimation window ({windows.est_start} to {windows.est_end})")

    excluded: dict[str, str] = {}
    filled: dict[str, int] = {}

    # 4. Exclusions
    # TMPV demerger break on 2025-10-14
    if "TMPV.NS" in raw_tickers:
        excluded["TMPV.NS"] = "Demerger on 2025-10-14 breaks the price series in the test window"

    n_est_rows = len(est_prices)
    for t in raw_tickers:
        if t in excluded:
            continue
        if t not in est_prices.columns:
            excluded[t] = "No price data found in estimation window"
            continue
        col = est_prices[t]
        missing_count = int(col.isna().sum())
        missing_pct = missing_count / n_est_rows
        if missing_pct > 0.05:
            excluded[t] = f"Missing {missing_pct:.1%} of estimation-window prices (threshold: 5%)"

    kept_tickers = [t for t in raw_tickers if t not in excluded]
    if not kept_tickers:
        raise ValueError("All tickers were excluded; no feasible assets remain")

    # 5. Forward-fill gaps of up to 3 days in estimation window
    for t in kept_tickers:
        orig_series = est_prices[t]
        orig_na = int(orig_series.isna().sum())
        filled_series = orig_series.ffill(limit=3)
        remaining_na = int(filled_series.isna().sum())
        fill_count = orig_na - remaining_na
        if fill_count > 0:
            filled[t] = fill_count
        est_prices[t] = filled_series

    # Also forward-fill test window for kept tickers and ^NSEI
    for t in kept_tickers:
        if t in test_prices.columns:
            test_prices[t] = test_prices[t].ffill(limit=3)
    if "^NSEI" in test_prices.columns:
        test_prices["^NSEI"] = test_prices["^NSEI"].ffill(limit=3)

    # 6. Daily log returns & mu / sigma on estimation window ONLY
    est_kept = est_prices[kept_tickers]
    log_prices = np.log(est_kept)
    log_returns = log_prices.diff()

    # Drop any remaining NaN return rows across kept universe
    log_returns = log_returns.dropna()

    if len(log_returns) < 2:
        raise ValueError("Insufficient valid return rows in estimation window to compute covariance")

    mu = log_returns.mean().to_numpy(dtype=float) * 252.0
    cov = log_returns.cov().to_numpy(dtype=float) * 252.0

    # Ensure symmetric PSD
    sigma = 0.5 * (cov + cov.T)
    eigvals, eigvecs = np.linalg.eigh(sigma)
    min_eig = float(np.min(eigvals))
    if min_eig < -1e-10:
        raise ValueError(f"Covariance matrix is not positive semi-definite (min eigenvalue {min_eig})")
    # Clip any tiny numerical negatives to 0.0
    clipped_eigvals = np.maximum(eigvals, 0.0)
    sigma = eigvecs @ np.diag(clipped_eigvals) @ eigvecs.T
    sigma = 0.5 * (sigma + sigma.T)

    # 7. Last estimation-window close prices
    est_end_prices = est_kept.iloc[-1].to_numpy(dtype=float)

    # 8. Test simple daily returns
    if not test_prices.empty and all(t in test_prices.columns for t in kept_tickers):
        test_kept = test_prices[kept_tickers]
        test_simple_returns = test_kept.pct_change().dropna()
    else:
        test_simple_returns = pd.DataFrame(columns=kept_tickers)

    # Benchmark test returns (^NSEI)
    if not test_prices.empty and "^NSEI" in test_prices.columns:
        bench_series = test_prices["^NSEI"].pct_change().dropna()
    else:
        bench_series = pd.Series(dtype=float, name="^NSEI")

    # Sectors matching kept tickers
    sectors = [sector_map.get(t, "Unknown") for t in kept_tickers]

    return Market(
        tickers=kept_tickers,
        sectors=sectors,
        mu=mu,
        sigma=sigma,
        est_end_prices=est_end_prices,
        test_returns=test_simple_returns,
        benchmark_test_returns=bench_series,
        excluded=excluded,
        filled=filled,
        windows=windows,
        source=market_source,
        as_of=market_as_of,
    )
