import { calculateLocalOperatingCost } from "@/lib/simulation/world";
import type {
  AngolaMacroContext,
  BusinessAgentEffect,
  BusinessTickSnapshot,
  BusinessUnitState,
  EconomyIndicators,
} from "@/types/simulation";
import { createSeededRandom, hashTickSeed } from "@/lib/simulation/deterministic/prng";
import { calculateDemandUnits } from "./demand";

export interface BusinessTickInput {
  business: BusinessUnitState;
  economy: EconomyIndicators;
  macro: AngolaMacroContext;
  agentEffects: BusinessAgentEffect[];
  seed: number;
  tick: number;
}

export interface BusinessTickResult {
  business: BusinessUnitState;
  snapshot: BusinessTickSnapshot;
}

/** Avanço microeconómico diário: receita, custos e caixa. */
export function runBusinessFinancialTick(input: BusinessTickInput): BusinessTickResult {
  const { business, economy, macro, agentEffects, seed, tick } = input;
  const volumeNoise = createSeededRandom(hashTickSeed(seed, tick + 4400))();
  const effect = agentEffects.find((item) => item.businessId === business.id);

  const localCost = calculateLocalOperatingCost(business.zoneId, business.category);
  const referencePrice = business.variableCostPerUnitAoa * 1.35;

  let unitPrice = business.unitPriceAoa;
  if (effect?.competitorPriceDeltaAoa) {
    unitPrice = Math.max(
      business.variableCostPerUnitAoa * 1.05,
      unitPrice + effect.competitorPriceDeltaAoa * 0.35,
    );
  }

  const { demandIndex, unitsSold } = calculateDemandUnits({
    zoneId: business.zoneId,
    unitPriceAoa: unitPrice,
    referencePriceAoa: referencePrice,
    priceElasticity: business.priceElasticity,
    economy,
    macro,
    demandMultiplier: effect?.demandMultiplier,
    volumeNoise,
  });

  const sold = Math.min(unitsSold, business.stockUnits);
  const grossRevenueAoa = sold * unitPrice;

  const importPremium = 1 + macro.forexScarcityIndex * 0.08 + macro.customsDelayDays * 0.004;
  const variableCostsAoa = sold * business.variableCostPerUnitAoa * importPremium;

  const scaledLocalCost = Math.min(
    localCost.totalDailyCostAoa,
    Math.max(3_000, business.cashAoa * 0.012),
  );
  const energyCost =
    scaledLocalCost * 0.18 * macro.generatorFuelCostMultiplier;
  const rentAndPayroll = business.fixedCostDailyAoa * 0.62;
  const localWasteAndTradeFee = Math.max(500, scaledLocalCost * 0.06);
  const taxBurden =
    (business.fixedCostDailyAoa + grossRevenueAoa * 0.025) *
    0.15 *
    (1.4 - macro.taxComplianceRate);

  const fixedCostsAoa = Math.round(
    rentAndPayroll + energyCost + localWasteAndTradeFee + taxBurden,
  );
  const netProfitAoa = Math.round(grossRevenueAoa - variableCostsAoa - fixedCostsAoa);
  const cashAoa = business.cashAoa + netProfitAoa;

  const snapshot: BusinessTickSnapshot = {
    unitsSold: sold,
    grossRevenueAoa: Math.round(grossRevenueAoa),
    variableCostsAoa: Math.round(variableCostsAoa),
    fixedCostsAoa,
    netProfitAoa,
    demandIndex,
  };

  return {
    business: {
      ...business,
      unitPriceAoa: Math.round(unitPrice),
      cashAoa,
      stockUnits: Math.max(0, business.stockUnits - sold),
      lastTick: snapshot,
    },
    snapshot,
  };
}

/** Formata DRE simplificada para logs CLI. */
export function formatBusinessDre(
  business: BusinessUnitState,
  snapshot: BusinessTickSnapshot,
): string {
  return [
    `DRE ${business.name}`,
    `  Receita bruta: ${snapshot.grossRevenueAoa.toLocaleString("pt-AO")} AOA`,
    `  Custos variáveis: ${snapshot.variableCostsAoa.toLocaleString("pt-AO")} AOA`,
    `  Custos fixos: ${snapshot.fixedCostsAoa.toLocaleString("pt-AO")} AOA`,
    `  Resultado líquido: ${snapshot.netProfitAoa.toLocaleString("pt-AO")} AOA`,
    `  Caixa: ${business.cashAoa.toLocaleString("pt-AO")} AOA`,
  ].join("\n");
}
