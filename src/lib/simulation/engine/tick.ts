import type { SimulationEventPayload, SimulationState } from "@/types/simulation";
import { runPhase3SimulationTick } from "@/core/simulation/tickPhase3";

export interface TickResult {
  state: SimulationState;
  emittedEvents: SimulationEventPayload[];
}

/**
 * Executa um tick diário completo (Fase 3): agentes → economia/negócio → eventos.
 */
export function runSimulationTick(state: SimulationState): TickResult {
  return runPhase3SimulationTick(state);
}
