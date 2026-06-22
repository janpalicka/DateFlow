import { addMonths, startOfDay } from "date-fns";
import { isGridNavKey, nextActiveDate } from "../render/gridKeyboard";
import { compareCalendarDay, mergeLocale, toISODate } from "../utils";
import type { CalendarDomElements } from "../dom/types";
import type { CalendarPopover } from "../popover";
import type { CalendarCallbacks, CalendarState } from "./ctx";

const monthIdx = (year: number, month: number): number => year * 12 + month;

export type GridNavDeps = {
  s: CalendarState;
  dom: CalendarDomElements;
  mode: () => string;
  isCompactRangeLayout: () => boolean;
  getPopover: () => CalendarPopover | null;
  cb: CalendarCallbacks;
};

export type GridNav = {
  focusActiveDay: () => void;
  revealActiveDate: (date: Date) => void;
  onGridKeydown: (e: KeyboardEvent) => void;
};

export function createGridNav({
  s,
  dom,
  mode,
  isCompactRangeLayout,
  getPopover,
  cb,
}: GridNavDeps): GridNav {
  function focusActiveDay(): void {
    const selector = `button.cal__day[data-date="${toISODate(s.activeDate)}"]`;
    const btn =
      dom.grid.querySelector<HTMLButtonElement>(selector) ??
      dom.gridRight.querySelector<HTMLButtonElement>(selector);
    btn?.focus();
  }

  function revealActiveDate(date: Date): void {
    const compactRange = isCompactRangeLayout();
    const left = monthIdx(s.viewYear, s.viewMonth);
    const target = monthIdx(date.getFullYear(), date.getMonth());
    const isVisible =
      mode() !== "range" || compactRange ? target === left : target === left || target === left + 1;
    if (isVisible) return;
    const twoPane = mode() === "range" && !compactRange;
    if (twoPane && target > left) {
      const leftDate = addMonths(new Date(date.getFullYear(), date.getMonth(), 1), -1);
      s.viewYear = leftDate.getFullYear();
      s.viewMonth = leftDate.getMonth();
    } else {
      s.viewYear = date.getFullYear();
      s.viewMonth = date.getMonth();
    }
  }

  function onGridKeydown(e: KeyboardEvent): void {
    if (e.key === "Escape" && getPopover()) {
      e.preventDefault();
      cb.hidePanel();
      return;
    }
    if (!isGridNavKey(e.key)) return;
    const locale = mergeLocale(s.options.locale);
    const candidate = nextActiveDate(e.key, e.shiftKey, s.activeDate, locale.firstDayOfWeek);
    if (!candidate) return;
    e.preventDefault();
    const next = startOfDay(candidate);
    if (s.options.minDate && compareCalendarDay(next, s.options.minDate) < 0) return;
    if (s.options.maxDate && compareCalendarDay(next, s.options.maxDate) > 0) return;
    cb.clearRangeHover();
    s.activeDate = next;
    revealActiveDate(next);
    cb.render();
    focusActiveDay();
  }

  return { focusActiveDay, revealActiveDate, onGridKeydown };
}
