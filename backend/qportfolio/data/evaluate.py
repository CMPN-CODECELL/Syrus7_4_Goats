"""Out-of-sample scoring on held-out test window data.

Evaluates buy-and-hold equal-weight portfolios over the test window (no intra-period rebalancing).
Computes annualised return, annualised volatility, Sharpe ratio, and maximum drawdown.
"""
from __future__ import annotations

import math
from dataclasses import dataclass

import numpy as np
import pandas as pd

from qportfolio.data.risk import RF, Market


@dataclass
class OOS:
    """Out-of-sample performance metrics matching TEAMS/CONTRACTS.md §2.6."""

    ann_return: float  # Annualised compound return decimal (e.g. 0.12 = 12%)
    ann_vol: float  # Annualised volatility decimal
    sharpe: float  # Sharpe ratio against rf
    max_drawdown: float  # Maximum peak-to-trough decline (<= 0.0)


def _compute_oos_metrics(
    portfolio_daily_returns: pd.Series | np.ndarray,
    cumulative_wealth: pd.Series | np.ndarray,
    rf: float = RF,
) -> OOS:
    """Calculate annualised metrics from daily returns and wealth path."""
    t_days = len(portfolio_daily_returns)
    if t_days == 0:
        return OOS(ann_return=0.0, ann_vol=0.0, sharpe=0.0, max_drawdown=0.0)

    wealth = np.asarray(cumulative_wealth, dtype=np.float64)
    # Ensure wealth starts with V_0 = 1.0
    if wealth[0] != 1.0:
        wealth = np.insert(wealth, 0, 1.0)

    final_v = float(wealth[-1])
    if final_v > 0.0:
        ann_return = float((final_v ** (252.0 / t_days)) - 1.0)
    else:
        ann_return = -1.0

    ret_arr = np.asarray(portfolio_daily_returns, dtype=np.float64)
    if t_days > 1:
        daily_vol = float(np.std(ret_arr, ddof=1))
        ann_vol = daily_vol * math.sqrt(252.0)
    else:
        ann_vol = 0.0

    if ann_vol > 1e-8:
        sharpe = (ann_return - rf) / ann_vol
    else:
        sharpe = 0.0

    # Max Drawdown: peak-to-trough decline (always <= 0.0)
    running_max = np.maximum.accumulate(wealth)
    drawdowns = (wealth - running_max) / running_max
    max_drawdown = float(np.min(drawdowns))
    if max_drawdown > 0.0:
        max_drawdown = 0.0

    return OOS(
        ann_return=round(ann_return, 4),
        ann_vol=round(ann_vol, 4),
        sharpe=round(sharpe, 4),
        max_drawdown=round(max_drawdown, 4),
    )


def out_of_sample(
    market: Market,
    selection: list[str],
    rf: float = RF,
) -> OOS:
    """Evaluate buy-and-hold equal-weight portfolio over the held-out test window.

    Args:
        market: Verified Market instance.
        selection: Chosen tickers for the portfolio.
        rf: Annualised risk-free rate (defaults to 0.0557).

    Returns:
        OOS: Computed out-of-sample metrics.
    """
    if not selection:
        return OOS(ann_return=0.0, ann_vol=0.0, sharpe=0.0, max_drawdown=0.0)

    for t in selection:
        if t not in market.test_returns.columns:
            raise ValueError(f"Ticker {t} not present in market test returns")

    k = len(selection)
    simple_rets = market.test_returns[selection]

    # Gross compounding per asset from start of test window: V_{i, t} = prod(1 + R_{i})
    gross_growth = (1.0 + simple_rets).cumprod(axis=0)

    # Equal-weight buy-and-hold portfolio wealth path
    portfolio_wealth = gross_growth.sum(axis=1) / float(k)

    # Daily portfolio returns
    # R_t = V_t / V_{t-1} - 1 (with V_0 = 1.0)
    v_with_v0 = pd.concat([pd.Series([1.0]), portfolio_wealth], ignore_index=True)
    daily_rets = v_with_v0.pct_change().dropna()

    return _compute_oos_metrics(daily_rets, portfolio_wealth, rf=rf)


def benchmark_oos(
    market: Market,
    rf: float = RF,
) -> OOS:
    """Evaluate benchmark (^NSEI) over the held-out test window.

    Args:
        market: Verified Market instance.
        rf: Annualised risk-free rate (defaults to 0.0557).

    Returns:
        OOS: Benchmark performance metrics.
    """
    bench_rets = market.benchmark_test_returns
    if bench_rets.empty:
        return OOS(ann_return=0.0, ann_vol=0.0, sharpe=0.0, max_drawdown=0.0)

    wealth = (1.0 + bench_rets).cumprod()
    return _compute_oos_metrics(bench_rets, wealth, rf=rf)
