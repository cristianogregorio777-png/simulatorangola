import type { BusinessUnitState } from "@/types/simulation";

/** Negócio de teste para scripts CLI da Fase 3. */
export function createTestRetailBusiness(zoneId: string): BusinessUnitState {
  return {
    id: "biz-test-retail-1",
    name: "Mercearia Kilamba (teste)",
    zoneId,
    category: "retail",
    targetAudience: "mid",
    cashAoa: 2_840_000,
    unitPriceAoa: 4_500,
    stockUnits: 420,
    employees: 18,
    reputation: 62,
    variableCostPerUnitAoa: 3_100,
    fixedCostDailyAoa: 95_000,
    priceElasticity: 1.15,
  };
}
