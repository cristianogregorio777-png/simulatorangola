import type { AngolaMacroContext } from "@/types/simulation";

/** Valores iniciais calibrados para Angola (2026, simplificado). */
export const DEFAULT_ANGOLA_MACRO: AngolaMacroContext = {
  basketCostAoa: 285_000,
  formalEconomyShare: 0.42,
  informalEconomyShare: 0.58,
  informalMonetaryMassShare: 0.38,
  taxComplianceRate: 0.61,
  unfairCompetitionPressure: 0.52,
  forexScarcityIndex: 0.48,
  customsDelayDays: 6,
  generatorFuelCostMultiplier: 1.18,
};
