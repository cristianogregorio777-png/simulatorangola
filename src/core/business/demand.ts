import { calculateZoneDemandIndex } from "@/lib/simulation/world";
import type { AngolaMacroContext, EconomyIndicators } from "@/types/simulation";

export interface DemandCurveInput {
  zoneId: string;
  unitPriceAoa: number;
  referencePriceAoa: number;
  priceElasticity: number;
  economy: EconomyIndicators;
  macro: AngolaMacroContext;
  demandMultiplier?: number;
  /** Ruído determinístico 0–1 para volume diário. */
  volumeNoise?: number;
}

/**
 * Curva de demanda local: poder de compra da zona, inflação e elasticidade de preço.
 */
export function calculateDemandUnits(input: DemandCurveInput): {
  demandIndex: number;
  unitsSold: number;
} {
  const zoneBase = calculateZoneDemandIndex(input.zoneId);
  const purchasingPowerFactor =
    1 - input.economy.inflation * 0.35 - input.macro.basketCostAoa / 400_000 * 0.08;

  const priceRatio = input.unitPriceAoa / Math.max(1, input.referencePriceAoa);
  const priceEffect = Math.pow(priceRatio, -Math.max(0.2, input.priceElasticity));

  const informalDrag =
    1 - input.macro.unfairCompetitionPressure * 0.12 * input.macro.informalEconomyShare;

  const agentFactor = input.demandMultiplier ?? 1;

  const demandIndex = Math.max(
    5,
    Math.min(
      100,
      Math.round(zoneBase * purchasingPowerFactor * priceEffect * informalDrag * agentFactor),
    ),
  );

  const noise = input.volumeNoise ?? 0.5;
  const baseUnits = 12 + demandIndex * 0.45;
  const unitsSold = Math.max(0, Math.round(baseUnits * (0.85 + noise * 0.3)));

  return { demandIndex, unitsSold };
}
