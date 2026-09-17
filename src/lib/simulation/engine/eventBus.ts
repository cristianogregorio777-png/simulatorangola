import type { SimulationEventPayload, SimulationEventType } from "@/types/simulation";

export type SimulationEventHandler = (payload: SimulationEventPayload) => void;

/**
 * Barramento pub/sub desacoplado para eventos da simulação.
 * Não depende de React nem de estado global externo.
 */
export class SimulationEventBus {
  private listeners = new Map<SimulationEventType | "*", Set<SimulationEventHandler>>();

  on(type: SimulationEventType | "*", handler: SimulationEventHandler): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(handler);

    return () => {
      this.listeners.get(type)?.delete(handler);
    };
  }

  emit(payload: SimulationEventPayload): void {
    const specific = this.listeners.get(payload.type);
    specific?.forEach((handler) => handler(payload));

    const global = this.listeners.get("*");
    global?.forEach((handler) => handler(payload));
  }

  clear(): void {
    this.listeners.clear();
  }
}
