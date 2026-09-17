"use client";

import { AuthPanel } from "@/components/auth/AuthPanel";
import { DashboardScreen } from "@/components/dashboard/DashboardScreen";
import { useAppState } from "@/components/providers/AppStateProvider";

interface SimulationGateProps {
  userEmail: string | null;
}

export function SimulationGate({ userEmail }: SimulationGateProps) {
  const { hasHydrated } = useAppState();

  if (!hasHydrated) {
    return (
      <main className="grid min-h-screen place-items-center bg-void text-sand">
        A carregar a simulação...
      </main>
    );
  }

  if (!userEmail) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-void px-6 py-12">
        <section className="relative z-10 w-full max-w-xl">
          <div className="mb-5 rounded-[8px] border border-void-line bg-void/72 p-5 backdrop-blur-xl">
            <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-sand-muted">
              Acesso à simulação
            </p>
            <h1 className="mt-2 font-display text-3xl text-sand">
              Entre para guardar o progresso do seu negócio.
            </h1>
            <p className="mt-3 font-body text-sm leading-relaxed text-sand-muted">
              A conta mantém localização, caixa, eventos e decisões sincronizados no Supabase.
            </p>
          </div>
          <AuthPanel />
        </section>
      </main>
    );
  }

  return <DashboardScreen />;
}
