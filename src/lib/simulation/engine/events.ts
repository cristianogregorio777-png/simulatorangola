import type {
  AngolaMacroContext,
  SimulationEventInstance,
  SimulationEventPayload,
  SimulationState,
} from "@/types/simulation";
import { calculateOperationalRiskModifier } from "@/lib/simulation/world/modifiers";
import { getAllZones } from "@/lib/simulation/world/registry";
import { createSeededRandom, hashTickSeed } from "@/lib/simulation/deterministic/prng";

function createEventId(type: string, tick: number, zoneId?: string): string {
  return `${type}-${tick}${zoneId ? `-${zoneId}` : ""}`;
}

function toEventInstance(payload: SimulationEventPayload): SimulationEventInstance {
  return {
    id: createEventId(payload.type, payload.tick, payload.zoneId),
    type: payload.type,
    tick: payload.tick,
    zoneId: payload.zoneId,
    modifiers: payload.modifiers ?? {},
    remainingTicks: payload.remainingTicks ?? 0,
    message: payload.message ?? payload.type,
  };
}

/** Gera eventos determinísticos com base no estado e na semente. */
export function generateDeterministicEvents(
  state: SimulationState,
): SimulationEventPayload[] {
  const events: SimulationEventPayload[] = [];
  const { clock, economy, seed } = state;
  const random = createSeededRandom(hashTickSeed(seed, clock.tick));
  const tick = clock.tick;

  // Desvalorização cambial quando inflação acumula
  if (economy.inflation > 0.165 && random() < 0.08) {
    events.push({
      type: "CURRENCY_DEVALUATION",
      tick,
      modifiers: { exchangeRateUsdAoa: 1.012 },
      message: "Pressão cambial: kwanza perde valor face ao USD.",
      remainingTicks: 3,
    });
  }

  // Pico de inflação
  if (random() < 0.04 && economy.inflation > 0.14) {
    events.push({
      type: "INFLATION_SPIKE",
      tick,
      modifiers: { inflation: 0.0025 },
      message: "Choque de preços no mercado interno.",
      remainingTicks: 5,
    });
  }

  // Corte de energia em zonas de risco
  const zones = getAllZones();
  for (const zone of zones) {
    const risk = calculateOperationalRiskModifier(zone.id);
    if (random() < risk * 0.06) {
      events.push({
        type: "POWER_OUTAGE_EVENT",
        tick,
        zoneId: zone.id,
        modifiers: { operationalCost: 1.08, demand: 0.92 },
        message: `Corte de energia reportado em ${zone.name}.`,
        remainingTicks: 2,
      });
      break;
    }
  }

  // Disrupção na cadeia de abastecimento
  if (random() < 0.03) {
    events.push({
      type: "SUPPLY_CHAIN_DISRUPTION",
      tick,
      modifiers: { supplyCost: 1.06, leadTimeDays: 2 },
      message: "Atrasos logísticos na distribuição nacional.",
      remainingTicks: 4,
    });
  }

  return events;
}

export function mergeActiveEvents(
  current: SimulationEventInstance[],
  incoming: SimulationEventPayload[],
): SimulationEventInstance[] {
  const decayed = current
    .map((event) => ({
      ...event,
      remainingTicks: Math.max(0, event.remainingTicks - 1),
    }))
    .filter((event) => event.remainingTicks > 0);

  const added = incoming.map(toEventInstance);
  return [...decayed, ...added];
}

export function applyEventEconomyModifiers(
  economy: SimulationState["economy"],
  events: SimulationEventInstance[],
): SimulationState["economy"] {
  const next = { ...economy };

  for (const event of events) {
    if (event.modifiers.inflation) {
      next.inflation += event.modifiers.inflation;
    }
    if (event.modifiers.exchangeRateUsdAoa) {
      next.exchangeRateUsdAoa *= event.modifiers.exchangeRateUsdAoa;
    }
  }

  return next;
}

export function applyEventMacroModifiers(
  macro: AngolaMacroContext,
  events: SimulationEventInstance[],
): AngolaMacroContext {
  const next = { ...macro };

  for (const event of events) {
    if (event.modifiers.basketCostAoa) {
      next.basketCostAoa += event.modifiers.basketCostAoa;
    }
    if (event.modifiers.forexScarcityIndex) {
      next.forexScarcityIndex = Math.min(
        1,
        next.forexScarcityIndex + event.modifiers.forexScarcityIndex,
      );
    }
    if (event.modifiers.customsDelayDays) {
      next.customsDelayDays += event.modifiers.customsDelayDays;
    }
    if (event.modifiers.supplyCost) {
      next.customsDelayDays += 0.2;
    }
  }

  return next;
}
