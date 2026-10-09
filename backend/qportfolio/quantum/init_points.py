"""Initial-point strategies for QAOA parameters. All return ``(gammas, betas)`` as float arrays of length p.

No classical solution enters these: random, a TQA-style linear ramp, and INTERP (Zhou et al. 2020)
which only reuses QAOA's own optimised parameters from depth p to p+1.
"""
from __future__ import annotations

import numpy as np


def random(p: int, seed: int | None = None) -> tuple[np.ndarray, np.ndarray]:
    """Seeded uniform start: gamma in [0, pi], beta in [0, pi/2]."""
    rng = np.random.default_rng(seed)
    return rng.uniform(0.0, np.pi, p), rng.uniform(0.0, np.pi / 2, p)


def ramp(p: int, dt: float = 0.75) -> tuple[np.ndarray, np.ndarray]:
    """TQA-style linear ramp: gamma rises and beta falls across layers."""
    frac = (np.arange(p) + 0.5) / p
    return frac * dt, (1.0 - frac) * dt


def _interp_one(old: np.ndarray) -> np.ndarray:
    p = len(old)
    padded = np.concatenate([[0.0], old, [0.0]])  # padded[i + 1] == old[i]; old[-1] == old[p] == 0
    i = np.arange(p + 1)
    return (i / p) * padded[i] + ((p - i) / p) * padded[i + 1]


def interp(gammas, betas) -> tuple[np.ndarray, np.ndarray]:
    """INTERP: depth-p parameters -> depth p+1, new[i] = (i/p) old[i-1] + ((p-i)/p) old[i]."""
    return _interp_one(np.asarray(gammas, dtype=float)), _interp_one(np.asarray(betas, dtype=float))
