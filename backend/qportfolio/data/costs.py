"""Linear transaction cost model for NIFTY 50 delivery trades.

Trading cost model:
tc(x) = lin · x + const (expressed as a fraction of total portfolio capital).
A new buy costs C_BUY / K.
A held position of weight h_i that is liquidated costs C_SELL * h_i.
Top-ups of kept positions are free.
"""
from __future__ import annotations

import numpy as np

from qportfolio.data.risk import C_BUY, C_SELL


def linear_costs(
    tickers: list[str],
    k: int,
    holdings_weights: dict[str, float] | None = None,
) -> tuple[np.ndarray, float]:
    """Calculate the linear transaction cost terms for QUBO formulation.

    tc(x) = lin · x + const.

    Args:
        tickers: Universe of candidate tickers in exact variable order.
        k: Target cardinality (number of stocks to pick).
        holdings_weights: Mapping of ticker to current holding fraction of capital.
            Empty dict or None represents an all-cash portfolio.

    Returns:
        tuple[np.ndarray, float]:
            - lin: (n,) float array of linear cost coefficients.
            - const: scalar constant representing mandatory liquidation cost.
    """
    n = len(tickers)
    if k <= 0:
        raise ValueError(f"Cardinality K must be positive, got {k}")

    weights = holdings_weights or {}
    lin = np.zeros(n, dtype=np.float64)
    const = 0.0

    # Mandatory liquidation cost for any held asset no longer in the candidate pool
    for held_ticker, h_weight in weights.items():
        if h_weight > 0.0:
            const += C_SELL * h_weight

    # Linear terms for assets in the solved pool
    buy_cost_per_pick = C_BUY / float(k)
    for i, t in enumerate(tickers):
        h_weight = weights.get(t, 0.0)
        if h_weight > 0.0:
            # Held asset: keeping it (x_i = 1) avoids paying the sell penalty C_SELL * h_weight
            lin[i] = -C_SELL * h_weight
        else:
            # Non-held asset: purchasing 1/K weight incurs the buy cost
            lin[i] = buy_cost_per_pick

    return lin, float(const)
