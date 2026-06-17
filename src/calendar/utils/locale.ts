import { DEFAULT_LOCALE } from "../locales/index";
import type { CalendarLocale, ResolvedCalendarLocale } from "../types/types";

/** Calendar convention: 0 = Sunday … 6 = Saturday. */
const normalizeFirstDayOfWeek = (day: number): number => ((day % 7) + 7) % 7;

type IntlLocaleWithWeekInfo = {
  getWeekInfo?: () => { firstDay?: number };
};

const getFirstDayOfWeekFromIntl = (localeTag: string): number | null => {
  try {
    const LocaleCtor = Intl.Locale;
    if (typeof LocaleCtor !== "function") return null;
    const locale = new LocaleCtor(localeTag);
    const getWeekInfo = (locale as IntlLocaleWithWeekInfo).getWeekInfo;
    if (typeof getWeekInfo !== "function") return null;
    const { firstDay } = getWeekInfo.call(locale);
    if (typeof firstDay !== "number" || firstDay < 1 || firstDay > 7) return null;
    return normalizeFirstDayOfWeek(firstDay);
  } catch {
    return null;
  }
};

const resolveFirstDayOfWeek = (override?: number, localeTag?: string): number => {
  if (override !== undefined) {
    return normalizeFirstDayOfWeek(override);
  }

  const tag = localeTag ?? (typeof navigator !== "undefined" ? navigator.language : undefined);
  if (tag) {
    const fromIntl = getFirstDayOfWeekFromIntl(tag);
    if (fromIntl !== null) return fromIntl;
  }

  return 1;
};

const mergeLocale = (partial: Partial<CalendarLocale> | undefined): ResolvedCalendarLocale => {
  const base = partial ?? {};
  return {
    weekdays: { ...DEFAULT_LOCALE.weekdays, ...base.weekdays },
    months: { ...DEFAULT_LOCALE.months, ...base.months },
    firstDayOfWeek: resolveFirstDayOfWeek(base.firstDayOfWeek, base.localeTag),
    weekNumberHeader: base.weekNumberHeader ?? DEFAULT_LOCALE.weekNumberHeader ?? "Wk",
    rangeDurationOne: base.rangeDurationOne ?? DEFAULT_LOCALE.rangeDurationOne,
    rangeDurationOther: base.rangeDurationOther ?? DEFAULT_LOCALE.rangeDurationOther,
    inputPlaceholder: base.inputPlaceholder ?? DEFAULT_LOCALE.inputPlaceholder ?? "Select date",
    rangeInputPlaceholder:
      base.rangeInputPlaceholder ??
      DEFAULT_LOCALE.rangeInputPlaceholder ??
      base.inputPlaceholder ??
      DEFAULT_LOCALE.inputPlaceholder ??
      "Select date range",
    rangeCancel: base.rangeCancel ?? DEFAULT_LOCALE.rangeCancel ?? "Cancel",
    rangeApply: base.rangeApply ?? DEFAULT_LOCALE.rangeApply ?? "Apply",
  };
};

export { getFirstDayOfWeekFromIntl, mergeLocale, resolveFirstDayOfWeek };
