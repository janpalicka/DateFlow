import { compareAsc } from "date-fns";
import { compareCalendarDay } from "./days";
import { matchesFilter } from "./filters";
import type { DateFilter, DateRangeValue, YearRange } from "../types/types";

const isSelectable = (
  day: Date,
  minDate: Date | null | undefined,
  maxDate: Date | null | undefined,
  disabledDates: DateFilter | undefined,
  enabledDatesOnly: DateFilter | undefined,
): boolean => {
  if (minDate && compareCalendarDay(day, minDate) < 0) return false;
  if (maxDate && compareCalendarDay(day, maxDate) > 0) return false;

  if (enabledDatesOnly) {
    return matchesFilter(enabledDatesOnly, day);
  }
  if (disabledDates && matchesFilter(disabledDates, day)) return false;
  return true;
};

const yearRange = (
  viewYear: number,
  minDate: Date | null | undefined,
  maxDate: Date | null | undefined,
  radius: number,
): YearRange => {
  let from = viewYear - radius;
  let to = viewYear + radius;

  if (minDate) from = Math.max(from, minDate.getFullYear());

  if (maxDate) to = Math.min(to, maxDate.getFullYear());

  if (from > to) {
    return { from: viewYear, to: viewYear };
  }

  return { from, to };
};

const cloneRange = (range: DateRangeValue): DateRangeValue => {
  return {
    start: range.start ? new Date(range.start.getTime()) : null,
    end: range.end ? new Date(range.end.getTime()) : null,
  };
};

const orderDateTimeRange = (start: Date, end: Date): { start: Date; end: Date } => {
  if (compareAsc(start, end) <= 0) {
    return { start, end };
  }
  return {
    start: new Date(end.getTime()),
    end: new Date(start.getTime()),
  };
};

export { isSelectable, yearRange, cloneRange, orderDateTimeRange };
