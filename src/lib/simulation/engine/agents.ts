import type {
  EconomicModifierProposal,
  SimulationAgent,
  SimulationEventPayload,
  SimulationState,
} from "@/types/simulation";
import { applyEconomicModifiers } from "@/core/economy";
import type { SimulationEventBus } from "./eventBus";

/** Implementação base para agentes de IA — leitura imutável + emissão indirecta. */
export class BaseSimulationAgent implements SimulationAgent {
  readonly id: string;
  private getStateRef: () => SimulationState;
  private bus: SimulationEventBus;
  private pendingModifiers: EconomicModifierProposal[] = [];

  constructor(
    id: string,
    getState: () => SimulationState,
    bus: SimulationEventBus,
  ) {
    this.id = id;
    this.getStateRef = getState;
    this.bus = bus;
  }

  getState(): Readonly<SimulationState> {
    return this.getStateRef();
  }

  emit(payload: SimulationEventPayload): void {
    this.bus.emit(payload);
  }

  proposeModifier(proposal: EconomicModifierProposal): void {
    this.pendingModifiers.push(proposal);
  }

  consumePendingModifiers(): EconomicModifierProposal[] {
    const batch = [...this.pendingModifiers];
    this.pendingModifiers = [];
    return batch;
  }
}

/** Aplica modificadores propostos por agentes ao estado (chamado pelo motor). */
export function applyAgentModifiers(
  state: SimulationState,
  proposals: EconomicModifierProposal[],
): SimulationState {
  if (proposals.length === 0) return state;

  const adjusted = applyEconomicModifiers(state, proposals);
  return { ...state, economy: adjusted.economy, macro: adjusted.macro };
}
