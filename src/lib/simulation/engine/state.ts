import type { BusinessUnitState, SimulationState, WorldState } from "@/types/simulation";
import { DEFAULT_ECONOMY } from "@/lib/simulation/deterministic/economy";
import { DEFAULT_ANGOLA_MACRO } from "@/core/economy";
import { createTestRetailBusiness } from "@/core/business";
import { createInitialClock } from "./clock";

export interface CreateSimulationStateOptions {
  seed?: number;
  selectedZoneId?: string | null;
  startYear?: number;
  businesses?: BusinessUnitState[];
  includeTestBusiness?: boolean;
}

export function createInitialSimulationState(
  options: CreateSimulationStateOptions = {},
): SimulationState {
  const zoneId = options.selectedZoneId ?? "zone-talatona";
  const businesses =
    options.businesses ??
    (options.includeTestBusiness === false
      ? []
      : [createTestRetailBusiness(zoneId)]);

  return {
    clock: createInitialClock(options.startYear ?? 2026),
    economy: { ...DEFAULT_ECONOMY },
    macro: { ...DEFAULT_ANGOLA_MACRO },
    businesses,
    selectedZoneId: zoneId,
    activeEvents: [],
    history: [],
    seed: options.seed ?? 20260917,
  };
}

/** Converte o estado completo do motor para o subset usado pela UI. */
export function toWorldState(state: SimulationState): WorldState {
  return {
    clock: {
      day: state.clock.day,
      year: state.clock.year,
      speed: state.clock.speed,
    },
    economy: {
      inflation: state.economy.inflation,
      gdpGrowth: state.economy.gdpGrowth,
      exchangeRateUsdAoa: state.economy.exchangeRateUsdAoa,
    },
    selectedProvinceId: state.selectedZoneId?.startsWith("prov-")
      ? state.selectedZoneId
      : null,
  };
}
