import { mergeLocale } from "../utils";
import type { CalendarOptions } from "../types";

export const renderWeekdaysRow = (target: HTMLDivElement, options: CalendarOptions): void => {
  const locale = mergeLocale(options.locale);
  const showWk = options.showWeekNumbers ?? false;
  target.replaceChildren();
  target.classList.toggle("cal__weekdays--with-weeks", showWk);
  if (showWk) {
    const wk = document.createElement("div");
    wk.className = "cal__weekday cal__weekday--weeknum";
    wk.textContent = locale.weekNumberHeader ?? "Wk";
    target.append(wk);
  }
  const start = locale.firstDayOfWeek % 7;
  for (let i = 0; i < 7; i += 1) {
    const idx = (start + i) % 7;
    const cell = document.createElement("div");
    cell.className = "cal__weekday";
    cell.textContent = locale.weekdays.shorthand[idx] ?? "";
    target.append(cell);
  }
};
