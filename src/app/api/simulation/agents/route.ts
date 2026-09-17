import { NextResponse } from "next/server";
import { completeWithFallback } from "@/lib/ai";
import { runAllAgentsWithAiOrFallback } from "@/core/agents";
import { createInitialSimulationState } from "@/lib/simulation/engine";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    seed?: number;
    selectedZoneId?: string;
  };

  const state = createInitialSimulationState({
    seed: body.seed,
    selectedZoneId: body.selectedZoneId,
  });

  const outputs = await runAllAgentsWithAiOrFallback(state, completeWithFallback);

  return NextResponse.json({
    tick: state.clock.tick,
    outputs,
  });
}
