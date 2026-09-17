import type { SimulationState } from "@/types/simulation";

const AGENT_JSON_SHAPE = `Responde APENAS com JSON válido neste formato:
{
  "modifiers": [{ "target": "inflation|exchangeRateUsdAoa|interestRate|gdpGrowth|basketCostAoa|forexScarcityIndex|customsDelayDays|generatorFuelCostMultiplier", "delta": number, "reason": string }],
  "events": [{ "type": "SUBSIDY_CUT|HEAVY_RAIN_LOGISTICS|FOREX_SCARCITY|CUSTOMS_PORT_DELAY|INFLATION_SPIKE|CURRENCY_DEVALUATION|POWER_OUTAGE_EVENT|SUPPLY_CHAIN_DISRUPTION", "message": string, "remainingTicks": number, "modifiers": {} }],
  "businessEffects": [{ "businessId": string, "demandMultiplier": number, "competitorPriceDeltaAoa": number }]
}`;

export function buildAgentPrompt(agentRole: string, state: SimulationState): string {
  return [
    `Actua como ${agentRole} num simulador económico de Angola.`,
    "Analisa o SimulationState e propõe acções modestas (deltas pequenos).",
    AGENT_JSON_SHAPE,
    "Contexto:",
    JSON.stringify(
      {
        tick: state.clock.tick,
        economy: state.economy,
        macro: state.macro,
        zoneId: state.selectedZoneId,
        businesses: state.businesses.map((b) => ({
          id: b.id,
          unitPriceAoa: b.unitPriceAoa,
          cashAoa: b.cashAoa,
        })),
      },
      null,
      0,
    ),
  ].join("\n");
}
