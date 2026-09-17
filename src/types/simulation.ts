/**
 * Tipos do motor de simulação — desacoplados de React e da UI.
 */

import type { BusinessCategory } from "@/types/geo";

/** Representa o relógio da simulação (tempo do mundo, não tempo real). */
export interface SimulationClock {
  /** Dia simulado dentro do mês (1–30). */
  day: number;
  /** Mês simulado (1–12). */
  month: number;
  /** Ano simulado dentro do mundo de Angola. */
  year: number;
  /** Número total de ticks (dias) decorridos desde o início. */
  tick: number;
  /** Velocidade da simulação: 0 = pausado. */
  speed: 0 | 1 | 2 | 3;
}

/** Indicadores macroeconómicos simulados. */
export interface EconomyIndicators {
  /** Taxa de inflação anual simulada (ex.: 0.15 = 15%). */
  inflation: number;
  /** Crescimento do PIB anual simulado. */
  gdpGrowth: number;
  /** Câmbio simulado AOA por 1 USD. */
  exchangeRateUsdAoa: number;
  /** Taxa de juros de referência simulada (BNA). */
  interestRate: number;
}

/** Tipos de eventos emitidos pelo Simulation Engine. */
export type SimulationEventType =
  | "TICK_COMPLETED"
  | "WEEK_SUMMARY"
  | "MONTHLY_CLOSE"
  | "CURRENCY_DEVALUATION"
  | "POWER_OUTAGE_EVENT"
  | "SUPPLY_CHAIN_DISRUPTION"
  | "INFLATION_SPIKE"
  | "SUBSIDY_CUT"
  | "HEAVY_RAIN_LOGISTICS"
  | "FOREX_SCARCITY"
  | "CUSTOMS_PORT_DELAY"
  | "AGENT_DECISION";

/** Instância de evento activo ou histórico dentro do estado. */
export interface SimulationEventInstance {
  id: string;
  type: SimulationEventType;
  tick: number;
  /** Zona afectada, quando aplicável. */
  zoneId?: string;
  /** Modificadores numéricos aplicados pelo evento. */
  modifiers: Record<string, number>;
  /** Duração restante em ticks (0 = evento pontual). */
  remainingTicks: number;
  message: string;
}

/** Payload genérico para o barramento de eventos. */
export interface SimulationEventPayload {
  type: SimulationEventType;
  tick: number;
  zoneId?: string;
  modifiers?: Record<string, number>;
  message?: string;
  remainingTicks?: number;
}

/** Modificador económico proposto por um agente de IA (não altera estado directamente). */
export interface EconomicModifierProposal {
  source: string;
  tick: number;
  target:
    | "inflation"
    | "exchangeRateUsdAoa"
    | "interestRate"
    | "gdpGrowth"
    | "basketCostAoa"
    | "forexScarcityIndex"
    | "customsDelayDays"
    | "generatorFuelCostMultiplier";
  delta: number;
  reason: string;
}

/** Contexto macro angolano além dos indicadores headline. */
export interface AngolaMacroContext {
  /** Custo estimado da cesta básica (AOA). */
  basketCostAoa: number;
  /** Participação do sector formal (0–1). */
  formalEconomyShare: number;
  /** Participação da economia informal (0–1). */
  informalEconomyShare: number;
  /** Massa monetária estimada no informal (0–1). */
  informalMonetaryMassShare: number;
  /** Adimplência fiscal / AGT (0–1). */
  taxComplianceRate: number;
  /** Pressão de concorrência desleal do informal (0–1). */
  unfairCompetitionPressure: number;
  /** Escassez de divisas (0–1). */
  forexScarcityIndex: number;
  /** Atraso médio alfândega/porto de Luanda (dias). */
  customsDelayDays: number;
  /** Multiplicador de custo de gerador por falhas eléctricas. */
  generatorFuelCostMultiplier: number;
}

/** Resultado financeiro de um tick para uma unidade de negócio. */
export interface BusinessTickSnapshot {
  unitsSold: number;
  grossRevenueAoa: number;
  variableCostsAoa: number;
  fixedCostsAoa: number;
  netProfitAoa: number;
  demandIndex: number;
}

/** Estado operacional e financeiro de um negócio simulado. */
export interface BusinessUnitState {
  id: string;
  name: string;
  zoneId: string;
  category: BusinessCategory;
  cashAoa: number;
  unitPriceAoa: number;
  stockUnits: number;
  employees: number;
  reputation: number;
  variableCostPerUnitAoa: number;
  fixedCostDailyAoa: number;
  priceElasticity: number;
  lastTick?: BusinessTickSnapshot;
}

/** Registo imutável de um dia processado, usado pelo calendário e relatórios. */
export interface SimulationHistoryEntry {
  tick: number;
  date: string;
  cashAoa: number;
  grossRevenueAoa: number;
  netProfitAoa: number;
  demandIndex: number;
  reputation: number;
  eventTypes: SimulationEventType[];
  automaticDecisions: string[];
}

/** Efeitos locais propostos por agentes (clientes/concorrentes). */
export interface BusinessAgentEffect {
  businessId: string;
  demandMultiplier?: number;
  competitorPriceDeltaAoa?: number;
}

/** Saída estruturada validada de um agente especializado. */
export interface AgentStructuredOutput {
  agentId: string;
  modifiers: EconomicModifierProposal[];
  events: SimulationEventPayload[];
  businessEffects: BusinessAgentEffect[];
  usedFallback: boolean;
  provider?: string;
}

/** Estado global imutável gerido pelo Simulation Engine. */
export interface SimulationState {
  clock: SimulationClock;
  economy: EconomyIndicators;
  macro: AngolaMacroContext;
  businesses: BusinessUnitState[];
  /** Zona seleccionada pelo jogador (bairro, município ou província). */
  selectedZoneId: string | null;
  /** Eventos activos com efeito contínuo. */
  activeEvents: SimulationEventInstance[];
  history: SimulationHistoryEntry[];
  /** Semente determinística para variações económicas reproducíveis. */
  seed: number;
}

/** Estado mínimo do "mundo" usado para inicializar a World Screen (UI). */
export interface WorldState {
  clock: Pick<SimulationClock, "day" | "year" | "speed">;
  economy: Pick<
    EconomyIndicators,
    "inflation" | "gdpGrowth" | "exchangeRateUsdAoa"
  >;
  selectedProvinceId: string | null;
}

/** Contrato de leitura do estado para agentes de IA externos ao motor. */
export interface SimulationAgentReader {
  getState(): Readonly<SimulationState>;
}

/** Contrato de escrita indirecta — agentes propõem eventos/modificadores. */
export interface SimulationAgentEmitter {
  emit(payload: SimulationEventPayload): void;
  proposeModifier(proposal: EconomicModifierProposal): void;
}

/** Interface completa para futuros agentes (Market, Event, etc.). */
export interface SimulationAgent
  extends SimulationAgentReader,
    SimulationAgentEmitter {
  readonly id: string;
}
