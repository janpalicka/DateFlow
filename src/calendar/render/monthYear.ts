import { addMonths } from "date-fns";
import { mergeLocale } from "../utils";
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
  monthSelect: HTMLSelectElement,
  monthSelectRight: HTMLSelectElement,
  viewYear: number,
  viewMonth: number,
  options: CalendarOptions,
): void => {
  const locale = mergeLocale(options.locale);
  monthSelect.replaceChildren();
  monthSelectRight.replaceChildren();
  for (let m = 0; m < 12; m += 1) {
    const o = document.createElement("option");
    o.value = String(m);
    o.textContent = locale.months.longhand[m] ?? String(m);
    monthSelect.append(o);
    const r = document.createElement("option");
    r.value = String(m);
    r.textContent = locale.months.longhand[m] ?? String(m);
    monthSelectRight.append(r);
  }
  monthSelect.value = String(viewMonth);
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
