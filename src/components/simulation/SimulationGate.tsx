"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { useAppState } from "@/components/providers/AppStateProvider";
import { supabase } from "@/lib/supabase/client";
import { MOCK_PROVINCES } from "@/data/provinces.mock";
import { MOCK_MUNICIPALITIES } from "@/data/municipalities.mock";

interface SimulationGateProps {
  userEmail: string | null;
}

/**
 * Porta de entrada da área protegida da simulação.
 *
 * Se o utilizador ainda não estiver autenticado, pedimos criação de conta
 * ou login. Quando a sessão existe, mostramos a localização guardada e
 * deixamos o espaço pronto para o futuro Simulation Engine.
 */
export function SimulationGate({ userEmail }: SimulationGateProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const {
    selectedBusinessLocation,
    selectedProvinceId,
    selectedMunicipalityId,
    hasHydrated,
  } = useAppState();

  const handleLogout = async () => {
    if (!supabase) return;

    setLoggingOut(true);
    await supabase.auth.signOut();
    router.refresh();
    setLoggingOut(false);
  };

  const currentLocationLabel =
    selectedBusinessLocation?.name ??
    (selectedProvinceId && selectedMunicipalityId
      ? "Seleção em preparação"
      : "Nenhuma localização selecionada ainda");

  const provinceName =
    MOCK_PROVINCES.find(
      (province) =>
        province.id ===
        (selectedBusinessLocation?.provinceId ?? selectedProvinceId),
    )?.name ?? "A definir";
  const municipalityName =
    MOCK_MUNICIPALITIES.find(
      (municipality) =>
        municipality.id ===
        (selectedBusinessLocation?.municipalityId ?? selectedMunicipalityId),
    )?.name ?? "A definir";

  if (!hasHydrated) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-void px-6 py-12">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(201,138,60,0.12),_transparent_28%),linear-gradient(180deg,_#0a0c0e_0%,_#050607_100%)]"
        />
        <div className="relative z-10 border border-void-line bg-void/62 px-5 py-4 font-mono text-[10px] tracking-[0.26em] uppercase text-sand-muted backdrop-blur-xl">
          A carregar estado da localização...
        </div>
      </main>
    );
  }

  if (!userEmail) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-void px-6 py-12">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(201,138,60,0.12),_transparent_28%),linear-gradient(180deg,_#0a0c0e_0%,_#050607_100%)]"
        />

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="relative z-10 w-full max-w-xl"
        >
          <div className="mb-5 border border-void-line bg-void/62 p-5 backdrop-blur-xl">
            <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-sand-muted">
              Área protegida
            </p>
            <h1 className="mt-2 font-display text-3xl tracking-tight text-sand">
              Cria a tua conta para começar a tua primeira simulação.
            </h1>
            <p className="mt-3 max-w-lg font-body text-sm leading-relaxed text-sand-muted">
              A exploração do mapa continua pública. Para iniciar a simulação,
              precisamos associar a localização escolhida a uma conta.
            </p>
          </div>

          <AuthPanel />
        </motion.section>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-void px-6 py-10">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(201,138,60,0.12),_transparent_28%),linear-gradient(180deg,_#0a0c0e_0%,_#050607_100%)]"
      />

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl flex-col justify-between gap-6"
      >
        <div className="border border-void-line bg-void/62 p-5 backdrop-blur-xl sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-sand-muted">
                Sessão ativa
              </p>
              <h1 className="mt-2 font-display text-3xl tracking-tight text-sand sm:text-4xl">
                Pronto para avançar.
              </h1>
              <p className="mt-3 max-w-2xl font-body text-sm leading-relaxed text-sand-muted">
                A tua conta está autenticada. A localização guardada já pode
                ser usada pelo futuro Simulation Engine.
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="border border-void-line bg-transparent px-4 py-3 font-mono text-[10px] tracking-[0.24em] uppercase text-sand-muted transition-colors hover:border-ochre/40 hover:text-sand disabled:cursor-not-allowed"
            >
              {loggingOut ? "A sair..." : "Logout"}
            </button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="border border-void-line bg-void/66 p-5 backdrop-blur-xl">
            <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-sand-muted">
              Localização ativa
            </p>
            <h2 className="mt-2 font-display text-2xl text-sand">
              {currentLocationLabel}
            </h2>
            <div className="mt-4 space-y-3">
              <Line
                label="Província"
                value={provinceName}
              />
              <Line
                label="Município"
                value={municipalityName}
              />
              <Line
                label="Zona / Área"
                value={selectedBusinessLocation?.zoneLabel ?? "A definir"}
              />
            </div>
          </div>

          <div className="border border-void-line bg-void/66 p-5 backdrop-blur-xl">
            <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-sand-muted">
              Próximo passo
            </p>
            <h2 className="mt-2 font-display text-2xl text-sand">
              Estrutura pronta
            </h2>
            <p className="mt-3 font-body text-sm leading-relaxed text-sand-muted">
              O espaço da simulação está reservado. Na próxima fase, este
              ponto receberá a Simulation Engine, a economia e os restantes
              sistemas.
            </p>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="mt-5 border border-ochre/45 bg-ochre/10 px-4 py-3 font-mono text-[10px] tracking-[0.24em] uppercase text-sand transition-colors hover:bg-ochre/15"
            >
              Voltar ao mapa
            </button>
          </div>
        </div>

        <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-sand-muted/80">
          Sessão persistente ativa via Supabase Auth
        </div>
      </motion.section>
    </main>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-void-line pb-3">
      <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-sand-muted">
        {label}
      </span>
      <span className="max-w-[60%] text-right font-body text-sm text-sand">
        {value}
      </span>
    </div>
  );
}
