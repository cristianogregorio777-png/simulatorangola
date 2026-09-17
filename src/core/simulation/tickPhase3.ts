import type { SimulationEventPayload, SimulationState } from "@/types/simulation";
import { advanceEconomyDeterministic } from "@/lib/simulation/deterministic/economy";
import {
  advanceClock,
  formatSimulationDate,
  isMonthlyBoundary,
  isWeeklyBoundary,
} from "@/lib/simulation/engine/clock";
import {
  applyEventEconomyModifiers,
  applyEventMacroModifiers,
  generateDeterministicEvents,
  mergeActiveEvents,
} from "@/lib/simulation/engine/events";
import { runAgentPhaseDeterministic } from "@/core/agents";
import {
  advanceAngolaMacroEconomy,
  applyEconomicModifiers,
  mergeEconomyAndMacro,
} from "@/core/economy";
import { runBusinessFinancialTick } from "@/core/business";
import type { TickResult } from "@/lib/simulation/engine/tick";

/**
 * Tick Fase 3:
 * SimulationState → Agentes (fallback determinístico) → Eventos/Modificadores → Economia & Negócio → Estado
 */
export function runPhase3SimulationTick(state: SimulationState): TickResult {
  const emittedEvents: SimulationEventPayload[] = [];
  const agentPhase = runAgentPhaseDeterministic(state);

  for (const output of agentPhase.outputs) {
    emittedEvents.push({
      type: "AGENT_DECISION",
      tick: state.clock.tick,
      message: `[${output.agentId}] provider=${output.provider ?? "deterministic"} fallback=${output.usedFallback}`,
    });
  }

  const adjusted = applyEconomicModifiers(state, agentPhase.modifiers);
  const workingState: SimulationState = {
    ...state,
    economy: adjusted.economy,
    macro: adjusted.macro,
  };

  const advancedClock = advanceClock(workingState.clock);

  let economy = advanceEconomyDeterministic({
    economy: workingState.economy,
    seed: workingState.seed,
    tick: advancedClock.tick,
  });

  const generatedEvents = [
    ...agentPhase.events,
    ...generateDeterministicEvents({
      ...workingState,
      clock: advancedClock,
      economy,
    }),
  ];

  const activeEvents = mergeActiveEvents(workingState.activeEvents, generatedEvents);
  economy = applyEventEconomyModifiers(economy, activeEvents);

  let macro = advanceAngolaMacroEconomy({
    macro: workingState.macro,
    economy,
    seed: workingState.seed,
    tick: advancedClock.tick,
    activeEvents,
  });
  macro = applyEventMacroModifiers(macro, activeEvents);
  economy = mergeEconomyAndMacro(economy, macro);

  emittedEvents.push(...generatedEvents);

  const businesses = workingState.businesses.map((business) =>
    runBusinessFinancialTick({
      business,
      economy,
      macro,
      agentEffects: agentPhase.businessEffects,
      seed: workingState.seed,
      tick: advancedClock.tick,
    }).business,
  );

  const primaryBusiness = businesses[0];
  const primarySnapshot = primaryBusiness?.lastTick;
  const previousBusiness = workingState.businesses[0];
  const reputationDelta = primarySnapshot
    ? primarySnapshot.netProfitAoa >= 0 && primarySnapshot.demandIndex >= 55
      ? 0.4
      : -0.6
    : 0;
  const businessesWithReputation = businesses.map((business, index) =>
    index === 0
      ? {
          ...business,
          reputation: clamp(
            (previousBusiness?.reputation ?? business.reputation) + reputationDelta,
            0,
            100,
          ),
        }
      : business,
  );

  if (primarySnapshot && primarySnapshot.unitsSold > 0) {
    emittedEvents.push({
      type: "BUSINESS_SALES",
      tick: advancedClock.tick,
      message: `Vendas do dia concluídas: +${primarySnapshot.grossRevenueAoa.toLocaleString("pt-AO")} Kz (${primarySnapshot.unitsSold} clientes atendidos).`,
    });
  }

  emittedEvents.push({
    type: "TICK_COMPLETED",
    tick: advancedClock.tick,
    message: `Tick ${advancedClock.tick} concluído (Fase 3).`,
  });

  if (isWeeklyBoundary(advancedClock)) {
    emittedEvents.push({
      type: "WEEK_SUMMARY",
      tick: advancedClock.tick,
      message: "Resumo semanal: métricas consolidadas.",
    });
  }

  if (isMonthlyBoundary(advancedClock)) {
    emittedEvents.push({
      type: "MONTHLY_CLOSE",
      tick: advancedClock.tick,
      message: "Fecho financeiro mensal processado.",
    });
  }

  return {
    state: {
      ...workingState,
      clock: advancedClock,
      economy,
      macro,
      businesses: businessesWithReputation,
      activeEvents,
      history: [
        ...workingState.history,
        {
          tick: advancedClock.tick,
          date: formatSimulationDate(advancedClock),
          cashAoa: primaryBusiness?.cashAoa ?? 0,
          grossRevenueAoa: primarySnapshot?.grossRevenueAoa ?? 0,
          netProfitAoa: primarySnapshot?.netProfitAoa ?? 0,
          demandIndex: primarySnapshot?.demandIndex ?? 0,
          reputation: businessesWithReputation[0]?.reputation ?? 0,
          eventTypes: generatedEvents.map((event) => event.type),
          automaticDecisions: [],
        },
      ],
    },
    emittedEvents,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value * 10) / 10));
}
