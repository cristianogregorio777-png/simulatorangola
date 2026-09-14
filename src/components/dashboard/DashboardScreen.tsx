"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
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
  "prov-benguela":
    "linear-gradient(135deg, rgba(47,111,115,.58), rgba(11,15,18,.42))",
  "prov-huila":
    "linear-gradient(135deg, rgba(137,99,66,.62), rgba(11,15,18,.42))",
  "prov-huambo":
    "linear-gradient(135deg, rgba(59,91,75,.58), rgba(11,15,18,.42))",
  "prov-cabinda":
    "linear-gradient(135deg, rgba(57,91,61,.62), rgba(11,15,18,.42))",
  "prov-namibe":
    "linear-gradient(135deg, rgba(140,94,63,.66), rgba(11,15,18,.42))",
};

const menuItems = [
  ["Mundo", "◉"],
  ["Empresa", "▤"],
  ["Finanças", "▥"],
  ["Operações", "⌘"],
  ["Mercado", "◇"],
  ["Eventos", "□"],
  ["Configurações", "○"],
];

export function DashboardScreen() {
  const router = useRouter();
  const [showAuth, setShowAuth] = useState(false);
  const [continueAfterLogin, setContinueAfterLogin] = useState(false);
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

  const activeProvinceId = selectedProvinceId ?? "prov-luanda";
  const activeMunicipalityId = selectedMunicipalityId ?? "mun-luanda";
  const activeProvince =
    MOCK_PROVINCES.find((province) => province.id === activeProvinceId) ??
    MOCK_PROVINCES[0];
  const activeMunicipality =
    MOCK_MUNICIPALITIES.find((item) => item.id === activeMunicipalityId) ??
    MOCK_MUNICIPALITIES[0];

  const playableProvinces = useMemo(
    () =>
      featuredProvinceIds
        .map((id) => MOCK_PROVINCES.find((province) => province.id === id))
        .filter(Boolean),
    [],
  );

  const handleProvinceSelect = (provinceId: string) => {
    selectProvince(provinceId);
    if (provinceId === "prov-luanda") {
      selectMunicipality("mun-luanda");
    }
  };

  const handleStart = () => {
    if (!selectedBusinessLocation) {
      confirmLocation();
    }

    if (!userEmail) {
      setContinueAfterLogin(true);
      setShowAuth(true);
      return;
    }

    router.push("/simulacao");
  };

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    await refreshSession();
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
              <div className="font-display text-4xl font-bold tracking-[-0.04em] text-white">
                SNA
              </div>
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
              {menuItems.map(([item, icon], index) => (
                <button
                  key={item}
                  type="button"
                  className={`flex w-full items-center gap-4 rounded-[8px] px-4 py-3 text-left text-sm transition ${
                    index === 0
                      ? "bg-white/10 text-white"
                      : "text-sand-muted hover:bg-white/[0.04] hover:text-sand"
                  }`}
                >
                  <span aria-hidden="true" className="w-5 text-center text-base">
                    {icon}
                  </span>
                  {item}
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
            userEmail={userEmail}
            onLogin={() => setShowAuth(true)}
            onLogout={handleLogout}
          />

          <div className="grid gap-5 px-4 py-5 sm:px-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:px-8">
            <div className="min-w-0 space-y-5">
              <StatsRow />

              <div className="relative h-[34rem] overflow-hidden rounded-[8px] border border-white/10 bg-[#101820] shadow-[0_26px_80px_rgba(0,0,0,.34)]">
                <MapView
                  activeProvinceId={activeProvinceId}
                  activeMunicipalityId={activeMunicipalityId}
                  onProvinceSelect={handleProvinceSelect}
                  onMunicipalitySelect={selectMunicipality}
                />
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(7,11,14,.22),transparent_34%,rgba(7,11,14,.46))]" />
                <LocationCard province={activeProvince.name} />
              </div>

              <div className="grid gap-5 xl:grid-cols-[330px_minmax(0,1fr)]">
                <ProvinceSummary province={activeProvince.name} />
                <PlayableProvinces
                  activeProvinceId={activeProvinceId}
                  provinces={playableProvinces as typeof MOCK_PROVINCES}
                  onSelect={handleProvinceSelect}
                />
              </div>
            </div>

            <aside className="space-y-5">
              <CompanyStatus
                province={activeProvince.name}
                municipality={activeMunicipality.name}
              />
              <RecentActivity />
              <Objectives onStart={handleStart} />
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
              onSuccess={async () => {
                await refreshSession();
                setShowAuth(false);
                if (continueAfterLogin) {
                  router.push("/simulacao");
                }
              }}
            />
          </div>
        </div>
      ) : null}
    </main>
  );
}

function TopBar({
  userEmail,
  onLogin,
  onLogout,
}: {
  userEmail: string | null;
  onLogin: () => void;
  onLogout: () => void;
}) {
  return (
    <header className="flex h-auto flex-col gap-4 border-b border-white/10 px-4 py-4 sm:px-6 lg:h-24 lg:flex-row lg:items-center lg:justify-between xl:px-8">
      <div className="grid min-w-0 flex-1 gap-4 sm:grid-cols-3">
        <TopMeta label="12 de Março de 2025" value="Dia 12" />
        <TopMeta label="Tempo do jogo" value="10:45" />
        <TopMeta label="Localização atual" value="Luanda" />
      </div>
      <div className="flex shrink-0 items-center justify-between gap-4 border-l border-white/10 pl-0 lg:pl-6">
        <span className="text-lg text-sand-muted">♡</span>
        <div className="h-11 w-11 rounded-full border border-white/10 bg-[linear-gradient(135deg,#d7e3ef,#33404d)]" />
        <div>
          <p className="text-sm font-semibold text-white">
            {userEmail ? userEmail.split("@")[0] : "João Silva"}
          </p>
          <button
            type="button"
            onClick={userEmail ? onLogout : onLogin}
            className="text-xs text-sand-muted hover:text-sand"
          >
            {userEmail ? "Sair da conta" : "Entrar / criar conta"}
          </button>
        </div>
      </div>
    </header>
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

function StatsRow() {
  const stats = [
    ["Saldo em Caixa", "2 840 000 Kz", "12%"],
    ["Receita (Hoje)", "1 260 000 Kz", "8%"],
    ["Despesas (Hoje)", "980 000 Kz", "5%"],
    ["Lucro (Hoje)", "280 000 Kz", "18%"],
  ];

  return (
    <div className="grid overflow-hidden rounded-[8px] border border-white/10 bg-white/[0.025] sm:grid-cols-2 xl:grid-cols-4">
      {stats.map(([label, value, change]) => (
        <div key={label} className="border-white/10 p-5 xl:border-r">
          <p className="text-sm text-sand-muted">{label}</p>
          <p className="mt-2 font-display text-2xl font-medium text-white">
            {value}
          </p>
          <p className="mt-2 text-xs text-emerald-300">+ {change} vs. dia anterior</p>
        </div>
      ))}
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
      <button
        type="button"
        className="mt-5 flex w-full items-center justify-between rounded-[8px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-sand hover:bg-white/[0.07]"
      >
        Ver detalhes
        <span>→</span>
      </button>
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

function ProvinceSummary({ province }: { province: string }) {
  return (
    <article className="rounded-[8px] border border-white/10 bg-[linear-gradient(140deg,rgba(184,135,79,.28),rgba(7,11,14,.82))] p-5">
      <h2 className="font-display text-xl font-medium text-white">{province}</h2>
      <p className="mt-2 text-sm text-sand-muted">Capital de Angola</p>
      <p className="mt-5 text-sm leading-6 text-sand">
        Centro económico principal, alta circulação comercial e maior densidade
        de clientes.
      </p>
      <button
        type="button"
        className="mt-6 rounded-[8px] border border-white/10 px-4 py-2 text-sm text-sand-muted hover:text-sand"
      >
        Ver províncias →
      </button>
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
              province.id === activeProvinceId
                ? "border-ochre bg-ochre/10"
                : "border-white/10 bg-white/[0.03] hover:border-white/25"
            }`}
          >
            <div
              className="mb-3 h-16 rounded-[6px] bg-cover bg-center"
              style={{ backgroundImage: provinceImages[province.id] }}
            />
            <p className="truncate text-xs text-sand">{province.name}</p>
          </button>
        ))}
      </div>
    </section>
  );
}

function CompanyStatus({
  province,
  municipality,
}: {
  province: string;
  municipality: string;
}) {
  return (
    <Panel title="Estado da Empresa" action="Operacional">
      <SideLine label="Tipo de negócio" value="Loja / Comércio" />
      <SideLine label="Localização" value={municipality || province} />
      <SideLine label="Capital inicial" value="2 500 000 Kz" />
      <div className="mt-6">
        <div className="mb-2 flex justify-between text-xs">
          <span className="text-sand-muted">Progresso</span>
          <span className="text-sand">12%</span>
        </div>
        <div className="h-2 rounded-full bg-white/10">
          <div className="h-full w-[12%] rounded-full bg-emerald-300" />
        </div>
      </div>
    </Panel>
  );
}

function RecentActivity() {
  const items = [
    ["Venda realizada", "+125 000 Kz", "10:32", "text-emerald-300"],
    ["Custo de transporte aumentado", "-50 000 Kz", "09:14", "text-red-300"],
    ["Novo cliente importante", "Potencial de crescimento", "08:45", "text-sky-300"],
    ["Previsão de chuva forte", "13 de Março - 15 de Março", "07:20", "text-sand-muted"],
  ];

  return (
    <Panel title="Atividade Recente" action="Ver todas →">
      <div className="space-y-4">
        {items.map(([title, value, time, color]) => (
          <div key={title} className="flex items-center justify-between gap-4 border-b border-white/10 pb-4 last:border-0 last:pb-0">
            <div>
              <p className="text-sm text-white">{title}</p>
              <p className={`mt-1 text-sm ${color}`}>{value}</p>
            </div>
            <span className="text-xs text-sand-muted">{time}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function Objectives({ onStart }: { onStart: () => void }) {
  return (
    <Panel title="Objetivos" action="Ver todos →">
      <div className="space-y-4 text-sm">
        <Objective label="Faturar 1 000 000 Kz" value="280 000 / 1 000 000" done={false} />
        <Objective label="Manter saúde acima de 70%" value="78%" done />
        <Objective label="Expandir para outra província" value="0 / 1" done={false} />
      </div>
      <button
        type="button"
        onClick={onStart}
        className="mt-6 w-full rounded-[8px] border border-ochre/45 bg-ochre/10 px-4 py-3 text-sm font-semibold text-sand hover:bg-ochre/15"
      >
        Iniciar simulação
      </button>
    </Panel>
  );
}

function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action: string;
  children: React.ReactNode;
}) {
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

function SideLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-5">
      <p className="text-xs text-sand-muted">{label}</p>
      <p className="mt-1 text-sm text-white">{value}</p>
    </div>
  );
}

function Objective({
  label,
  value,
  done,
}: {
  label: string;
  value: string;
  done: boolean;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <span className="text-sand">{label}</span>
        <span className="text-xs text-sand-muted">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${done ? "w-[78%] bg-emerald-300" : "w-[28%] bg-emerald-300"}`}
        />
      </div>
    </div>
  );
}
