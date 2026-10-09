"""Circuit-level noise layer (U7, KTD10): FakeGuadalupeV2 noisy sampling and energy vs the ideal simulators.

All functions take a *flattened* parameterised circuit (no raw ``QAOAAnsatz``: Aer rejects composite
``QAOA`` / ``PauliEvolution`` blocks) whose parameters are bound by a ``values`` array in
``circuit.parameters`` order. Counts keep Qiskit's little-endian bitstring keys, unchanged.
"""
from __future__ import annotations

from functools import lru_cache
from typing import Callable

import numpy as np
from qiskit.primitives import StatevectorSampler
from qiskit.transpiler.preset_passmanagers import generate_preset_pass_manager
from qiskit_aer.noise import NoiseModel
from qiskit_aer.primitives import EstimatorV2 as AerEstimatorV2
from qiskit_aer.primitives import SamplerV2 as AerSamplerV2
from qiskit_ibm_runtime.fake_provider import FakeGuadalupeV2

BACKEND_NAME = "FakeGuadalupeV2"
# Layout/routing is randomised unless seeded; pin it so noisy results are reproducible (AGENTS.md: seed 7).
TRANSPILE_SEED = 7


@lru_cache(maxsize=1)
def backend():
    """(fake backend, noise model, level-1 pass manager); built once and cached."""
    fake = FakeGuadalupeV2()
    nm = NoiseModel.from_backend(fake)
    pm = generate_preset_pass_manager(optimization_level=1, backend=fake, seed_transpiler=TRANSPILE_SEED)
    return fake, nm, pm


def transpile_stats(circuit) -> dict:
    """Depth, two-qubit gate count and physical qubits touched, after transpiling to the fake backend."""
    isa = backend()[2].run(circuit)
    touched = {isa.find_bit(q).index for inst in isa.data if inst.operation.name != "barrier" for q in inst.qubits}
    return {"depth": isa.depth(), "two_qubit_gates": isa.num_nonlocal_gates(), "qubits": len(touched)}


def _measured(circuit, values):
    return circuit.measure_all(inplace=False).assign_parameters(np.asarray(values, dtype=float))


def sample_noisy(circuit, values, shots: int, seed: int) -> dict[str, int]:
    """Measure, bind, transpile to the fake backend and sample under its noise model."""
    _, nm, pm = backend()
    isa = pm.run(_measured(circuit, values))
    sampler = AerSamplerV2(default_shots=shots, seed=seed, options={"backend_options": {"noise_model": nm}})
    return dict(sampler.run([isa]).result()[0].data.meas.get_counts())


def sample_ideal(circuit, values, shots: int, seed: int) -> dict[str, int]:
    """Noiseless counterpart of :func:`sample_noisy` (same key convention)."""
    sampler = StatevectorSampler(default_shots=shots, seed=seed)
    return dict(sampler.run([_measured(circuit, values)]).result()[0].data.meas.get_counts())


def make_noisy_energy(circuit, H, seed: int = 7) -> Callable[[np.ndarray], float]:
    """Transpile ``circuit`` (no measurements) once and return ``fn(values) -> noisy <H>``.

    ``seed`` fixes Aer's trajectory sampling, which it uses instead of an exact density-matrix run once the
    routed circuit touches many qubits (roughly >= 10), so the energy is a deterministic function of ``values``.
    """
    _, nm, pm = backend()
    isa = pm.run(circuit)
    H_isa = H.apply_layout(isa.layout)
    est = AerEstimatorV2(
        options={"backend_options": {"noise_model": nm}, "run_options": {"seed_simulator": seed}}
    )

    def energy(values: np.ndarray) -> float:
        pub = (isa, H_isa, np.asarray(values, dtype=float))
        return float(est.run([pub]).result()[0].data.evs)

    return energy
