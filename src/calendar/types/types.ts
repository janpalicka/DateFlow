/**
 * Locale shape inspired by flatpickr: weekday/month names and `firstDayOfWeek`.
 * @see https://flatpickr.js.org/localization/
 */
export interface CalendarLocale {
  weekdays: {
    shorthand: string[];
    longhand: string[];
  };
  months: {
    shorthand: string[];
    longhand: string[];
  };
  /** 0 = Sunday (US), 1 = Monday (ISO / much of Europe) */
  firstDayOfWeek: number;
  /** Column title when week numbers are shown. Default: `"Wk"`. */
  weekNumberHeader?: string;
  /** Range tooltip when start and end are the same day. Default: `"1 day"`. */
  rangeDurationOne?: string;
  /** Range tooltip for longer spans; `{n}` is replaced with the inclusive day count. Default: `"{n} days"`. */
  rangeDurationOther?: string;
}

export type DatePredicate = (date: Date) => boolean;
export type DateFilter = readonly Date[] | DatePredicate;

export type CalendarMode = "single" | "range";

export interface DateRangeValue {
  start: Date | null;
  end: Date | null;
}

export interface CalendarOptions {
  /** Partial locale merges over {@link DEFAULT_LOCALE} */
  locale?: Partial<CalendarLocale>;
  /** Default: `"single"`. */
  mode?: CalendarMode;
  /** Single mode: selected instant (date + optional time). */
  value?: Date | null;
  /** Range mode: start/end instants. Omitted parts default to `null`. */
  range?: DateRangeValue;
  onChange?: (date: Date | null) => void;
  onRangeChange?: (range: DateRangeValue) => void;
  minDate?: Date | null;
  maxDate?: Date | null;
  /** Blocked dates or predicate (ignored when `enabledDatesOnly` is set). */
  disabledDates?: DateFilter;
  /** When set, only these dates (or predicate true) are selectable. */
  enabledDatesOnly?: DateFilter;
  /**
   * Time controls (24h). Default: `false`.
   * When `false`, the selected calendar day is kept at local midnight for value, callbacks, and output formatting.
   */
  showTime?: boolean;
  /**
   * [date-fns `format`](https://date-fns.org/docs/format) for the visible &lt;output&gt; text.
   * Default: `"yyyy-MM-dd"` without time, `"yyyy-MM-dd HH:mm"` with `showTime`.
   */
  outputFormat?: string;
  /** Between start and end when `mode === "range"` and both ends exist. Default: `" → "`. */
  rangeOutputSeparator?: string;
  /** Show ISO week numbers in the first column. Default: `false`. */
  showWeekNumbers?: boolean;
  className?: string;
  /** Sets `data-cal-theme` on the root for styling. */
  theme?: string;
  /**
   * Half-width of the year dropdown around the focused year when `minDate`/`maxDate`
   * do not constrain it. Default `50` → roughly ±50 years.
   */
  yearDropdownRadius?: number;
  /** Accessible label for the calendar region */
  ariaLabel?: string;
}

export interface CalendarPickerAPI {
  getValue(): Date | null;
  setValue(date: Date | null): void;
  getRange(): DateRangeValue;
  setRange(range: DateRangeValue): void;
  /** Merge options and re-render (e.g. change locale or constraints). */
  setOptions(partial: Partial<CalendarOptions>): void;
  destroy(): void;
}

export interface YearRange {
  from: number;
  to: number;
}
