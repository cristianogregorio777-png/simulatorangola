"use client";

import type { SimulationState } from "@/types/simulation";

interface CareerCalendarProps {
  state: SimulationState;
  isSkipping: boolean;
  progress: number;
  onAdvanceDay: () => void;
  onSkipDays: (days: number) => void;
  onSkipToDate: (date: string) => void;
}

export function CareerCalendar({
  state,
  isSkipping,
  progress,
  onAdvanceDay,
  onSkipDays,
  onSkipToDate,
}: CareerCalendarProps) {
  const dateValue = `${state.clock.year}-${String(state.clock.month).padStart(2, "0")}-${String(state.clock.day).padStart(2, "0")}`;

  return (
    <section className="border-b border-white/10 bg-[#0b1116] px-4 py-4 sm:px-6 xl:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-sand-muted">Modo carreira</p>
          <p className="mt-1 font-display text-2xl text-white">{state.clock.day}/{state.clock.month}/{state.clock.year}</p>
          <p className="mt-1 text-xs text-sand-muted">Tick diário {state.clock.tick} · decisões manuais antes do avanço</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" disabled={isSkipping} onClick={onAdvanceDay} className="rounded-[8px] border border-ochre/50 bg-ochre/15 px-4 py-2 text-sm text-sand disabled:cursor-not-allowed disabled:opacity-50">Avançar dia</button>
          {[7, 30].map((days) => (
            <button key={days} type="button" disabled={isSkipping} onClick={() => onSkipDays(days)} className="rounded-[8px] border border-white/10 px-3 py-2 text-xs text-sand-muted hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-50">Simular {days} dias</button>
          ))}
          <label className="flex items-center gap-2 rounded-[8px] border border-white/10 px-3 py-2 text-xs text-sand-muted">
            <span>Até</span>
            <input type="date" value={dateValue} min={dateValue} disabled={isSkipping} onChange={(event) => onSkipToDate(event.target.value)} className="bg-transparent text-sand outline-none" />
          </label>
        </div>
      </div>
      {isSkipping ? (
        <div className="mt-4">
          <div className="mb-1 flex justify-between font-mono text-[10px] uppercase tracking-[0.12em] text-sand-muted"><span>Processando gestão delegada</span><span>{progress}%</span></div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-emerald-300 transition-[width]" style={{ width: `${progress}%` }} /></div>
        </div>
      ) : null}
    </section>
  );
}