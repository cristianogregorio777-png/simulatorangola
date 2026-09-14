"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { useAppState } from "@/components/providers/AppStateProvider";
import { MOCK_MUNICIPALITIES } from "@/data/municipalities.mock";
import { MOCK_PROVINCES } from "@/data/provinces.mock";
import { supabase } from "@/lib/supabase/client";

const MapView = dynamic(
  () => import("@/components/map/MapView").then((mod) => mod.MapView),
  { ssr: false },
);

type AuthMode = "sign-in" | "sign-up";
type DashboardTab =
  | "Mundo"
  | "Empresa"
  | "Finanças"
  | "Operações"
  | "Mercado"
  | "Eventos"
  | "Configurações";

interface SimulationState {
  day: number;
  hour: number;
  cash: number;
  revenue: number;
  expenses: number;
  efficiency: number;
  marketShare: number;
  inventory: number;
  demand: number;
  eventImpact: number;
  speed: 0 | 1 | 2 | 5;
}

const menuItems: Array<{ label: DashboardTab; icon: string; protected: boolean }> = [
  { label: "Mundo", icon: "◎", protected: false },
  { label: "Empresa", icon: "▤", protected: true },
  { label: "Finanças", icon: "▥", protected: true },
  { label: "Operações", icon: "⌘", protected: true },
  { label: "Mercado", icon: "◇", protected: true },
  { label: "Eventos", icon: "□", protected: true },
  { label: "Configurações", icon: "○", protected: true },
];

const featuredProvinceIds = [
  "prov-luanda",
  "prov-benguela",
  "prov-huila",
  "prov-huambo",
  "prov-cabinda",
  "prov-namibe",
];

const provinceImages: Record<string, string> = {
  "prov-luanda":
    "linear-gradient(135deg, rgba(184,135,79,.72), rgba(11,15,18,.3)), url('https://images.unsplash.com/photo-1579547945413-497e1b99dac0?auto=format&fit=crop&w=640&q=70')",
  "prov-benguela": "linear-gradient(135deg, rgba(47,111,115,.58), rgba(11,15,18,.42))",
  "prov-huila": "linear-gradient(135deg, rgba(137,99,66,.62), rgba(11,15,18,.42))",
  "prov-huambo": "linear-gradient(135deg, rgba(59,91,75,.58), rgba(11,15,18,.42))",
  "prov-cabinda": "linear-gradient(135deg, rgba(57,91,61,.62), rgba(11,15,18,.42))",
  "prov-namibe": "linear-gradient(135deg, rgba(140,94,63,.66), rgba(11,15,18,.42))",
};

const initialSimulation: SimulationState = {
  day: 12,
  hour: 10,
  cash: 2840000,
  revenue: 1260000,
  expenses: 980000,
  efficiency: 76,
  marketShare: 8.4,
  inventory: 68,
  demand: 72,
  eventImpact: 0,
  speed: 1,
};

export function DashboardScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<DashboardTab>("Mundo");
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("sign-in");
  const [continueAfterLogin, setContinueAfterLogin] = useState(false);
  const [sim, setSim] = useState<SimulationState>(initialSimulation);
  const [events, setEvents] = useState([
    { title: "Venda realizada", detail: "+125 000 Kz", time: "10:32", tone: "good" },
    { title: "Transporte mais caro", detail: "-50 000 Kz", time: "09:14", tone: "bad" },
    { title: "Cliente empresarial", detail: "Contrato em negociação", time: "08:45", tone: "info" },
    { title: "Chuva prevista", detail: "Impacto logístico moderado", time: "07:20", tone: "muted" },
  ]);

  const {
    selectedProvinceId,
    selectedMunicipalityId,
    selectedBusinessLocation,
    userEmail,
    selectProvince,
    selectMunicipality,
    confirmLocation,
    refreshSession,
  } = useAppState();

  const isAuthenticated = Boolean(userEmail);
  const activeProvinceId = selectedProvinceId ?? "prov-luanda";
  const activeMunicipalityId = selectedMunicipalityId ?? "mun-luanda";
  const activeProvince =
    MOCK_PROVINCES.find((province) => province.id === activeProvinceId) ?? MOCK_PROVINCES[0];
  const activeMunicipality =
    MOCK_MUNICIPALITIES.find((item) => item.id === activeMunicipalityId) ?? MOCK_MUNICIPALITIES[0];

  const playableProvinces = useMemo(
    () =>
      featuredProvinceIds
        .map((id) => MOCK_PROVINCES.find((province) => province.id === id))
        .filter(Boolean),
    [],
  );

  useEffect(() => {
    if (sim.speed === 0) return;

    const interval = window.setInterval(() => {
      setSim((current) => {
        const demandLift = (current.demand - 60) * 120;
        const efficiencyLift = (current.efficiency - 70) * 95;
        const eventCost = current.eventImpact * 240;
        const revenue = Math.max(0, Math.round(current.revenue + demandLift + efficiencyLift));
        const expenses = Math.max(0, Math.round(current.expenses + eventCost + (100 - current.inventory) * 70));

        return {
          ...current,
          day: current.day + 1,
          hour: (current.hour + current.speed * 2) % 24,
          cash: Math.round(current.cash + revenue - expenses),
          revenue,
          expenses,
          efficiency: clamp(current.efficiency + (current.inventory > 45 ? 0.2 : -0.6), 40, 96),
          inventory: clamp(current.inventory - current.demand * 0.025 + current.speed * 0.6, 12, 100),
          demand: clamp(current.demand + Math.sin(current.day / 3) * 1.6 - current.eventImpact * 0.04, 35, 95),
          marketShare: clamp(current.marketShare + (revenue > expenses ? 0.04 : -0.03), 3, 24),
          eventImpact: Math.max(0, current.eventImpact - 0.4),
        };
      });
    }, 1800 / sim.speed);

    return () => window.clearInterval(interval);
  }, [sim.speed]);

  const handleProtectedTab = (tab: DashboardTab, protectedTab: boolean) => {
    if (protectedTab && !isAuthenticated) {
      setAuthMode("sign-in");
      setShowAuth(true);
      return;
    }

    setActiveTab(tab);
  };

  const handleProvinceSelect = (provinceId: string) => {
    selectProvince(provinceId);
    if (provinceId === "prov-luanda") selectMunicipality("mun-luanda");
  };

  const handleStart = () => {
    if (!selectedBusinessLocation) confirmLocation();

    if (!isAuthenticated) {
      setContinueAfterLogin(true);
      setAuthMode("sign-in");
      setShowAuth(true);
      return;
    }

    router.push("/simulacao");
  };

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    await refreshSession();
    setActiveTab("Mundo");
  };

  const triggerMarketShock = () => {
    setSim((current) => ({
      ...current,
      eventImpact: clamp(current.eventImpact + 18, 0, 100),
      expenses: current.expenses + 65000,
      demand: clamp(current.demand - 5, 35, 95),
    }));
    setEvents((current) => [
      {
        title: "Pressão nos custos",
        detail: "Margem reduzida nas próximas rodadas",
        time: `${String(sim.hour).padStart(2, "0")}:00`,
        tone: "bad",
      },
      ...current.slice(0, 3),
    ]);
  };

  return (
    <main className="min-h-screen bg-[#070b0e] text-sand">
      <div className="grid min-h-screen lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="relative hidden overflow-hidden border-r border-white/10 bg-[#0b1116] lg:block">
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-[44%] bg-[linear-gradient(180deg,transparent,#0b1116_78%),linear-gradient(140deg,rgba(184,135,79,.32),rgba(47,111,115,.14))]"
          />
          <div className="relative z-10 flex h-full flex-col p-6">
            <div className="mb-10 flex items-center gap-3">
              <div className="font-display text-4xl font-bold tracking-[-0.04em] text-white">SNA</div>
              <div className="h-7 w-2 skew-x-[-18deg] bg-ochre" />
              <div className="font-mono text-[10px] leading-3 tracking-[0.12em] uppercase text-sand-muted">
                Simulador
                <br />
                de negócios
                <br />
                angolano
              </div>
            </div>

            <nav className="space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleProtectedTab(item.label, item.protected)}
                  className={`flex w-full items-center gap-4 rounded-[8px] px-4 py-3 text-left text-sm transition ${
                    activeTab === item.label
                      ? "bg-white/10 text-white"
                      : "text-sand-muted hover:bg-white/[0.04] hover:text-sand"
                  }`}
                >
                  <span aria-hidden="true" className="w-5 text-center text-base">
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="mt-auto max-w-[13rem] pb-4">
              <p className="mb-4 font-mono text-[10px] tracking-[0.16em] uppercase text-sand-muted">
                Angola
              </p>
              <p className="text-sm leading-6 text-white/90">
                Decisões claras para mercados complexos.
              </p>
              <div className="mt-6 h-px w-10 bg-ochre" />
            </div>
          </div>
        </aside>

        <section className="min-w-0">
          <TopBar
            activeProvince={activeProvince.name}
            isAuthenticated={isAuthenticated}
            userEmail={userEmail}
            sim={sim}
            onLogin={() => {
              setAuthMode("sign-in");
              setShowAuth(true);
            }}
            onSignUp={() => {
              setAuthMode("sign-up");
              setShowAuth(true);
            }}
            onLogout={handleLogout}
          />

          <div className="grid gap-5 px-4 py-5 sm:px-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:px-8">
            <div className="min-w-0 space-y-5">
              <StatsRow sim={sim} />
              <MainPanel
                activeTab={activeTab}
                sim={sim}
                activeProvinceId={activeProvinceId}
                activeMunicipalityId={activeMunicipalityId}
                province={activeProvince.name}
                municipality={activeMunicipality.name}
                playableProvinces={playableProvinces as typeof MOCK_PROVINCES}
                onProvinceSelect={handleProvinceSelect}
                onMunicipalitySelect={selectMunicipality}
                onShock={triggerMarketShock}
                setSim={setSim}
              />
            </div>

            <aside className="space-y-5">
              <CompanyStatus province={activeProvince.name} municipality={activeMunicipality.name} sim={sim} />
              <RecentActivity events={events} />
              <Objectives sim={sim} onStart={handleStart} />
            </aside>
          </div>
        </section>
      </div>

      {showAuth ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md">
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setContinueAfterLogin(false);
                  setShowAuth(false);
                }}
                className="rounded-[8px] border border-white/10 bg-white/5 px-3 py-2 text-xs text-sand-muted hover:text-sand"
              >
                Fechar
              </button>
            </div>
            <AuthPanel
              initialMode={authMode}
              onSuccess={async () => {
                await refreshSession();
                setShowAuth(false);
                if (continueAfterLogin) router.push("/simulacao");
              }}
            />
          </div>
        </div>
      ) : null}
    </main>
  );
}

function MainPanel({
  activeTab,
  sim,
  activeProvinceId,
  activeMunicipalityId,
  province,
  municipality,
  playableProvinces,
  onProvinceSelect,
  onMunicipalitySelect,
  onShock,
  setSim,
}: {
  activeTab: DashboardTab;
  sim: SimulationState;
  activeProvinceId: string;
  activeMunicipalityId: string;
  province: string;
  municipality: string;
  playableProvinces: typeof MOCK_PROVINCES;
  onProvinceSelect: (provinceId: string) => void;
  onMunicipalitySelect: (municipalityId: string | null) => void;
  onShock: () => void;
  setSim: React.Dispatch<React.SetStateAction<SimulationState>>;
}) {
  if (activeTab === "Mundo") {
    return (
      <>
        <div className="relative h-[34rem] overflow-hidden rounded-[8px] border border-white/10 bg-[#101820] shadow-[0_26px_80px_rgba(0,0,0,.34)]">
          <MapView
            activeProvinceId={activeProvinceId}
            activeMunicipalityId={activeMunicipalityId}
            onProvinceSelect={onProvinceSelect}
            onMunicipalitySelect={onMunicipalitySelect}
          />
          <HeatLayer />
          <LocationCard province={province} />
        </div>
        <div className="grid gap-5 xl:grid-cols-[330px_minmax(0,1fr)]">
          <ProvinceSummary province={province} />
          <PlayableProvinces
            activeProvinceId={activeProvinceId}
            provinces={playableProvinces}
            onSelect={onProvinceSelect}
          />
        </div>
      </>
    );
  }

  const panelMap: Record<Exclude<DashboardTab, "Mundo">, React.ReactNode> = {
    Empresa: <CompanyTab sim={sim} />,
    Finanças: <FinanceTab sim={sim} />,
    Operações: <OperationsTab sim={sim} setSim={setSim} />,
    Mercado: <MarketTab sim={sim} onShock={onShock} />,
    Eventos: <EventsTab onShock={onShock} />,
    Configurações: <SettingsTab sim={sim} setSim={setSim} />,
  };

  return (
    <div className="min-h-[46rem] rounded-[8px] border border-white/10 bg-white/[0.025] p-5 shadow-[0_26px_80px_rgba(0,0,0,.24)]">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-sand-muted">
            {activeTab}
          </p>
          <h1 className="mt-1 font-display text-2xl text-white">{tabTitle(activeTab, municipality)}</h1>
        </div>
        <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-300">
          Ao vivo
        </span>
      </div>
      {panelMap[activeTab]}
    </div>
  );
}

function TopBar({
  activeProvince,
  isAuthenticated,
  userEmail,
  sim,
  onLogin,
  onSignUp,
  onLogout,
}: {
  activeProvince: string;
  isAuthenticated: boolean;
  userEmail: string | null;
  sim: SimulationState;
  onLogin: () => void;
  onSignUp: () => void;
  onLogout: () => void;
}) {
  return (
    <header className="flex h-auto flex-col gap-4 border-b border-white/10 px-4 py-4 sm:px-6 lg:h-24 lg:flex-row lg:items-center lg:justify-between xl:px-8">
      <div className="grid min-w-0 flex-1 gap-4 sm:grid-cols-3">
        <TopMeta label="12 de Março de 2025" value={`Dia ${sim.day}`} />
        <TopMeta label="Tempo do jogo" value={`${String(sim.hour).padStart(2, "0")}:45`} />
        <TopMeta label="Localização atual" value={activeProvince} />
      </div>
      {isAuthenticated ? (
        <div className="flex shrink-0 items-center justify-between gap-4 border-l border-white/10 pl-0 lg:pl-6">
          <span className="text-lg text-sand-muted">○</span>
          <div className="h-11 w-11 rounded-full border border-white/10 bg-[linear-gradient(135deg,#d7e3ef,#33404d)]" />
          <div>
            <p className="text-sm font-semibold text-white">{userEmail?.split("@")[0]}</p>
            <button type="button" onClick={onLogout} className="text-xs text-sand-muted hover:text-sand">
              Sair da conta
            </button>
          </div>
        </div>
      ) : (
        <div className="flex shrink-0 items-center gap-2 border-l border-white/10 pl-0 lg:pl-6">
          <button type="button" onClick={onLogin} className="rounded-[8px] border border-white/10 px-4 py-2 text-sm text-sand hover:bg-white/[0.04]">
            Entrar
          </button>
          <button type="button" onClick={onSignUp} className="rounded-[8px] border border-ochre/40 bg-ochre/10 px-4 py-2 text-sm font-semibold text-sand hover:bg-ochre/15">
            Criar conta
          </button>
        </div>
      )}
    </header>
  );
}

function StatsRow({ sim }: { sim: SimulationState }) {
  const profit = sim.revenue - sim.expenses;
  const stats = [
    ["Saldo em Caixa", money(sim.cash), "12%"],
    ["Receita (Hoje)", money(sim.revenue), "8%"],
    ["Despesas (Hoje)", money(sim.expenses), "5%"],
    ["Lucro (Hoje)", money(profit), profit >= 0 ? "18%" : "-6%"],
  ];

  return (
    <div className="grid overflow-hidden rounded-[8px] border border-white/10 bg-white/[0.025] sm:grid-cols-2 xl:grid-cols-4">
      {stats.map(([label, value, change]) => (
        <div key={label} className="border-white/10 p-5 xl:border-r">
          <p className="text-sm text-sand-muted">{label}</p>
          <p className="mt-2 font-display text-2xl font-medium text-white">{value}</p>
          <p className={`mt-2 text-xs ${String(change).startsWith("-") ? "text-red-300" : "text-emerald-300"}`}>
            {String(change).startsWith("-") ? "" : "+ "}
            {change} vs. dia anterior
          </p>
        </div>
      ))}
    </div>
  );
}

function CompanyTab({ sim }: { sim: SimulationState }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
      <MetricGrid
        items={[
          ["Valuation", money(sim.cash * 4.8), "+3,2%"],
          ["Market share", `${sim.marketShare.toFixed(1)}%`, "+0,4%"],
          ["Colaboradores", "18", "+2"],
          ["Eficiência", `${Math.round(sim.efficiency)}%`, sim.efficiency > 70 ? "Estável" : "Atenção"],
        ]}
      />
      <GlassPanel title="Organograma">
        {["Direção", "Operações", "Comercial", "Finanças"].map((item, index) => (
          <div key={item} className="mb-3 rounded-[8px] border border-white/10 bg-white/[0.03] p-4">
            <div className="flex justify-between text-sm">
              <span className="text-white">{item}</span>
              <span className="text-sand-muted">{[1, 7, 6, 4][index]} pessoas</span>
            </div>
            <div className="mt-3 h-1.5 rounded-full bg-white/10">
              <div className="h-full rounded-full bg-emerald-300" style={{ width: `${[92, 74, 68, 81][index]}%` }} />
            </div>
          </div>
        ))}
      </GlassPanel>
    </div>
  );
}

function FinanceTab({ sim }: { sim: SimulationState }) {
  const points = [42, 48, 45, 56, 61, 58, clamp(sim.revenue / 20000, 35, 90)];

  return (
    <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
      <GlassPanel title="Fluxo de caixa">
        <MiniLineChart points={points} />
      </GlassPanel>
      <GlassPanel title="Alocação de capital">
        <SideLine label="Operação" value="42%" />
        <SideLine label="Marketing" value="24%" />
        <SideLine label="Reserva" value="21%" />
        <SideLine label="Expansão" value="13%" />
      </GlassPanel>
    </div>
  );
}

function OperationsTab({
  sim,
  setSim,
}: {
  sim: SimulationState;
  setSim: React.Dispatch<React.SetStateAction<SimulationState>>;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
      <GlassPanel title="Pipeline operacional">
        <Slider label="Capacidade" value={sim.efficiency} onChange={(value) => setSim((current) => ({ ...current, efficiency: value }))} />
        <Slider label="Estoque" value={sim.inventory} onChange={(value) => setSim((current) => ({ ...current, inventory: value }))} />
        <Slider label="Demanda" value={sim.demand} onChange={(value) => setSim((current) => ({ ...current, demand: value }))} />
      </GlassPanel>
      <GlassPanel title="Gargalos">
        <Bar label="Fornecimento" value={100 - sim.inventory} tone="bad" />
        <Bar label="Atendimento" value={100 - sim.efficiency} tone="warn" />
        <Bar label="Entrega" value={sim.eventImpact} tone="bad" />
      </GlassPanel>
    </div>
  );
}

function MarketTab({ sim, onShock }: { sim: SimulationState; onShock: () => void }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
      <GlassPanel title="Livro de ofertas">
        {["Distribuidor Norte", "Kwanza Retail", "Atlântico Grossista", "Nova Praça"].map((name, index) => (
          <div key={name} className="mb-3 grid grid-cols-3 rounded-[8px] border border-white/10 bg-white/[0.03] p-3 text-sm">
            <span className="text-white">{name}</span>
            <span className="text-emerald-300">{money(42000 + index * 18000)}</span>
            <span className="text-right text-sand-muted">{Math.round(sim.demand - index * 6)} un.</span>
          </div>
        ))}
      </GlassPanel>
      <GlassPanel title="Concorrência">
        <Bar label="Nossa empresa" value={sim.marketShare * 4} tone="good" />
        <Bar label="Concorrente A" value={48} tone="warn" />
        <Bar label="Concorrente B" value={34} tone="muted" />
        <button type="button" onClick={onShock} className="mt-5 w-full rounded-[8px] border border-red-300/25 bg-red-300/10 px-4 py-3 text-sm text-red-100 hover:bg-red-300/15">
          Simular choque de mercado
        </button>
      </GlassPanel>
    </div>
  );
}

function EventsTab({ onShock }: { onShock: () => void }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
      <GlassPanel title="Alertas ativos">
        <EventRow title="Custos logísticos em alta" impact="Negativo" time="2 dias" />
        <EventRow title="Demanda urbana aquecida" impact="Positivo" time="5 dias" />
        <EventRow title="Pressão cambial" impact="Crítico" time="8 dias" />
      </GlassPanel>
      <GlassPanel title="Motor causal">
        <p className="mb-5 text-sm leading-6 text-sand-muted">
          Eventos alteram demanda, custos e margem. O impacto aparece nos KPIs e nas operações nos próximos ticks.
        </p>
        <button type="button" onClick={onShock} className="rounded-[8px] border border-ochre/40 bg-ochre/10 px-4 py-3 text-sm font-semibold text-sand hover:bg-ochre/15">
          Gerar evento
        </button>
      </GlassPanel>
    </div>
  );
}

function SettingsTab({
  sim,
  setSim,
}: {
  sim: SimulationState;
  setSim: React.Dispatch<React.SetStateAction<SimulationState>>;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
      <GlassPanel title="Velocidade da simulação">
        <div className="grid grid-cols-4 gap-2">
          {[0, 1, 2, 5].map((speed) => (
            <button
              key={speed}
              type="button"
              onClick={() => setSim((current) => ({ ...current, speed: speed as SimulationState["speed"] }))}
              className={`rounded-[8px] border px-3 py-3 text-sm ${
                sim.speed === speed ? "border-ochre bg-ochre/10 text-white" : "border-white/10 text-sand-muted"
              }`}
            >
              {speed === 0 ? "Pausar" : `${speed}x`}
            </button>
          ))}
        </div>
      </GlassPanel>
      <GlassPanel title="Relatórios">
        <button type="button" className="mb-3 w-full rounded-[8px] border border-white/10 px-4 py-3 text-left text-sm text-sand hover:bg-white/[0.04]">
          Exportar JSON
        </button>
        <button type="button" className="w-full rounded-[8px] border border-white/10 px-4 py-3 text-left text-sm text-sand hover:bg-white/[0.04]">
          Preparar PDF
        </button>
      </GlassPanel>
    </div>
  );
}

function LocationCard({ province }: { province: string }) {
  return (
    <div className="absolute right-5 top-5 w-[min(22rem,calc(100%-2.5rem))] rounded-[8px] border border-white/10 bg-[#0b1116]/90 p-4 shadow-2xl backdrop-blur-xl">
      <div className="flex gap-4">
        <div className="h-16 w-24 rounded-[6px] bg-[linear-gradient(135deg,rgba(184,135,79,.75),rgba(47,111,115,.3))]" />
        <div>
          <h2 className="font-display text-xl font-medium text-white">{province}</h2>
          <p className="text-xs text-sand-muted">Capital de Angola</p>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3 text-xs">
        <Info label="Clima" value="24°C" />
        <Info label="População" value="9,3 M" />
        <Info label="Moeda" value="Kwanza" />
      </div>
    </div>
  );
}

function CompanyStatus({ province, municipality, sim }: { province: string; municipality: string; sim: SimulationState }) {
  return (
    <Panel title="Estado da Empresa" action="Operacional">
      <SideLine label="Tipo de negócio" value="Loja / Comércio" />
      <SideLine label="Localização" value={municipality || province} />
      <SideLine label="Capital atual" value={money(sim.cash)} />
      <Bar label="Progresso" value={12 + sim.marketShare} tone="good" />
    </Panel>
  );
}

function RecentActivity({ events }: { events: Array<{ title: string; detail: string; time: string; tone: string }> }) {
  return (
    <Panel title="Atividade Recente" action="Ver todas">
      <div className="space-y-4">
        {events.map((item) => (
          <div key={`${item.title}-${item.time}`} className="flex items-center justify-between gap-4 border-b border-white/10 pb-4 last:border-0 last:pb-0">
            <div>
              <p className="text-sm text-white">{item.title}</p>
              <p className={`mt-1 text-sm ${toneClass(item.tone)}`}>{item.detail}</p>
            </div>
            <span className="text-xs text-sand-muted">{item.time}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function Objectives({ sim, onStart }: { sim: SimulationState; onStart: () => void }) {
  return (
    <Panel title="Objetivos" action="Ver todos">
      <div className="space-y-4 text-sm">
        <Objective label="Faturar 1 000 000 Kz" value={`${money(Math.min(sim.revenue, 1000000))} / 1 000 000 Kz`} progress={Math.min(sim.revenue / 10000, 100)} />
        <Objective label="Manter eficiência acima de 70%" value={`${Math.round(sim.efficiency)}%`} progress={sim.efficiency} />
        <Objective label="Expandir para outra província" value="0 / 1" progress={0} />
      </div>
      <button type="button" onClick={onStart} className="mt-6 w-full rounded-[8px] border border-ochre/45 bg-ochre/10 px-4 py-3 text-sm font-semibold text-sand hover:bg-ochre/15">
        Iniciar simulação
      </button>
    </Panel>
  );
}

function ProvinceSummary({ province }: { province: string }) {
  return (
    <article className="rounded-[8px] border border-white/10 bg-[linear-gradient(140deg,rgba(184,135,79,.28),rgba(7,11,14,.82))] p-5">
      <h2 className="font-display text-xl font-medium text-white">{province}</h2>
      <p className="mt-2 text-sm text-sand-muted">Capital de Angola</p>
      <p className="mt-5 text-sm leading-6 text-sand">
        Centro económico principal, alta circulação comercial e maior densidade de clientes.
      </p>
    </article>
  );
}

function PlayableProvinces({
  activeProvinceId,
  provinces,
  onSelect,
}: {
  activeProvinceId: string;
  provinces: typeof MOCK_PROVINCES;
  onSelect: (provinceId: string) => void;
}) {
  return (
    <section className="rounded-[8px] border border-white/10 bg-white/[0.025] p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Províncias jogáveis</h2>
        <span className="text-xs text-sand-muted">6 de 18</span>
      </div>
      <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
        {provinces.map((province) => (
          <button
            key={province.id}
            type="button"
            onClick={() => onSelect(province.id)}
            className={`overflow-hidden rounded-[8px] border p-2 text-left transition ${
              province.id === activeProvinceId ? "border-ochre bg-ochre/10" : "border-white/10 bg-white/[0.03] hover:border-white/25"
            }`}
          >
            <div className="mb-3 h-16 rounded-[6px] bg-cover bg-center" style={{ backgroundImage: provinceImages[province.id] }} />
            <p className="truncate text-xs text-sand">{province.name}</p>
          </button>
        ))}
      </div>
    </section>
  );
}

function HeatLayer() {
  return (
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_35%_40%,rgba(248,190,92,.22),transparent_12%),radial-gradient(circle_at_55%_54%,rgba(71,213,170,.14),transparent_15%),linear-gradient(90deg,rgba(7,11,14,.22),transparent_34%,rgba(7,11,14,.46))]" />
  );
}

function TopMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-r border-white/10 pr-6">
      <p className="text-lg text-white">{value}</p>
      <p className="text-xs text-sand-muted">{label}</p>
    </div>
  );
}

function MetricGrid({ items }: { items: Array<[string, string, string]> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map(([label, value, meta]) => (
        <div key={label} className="rounded-[8px] border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs text-sand-muted">{label}</p>
          <p className="mt-2 font-display text-2xl text-white">{value}</p>
          <p className="mt-2 text-xs text-emerald-300">{meta}</p>
        </div>
      ))}
    </div>
  );
}

function MiniLineChart({ points }: { points: number[] }) {
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${index * 58} ${110 - point}`).join(" ");

  return (
    <svg viewBox="0 0 350 130" className="h-64 w-full">
      {[20, 50, 80, 110].map((y) => (
        <line key={y} x1="0" x2="350" y1={y} y2={y} stroke="rgba(255,255,255,.08)" />
      ))}
      <path d={path} fill="none" stroke="#69e6b0" strokeWidth="3" />
      <path d={`${path} L 348 130 L 0 130 Z`} fill="rgba(105,230,176,.08)" />
    </svg>
  );
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="mb-5 block">
      <div className="mb-2 flex justify-between text-sm">
        <span className="text-sand">{label}</span>
        <span className="text-sand-muted">{Math.round(value)}%</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-ochre"
      />
    </label>
  );
}

function Bar({ label, value, tone }: { label: string; value: number; tone: "good" | "bad" | "warn" | "muted" }) {
  const color = tone === "good" ? "bg-emerald-300" : tone === "bad" ? "bg-red-300" : tone === "warn" ? "bg-ochre" : "bg-sand-muted";

  return (
    <div className="mb-4">
      <div className="mb-2 flex justify-between text-xs">
        <span className="text-sand-muted">{label}</span>
        <span className="text-sand">{Math.round(value)}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/10">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${clamp(value, 0, 100)}%` }} />
      </div>
    </div>
  );
}

function Panel({ title, action, children }: { title: string; action: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[8px] border border-white/10 bg-white/[0.025] p-5">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="font-display text-lg font-medium text-white">{title}</h2>
        <span className="text-xs text-emerald-300">{action}</span>
      </div>
      {children}
    </section>
  );
}

function GlassPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[8px] border border-white/10 bg-[#0b1116]/70 p-5">
      <h2 className="mb-5 font-display text-lg text-white">{title}</h2>
      {children}
    </section>
  );
}

function SideLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-5">
      <p className="text-xs text-sand-muted">{label}</p>
      <p className="mt-1 text-sm text-white">{value}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-semibold text-white">{value}</p>
      <p className="text-sand-muted">{label}</p>
    </div>
  );
}

function Objective({ label, value, progress }: { label: string; value: string; progress: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <span className="text-sand">{label}</span>
        <span className="text-xs text-sand-muted">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10">
        <div className="h-full rounded-full bg-emerald-300" style={{ width: `${clamp(progress, 0, 100)}%` }} />
      </div>
    </div>
  );
}

function EventRow({ title, impact, time }: { title: string; impact: string; time: string }) {
  const color = impact === "Positivo" ? "text-emerald-300" : impact === "Crítico" ? "text-red-300" : "text-ochre";

  return (
    <div className="mb-3 rounded-[8px] border border-white/10 bg-white/[0.03] p-4">
      <div className="flex justify-between gap-4">
        <p className="text-sm text-white">{title}</p>
        <span className={`text-xs ${color}`}>{impact}</span>
      </div>
      <p className="mt-2 text-xs text-sand-muted">Termina em {time}</p>
    </div>
  );
}

function tabTitle(tab: DashboardTab, municipality: string) {
  const titles: Record<DashboardTab, string> = {
    Mundo: "Mapa operacional",
    Empresa: "Gestão executiva",
    Finanças: "Fluxo financeiro",
    Operações: "Capacidade e estoque",
    Mercado: "Oferta, demanda e concorrência",
    Eventos: "Risco e oportunidade",
    Configurações: "Preferências da simulação",
  };

  return tab === "Mundo" ? `${titles[tab]} - ${municipality}` : titles[tab];
}

function toneClass(tone: string) {
  if (tone === "good") return "text-emerald-300";
  if (tone === "bad") return "text-red-300";
  if (tone === "info") return "text-sky-300";
  return "text-sand-muted";
}

function money(value: number) {
  return `${Math.round(value).toLocaleString("pt-AO").replaceAll(".", " ")} Kz`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
