import { startOfDay } from "date-fns";
import { compareCalendarDay } from "./utils";
import type { CalendarMode } from "./types";

export const canGoPrevMonth = (
  viewYear: number,
  viewMonth: number,
  minDate: Date | null | undefined,
): boolean => {
  if (!minDate) return true;
  const prev = new Date(viewYear, viewMonth - 1, 1);
  const minM = startOfDay(minDate);
  return compareCalendarDay(prev, new Date(minM.getFullYear(), minM.getMonth(), 1)) >= 0;
};

export const canGoNextMonth = (
  viewYear: number,
  viewMonth: number,
  maxDate: Date | null | undefined,
  mode: CalendarMode,
  compactRange = false,
): boolean => {
  if (!maxDate) return true;
  const nextShift = mode === "range" && !compactRange ? 2 : 1;
  const next = new Date(viewYear, viewMonth + nextShift, 1);
  const maxM = startOfDay(maxDate);
  return compareCalendarDay(next, new Date(maxM.getFullYear(), maxM.getMonth(), 1)) <= 0;
};
