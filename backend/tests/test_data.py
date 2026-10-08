"""Unit tests for the Data Layer (Unit U3).

Tests verify:
- AE4: No look-ahead bias (future prices do not affect mu, sigma, est_end_prices).
- AE6: Offline resilience (fallback to snapshot when network fails).
- Gap forward-fill and tracking.
- Exclusion for missing data threshold (>5%).
- Default exclusion of TMPV.NS with demerger reason.
- PSD and symmetry of covariance matrix.
- Universe loader consistency (50 assets with sectors).
- Market subset integrity.
- Execution speed (< 2s on snapshot).
"""
from __future__ import annotations

import time
from unittest.mock import patch

import numpy as np
import pandas as pd
import pytest

from qportfolio.data import (
    C_BUY,
    C_SELL,
    DEFAULT_WINDOWS,
    RF,
    Asset,
    Market,
    PriceData,
    Windows,
    build_market,
    load_prices,
    load_universe,
)


def test_load_universe():
    """load_universe must return exactly 50 assets, each with non-empty fields."""
    assets = load_universe()
    assert len(assets) == 50
    for a in assets:
        assert isinstance(a, Asset)
        assert a.ticker.endswith(".NS")
        assert len(a.symbol) > 0
        assert len(a.name) > 0
        assert len(a.sector) > 0


def test_constants():
    """Constants must match TEAMS/CONTRACTS.md §1.2 exactly."""
    assert RF == pytest.approx(0.0557)
    assert C_BUY == pytest.approx(0.001187)
    assert C_SELL == pytest.approx(0.001037)
    assert DEFAULT_WINDOWS.est_start == "2023-10-01"
    assert DEFAULT_WINDOWS.est_end == "2025-09-30"
    assert DEFAULT_WINDOWS.test_start == "2025-10-01"
    assert DEFAULT_WINDOWS.test_end == "2026-09-30"


def test_ae6_offline_resilience():
    """AE6: With network patched to fail, load_prices returns snapshot and as_of date."""
    with patch("yfinance.download", side_effect=RuntimeError("Network offline")):
        price_data = load_prices(refresh=False)
        assert price_data.source in ("snapshot", "cache")
        assert len(price_data.as_of) == 10  # YYYY-MM-DD
        assert not price_data.close.empty
        assert price_data.as_of == "2026-10-07"


def test_tmpv_excluded_by_default():
    """TMPV.NS must be excluded by default with the demerger reason."""
    market = build_market(tickers=["TCS.NS", "INFY.NS", "TMPV.NS"])
    assert "TMPV.NS" in market.excluded
    assert "demerger" in market.excluded["TMPV.NS"].lower()
    assert "TMPV.NS" not in market.tickers


def test_missing_data_exclusion():
    """A ticker with >5% missing estimation rows must be excluded."""
    price_data = load_prices(tickers=["TCS.NS", "INFY.NS", "HDFCBANK.NS"])
    df = price_data.close.copy()

    # Artificially inject 10% missing rows in estimation window for INFY.NS
    est_mask = (df.index >= pd.to_datetime("2023-10-01")) & (df.index <= pd.to_datetime("2025-09-30"))
    est_indices = df.index[est_mask]
    n_drop = int(len(est_indices) * 0.10)
    df.loc[est_indices[:n_drop], "INFY.NS"] = np.nan

    market = build_market(tickers=["TCS.NS", "INFY.NS", "HDFCBANK.NS"], prices_df=df)
    assert "INFY.NS" in market.excluded
    assert "missing" in market.excluded["INFY.NS"].lower()
    assert "INFY.NS" not in market.tickers


def test_gap_forward_filled():
    """A 2-day gap must be forward-filled and counted in market.filled."""
    price_data = load_prices(tickers=["TCS.NS", "HDFCBANK.NS"])
    df = price_data.close.copy()

    # Inject a 2-day gap in TCS.NS inside estimation window (not leading)
    est_mask = (df.index >= pd.to_datetime("2023-10-01")) & (df.index <= pd.to_datetime("2025-09-30"))
    est_indices = df.index[est_mask]
    target_idx = est_indices[10:12]
    df.loc[target_idx, "TCS.NS"] = np.nan

    market = build_market(tickers=["TCS.NS", "HDFCBANK.NS"], prices_df=df)
    assert "TCS.NS" in market.tickers
    assert market.filled.get("TCS.NS") == 2


def test_ae4_no_lookahead():
    """AE4: Prices after estimation end must NOT affect mu, sigma, or est_end_prices."""
    price_data = load_prices(tickers=["TCS.NS", "HDFCBANK.NS", "RELIANCE.NS"])
    df_clean = price_data.close.copy()

    market_orig = build_market(tickers=["TCS.NS", "HDFCBANK.NS", "RELIANCE.NS"], prices_df=df_clean)

    # Randomise every price strictly after estimation end date (2025-09-30)
    df_randomized = df_clean.copy()
    future_mask = df_randomized.index > pd.to_datetime("2025-09-30")
    rng = np.random.default_rng(42)
    random_noise = rng.uniform(500.0, 5000.0, size=df_randomized.loc[future_mask].shape)
    df_randomized.loc[future_mask] = random_noise

    market_future_altered = build_market(
        tickers=["TCS.NS", "HDFCBANK.NS", "RELIANCE.NS"], prices_df=df_randomized
    )

    np.testing.assert_allclose(market_orig.mu, market_future_altered.mu, rtol=1e-12)
    np.testing.assert_allclose(market_orig.sigma, market_future_altered.sigma, rtol=1e-12)
    np.testing.assert_allclose(
        market_orig.est_end_prices, market_future_altered.est_end_prices, rtol=1e-12
    )


def test_covariance_symmetric_and_psd():
    """Sigma must be symmetric and positive semi-definite (min eigenvalue >= -1e-10)."""
    market = build_market(tickers=["TCS.NS", "INFY.NS", "HDFCBANK.NS", "RELIANCE.NS", "ITC.NS"])
    sigma = market.sigma

    # Symmetry
    np.testing.assert_allclose(sigma, sigma.T, rtol=1e-12, atol=1e-12)

    # PSD: all eigenvalues >= -1e-10
    eigvals = np.linalg.eigvalsh(sigma)
    assert np.min(eigvals) >= -1e-10


def test_market_subset():
    """Market.subset must preserve order, mu, sigma, sectors, and prices."""
    tickers = ["TCS.NS", "INFY.NS", "HDFCBANK.NS", "RELIANCE.NS"]
    full_market = build_market(tickers=tickers)

    sub_tickers = ["RELIANCE.NS", "TCS.NS"]
    sub_market = full_market.subset(sub_tickers)

    assert sub_market.tickers == sub_tickers
    assert len(sub_market.sectors) == 2

    # Check subset mu matches full_market mu for the chosen tickers
    idx_rel = full_market.tickers.index("RELIANCE.NS")
    idx_tcs = full_market.tickers.index("TCS.NS")

    assert sub_market.mu[0] == pytest.approx(full_market.mu[idx_rel])
    assert sub_market.mu[1] == pytest.approx(full_market.mu[idx_tcs])

    assert sub_market.est_end_prices[0] == pytest.approx(full_market.est_end_prices[idx_rel])
    assert sub_market.est_end_prices[1] == pytest.approx(full_market.est_end_prices[idx_tcs])

    assert sub_market.sigma[0, 0] == pytest.approx(full_market.sigma[idx_rel, idx_rel])
    assert sub_market.sigma[1, 1] == pytest.approx(full_market.sigma[idx_tcs, idx_tcs])
    assert sub_market.sigma[0, 1] == pytest.approx(full_market.sigma[idx_rel, idx_tcs])


def test_full_market_performance_and_shape():
    """build_market on all 50 tickers takes under 2 seconds from snapshot."""
    t0 = time.perf_counter()
    market = build_market()
    dt = time.perf_counter() - t0

    assert dt < 2.0, f"build_market took {dt:.2f}s (expected < 2.0s)"
    # TMPV.NS is excluded by default, so 49 tickers remain
    assert len(market.tickers) == 49
    assert len(market.sectors) == 49
    assert market.mu.shape == (49,)
    assert market.sigma.shape == (49, 49)
    assert market.est_end_prices.shape == (49,)
    assert not market.test_returns.empty
    assert not market.benchmark_test_returns.empty
    assert "TMPV.NS" in market.excluded
