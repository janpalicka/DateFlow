import { addMonths } from "date-fns";
import { mergeLocale } from "../utils";
import type { CustomSelectControl } from "../dom/customSelect";
import type { CalendarOptions } from "../types";

export const parseYearInput = (text: string): number | null => {
  const trimmed = text.trim();
  if (!/^\d{1,4}$/.test(trimmed)) return null;
  const year = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(year) || year < 1 || year > 9999) return null;
  return year;
};

export const clampYear = (year: number, options: CalendarOptions): number => {
  let y = year;
  if (options.minDate) y = Math.max(y, options.minDate.getFullYear());
  if (options.maxDate) y = Math.min(y, options.maxDate.getFullYear());
  return y;
};

export const restoreYearInput = (
  input: HTMLInputElement,
  viewYear: number,
  viewMonth: number,
  forRightPane: boolean,
): void => {
  if (forRightPane) {
    const rightView = addMonths(new Date(viewYear, viewMonth, 1), 1);
    input.value = String(rightView.getFullYear());
    return;
  }
  input.value = String(viewYear);
};

export const fillMonthYearSelects = (
  monthSelect: CustomSelectControl,
  monthSelectRight: CustomSelectControl,
  viewYear: number,
  viewMonth: number,
  options: CalendarOptions,
): void => {
  const locale = mergeLocale(options.locale);
  const monthOptions = Array.from({ length: 12 }, (_, monthIndex) => ({
    value: String(monthIndex),
    label: locale.months.longhand[monthIndex] ?? String(monthIndex),
  }));
  monthSelect.setOptions(monthOptions);
  monthSelect.value = String(viewMonth);
  monthSelectRight.setOptions(monthOptions);
  const rightView = addMonths(new Date(viewYear, viewMonth, 1), 1);
  monthSelectRight.value = String(rightView.getMonth());
};

export const syncYearInputs = (
  yearInput: HTMLInputElement,
  yearInputRight: HTMLInputElement,
  viewYear: number,
  viewMonth: number,
): void => {
  if (document.activeElement !== yearInput) {
    yearInput.value = String(viewYear);
  }
  const rightView = addMonths(new Date(viewYear, viewMonth, 1), 1);
  if (document.activeElement !== yearInputRight) {
    yearInputRight.value = String(rightView.getFullYear());
  }
};
