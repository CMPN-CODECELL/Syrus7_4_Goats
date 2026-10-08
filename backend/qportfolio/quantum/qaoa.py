"""QAOA integration step (U6): optimise <H>, sample the circuit, decode, judge with Problem.evaluate, report.

The answer is the best feasible sampled selection. Infeasible samples are never repaired (KTD6, AE2).
With settings.noise the parameters are still optimised noiselessly; the same values are then sampled
ideal and noisy (KTD10 sample-only mode).
"""
from __future__ import annotations

import math
import threading
import time
from collections.abc import Callable

import numpy as np
from qiskit.primitives import StatevectorEstimator

from qportfolio.contracts import Landscape, QaoaSettings, Sample, SolverResult
from qportfolio.metrics import qaoa_metrics
from qportfolio.pipeline import Cancelled
from qportfolio.problem import Evaluation, Problem
from qportfolio.quantum import ansatz, init_points, optimizers
from qportfolio.quantum.noise import BACKEND_NAME, sample_ideal, sample_noisy, transpile_stats
from qportfolio.qubo.builder import Qubo
from qportfolio.qubo.ising import to_sparse_pauli

OPTIMIZERS = {"COBYLA": optimizers.cobyla, "SPSA": optimizers.spsa, "NELDER_MEAD": optimizers.nelder_mead}
LABELS = {"standard": "QAOA (standard mixer)", "xy": "QAOA (XY mixer)"}


def _decode(counts: dict[str, int], n_assets: int) -> dict[str, float]:
    """Qiskit keys are little-endian (qubit 0 rightmost): reverse, keep the asset bits, merge probabilities."""
    shots = sum(counts.values())
    probs: dict[str, float] = {}
    for key, c in counts.items():
        bits = key[::-1][:n_assets]
        probs[bits] = probs.get(bits, 0.0) + c / shots
    return probs


def qaoa_solve(
    problem: Problem,
    qubo: Qubo,
    settings: QaoaSettings,
    on_progress: Callable[[float, str, dict | None], None] | None = None,
    cancel: threading.Event | None = None,
    landscape: Landscape | None = None,
) -> tuple[SolverResult, dict]:
    """Return the SolverResult (portfolio and oos left for the pipeline) and the RunResult "qaoa" block."""
    t0 = time.perf_counter()
    n = qubo.n_assets
    H, offset, scale = to_sparse_pauli(qubo)
    estimator = StatevectorEstimator()
    convergence: list[dict] = []

    def optimise(circuit, x0: np.ndarray, budget: int) -> np.ndarray:
        p = len(x0) // 2

        def energy(x: np.ndarray) -> float:
            values = ansatz.assemble_values(circuit, x[:p], x[p:])
            return float(estimator.run([(circuit, H, values)]).result()[0].data.evs)

        def callback(_: int, e: float, x: np.ndarray) -> None:
            point = {"iter": len(convergence) + 1, "energy": e * scale + offset}
            convergence.append(point)
            if on_progress is not None:
                on_progress(min(point["iter"] / settings.maxiter, 1.0),
                            f"Optimising QAOA parameters (iteration {point['iter']} of {settings.maxiter})", point)
            if cancel is not None and cancel.is_set():
                raise Cancelled

        return OPTIMIZERS[settings.optimizer](energy, x0, budget, callback, settings.seed).x

    reps = settings.reps
    if settings.init == "interp":  # INTERP warm start: depth 1 from the ramp, then up one depth at a time
        gammas, betas = init_points.ramp(1)
        depths, budget = range(1, reps + 1), max(1, settings.maxiter // reps)
    else:
        gammas, betas = init_points.random(reps, settings.seed) if settings.init == "random" else init_points.ramp(reps)
        depths, budget = [reps], settings.maxiter
    for p in depths:
        circuit = ansatz.build(H, p, settings.variant, n, problem.k)
        x = optimise(circuit, np.concatenate([gammas, betas]), budget)
        gammas, betas = x[:p], x[p:]
        if p < reps:
            gammas, betas = init_points.interp(gammas, betas)
    values = ansatz.assemble_values(circuit, gammas, betas)

    judged: dict[str, Evaluation] = {}

    def summarise(counts: dict[str, int]) -> tuple[list[Sample], dict, list[Sample]]:
        samples = []
        for bits, prob in _decode(counts, n).items():
            if bits not in judged:
                judged[bits] = problem.evaluate(np.array([int(b) for b in bits]))
            ev = judged[bits]
            samples.append(Sample(bitstring=bits, prob=prob, objective=ev.objective if ev.feasible else None,
                                  feasible=ev.feasible, optimal=False))
        if landscape is None:
            metrics = {"approx_ratio": None, "p_opt": None, "p_random": None,
                       "feasible_rate": sum(s.prob for s in samples if s.feasible)}
            return samples, metrics, sorted(samples, key=lambda s: -s.prob)[:20]
        m = qaoa_metrics(samples, landscape)
        return samples, m.model_dump(), m.top_samples

    samples, metrics, top = summarise(sample_ideal(circuit, values, settings.shots, settings.seed))
    stats = transpile_stats(circuit)
    transpiled = {"depth": stats["depth"], "two_qubit_gates": stats["two_qubit_gates"]}
    noise = None
    if settings.noise:
        noisy_metrics = summarise(sample_noisy(circuit, values, settings.shots, settings.seed))[1]
        noise = {"backend": BACKEND_NAME, "ideal": metrics, "noisy": noisy_metrics, "transpiled": transpiled}

    feasible = [s for s in samples if s.feasible]
    solver = f"qaoa_{settings.variant}"
    common = dict(solver=solver, label=LABELS[settings.variant], kind="quantum", runtime_s=time.perf_counter() - t0,
                  approx_ratio=metrics["approx_ratio"], p_opt=metrics["p_opt"], feasible_rate=metrics["feasible_rate"],
                  details={"most_probable": max(samples, key=lambda s: s.prob).bitstring})
    if feasible:
        best = min(feasible, key=lambda s: s.objective)
        ev = judged[best.bitstring]
        result = SolverResult(
            selection=[t for t, b in zip(problem.tickers, best.bitstring) if b == "1"], bitstring=best.bitstring,
            objective=ev.objective, exp_return=ev.exp_return, volatility=math.sqrt(max(ev.variance, 0.0)),
            variance=ev.variance, txn_cost=ev.txn_cost, feasible=True, violations=[], **common)
    else:
        result = SolverResult(
            selection=None, bitstring=None, objective=None, exp_return=None, volatility=None, variance=None,
            txn_cost=None, feasible=False, violations=["no feasible sample"], **common)

    block = {
        "solver": solver,
        "convergence": convergence,
        "samples": [s.model_dump() for s in top],
        "metrics": metrics,
        "circuit": {"qubits": circuit.num_qubits, "reps": reps, **transpiled, "optimizer": settings.optimizer,
                    "init": settings.init, "seed": settings.seed},
        "noise": noise,
    }
    return result, block
