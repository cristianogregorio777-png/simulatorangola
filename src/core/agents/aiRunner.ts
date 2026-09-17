import type { AgentStructuredOutput, SimulationState } from "@/types/simulation";
import type { AiCompletionRequest, AiCompletionResponse } from "@/lib/ai/types";
import { buildAgentPrompt } from "./prompts";
import { extractJsonFromText, parseAgentStructuredOutput } from "./schemas";
import {
  runCompetitorAgentDeterministic,
  runCustomerAgentDeterministic,
  runEventAgentDeterministic,
  runMarketAgentDeterministic,
} from "./deterministicAgents";

export type CompleteWithFallbackFn = (
  request: AiCompletionRequest,
) => Promise<AiCompletionResponse>;

const AGENT_RUNNERS: Record<
  string,
  { role: string; fallback: (state: SimulationState) => AgentStructuredOutput }
> = {
  "market-agent": {
    role: "Market Agent (macroeconomia angolana)",
    fallback: runMarketAgentDeterministic,
  },
  "customer-agent": {
    role: "Customer Agent (comportamento de compra local)",
    fallback: runCustomerAgentDeterministic,
  },
  "competitor-agent": {
    role: "Competitor Agent (concorrência local)",
    fallback: runCompetitorAgentDeterministic,
  },
  "event-agent": {
    role: "Event Agent (eventos socioeconómicos de Angola)",
    fallback: runEventAgentDeterministic,
  },
};

export async function runAgentWithAiOrFallback(
  agentId: keyof typeof AGENT_RUNNERS,
  state: SimulationState,
  complete: CompleteWithFallbackFn,
): Promise<AgentStructuredOutput> {
  const config = AGENT_RUNNERS[agentId];
  const prompt = buildAgentPrompt(config.role, state);

  try {
    const response = await complete({
      prompt,
      context: {
        agentId,
        tick: state.clock.tick,
        economy: state.economy,
        macro: state.macro,
      },
    });

    const parsed = parseAgentStructuredOutput(
      agentId,
      state.clock.tick,
      extractJsonFromText(response.text),
      response.provider === "deterministic",
      response.provider,
    );

    if (parsed) {
      return parsed;
    }
  } catch {
    // cai para fallback local
  }

  return config.fallback(state);
}

export async function runAllAgentsWithAiOrFallback(
  state: SimulationState,
  complete: CompleteWithFallbackFn,
): Promise<AgentStructuredOutput[]> {
  const ids = Object.keys(AGENT_RUNNERS) as (keyof typeof AGENT_RUNNERS)[];
  const results: AgentStructuredOutput[] = [];

  for (const id of ids) {
    results.push(await runAgentWithAiOrFallback(id, state, complete));
  }

  return results;
}

export function runAllAgentsDeterministicFromRunner(state: SimulationState): AgentStructuredOutput[] {
  return (Object.keys(AGENT_RUNNERS) as (keyof typeof AGENT_RUNNERS)[]).map((id) =>
    AGENT_RUNNERS[id].fallback(state),
  );
}
