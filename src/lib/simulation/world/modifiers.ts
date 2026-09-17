import type { BusinessCategory, ZoneId } from "@/types/geo";
import { getRegionalProfile, resolveZoneHierarchy } from "./registry";

/** Custo operacional base diário em AOA por tipo de negócio (referência nacional). */
const BASE_DAILY_OPERATING_COST_AOA: Record<BusinessCategory, number> = {
  retail: 185_000,
  food_and_beverage: 220_000,
  services: 145_000,
  logistics: 310_000,
  manufacturing: 480_000,
  technology: 265_000,
  real_estate: 195_000,
  other: 160_000,
};

/** Multiplicadores de sensibilidade à infraestrutura por categoria. */
const INFRA_SENSITIVITY: Record<BusinessCategory, number> = {
  retail: 0.28,
  food_and_beverage: 0.35,
  services: 0.22,
  logistics: 0.48,
  manufacturing: 0.42,
  technology: 0.38,
  real_estate: 0.18,
  other: 0.25,
};

export interface LocalOperatingCostBreakdown {
  zoneId: ZoneId;
  businessType: BusinessCategory;
  baseCostAoa: number;
  infrastructureMultiplier: number;
  informalAdjustment: number;
  purchasingPowerMultiplier: number;
  totalDailyCostAoa: number;
}

function averageInfrastructureScore(
  profile: ReturnType<typeof getRegionalProfile>,
): number {
  const { infrastructure } = profile;
  return (
    (infrastructure.powerStability +
      infrastructure.waterSupply +
      infrastructure.connectivity +
      infrastructure.roadsLogistics) /
    4
  );
}

/**
 * Calcula o custo operacional diário estimado para um negócio numa zona.
 * Fórmula determinística — sem dependência de APIs externas.
 */
export function calculateLocalOperatingCost(
  zoneId: ZoneId,
  businessType: BusinessCategory,
): LocalOperatingCostBreakdown {
  const profile = getRegionalProfile(zoneId);
  const baseCostAoa = BASE_DAILY_OPERATING_COST_AOA[businessType];
  const infraScore = averageInfrastructureScore(profile);
  const sensitivity = INFRA_SENSITIVITY[businessType];

  // Infraestrutura fraca aumenta custos (geradores, perdas, logística)
  const infrastructureMultiplier = 1 + ((100 - infraScore) / 100) * sensitivity;

  // Economia informal reduz custos formais ( tributação/compliance )
  const informalAdjustment = 1 - profile.informalEconomyRate * 0.12;

  // Poder de compra local afecta custos de factor (salários, rendas)
  const purchasingPowerMultiplier =
    0.85 + (profile.purchasingPowerIndex / 100) * 0.3;

  const totalDailyCostAoa = Math.round(
    baseCostAoa *
      infrastructureMultiplier *
      informalAdjustment *
      purchasingPowerMultiplier,
  );

  return {
    zoneId,
    businessType,
    baseCostAoa,
    infrastructureMultiplier,
    informalAdjustment,
    purchasingPowerMultiplier,
    totalDailyCostAoa,
  };
}

/** Índice composto de atractividade comercial da zona (0–100). */
export function calculateZoneDemandIndex(zoneId: ZoneId): number {
  const profile = getRegionalProfile(zoneId);
  const infra = averageInfrastructureScore(profile);
  const hierarchy = resolveZoneHierarchy(zoneId);

  let demand =
    profile.purchasingPowerIndex * 0.45 +
    infra * 0.25 +
    (1 - profile.informalEconomyRate) * 30;

  if (hierarchy?.province?.slug === "luanda") {
    demand += 8;
  }

  return Math.min(100, Math.max(0, Math.round(demand)));
}

/** Modificador de risco operacional (0–1) — usado pelo Event Engine. */
export function calculateOperationalRiskModifier(zoneId: ZoneId): number {
  const profile = getRegionalProfile(zoneId);
  const powerRisk = (100 - profile.infrastructure.powerStability) / 100;
  const logisticsRisk = (100 - profile.infrastructure.roadsLogistics) / 100;
  return Math.min(1, powerRisk * 0.55 + logisticsRisk * 0.25 + profile.informalEconomyRate * 0.2);
}
