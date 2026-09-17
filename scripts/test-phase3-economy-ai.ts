/**
 * Fase 3 — 30 ticks com motor económico, DRE e agentes (fallback determinístico).
 *
 * Executar: npm run test:phase3
 */
import { SimulationEngine } from "../src/lib/simulation/engine";
import { formatBusinessDre } from "../src/core/business";
import {
  runAllAgentsWithAiOrFallback,
  type CompleteWithFallbackFn,
} from "../src/core/agents";
import type { SimulationEventPayload } from "../src/types/simulation";

const TICK_COUNT = 30;
const ZONE_ID = "zone-cazenga";

function formatEvent(event: SimulationEventPayload): string {
  const zone = event.zoneId ? ` [${event.zoneId}]` : "";
  return `  • ${event.type}${zone}: ${event.message ?? ""}`;
}

const failingComplete: CompleteWithFallbackFn = async () => {
  throw new Error("Simulação: API de IA indisponível (quota/esgotamento).");
};

async function main(): Promise<void> {
console.log("=== Fase 3 — Motor Económico + Agentes de IA ===\n");

console.log("Pré-voo: agentes com API simulada indisponível → fallback determinístico");
const preState = new SimulationEngine({
  seed: 20260917,
  selectedZoneId: ZONE_ID,
  includeTestBusiness: true,
}).getState();

const fallbackProbe = await runAllAgentsWithAiOrFallback(preState, failingComplete);
const angolaEvents = fallbackProbe.flatMap((output) => output.events);
console.log(
  `  Agentes executados: ${fallbackProbe.length} | eventos angolanos gerados: ${angolaEvents.length}`,
);
angolaEvents.slice(0, 3).forEach((event) => {
  console.log(`  ↳ ${event.type}: ${event.message ?? ""}`);
});
console.log("");

const notableEvents: SimulationEventPayload[] = [];
const agentDecisions: SimulationEventPayload[] = [];

const engine = new SimulationEngine({
  seed: 20260917,
  selectedZoneId: ZONE_ID,
  includeTestBusiness: true,
  onEvent: (payload) => {
    if (payload.type === "AGENT_DECISION") {
      agentDecisions.push(payload);
    }
    if (
      payload.type !== "TICK_COMPLETED" &&
      payload.type !== "AGENT_DECISION"
    ) {
      notableEvents.push(payload);
    }
  },
});

const business = engine.getState().businesses[0];
console.log(`Negócio de teste: ${business?.name ?? "(nenhum)"} @ ${ZONE_ID}`);
console.log(`Caixa inicial: ${business?.cashAoa.toLocaleString("pt-AO")} AOA\n`);

console.log("Progressão diária (macro + caixa):\n");

for (let i = 0; i < TICK_COUNT; i += 1) {
  engine.tick();
  const state = engine.getState();
  const biz = state.businesses[0];
  const cash = biz?.cashAoa.toLocaleString("pt-AO") ?? "—";
  console.log(
    `Dia ${i + 1}: ${engine.getSnapshotLabel()} | cesta=${state.macro.basketCostAoa.toLocaleString("pt-AO")} AOA | caixa=${cash} AOA`,
  );
}

const finalBusiness = engine.getState().businesses[0];
if (finalBusiness?.lastTick) {
  console.log("\nDRE final do negócio de teste:");
  console.log(formatBusinessDre(finalBusiness, finalBusiness.lastTick));
}

console.log("\nDecisões de agentes (amostra):");
agentDecisions.slice(0, 8).forEach((event) => console.log(formatEvent(event)));
if (agentDecisions.length > 8) {
  console.log(`  … +${agentDecisions.length - 8} decisões`);
}

console.log("\nEventos económicos angolanos (excl. TICK_COMPLETED):");
if (notableEvents.length === 0) {
  console.log("  (nenhum evento especial neste período)");
} else {
  notableEvents.forEach((event) => console.log(formatEvent(event)));
}

console.log("\n=== Fase 3 concluída com sucesso ===");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
