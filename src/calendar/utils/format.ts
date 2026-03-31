import type { CalendarLocale } from "../types/types";

const formatRangeDurationLabel = (locale: CalendarLocale, dayCount: number): string => {
  const one = locale.rangeDurationOne ?? "1 day";
  const other = locale.rangeDurationOther ?? "{n} days";
  if (dayCount === 1) return one;
  return other.replace(/\{n\}/g, String(dayCount));
};

export { formatRangeDurationLabel };
