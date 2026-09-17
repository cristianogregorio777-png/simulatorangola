import type { WorldState } from "@/types/simulation";
import { createInitialSimulationState, toWorldState } from "@/lib/simulation/engine";

/**
 * Estado inicial do "mundo" para a World Screen.
 * Derivado do Simulation Engine para manter valores macro consistentes.
 */
export const INITIAL_WORLD_STATE: WorldState = toWorldState(
  createInitialSimulationState(),
);
