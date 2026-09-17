import type { AgentStructuredOutput, SimulationState } from "@/types/simulation";
import { createSeededRandom, hashTickSeed } from "@/lib/simulation/deterministic/prng";

function baseOutput(agentId: string): AgentStructuredOutput {
  return {
    agentId,
    usedFallback: true,
    provider: "deterministic",
    modifiers: [],
    events: [],
    businessEffects: [],
  };
}

/** Market Agent — oscilações macro e política monetária. */
export function runMarketAgentDeterministic(state: SimulationState): AgentStructuredOutput {
  const tick = state.clock.tick;
  const random = createSeededRandom(hashTickSeed(state.seed, tick + 101));
  const output = baseOutput("market-agent");

  if (state.economy.inflation > 0.16 && random() < 0.35) {
    output.modifiers.push({
      source: "market-agent",
      tick,
      target: "interestRate",
      delta: 0.0015,
      reason: "BNA aperta liquidez face à inflação persistente.",
    });
  }

  if (state.macro.forexScarcityIndex > 0.5 && random() < 0.25) {
    output.modifiers.push({
      source: "market-agent",
      tick,
      target: "exchangeRateUsdAoa",
      delta: 2.5,
      reason: "Pressão cambial no mercado paralelo.",
    });
  }

  return output;
}

/** Customer Agent — intenção de compra vs preços e cesta básica. */
export function runCustomerAgentDeterministic(state: SimulationState): AgentStructuredOutput {
  const tick = state.clock.tick;
  const random = createSeededRandom(hashTickSeed(state.seed, tick + 202));
  const output = baseOutput("customer-agent");
  const business = state.businesses[0];
  if (!business) return output;

  const basketStress = state.macro.basketCostAoa / 285_000;
  const demandMultiplier =
    basketStress > 1.05 ? 0.92 - random() * 0.04 : 1.02 + random() * 0.03;

  output.businessEffects.push({
    businessId: business.id,
    demandMultiplier: round4(demandMultiplier),
  });

  return output;
}

/** Competitor Agent — reacção de concorrentes locais. */
export function runCompetitorAgentDeterministic(state: SimulationState): AgentStructuredOutput {
  const tick = state.clock.tick;
  const random = createSeededRandom(hashTickSeed(state.seed, tick + 303));
  const output = baseOutput("competitor-agent");
  const business = state.businesses[0];
  if (!business) return output;

  if (random() < 0.4) {
    output.businessEffects.push({
      businessId: business.id,
      competitorPriceDeltaAoa: random() < 0.5 ? -120 : 80,
    });
  }

  return output;
}

/** Event Agent — choques da realidade angolana. */
export function runEventAgentDeterministic(state: SimulationState): AgentStructuredOutput {
  const tick = state.clock.tick;
  const random = createSeededRandom(hashTickSeed(state.seed, tick + 404));
  const output = baseOutput("event-agent");

  if (random() < 0.07) {
    output.events.push({
      type: "SUBSIDY_CUT",
      tick,
      modifiers: { basketCostAoa: 3500, inflation: 0.0018 },
      message: "Corte parcial de subsídios a combustíveis eleva custos logísticos.",
      remainingTicks: 6,
    });
  }

  if (random() < 0.06) {
    output.events.push({
      type: "HEAVY_RAIN_LOGISTICS",
      tick,
      zoneId: state.selectedZoneId ?? undefined,
      modifiers: { supplyCost: 1.05, leadTimeDays: 1 },
      message: "Chuvas intensas afectam entregas na periferia de Luanda.",
      remainingTicks: 3,
    });
  }

  if (state.macro.forexScarcityIndex > 0.45 && random() < 0.08) {
    output.events.push({
      type: "FOREX_SCARCITY",
      tick,
      modifiers: { forexScarcityIndex: 0.04 },
      message: "Escassez de divisas limita importações de stock.",
      remainingTicks: 5,
    });
  }

  if (random() < 0.05) {
    output.events.push({
      type: "CUSTOMS_PORT_DELAY",
      tick,
      modifiers: { customsDelayDays: 1.5, supplyCost: 1.04 },
      message: "Congestionamento no porto de Luanda atrasa desalfandegamento.",
      remainingTicks: 4,
    });
  }

  return output;
}

export function runAllAgentsDeterministic(state: SimulationState): AgentStructuredOutput[] {
  return [
    runMarketAgentDeterministic(state),
    runCustomerAgentDeterministic(state),
    runCompetitorAgentDeterministic(state),
    runEventAgentDeterministic(state),
  ];
}

function round4(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}
