/**
 * Script CLI — simula 30 ticks diários e imprime a progressão do estado.
 *
 * Executar: npm run test:simulation
 */
import { SimulationEngine } from "../src/lib/simulation/engine";
import { calculateLocalOperatingCost } from "../src/lib/simulation/world";
import type { SimulationEventPayload } from "../src/types/simulation";

const TICK_COUNT = 30;
const ZONE_ID = "zone-cazenga";

function formatEvent(event: SimulationEventPayload): string {
  const zone = event.zoneId ? ` [${event.zoneId}]` : "";
  return `  • ${event.type}${zone}: ${event.message ?? ""}`;
}

console.log("=== Simulador de Negócios Angolano — Teste de 30 Ticks ===\n");

const notableEvents: SimulationEventPayload[] = [];

const engine = new SimulationEngine({
  seed: 20260917,
  selectedZoneId: ZONE_ID,
  includeTestBusiness: true,
  onEvent: (payload) => {
    if (payload.type !== "TICK_COMPLETED") {
      notableEvents.push(payload);
    }
  },
});

const initialState = engine.getState();
console.log("Estado inicial (SimulationState):");
console.log(JSON.stringify(initialState, null, 2));
console.log("");

const operatingCost = calculateLocalOperatingCost(ZONE_ID, "retail");
console.log(
  `Custo operacional estimado (${ZONE_ID}, retail): ${operatingCost.totalDailyCostAoa.toLocaleString("pt-AO")} AOA/dia`,
);
console.log("");

console.log("Progressão diária:\n");

for (let i = 0; i < TICK_COUNT; i += 1) {
  engine.tick();
  console.log(`Dia ${i + 1}: ${engine.getSnapshotLabel()}`);
}

console.log("\nEventos notáveis (excl. TICK_COMPLETED):");
if (notableEvents.length === 0) {
  console.log("  (nenhum evento especial neste período)");
} else {
  notableEvents.forEach((event) => console.log(formatEvent(event)));
}

console.log("\nEstado final (SimulationState):");
console.log(JSON.stringify(engine.getState(), null, 2));

console.log("\n=== Teste concluído com sucesso ===");
