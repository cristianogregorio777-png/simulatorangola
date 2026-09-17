"use client";

import type { SkipSummary } from "@/components/providers/SimulationProvider";

export function SkipSummaryModal({ summary, onClose }: { summary: SkipSummary; onClose: () => void }) {
  const cashDelta = summary.endCashAoa - summary.startCashAoa;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4 backdrop-blur-sm">
      <section role="dialog" aria-modal="true" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[8px] border border-white/10 bg-[#0b1116] p-6 text-sand shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-sand-muted">Relatório do salto</p>
            <h2 className="mt-2 font-display text-3xl text-white">{summary.fromDate} → {summary.toDate}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-[8px] border border-white/10 px-3 py-2 text-xs text-sand-muted hover:text-sand">Fechar</button>
        </div>
        {summary.stopped ? <p className="mt-5 border border-red-300/30 bg-red-300/10 p-3 text-sm text-red-100">Pausa de emergência: {summary.emergencyReason}</p> : null}
        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          <Metric label="Dias" value={String(summary.days)} />
          <Metric label="Caixa" value={`${cashDelta >= 0 ? "+" : ""}${money(cashDelta)}`} />
          <Metric label="Faturamento" value={money(summary.revenueAoa)} />
          <Metric label="Clientela" value={`${summary.demandDelta >= 0 ? "+" : ""}${summary.demandDelta.toFixed(0)} pts`} />
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Log title="Decisões automáticas" items={summary.decisions} empty="Nenhuma decisão registada." />
          <Log title="Eventos marcantes" items={summary.eventMessages} empty="Nenhum evento marcante." />
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="border border-white/10 bg-white/[0.03] p-3"><p className="text-xs text-sand-muted">{label}</p><p className="mt-1 text-lg text-white">{value}</p></div>;
}

function Log({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return <div><h3 className="font-display text-xl text-white">{title}</h3><div className="mt-3 space-y-2">{items.length ? items.slice(0, 12).map((item, index) => <p key={`${item}-${index}`} className="border-b border-white/10 pb-2 text-sm text-sand-muted">{item}</p>) : <p className="text-sm text-sand-muted">{empty}</p>}</div></div>;
}

function money(value: number): string {
  return `${Math.round(value).toLocaleString("pt-AO")} Kz`;
}