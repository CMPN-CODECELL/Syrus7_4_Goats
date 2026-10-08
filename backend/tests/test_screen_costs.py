"""Unit tests for Pre-screen, Costs, Allocation, and Out-of-Sample evaluation (Unit U4).

Test Scenarios:
- AE1: 50 tickers, K=10, budget 16, no caps -> keeps 16 tickers, each kept Sharpe >= best dropped Sharpe,
       rule text names metric and estimation window.
- Sector cap 2: No more than 3 kept tickers (cap + 1) from any one sector.
- AE3: Holdings in A and B; a selection keeping A and B has strictly lower transaction costs
       than one swapping both out.
- Zero holdings: Transaction costs equal the sum of buy costs over the selection (C_BUY).
- Allocation: Capital 1,000,000, K=5, known prices -> shares are floor(200,000 / price) and cash_left >= 0.
- Budget overflow: A stock price higher than per-pick budget results in shares=0 and value=0 without crashing.
- Synthetic OOS doubling: A series that doubles over 252 days has annualised return 1.0 (100%) and max drawdown 0.0.
- Benchmark OOS: Computes valid metrics for ^NSEI benchmark.
"""
from __future__ import annotations

import numpy as np
import pandas as pd
import pytest

from qportfolio.data import (
    C_BUY,
    C_SELL,
    DEFAULT_WINDOWS,
    RF,
    Market,
    benchmark_oos,
    build_market,
    linear_costs,
    out_of_sample,
    prescreen,
    to_shares,
)


@pytest.fixture
def full_market() -> Market:
    """Fixture providing full 50-stock market from snapshot."""
    return build_market()


def test_ae1_prescreen_no_caps(full_market: Market):
    """AE1: With 50 tickers, K=10, budget 16, no caps -> keeps 16 tickers, Sharpe ordering preserved."""
    screen = prescreen(full_market, k=10, qubit_budget=16, sector_cap=None)

    assert screen.applied is True
    assert screen.qubits.assets == 16
    assert screen.qubits.slack == 0
    assert screen.qubits.total == 16
    assert len(screen.kept) == 16
    assert len(screen.dropped) == len(full_market.tickers) - 16

    # Verify Sharpe ordering: lowest kept Sharpe >= highest dropped Sharpe
    sharpes = {}
    for i, t in enumerate(full_market.tickers):
        vol = np.sqrt(max(full_market.sigma[i, i], 1e-12))
        sharpes[t] = (full_market.mu[i] - RF) / vol

    min_kept_sharpe = min(sharpes[t] for t in screen.kept)
    max_dropped_sharpe = max(sharpes[t] for t in screen.dropped)
    assert min_kept_sharpe >= max_dropped_sharpe - 1e-9

    # Verify rule text names metric and window dates
    assert "Sharpe ratio" in screen.rule
    assert full_market.windows.est_start in screen.rule
    assert full_market.windows.est_end in screen.rule
    assert "16 qubits" in screen.rule


def test_sector_cap_constraint(full_market: Market):
    """Sector cap 2 keeps no more than 3 (cap + 1) tickers from any single sector."""
    screen = prescreen(full_market, k=5, qubit_budget=16, sector_cap=2)

    assert screen.applied is True
    assert screen.qubits.total <= 16

    # Count kept per sector
    ticker_sector = {t: full_market.sectors[i] for i, t in enumerate(full_market.tickers)}
    counts = {}
    for t in screen.kept:
        sec = ticker_sector[t]
        counts[sec] = counts.get(sec, 0) + 1

    for sec, count in counts.items():
        assert count <= 3, f"Sector {sec} exceeded limit (expected <= 3, got {count})"


def test_universe_already_fits():
    """If market universe + slack already fits in qubit budget, applied=False and kept=[] dropped=[]."""
    small_market = build_market(tickers=["TCS.NS", "INFY.NS", "HDFCBANK.NS"])
    screen = prescreen(small_market, k=2, qubit_budget=16, sector_cap=None)

    assert screen.applied is False
    assert screen.kept == []
    assert screen.dropped == []
    assert screen.rule == ""
    assert screen.qubits.assets == 3
    assert screen.qubits.total == 3


def test_prescreen_budget_too_small_raises(full_market: Market):
    """If qubit budget is smaller than K, prescreen raises ValueError."""
    with pytest.raises(ValueError, match="too small"):
        prescreen(full_market, k=10, qubit_budget=8)


def test_zero_holdings_costs():
    """With no existing holdings, total transaction cost equals sum of buy costs (C_BUY)."""
    tickers = ["TCS.NS", "INFY.NS", "HDFCBANK.NS", "RELIANCE.NS", "ITC.NS"]
    k = 3
    lin, const = linear_costs(tickers, k, holdings_weights={})

    assert const == 0.0
    for val in lin:
        assert val == pytest.approx(C_BUY / k)

    # Any selection of K assets costs C_BUY
    x = np.array([1, 1, 1, 0, 0])
    tc = float(lin @ x + const)
    assert tc == pytest.approx(C_BUY)


def test_ae3_holdings_preference():
    """AE3: Selection keeping held assets A and B has strictly lower cost than swapping them out."""
    tickers = ["TCS.NS", "INFY.NS", "HDFCBANK.NS", "RELIANCE.NS"]
    k = 2
    # Holdings: 50% in TCS.NS (idx 0), 50% in INFY.NS (idx 1)
    holdings = {"TCS.NS": 0.5, "INFY.NS": 0.5}
    lin, const = linear_costs(tickers, k, holdings_weights=holdings)

    # Selection 1: keep both held assets [1, 1, 0, 0]
    x_keep = np.array([1, 1, 0, 0])
    tc_keep = float(lin @ x_keep + const)

    # Selection 2: swap both out for HDFCBANK and RELIANCE [0, 0, 1, 1]
    x_swap = np.array([0, 0, 1, 1])
    tc_swap = float(lin @ x_swap + const)

    # Keeping held assets incurs 0 cost; swapping pays sell fees on A & B + buy fees on C & D
    assert tc_keep == pytest.approx(0.0)
    assert tc_swap == pytest.approx(C_SELL * 1.0 + C_BUY)
    assert tc_keep < tc_swap


def test_to_shares_standard_allocation():
    """Capital ₹10,00,000, K=5, known prices -> shares are floors of 200,000/price and cash_left >= 0."""
    tickers = ["TCS.NS", "INFY.NS", "HDFCBANK.NS", "RELIANCE.NS", "ITC.NS"]
    prices = np.array([3800.0, 1600.0, 1500.0, 2900.0, 450.0])
    capital = 1_000_000.0
    selection = tickers

    portfolio = to_shares(tickers, prices, capital, selection)

    assert len(portfolio.rows) == 5
    per_pick_budget = 200_000.0

    for i, row in enumerate(portfolio.rows):
        expected_shares = int(np.floor(per_pick_budget / prices[i]))
        assert row.shares == expected_shares
        assert row.value == pytest.approx(expected_shares * prices[i], abs=1e-2)
        assert row.weight == pytest.approx(0.2)

    assert portfolio.invested <= capital
    assert portfolio.cash_left >= 0.0
    assert portfolio.cash_left == pytest.approx(capital - portfolio.invested, abs=1e-2)


def test_to_shares_price_above_budget():
    """If stock price exceeds the per-asset budget, shares=0 and value=0 without crashing."""
    tickers = ["TCS.NS", "EXPENSIVE.NS"]
    prices = np.array([3800.0, 150_000.0])
    capital = 100_000.0  # per-pick budget = 50,000 < 150,000
    selection = ["TCS.NS", "EXPENSIVE.NS"]

    portfolio = to_shares(tickers, prices, capital, selection)

    row_expensive = [r for r in portfolio.rows if r.ticker == "EXPENSIVE.NS"][0]
    assert row_expensive.shares == 0
    assert row_expensive.value == 0.0
    assert portfolio.cash_left >= 0.0


def test_synthetic_oos_doubling():
    """A synthetic series that doubles steadily over 252 days yields ann_return=1.0 and max_drawdown=0.0."""
    # 252 days of daily return r such that (1 + r)^252 = 2.0 -> r = 2^(1/252) - 1
    t_days = 252
    r_daily = (2.0 ** (1.0 / t_days)) - 1.0
    dates = pd.date_range("2025-10-01", periods=t_days, freq="B")

    test_df = pd.DataFrame(
        {"ASSET.NS": [r_daily] * t_days},
        index=dates,
    )

    # Dummy market object with synthetic test_returns
    market = Market(
        tickers=["ASSET.NS"],
        sectors=["Test"],
        mu=np.array([0.2]),
        sigma=np.array([[0.04]]),
        est_end_prices=np.array([100.0]),
        test_returns=test_df,
        benchmark_test_returns=pd.Series(dtype=float),
    )

    oos = out_of_sample(market, selection=["ASSET.NS"], rf=RF)

    assert oos.ann_return == pytest.approx(1.0, abs=1e-3)  # Doubled = 100% return
    assert oos.max_drawdown == pytest.approx(0.0)  # Monotonic increase -> 0 drawdown
    assert oos.ann_vol == pytest.approx(0.0, abs=1e-4)  # Zero daily volatility


def test_benchmark_oos(full_market: Market):
    """benchmark_oos computes valid finite metrics for ^NSEI."""
    b_oos = benchmark_oos(full_market)
    assert isinstance(b_oos.ann_return, float)
    assert isinstance(b_oos.ann_vol, float)
    assert b_oos.ann_vol > 0.0
    assert b_oos.max_drawdown <= 0.0
