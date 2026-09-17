"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAppState } from "@/components/providers/AppStateProvider";
import { SimulationEngine } from "@/lib/simulation/engine";
import type { SimulationEventPayload, SimulationState } from "@/types/simulation";

export interface SkipSummary {
  fromDate: string;
  toDate: string;
  days: number;
  startCashAoa: number;
  endCashAoa: number;
  revenueAoa: number;
  demandDelta: number;
  decisions: string[];
  eventMessages: string[];
  stopped: boolean;
  emergencyReason: string | null;
}

interface SimulationContextValue {
  state: SimulationState;
  events: SimulationEventPayload[];
  tick: () => void;
  setSpeed: (speed: SimulationState["clock"]["speed"]) => void;
  setBusinessPrice: (price: number) => void;
  purchaseStock: (units: number) => void;
  changeEmployees: (delta: number) => void;
  buyGeneratorFuel: (amount: number) => void;
  advanceDay: () => void;
  skipDays: (days: number) => Promise<void>;
  skipToDate: (date: string) => Promise<void>;
  isSkipping: boolean;
  skipProgress: number;
  skipSummary: SkipSummary | null;
  dismissSkipSummary: () => void;
}

const SimulationContext = createContext<SimulationContextValue | null>(null);

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  const { selectedBusinessLocation } = useAppState();
  const [engine] = useState(
    () =>
      new SimulationEngine({
        selectedZoneId: selectedBusinessLocation?.locationId ?? "zone-talatona",
      }),
  );
  const [, forceUpdate] = useState(0);
  const [events, setEvents] = useState<SimulationEventPayload[]>([]);
  const [isSkipping, setIsSkipping] = useState(false);
  const [skipProgress, setSkipProgress] = useState(0);
  const [skipSummary, setSkipSummary] = useState<SkipSummary | null>(null);
  const state = engine.getState();

  const commit = useCallback((nextEvents: SimulationEventPayload[] = []) => {
    if (nextEvents.length > 0) {
      setEvents((current) => [...nextEvents, ...current].slice(0, 24));
    }
    forceUpdate((value) => value + 1);
  }, []);

  const tick = useCallback(() => commit(engine.tick()), [commit, engine]);

  const setSpeed = useCallback(
    (speed: SimulationState["clock"]["speed"]) => {
      engine.setSpeed(speed);
      commit();
    },
    [commit, engine],
  );

  const setBusinessPrice = useCallback(
    (price: number) => {
      const business = engine.getState().businesses[0];
      if (business && engine.setBusinessPrice(business.id, price)) commit();
    },
    [commit, engine],
  );

  const purchaseStock = useCallback(
    (units: number) => {
      const business = engine.getState().businesses[0];
      if (business && engine.purchaseStock(business.id, units)) commit();
    },
    [commit, engine],
  );

  const changeEmployees = useCallback(
    (delta: number) => {
      const business = engine.getState().businesses[0];
      if (business && engine.changeEmployees(business.id, delta)) commit();
    },
    [commit, engine],
  );

  const buyGeneratorFuel = useCallback(
    (amount: number) => {
      const business = engine.getState().businesses[0];
      if (business && engine.buyGeneratorFuel(business.id, amount)) commit();
    },
    [commit, engine],
  );

  const advanceDay = useCallback(() => {
    commit(engine.tick());
  }, [commit, engine]);

  const skipDays = useCallback(
    async (days: number) => {
      const totalDays = Math.max(0, Math.floor(days));
      if (totalDays === 0 || isSkipping) return;

      const startState = engine.getState();
      const startBusiness = startState.businesses[0];
      const startHistoryLength = startState.history.length;
      const decisions: string[] = [];
      const eventMessages: string[] = [];
      setIsSkipping(true);
      setSkipProgress(0);
      setSkipSummary(null);

      let processed = 0;
      let result: ReturnType<SimulationEngine["runAutoPilotTicks"]> | null = null;
      while (processed < totalDays) {
        const chunk = Math.min(5, totalDays - processed);
        result = engine.runAutoPilotTicks(chunk);
        processed = result.endTick - startState.clock.tick;
        decisions.push(...result.decisions.flatMap((decision) => decision.messages));
        eventMessages.push(...result.events.filter((event) => event.type !== "TICK_COMPLETED").map((event) => event.message ?? event.type));
        setSkipProgress(Math.min(100, Math.round((processed / totalDays) * 100)));
        commit();
        if (result.stopped) break;
        await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
      }

      const endState = engine.getState();
      const newHistory = endState.history.slice(startHistoryLength);
      const endBusiness = endState.businesses[0];
      setSkipSummary({
        fromDate: startState.history.at(-1)?.date ?? "01/01/2026",
        toDate: endState.history.at(-1)?.date ?? "01/01/2026",
        days: processed,
        startCashAoa: startBusiness?.cashAoa ?? 0,
        endCashAoa: endBusiness?.cashAoa ?? 0,
        revenueAoa: newHistory.reduce((total, entry) => total + entry.grossRevenueAoa, 0),
        demandDelta: (newHistory.at(-1)?.demandIndex ?? 0) - (startState.history.at(-1)?.demandIndex ?? 0),
        decisions,
        eventMessages,
        stopped: result?.stopped ?? false,
        emergencyReason: result?.emergencyReason ?? null,
      });
      setIsSkipping(false);
    },
    [commit, engine, isSkipping],
  );

  const skipToDate = useCallback(
    async (date: string) => {
      const [year, month, day] = date.split("-").map(Number);
      const current = engine.getState().clock;
      const target = Date.UTC(year, month - 1, day);
      const currentDate = Date.UTC(current.year, current.month - 1, current.day);
      const days = Math.floor((target - currentDate) / 86_400_000);
      if (days > 0) await skipDays(days);
    },
    [engine, skipDays],
  );

  const dismissSkipSummary = useCallback(() => setSkipSummary(null), []);

  useEffect(() => {
    engine.setSelectedZone(selectedBusinessLocation?.locationId ?? "zone-talatona");
  }, [engine, selectedBusinessLocation?.locationId]);

  const value = useMemo(
    () => ({
      state,
      events,
      tick,
      setSpeed,
      setBusinessPrice,
      purchaseStock,
      changeEmployees,
      buyGeneratorFuel,
      advanceDay,
      skipDays,
      skipToDate,
      isSkipping,
      skipProgress,
      skipSummary,
      dismissSkipSummary,
    }),
    [advanceDay, buyGeneratorFuel, changeEmployees, dismissSkipSummary, events, isSkipping, purchaseStock, setBusinessPrice, setSpeed, skipDays, skipProgress, skipSummary, skipToDate, state, tick],
  );

  return <SimulationContext.Provider value={value}>{children}</SimulationContext.Provider>;
}

export function useSimulation() {
  const context = useContext(SimulationContext);
  if (!context) throw new Error("useSimulation must be used within SimulationProvider");
  return context;
}