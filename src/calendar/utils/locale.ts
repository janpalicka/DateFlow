import { DEFAULT_LOCALE } from "../locales/index";
import type { CalendarLocale } from "../types/types";

const mergeLocale = (partial: Partial<CalendarLocale> | undefined): CalendarLocale => {
  if (!partial) return DEFAULT_LOCALE;
  return {
    weekdays: { ...DEFAULT_LOCALE.weekdays, ...partial.weekdays },
    months: { ...DEFAULT_LOCALE.months, ...partial.months },
    firstDayOfWeek: partial.firstDayOfWeek ?? DEFAULT_LOCALE.firstDayOfWeek,
    weekNumberHeader: partial.weekNumberHeader ?? DEFAULT_LOCALE.weekNumberHeader ?? "Wk",
    rangeDurationOne: partial.rangeDurationOne ?? DEFAULT_LOCALE.rangeDurationOne,
    rangeDurationOther: partial.rangeDurationOther ?? DEFAULT_LOCALE.rangeDurationOther,
    inputPlaceholder: partial.inputPlaceholder ?? DEFAULT_LOCALE.inputPlaceholder ?? "Select date",
    rangeInputPlaceholder:
      partial.rangeInputPlaceholder ??
      DEFAULT_LOCALE.rangeInputPlaceholder ??
      partial.inputPlaceholder ??
      DEFAULT_LOCALE.inputPlaceholder ??
      "Select date range",
    rangeCancel: partial.rangeCancel ?? DEFAULT_LOCALE.rangeCancel ?? "Cancel",
    rangeApply: partial.rangeApply ?? DEFAULT_LOCALE.rangeApply ?? "Apply",
  };
};

export { mergeLocale };
