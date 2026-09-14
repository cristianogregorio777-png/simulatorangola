import type { WorldState } from "@/types/simulation";

/**
 * Estado inicial do "mundo" usado apenas para popular a World Screen
 * nesta fase. O Simulation Engine real (relógio avançando, economia
 * dinâmica, etc.) será construído em uma fase futura.
 */
export const INITIAL_WORLD_STATE: WorldState = {
  clock: {
    day: 1,
    year: 2026,
    speed: 0,
  },
  economy: {
    inflation: 0,
    gdpGrowth: 0,
    exchangeRateUsdAoa: 0,
  },
  selectedProvinceId: null,
};
