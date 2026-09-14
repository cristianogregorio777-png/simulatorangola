/**
 * Tipos base da simulação. Nesta fase (Fase 1) estes tipos existem apenas
 * para preparar a arquitetura dos futuros engines — nenhuma lógica de
 * simulação real é executada ainda.
 */

/** Representa o relógio da simulação (tempo do mundo, não tempo real). */
export interface SimulationClock {
  /** Dia simulado, começando em 1. */
  day: number;
  /** Ano simulado dentro do mundo de Angola. */
  year: number;
  /** Velocidade da simulação: 0 = pausado. */
  speed: 0 | 1 | 2 | 3;
}

/** Indicadores macro que futuramente virão do Economy Engine. */
export interface EconomyIndicators {
  inflation: number;
  gdpGrowth: number;
  exchangeRateUsdAoa: number;
}

/** Estado mínimo do "mundo" usado para inicializar a World Screen. */
export interface WorldState {
  clock: SimulationClock;
  economy: EconomyIndicators;
  selectedProvinceId: string | null;
}
