import type {
  EconomicModifierProposal,
  SimulationEventPayload,
  SimulationState,
} from "@/types/simulation";
import { SimulationEventBus } from "./eventBus";
import {
  createInitialSimulationState,
  toWorldState,
  type CreateSimulationStateOptions,
} from "./state";
import { runSimulationTick } from "./tick";
import { BaseSimulationAgent, applyAgentModifiers } from "./agents";
import { formatSimulationDate } from "./clock";
import {
  appendAutomaticDecisions,
  applyAutoPilotDecision,
  createEmergencyEvent,
  getEmergencyReason,
  type AutoPilotDecision,
} from "@/core/simulation/autoPilot";

export interface SimulationEngineOptions extends CreateSimulationStateOptions {
  onEvent?: (payload: SimulationEventPayload) => void;
}

export interface AutoPilotBatchResult {
  events: SimulationEventPayload[];
  decisions: Array<AutoPilotDecision & { tick: number }>;
  startTick: number;
  endTick: number;
  stopped: boolean;
  emergencyReason: string | null;
}

/**
 * Motor central de simulação — tempo, estado e eventos.
 * 100% TypeScript puro, sem dependências React.
 */
export class SimulationEngine {
  private state: SimulationState;
  private bus = new SimulationEventBus();
  private agents: BaseSimulationAgent[] = [];

  constructor(options: SimulationEngineOptions = {}) {
    this.state = createInitialSimulationState(options);

    if (options.onEvent) {
      this.bus.on("*", options.onEvent);
    }
  }

  getState(): Readonly<SimulationState> {
    return this.state;
  }

  getEventBus(): SimulationEventBus {
    return this.bus;
  }

  registerAgent(agentId: string): BaseSimulationAgent {
    const agent = new BaseSimulationAgent(
      agentId,
      () => this.state,
      this.bus,
    );
    this.agents.push(agent);
    return agent;
  }

  setSelectedZone(zoneId: string | null): void {
    this.state = { ...this.state, selectedZoneId: zoneId };
  }

  setSpeed(speed: SimulationState["clock"]["speed"]): void {
    this.state = {
      ...this.state,
      clock: { ...this.state.clock, speed },
    };
  }

  setBusinessPrice(businessId: string, unitPriceAoa: number): boolean {
    const business = this.state.businesses.find((item) => item.id === businessId);
    if (!business) return false;

    this.state = {
      ...this.state,
      businesses: this.state.businesses.map((item) =>
        item.id === businessId
          ? { ...item, unitPriceAoa: Math.max(item.variableCostPerUnitAoa * 1.05, Math.round(unitPriceAoa)) }
          : item,
      ),
    };
    return true;
  }

  purchaseStock(businessId: string, units: number): boolean {
    const business = this.state.businesses.find((item) => item.id === businessId);
    const quantity = Math.floor(units);
    if (!business || quantity <= 0) return false;

    const totalCost = Math.round(quantity * business.variableCostPerUnitAoa * 1.1);
    if (business.cashAoa < totalCost) return false;

    this.state = {
      ...this.state,
      businesses: this.state.businesses.map((item) =>
        item.id === businessId
          ? { ...item, cashAoa: item.cashAoa - totalCost, stockUnits: item.stockUnits + quantity }
          : item,
      ),
    };
    return true;
  }

  changeEmployees(businessId: string, delta: number): boolean {
    const business = this.state.businesses.find((item) => item.id === businessId);
    if (!business || !Number.isInteger(delta) || delta === 0) return false;

    const employees = Math.max(1, business.employees + delta);
    const hiringCost = delta > 0 ? delta * 120_000 : 0;
    if (business.cashAoa < hiringCost) return false;

    this.state = {
      ...this.state,
      businesses: this.state.businesses.map((item) =>
        item.id === businessId
          ? {
              ...item,
              employees,
              cashAoa: item.cashAoa - hiringCost,
              fixedCostDailyAoa: Math.max(25_000, item.fixedCostDailyAoa + delta * 12_000),
            }
          : item,
      ),
    };
    return true;
  }

  buyGeneratorFuel(businessId: string, amount: number): boolean {
    const business = this.state.businesses.find((item) => item.id === businessId);
    const units = Math.max(1, Math.floor(amount));
    const cost = units * 18_000;
    if (!business || business.cashAoa < cost) return false;

    this.state = {
      ...this.state,
      macro: {
        ...this.state.macro,
        generatorFuelCostMultiplier: Math.max(
          1,
          this.state.macro.generatorFuelCostMultiplier - units * 0.01,
        ),
      },
      businesses: this.state.businesses.map((item) =>
        item.id === businessId ? { ...item, cashAoa: item.cashAoa - cost } : item,
      ),
    };
    return true;
  }

  /** Executa um tick diário e retorna eventos emitidos. */
  tick(): SimulationEventPayload[] {
    const result = runSimulationTick(this.state);
    this.state = result.state;

    for (const payload of result.emittedEvents) {
      this.bus.emit(payload);
    }

    const proposals = this.agents.flatMap((agent) =>
      agent.consumePendingModifiers(),
    );
    this.state = applyAgentModifiers(this.state, proposals);

    return result.emittedEvents;
  }

  /** Executa múltiplos ticks consecutivos. */
  runTicks(count: number): SimulationEventPayload[] {
    const all: SimulationEventPayload[] = [];
    for (let i = 0; i < count; i += 1) {
      all.push(...this.tick());
    }
    return all;
  }

  runAutoPilotTicks(count: number): AutoPilotBatchResult {
    const requested = Math.max(0, Math.floor(count));
    const events: SimulationEventPayload[] = [];
    const decisions: Array<AutoPilotDecision & { tick: number }> = [];
    const startTick = this.state.clock.tick;
    let stopped = false;
    let emergencyReason: string | null = null;

    for (let index = 0; index < requested; index += 1) {
      const previousState = this.state;
      const managed = applyAutoPilotDecision(previousState);
      this.state = managed.state;
      const tickEvents = this.tick();
      this.state = appendAutomaticDecisions(this.state, managed.decision.messages);
      events.push(...tickEvents);
      decisions.push({ ...managed.decision, tick: this.state.clock.tick });

      emergencyReason = getEmergencyReason(this.state, previousState);
      if (emergencyReason) {
        stopped = true;
        const emergencyEvent = createEmergencyEvent(this.state, emergencyReason);
        events.push(emergencyEvent);
        this.bus.emit(emergencyEvent);
        break;
      }
    }

    return {
      events,
      decisions,
      startTick,
      endTick: this.state.clock.tick,
      stopped,
      emergencyReason,
    };
  }

  /** Resumo legível do estado actual. */
  getSnapshotLabel(): string {
    const { clock, economy, macro } = this.state;
    return [
      formatSimulationDate(clock),
      `tick=${clock.tick}`,
      `inflação=${(economy.inflation * 100).toFixed(2)}%`,
      `USD/AOA=${economy.exchangeRateUsdAoa.toFixed(2)}`,
      `juros=${(economy.interestRate * 100).toFixed(2)}%`,
      `divisas=${(macro.forexScarcityIndex * 100).toFixed(0)}%`,
      `alfândega=${macro.customsDelayDays.toFixed(1)}d`,
      `eventos=${this.state.activeEvents.length}`,
    ].join(" | ");
  }
}

export {
  SimulationEventBus,
  createInitialSimulationState,
  toWorldState,
  runSimulationTick,
  formatSimulationDate,
  BaseSimulationAgent,
  applyAgentModifiers,
};

export type {
  CreateSimulationStateOptions,
  EconomicModifierProposal,
  SimulationEventPayload,
  SimulationState,
};
