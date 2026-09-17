import type {
  AgentStructuredOutput,
  BusinessAgentEffect,
  EconomicModifierProposal,
  SimulationEventPayload,
  SimulationEventType,
} from "@/types/simulation";

const ECONOMY_TARGETS = new Set<EconomicModifierProposal["target"]>([
  "inflation",
  "exchangeRateUsdAoa",
  "interestRate",
  "gdpGrowth",
  "basketCostAoa",
  "forexScarcityIndex",
  "customsDelayDays",
  "generatorFuelCostMultiplier",
]);

const EVENT_TYPES = new Set<SimulationEventType>([
  "CURRENCY_DEVALUATION",
  "POWER_OUTAGE_EVENT",
  "SUPPLY_CHAIN_DISRUPTION",
  "INFLATION_SPIKE",
  "SUBSIDY_CUT",
  "HEAVY_RAIN_LOGISTICS",
  "FOREX_SCARCITY",
  "CUSTOMS_PORT_DELAY",
  "AGENT_DECISION",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseModifier(raw: unknown, agentId: string, tick: number): EconomicModifierProposal | null {
  if (!isRecord(raw)) return null;
  const target = raw.target;
  const delta = Number(raw.delta);
  if (!ECONOMY_TARGETS.has(target as EconomicModifierProposal["target"])) return null;
  if (!Number.isFinite(delta)) return null;

  return {
    source: String(raw.source ?? agentId),
    tick,
    target: target as EconomicModifierProposal["target"],
    delta,
    reason: String(raw.reason ?? "Decisão do agente"),
  };
}

function parseEvent(raw: unknown, tick: number): SimulationEventPayload | null {
  if (!isRecord(raw)) return null;
  const type = raw.type;
  if (!EVENT_TYPES.has(type as SimulationEventType)) return null;

  return {
    type: type as SimulationEventType,
    tick,
    zoneId: raw.zoneId ? String(raw.zoneId) : undefined,
    modifiers: isRecord(raw.modifiers)
      ? Object.fromEntries(
          Object.entries(raw.modifiers).map(([key, value]) => [key, Number(value)]),
        )
      : undefined,
    message: raw.message ? String(raw.message) : undefined,
    remainingTicks: raw.remainingTicks !== undefined ? Number(raw.remainingTicks) : undefined,
  };
}

function parseBusinessEffect(raw: unknown): BusinessAgentEffect | null {
  if (!isRecord(raw)) return null;
  const businessId = raw.businessId;
  if (typeof businessId !== "string") return null;

  const effect: BusinessAgentEffect = { businessId };
  if (raw.demandMultiplier !== undefined) {
    effect.demandMultiplier = Number(raw.demandMultiplier);
  }
  if (raw.competitorPriceDeltaAoa !== undefined) {
    effect.competitorPriceDeltaAoa = Number(raw.competitorPriceDeltaAoa);
  }
  return effect;
}

/** Valida JSON de resposta de agente (substituto tipado quando Zod não está instalado). */
export function parseAgentStructuredOutput(
  agentId: string,
  tick: number,
  raw: unknown,
  usedFallback: boolean,
  provider?: string,
): AgentStructuredOutput | null {
  if (!isRecord(raw)) return null;

  const modifiers = Array.isArray(raw.modifiers)
    ? raw.modifiers
        .map((item) => parseModifier(item, agentId, tick))
        .filter((item): item is EconomicModifierProposal => item !== null)
    : [];

  const events = Array.isArray(raw.events)
    ? raw.events
        .map((item) => parseEvent(item, tick))
        .filter((item): item is SimulationEventPayload => item !== null)
    : [];

  const businessEffects = Array.isArray(raw.businessEffects)
    ? raw.businessEffects
        .map(parseBusinessEffect)
        .filter((item): item is BusinessAgentEffect => item !== null)
    : [];

  return {
    agentId,
    modifiers,
    events,
    businessEffects,
    usedFallback,
    provider,
  };
}

/** Extrai bloco JSON de uma resposta textual de LLM. */
export function extractJsonFromText(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as unknown;
    } catch {
      return null;
    }
  }
}
