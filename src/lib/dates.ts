import type { YearMonth } from "@/content/types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

function parseYearMonth(value: YearMonth): { year: number; month: number } {
  const [year, month] = value.split("-").map(Number);
  // The YearMonth type guarantees both parts exist; this guards the runtime anyway.
  if (year === undefined || month === undefined || Number.isNaN(year) || Number.isNaN(month)) {
    throw new Error(`Invalid YearMonth: ${value}`);
  }
  return { year, month };
}

export function formatYearMonth(value: YearMonth): string {
  const { year, month } = parseYearMonth(value);
  return `${MONTHS[month - 1] ?? ""} ${year}`.trim();
}

/** Machine-readable value for <time dateTime>. */
export function toDateTime(value: YearMonth | "present", now: Date): string {
  if (value === "present") {
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  }
  return value;
}

export function fullYearsBetween(start: YearMonth, now: Date): number {
  const { year, month } = parseYearMonth(start);
  const months = (now.getUTCFullYear() - year) * 12 + (now.getUTCMonth() + 1 - month);
  return Math.max(0, Math.floor(months / 12));
}
