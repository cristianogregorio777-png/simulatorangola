import type { EconomyIndicators } from "@/types/simulation";
import { createSeededRandom, hashTickSeed } from "./prng";

/** Parâmetros macro calibrados para contexto angolano (simplificado). */
export const DEFAULT_ECONOMY: EconomyIndicators = {
  inflation: 0.152,
  gdpGrowth: 0.028,
  exchangeRateUsdAoa: 856,
  interestRate: 0.195,
};

export interface EconomyTickInput {
  economy: EconomyIndicators;
  seed: number;
  tick: number;
}

/**
 * Avanço económico diário determinístico.
 * Variações pequenas acumulam ao longo dos ticks.
 */
export function advanceEconomyDeterministic(
  input: EconomyTickInput,
): EconomyIndicators {
  const { economy, seed, tick } = input;
  const random = createSeededRandom(hashTickSeed(seed, tick));

  const inflationNoise = (random() - 0.5) * 0.0008;
  const inflation =
    economy.inflation + inflationNoise + (economy.inflation > 0.2 ? -0.0002 : 0.0001);

  const exchangeDrift = inflation * 0.35 + (random() - 0.48) * 0.002;
  const exchangeRateUsdAoa = Math.max(
    400,
    economy.exchangeRateUsdAoa * (1 + exchangeDrift / 30),
  );

  const gdpNoise = (random() - 0.5) * 0.0004;
  const gdpGrowth = Math.max(-0.05, Math.min(0.08, economy.gdpGrowth + gdpNoise));

  const rateAdjustment = (inflation - 0.15) * 0.02 + (random() - 0.5) * 0.0003;
  const interestRate = Math.max(
    0.05,
    Math.min(0.35, economy.interestRate + rateAdjustment),
  );

  return {
    inflation: round6(inflation),
    gdpGrowth: round6(gdpGrowth),
    exchangeRateUsdAoa: round2(exchangeRateUsdAoa),
    interestRate: round6(interestRate),
  };
}

/** Contexto serializável para fallback de IA (sem server-only). */
export function buildDeterministicInsightContext(
  economy: EconomyIndicators,
  zoneLabel: string,
): Record<string, unknown> {
  const demand = Math.round(
    50 + economy.gdpGrowth * 200 - economy.inflation * 80,
  );

  return {
    province: zoneLabel,
    provinceName: zoneLabel,
    cash: 2_840_000,
    cashBalance: 2_840_000,
    demand: Math.max(20, Math.min(95, demand)),
    inflation: economy.inflation,
    exchangeRateUsdAoa: economy.exchangeRateUsdAoa,
    interestRate: economy.interestRate,
  };
}

function round6(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
