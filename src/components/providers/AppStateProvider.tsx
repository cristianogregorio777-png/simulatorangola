"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { BusinessLocation } from "@/types/geo";
import { MOCK_MUNICIPALITIES } from "@/data/municipalities.mock";
import { MOCK_PROVINCES } from "@/data/provinces.mock";
import { buildDraftBusinessLocation } from "@/lib/simulation/businessLocation";
import { supabase } from "@/lib/supabase/client";

const STORAGE_KEY = "simulador-angola:selection";

interface PersistedSelection {
  selectedProvinceId: string | null;
  selectedMunicipalityId: string | null;
  selectedBusinessLocation: BusinessLocation | null;
}

interface AppSelectionState extends PersistedSelection {
  hasHydrated: boolean;
  userId: string | null;
  userEmail: string | null;
}

interface AppStateContextValue {
  selectedProvinceId: string | null;
  selectedMunicipalityId: string | null;
  selectedBusinessLocation: BusinessLocation | null;
  hasHydrated: boolean;
  userEmail: string | null;
  userId: string | null;
  selectProvince: (provinceId: string | null) => void;
  selectMunicipality: (municipalityId: string | null) => void;
  confirmLocation: () => void;
  resetSelection: () => void;
  refreshSession: () => Promise<void>;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

const EMPTY_SELECTION: PersistedSelection = {
  selectedProvinceId: null,
  selectedMunicipalityId: null,
  selectedBusinessLocation: null,
};

const EMPTY_STATE: AppSelectionState = {
  ...EMPTY_SELECTION,
  hasHydrated: false,
  userId: null,
  userEmail: null,
};

function getProvinceById(provinceId: string | null) {
  if (!provinceId) return null;
  return MOCK_PROVINCES.find((province) => province.id === provinceId) ?? null;
}

function getMunicipalityById(municipalityId: string | null) {
  if (!municipalityId) return null;
  return (
    MOCK_MUNICIPALITIES.find((municipality) => municipality.id === municipalityId) ??
    null
  );
}

function readPersistedSelection(): PersistedSelection | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    return JSON.parse(raw) as PersistedSelection;
  } catch {
    return null;
  }
}

function writePersistedSelection(selection: PersistedSelection) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(selection));
  } catch {
    // Persistência opcional; se falhar, seguimos com estado em memória.
  }
}

/**
 * Estado compartilhado do projeto.
 *
 * Esta camada mantém a seleção geográfica entre a World Screen e a área
 * protegida da simulação, de forma simples e compatível com a futura
 * engine.
 */
export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [selection, setSelection] = useState<AppSelectionState>(EMPTY_STATE);

  const {
    selectedProvinceId,
    selectedMunicipalityId,
    selectedBusinessLocation,
    hasHydrated,
    userId,
    userEmail,
  } = selection;

  const refreshSession = useCallback(async () => {
    if (!supabase) return;

    const { data } = await supabase.auth.getUser();
    const user = data.user;

    setSelection((current) => ({
      ...current,
      userId: user?.id ?? null,
      userEmail: user?.email ?? null,
    }));
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const hydrate = async () => {
        const localSelection = readPersistedSelection() ?? EMPTY_SELECTION;

        if (!supabase) {
          setSelection({
            ...localSelection,
            hasHydrated: true,
            userId: null,
            userEmail: null,
          });
          return;
        }

        const { data: userData } = await supabase.auth.getUser();
        const user = userData.user;
        let persistedSelection = localSelection;

        if (user) {
          const { data } = await supabase
            .from("simulation_states")
            .select(
              "selected_province_id, selected_municipality_id, selected_business_location",
            )
            .eq("user_id", user.id)
            .maybeSingle();

          if (data) {
            persistedSelection = {
              selectedProvinceId: data.selected_province_id,
              selectedMunicipalityId: data.selected_municipality_id,
              selectedBusinessLocation:
                data.selected_business_location as BusinessLocation | null,
            };
          }
        }

        setSelection({
          ...persistedSelection,
          hasHydrated: true,
          userId: user?.id ?? null,
          userEmail: user?.email ?? null,
        });
      };

      void hydrate();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!supabase) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refreshSession();
    });

    return () => subscription.unsubscribe();
  }, [refreshSession]);

  useEffect(() => {
    if (!hasHydrated) return;

    writePersistedSelection({
      selectedProvinceId,
      selectedMunicipalityId,
      selectedBusinessLocation,
    });

    if (supabase && userId) {
      void supabase.from("simulation_states").upsert(
        {
          user_id: userId,
          selected_province_id: selectedProvinceId,
          selected_municipality_id: selectedMunicipalityId,
          selected_business_location: selectedBusinessLocation,
          cash_balance: 2840000,
          today_revenue: 1260000,
          today_expenses: 980000,
          today_profit: 280000,
          progress: 12,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
    }
  }, [
    hasHydrated,
    selectedBusinessLocation,
    selectedMunicipalityId,
    selectedProvinceId,
    userId,
  ]);

  const selectProvince = useCallback((provinceId: string | null) => {
    setSelection((current) => ({
      ...current,
      selectedProvinceId: provinceId,
      selectedMunicipalityId: null,
      selectedBusinessLocation: null,
    }));
  }, []);

  const selectMunicipality = useCallback((municipalityId: string | null) => {
    setSelection((current) => ({
      ...current,
      selectedMunicipalityId: municipalityId,
      selectedBusinessLocation: null,
    }));
  }, []);

  const confirmLocation = useCallback(() => {
    const province = getProvinceById(selectedProvinceId);
    const municipality = getMunicipalityById(selectedMunicipalityId);

    if (!province) return;

    setSelection((current) => ({
      ...current,
      selectedBusinessLocation: buildDraftBusinessLocation({
        province,
        municipality,
      }),
    }));
  }, [selectedMunicipalityId, selectedProvinceId]);

  const resetSelection = useCallback(() => {
    setSelection((current) => ({
      ...current,
      ...EMPTY_SELECTION,
    }));
  }, []);

  const value = useMemo<AppStateContextValue>(
    () => ({
      selectedProvinceId,
      selectedMunicipalityId,
      selectedBusinessLocation,
      hasHydrated,
      userEmail,
      userId,
      selectProvince,
      selectMunicipality,
      confirmLocation,
      resetSelection,
      refreshSession,
    }),
    [
      confirmLocation,
      hasHydrated,
      resetSelection,
      selectedBusinessLocation,
      selectedMunicipalityId,
      selectedProvinceId,
      selectProvince,
      selectMunicipality,
      userEmail,
      userId,
      refreshSession,
    ],
  );

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);

  if (!context) {
    throw new Error("useAppState must be used within AppStateProvider");
  }

  return context;
}
