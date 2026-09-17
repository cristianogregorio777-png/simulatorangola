import type {
  AngolaMacroContext,
  EconomyIndicators,
  SimulationEventInstance,
} from "@/types/simulation";
import { createSeededRandom, hashTickSeed } from "@/lib/simulation/deterministic/prng";

export interface MacroTickInput {
  macro: AngolaMacroContext;
  economy: EconomyIndicators;
  seed: number;
  tick: number;
  activeEvents: SimulationEventInstance[];
}

/**
 * Evolução macro local: formal/informal, cesta básica, divisas, alfândega e geradores.
 */
export function advanceAngolaMacroEconomy(input: MacroTickInput): AngolaMacroContext {
  const { macro, economy, seed, tick, activeEvents } = input;
  const random = createSeededRandom(hashTickSeed(seed, tick + 9001));

  const inflationPressure = economy.inflation - 0.12;
  const basketDrift =
    economy.inflation * 420 + (random() - 0.45) * 800 + inflationPressure * 600;

  let basketCostAoa = Math.max(120_000, macro.basketCostAoa + basketDrift / 30);

  let forexScarcityIndex = macro.forexScarcityIndex;
  forexScarcityIndex += (economy.exchangeRateUsdAoa / 900 - 1) * 0.02;
  forexScarcityIndex += inflationPressure * 0.015;
  forexScarcityIndex += (random() - 0.5) * 0.012;

  let customsDelayDays = macro.customsDelayDays;
  customsDelayDays += forexScarcityIndex > 0.55 ? 0.08 : -0.02;
  customsDelayDays += (random() - 0.48) * 0.15;

  let generatorFuelCostMultiplier = macro.generatorFuelCostMultiplier;
  generatorFuelCostMultiplier +=
    (economy.inflation - 0.14) * 0.04 + (random() - 0.5) * 0.004;

  let informalEconomyShare = macro.informalEconomyShare;
  informalEconomyShare +=
    inflationPressure * 0.008 + forexScarcityIndex * 0.006 - macro.taxComplianceRate * 0.004;
  informalEconomyShare = clamp01(informalEconomyShare);

  const formalEconomyShare = clamp01(1 - informalEconomyShare * 0.92);

  let unfairCompetitionPressure = macro.unfairCompetitionPressure;
  unfairCompetitionPressure +=
    informalEconomyShare * 0.02 - formalEconomyShare * 0.01 + (random() - 0.5) * 0.01;

  let taxComplianceRate = macro.taxComplianceRate;
  taxComplianceRate -= informalEconomyShare * 0.004 + unfairCompetitionPressure * 0.003;
  taxComplianceRate += economy.interestRate > 0.2 ? 0.002 : -0.001;

  let informalMonetaryMassShare = macro.informalMonetaryMassShare;
  informalMonetaryMassShare +=
    informalEconomyShare * 0.01 - taxComplianceRate * 0.005 + (random() - 0.5) * 0.008;

  for (const event of activeEvents) {
    if (event.type === "FOREX_SCARCITY") {
      forexScarcityIndex += 0.03;
      customsDelayDays += 0.5;
    }
    if (event.type === "CUSTOMS_PORT_DELAY") {
      customsDelayDays += 1.2;
    }
    if (event.type === "POWER_OUTAGE_EVENT") {
      generatorFuelCostMultiplier += 0.015;
    }
    if (event.type === "SUBSIDY_CUT") {
      basketCostAoa *= 1.008;
    }
  }

  return {
    basketCostAoa: Math.round(basketCostAoa),
    formalEconomyShare: round4(formalEconomyShare),
    informalEconomyShare: round4(informalEconomyShare),
    informalMonetaryMassShare: round4(clamp01(informalMonetaryMassShare)),
    taxComplianceRate: round4(clamp01(taxComplianceRate)),
    unfairCompetitionPressure: round4(clamp01(unfairCompetitionPressure)),
    forexScarcityIndex: round4(clamp01(forexScarcityIndex)),
    customsDelayDays: round2(Math.max(2, Math.min(25, customsDelayDays))),
    generatorFuelCostMultiplier: round4(
      Math.max(1, Math.min(2.2, generatorFuelCostMultiplier)),
    ),
  };
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function round4(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
