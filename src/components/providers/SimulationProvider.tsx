"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAppState } from "@/components/providers/AppStateProvider";
import { SimulationEngine } from "@/lib/simulation/engine";
import type { CreateBusinessInput, SimulationEventPayload, SimulationState } from "@/types/simulation";
import { supabase } from "@/lib/supabase/client";

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
  createBusiness: (input: CreateBusinessInput) => boolean;
}

const SimulationContext = createContext<SimulationContextValue | null>(null);

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  const { selectedBusinessLocation, hasHydrated, userId } = useAppState();
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
  const restoredUserRef = useRef<string | null>(null);
  const restoreStartedUserRef = useRef<string | null>(null);
  const persistedTickRef = useRef(0);
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

  const createBusiness = useCallback(
    (input: CreateBusinessInput) => {
      const created = engine.createBusiness(input);
      if (created) commit();
      return created;
    },
    [commit, engine],
  );

  useEffect(() => {
    engine.setSelectedZone(selectedBusinessLocation?.locationId ?? "zone-talatona");
  }, [engine, selectedBusinessLocation?.locationId]);

  useEffect(() => {
    const client = supabase;
    if (!client || !hasHydrated || !userId || restoreStartedUserRef.current === userId) return;
    restoreStartedUserRef.current = userId;

    const restore = async () => {
      const { data } = await client
        .from("simulation_states")
        .select("current_tick, simulated_date, macro_indicators, state_payload")
        .eq("user_id", userId)
        .maybeSingle();
      const payload = data?.state_payload;
      if (payload && typeof payload === "object" && !Array.isArray(payload)) {
        engine.hydrateState(payload as Partial<SimulationState>);
        persistedTickRef.current = engine.getState().clock.tick;
      }
      restoredUserRef.current = userId;
      window.setTimeout(() => forceUpdate((value) => value + 1), 0);
    };

    void restore();
  }, [engine, hasHydrated, userId]);

  useEffect(() => {
    const client = supabase;
    if (!client || !hasHydrated || !userId || restoredUserRef.current !== userId) return;
    const current = engine.getState();
    const business = current.businesses[0];
    const date = `${current.clock.year}-${String(current.clock.month).padStart(2, "0")}-${String(current.clock.day).padStart(2, "0")}`;

    void client.from("simulation_states").upsert(
      {
        user_id: userId,
        current_tick: current.clock.tick,
        simulated_date: date,
        macro_indicators: {
          usd_exchange_rate: current.economy.exchangeRateUsdAoa,
          inflation_rate: current.economy.inflation * 100,
          bna_interest_rate: current.economy.interestRate * 100,
          forex_scarcity_level: current.macro.forexScarcityIndex,
        },
        state_payload: current,
        cash_balance: business?.cashAoa ?? 0,
        today_revenue: business?.lastTick?.grossRevenueAoa ?? 0,
        today_expenses:
          (business?.lastTick?.variableCostsAoa ?? 0) +
          (business?.lastTick?.fixedCostsAoa ?? 0),
        today_profit: business?.lastTick?.netProfitAoa ?? 0,
        progress: Math.min(100, current.clock.tick),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    if (current.clock.tick > persistedTickRef.current) {
      const entries = current.history.filter((entry) => entry.tick > persistedTickRef.current);
      persistedTickRef.current = current.clock.tick;
      void Promise.all(
        entries.flatMap((entry) =>
          entry.eventTypes.map((eventType) =>
            client.from("simulation_logs").insert({
              user_id: userId,
              tick_number: entry.tick,
              simulated_date: toIsoDate(entry.date),
              event_type: eventType,
              title: eventType,
              description: entry.automaticDecisions.join(" ") || null,
              impact_data: {
                cashAoa: entry.cashAoa,
                revenueAoa: entry.grossRevenueAoa,
                demandIndex: entry.demandIndex,
              },
            }),
          ),
        ),
      );
    }
  }, [engine, hasHydrated, state, userId]);

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
      createBusiness,
    }),
    [advanceDay, buyGeneratorFuel, changeEmployees, createBusiness, dismissSkipSummary, events, isSkipping, purchaseStock, setBusinessPrice, setSpeed, skipDays, skipProgress, skipSummary, skipToDate, state, tick],
  );

  return <SimulationContext.Provider value={value}>{children}</SimulationContext.Provider>;
}

export function useSimulation() {
  const context = useContext(SimulationContext);
  if (!context) throw new Error("useSimulation must be used within SimulationProvider");
  return context;
}

function toIsoDate(displayDate: string): string {
  const [day, month, year] = displayDate.split("/");
  return `${year}-${month}-${day}`;
}