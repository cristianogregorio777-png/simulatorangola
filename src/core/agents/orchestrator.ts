import type {
  AgentStructuredOutput,
  BusinessAgentEffect,
  EconomicModifierProposal,
  SimulationEventPayload,
  SimulationState,
} from "@/types/simulation";
import { runAllAgentsDeterministic } from "./deterministicAgents";

export interface AgentOrchestrationResult {
  outputs: AgentStructuredOutput[];
  modifiers: EconomicModifierProposal[];
  events: SimulationEventPayload[];
  businessEffects: BusinessAgentEffect[];
}

/** Agrega saídas dos agentes num único lote para o tick. */
export function orchestrateAgentOutputs(outputs: AgentStructuredOutput[]): AgentOrchestrationResult {
  return {
    outputs,
    modifiers: outputs.flatMap((output) => output.modifiers),
    events: outputs.flatMap((output) => output.events),
    businessEffects: outputs.flatMap((output) => output.businessEffects),
  };
}

export function runAgentPhaseDeterministic(state: SimulationState): AgentOrchestrationResult {
  return orchestrateAgentOutputs(runAllAgentsDeterministic(state));
}
