import type { SimulationClock } from "@/types/simulation";

const DAYS_PER_MONTH = 30;

export function createInitialClock(
  year = 2026,
  month = 1,
  day = 1,
): SimulationClock {
  return {
    year,
    month,
    day,
    tick: 0,
    speed: 0,
  };
}

/** Avança o relógio um dia (tick diário). */
export function advanceClock(clock: SimulationClock): SimulationClock {
  const nextTick = clock.tick + 1;
  let { day, month, year } = clock;

  day += 1;
  if (day > DAYS_PER_MONTH) {
    day = 1;
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return {
    ...clock,
    day,
    month,
    year,
    tick: nextTick,
  };
}

export function isWeeklyBoundary(clock: SimulationClock): boolean {
  return clock.tick > 0 && clock.tick % 7 === 0;
}

export function isMonthlyBoundary(clock: SimulationClock): boolean {
  return clock.day === 1 && clock.tick > 0;
}

export function formatSimulationDate(clock: SimulationClock): string {
  const month = String(clock.month).padStart(2, "0");
  const day = String(clock.day).padStart(2, "0");
  return `${day}/${month}/${clock.year}`;
}
