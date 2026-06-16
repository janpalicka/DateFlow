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
  /** Value input placeholder when nothing is selected (single mode). Default: `"Select date"`. */
  inputPlaceholder?: string;
  /** Value input placeholder when no range is selected. Defaults to `inputPlaceholder`. */
  rangeInputPlaceholder?: string;
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
   * When `showTime` is enabled, render hour selector in 12-hour format with AM/PM selector.
   * Default: `false` (24-hour time).
   */
  use12HourTime?: boolean;
  /**
   * When `showTime` is enabled, show a seconds selector after minutes.
   * Default: `false`.
   */
  showSeconds?: boolean;
  /**
   * Minute dropdown step when `showTime` is enabled.
   * Default: `5` (0, 5, 10, …).
   */
  minuteStep?: number;
  /**
   * [date-fns `format`](https://date-fns.org/docs/format) for the visible &lt;output&gt; text.
   * Default: `"yyyy-MM-dd"` without time, `"yyyy-MM-dd HH:mm"` with 24h time,
   * `"yyyy-MM-dd hh:mm a"` with 12h time, with `:ss` when `showSeconds` is enabled.
   */
  outputFormat?: string;
  /** Between start and end when `mode === "range"` and both ends exist. Default: `"—"`. */
  rangeOutputSeparator?: string;
  /** Show ISO week numbers in the first column. Default: `false`. */
  showWeekNumbers?: boolean;
  /**
   * In single mode, hide the picker container right after a day is selected.
   * Default: `true`.
   */
  hideOnSingleSelect?: boolean;
  /**
   * Allows typing a date directly into the picker’s value input.
   * Default: `false` (input is read-only; pick dates from the calendar only).
   */
  allowInput?: boolean;
  /**
   * When `allowInput` is enabled, keep the calendar open after Enter commits typed input.
   * Default: `false` (calendar closes on successful Enter, like a day click).
   */
  keepOpenOnAllowInputEnter?: boolean;
  className?: string;
  /** Sets `data-cal-theme` on the root for styling. */
  theme?: string;
  /**
   * Half-width of the year dropdown around the focused year when `minDate`/`maxDate`
   * do not constrain it. Default `50` → roughly ±50 years.
   */
  yearDropdownRadius?: number;
  /** Show reset icon button in header. Default: `false`. */
  showResetButton?: boolean;
  /**
   * Accessible label/title for reset icon button.
   * Used only when `showResetButton` is true. Default: `"Reset"`.
   */
  resetInputLabel?: string;
  /** Accessible label for the calendar region */
  ariaLabel?: string;
  /**
   * Where the calendar panel is mounted when `inline` is false.
   * Default: `document.body`.
   */
  appendTo?: HTMLElement;
  /**
   * Insert the calendar panel as the next sibling of the input.
   * Default: `false` (panel is appended to `appendTo`).
   */
  inline?: boolean;
  /**
   * Open the panel on input focus/click, position it with Floating UI when not `inline`,
   * and close on outside click or Escape. Default: `true`.
   */
  popover?: boolean;
}

export interface CalendarPickerInstance {
  getValue(): Date | null;
  setValue(date: Date | null): void;
  getRange(): DateRangeValue;
  setRange(range: DateRangeValue): void;
  /** Merge options and re-render (e.g. change locale or constraints). */
  setOptions(partial: Partial<CalendarOptions>): void;
  /** The input element passed to {@link createCalendarPicker}. */
  getInputElement(): HTMLInputElement;
  /** Root wrapper for the calendar panel (initially hidden). */
  getCalendarElement(): HTMLElement;
  /** Show the calendar panel (no-op when `popover` is false). */
  open(): void;
  /** Hide the calendar panel. */
  close(): void;
  destroy(): void;
}

export interface YearRange {
  from: number;
  to: number;
}
