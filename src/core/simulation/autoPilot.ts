import type { SimulationEventPayload, SimulationState } from "@/types/simulation";
import { createSeededRandom, hashTickSeed } from "@/lib/simulation/deterministic/prng";

export type AutoPilotPerformance = "Ruim" | "Mediano" | "Bom" | "Excelente";

export interface AutoPilotDecision {
  performance: AutoPilotPerformance;
  messages: string[];
}

export interface AutoPilotStepResult {
  state: SimulationState;
  decision: AutoPilotDecision;
}

/** Decide operações delegadas sem chamar IA ou depender do browser. */
export function applyAutoPilotDecision(state: SimulationState): AutoPilotStepResult {
  const business = state.businesses[0];
  if (!business) {
    return { state, decision: { performance: "Ruim", messages: ["Sem negócio activo."] } };
  }

  const random = createSeededRandom(hashTickSeed(state.seed, state.clock.tick + 7_700));
  const demand = business.lastTick?.demandIndex ?? 60;
  const macroStress = state.macro.forexScarcityIndex + state.economy.inflation;
  const score =
    (business.cashAoa > 1_000_000 ? 1 : business.cashAoa > 300_000 ? 0.5 : 0) +
    business.reputation / 100 +
    (1 - Math.min(1, macroStress / 1.2)) +
    random() * 0.8;
  const performance: AutoPilotPerformance =
    score >= 2.35 ? "Excelente" : score >= 1.75 ? "Bom" : score >= 1.1 ? "Mediano" : "Ruim";

  const messages: string[] = [];
  let nextBusiness = business;
  const stockTarget = performance === "Ruim" ? 80 : demand > 65 ? 260 : 140;
  if (business.stockUnits < stockTarget) {
    const units = Math.min(stockTarget - business.stockUnits, Math.floor(business.cashAoa / (business.variableCostPerUnitAoa * 1.1)));
    if (units > 0) {
      const cost = Math.round(units * business.variableCostPerUnitAoa * 1.1);
      nextBusiness = { ...nextBusiness, stockUnits: nextBusiness.stockUnits + units, cashAoa: nextBusiness.cashAoa - cost };
      messages.push(`Comprou ${units} unidades de stock.`);
    }
  }

  if (performance === "Bom" || performance === "Excelente") {
    nextBusiness = { ...nextBusiness, unitPriceAoa: Math.round(nextBusiness.unitPriceAoa * (demand > 70 ? 1.01 : 0.99)) };
    messages.push("Ajustou o preço conforme a procura local.");
  } else if (performance === "Ruim") {
    nextBusiness = { ...nextBusiness, unitPriceAoa: Math.max(nextBusiness.variableCostPerUnitAoa * 1.05, Math.round(nextBusiness.unitPriceAoa * 0.98)) };
    messages.push("Reduziu o preço para proteger a procura.");
  }

  if (demand > 78 && performance !== "Ruim" && nextBusiness.cashAoa > 180_000) {
    nextBusiness = {
      ...nextBusiness,
      employees: nextBusiness.employees + 1,
      cashAoa: nextBusiness.cashAoa - 120_000,
      fixedCostDailyAoa: nextBusiness.fixedCostDailyAoa + 12_000,
    };
    messages.push("Contratou um colaborador para responder à procura.");
  }

  return {
    state: { ...state, businesses: [nextBusiness, ...state.businesses.slice(1)] },
    decision: { performance, messages },
  };
}

export function appendAutomaticDecisions(
  state: SimulationState,
  messages: string[],
): SimulationState {
  if (state.history.length === 0) return state;
  const history = [...state.history];
  const last = history[history.length - 1];
  history[history.length - 1] = { ...last, automaticDecisions: messages };
  return { ...state, history };
}

/** Interrompe saltos quando o negócio entra numa condição crítica. */
export function getEmergencyReason(
  state: SimulationState,
  previousState?: SimulationState,
): string | null {
  const business = state.businesses[0];
  if (!business) return "Negócio sem unidade operacional.";
  if (business.cashAoa <= 0) return "Falência iminente: caixa esgotado.";
  if (business.stockUnits <= 0) return "Stock esgotado: operação interrompida.";
  if (state.macro.generatorFuelCostMultiplier >= 2.05) return "Combustível de gerador em nível crítico.";
  if (previousState && state.economy.exchangeRateUsdAoa / previousState.economy.exchangeRateUsdAoa - 1 >= 0.05) {
    return "Choque cambial: alteração brusca no câmbio AOA/USD.";
  }
  if (
    state.macro.generatorFuelCostMultiplier >= 1.9 &&
    state.activeEvents.some((event) => event.type === "POWER_OUTAGE_EVENT")
  ) {
    return "Corte severo de energia detectado.";
  }
  return null;
}

export function createEmergencyEvent(state: SimulationState, reason: string): SimulationEventPayload {
  return { type: "AGENT_DECISION", tick: state.clock.tick, message: `AUTO-PILOT interrompido: ${reason}` };
}