import { addMonths, compareAsc, startOfDay } from "date-fns";
import { canGoNextMonth, canGoPrevMonth } from "../navigation";
import { clampYear, parseYearInput, restoreYearInput } from "../render/monthYear";
import { applyHM } from "../time";
import { shouldShowTimeOn } from "../utils";
import type { CustomSelectControl } from "../dom/customSelect";
import type { CalendarDomElements } from "../dom/types";
import type { CalendarMode } from "../types";
import type { CalendarCallbacks, CalendarState } from "./ctx";
import type { Emitters } from "./emitters";

export type NavigationHandlersDeps = {
  s: CalendarState;
  dom: CalendarDomElements;
  mode: () => CalendarMode;
  use12Hour: () => boolean;
  usesApplyActions: () => boolean;
  secondForSingle: () => CustomSelectControl | null;
  secondForStart: () => CustomSelectControl | null;
  secondForEnd: () => CustomSelectControl | null;
  emitters: Emitters;
  cb: CalendarCallbacks;
};

export function attachNavigationHandlers({
  s,
  dom,
  mode,
  use12Hour,
  usesApplyActions,
  secondForSingle,
  secondForStart,
  secondForEnd,
  emitters,
  cb,
}: NavigationHandlersDeps): void {
  function commitYearInput(input: HTMLInputElement, forRightPane: boolean): void {
    if (s.syncingYearInput) return;
    const parsed = parseYearInput(input.value);
    if (parsed === null) {
      restoreYearInput(input, s.viewYear, s.viewMonth, forRightPane);
      return;
    }
    cb.clearRangeHover();
    const year = clampYear(parsed, s.options);
    if (forRightPane) {
      const nextMonth = Number.parseInt(dom.monthSelectRight.value, 10);
      const left = addMonths(new Date(year, nextMonth, 1), -1);
      s.viewYear = left.getFullYear();
      s.viewMonth = left.getMonth();
    } else {
      s.viewYear = year;
    }
    cb.render();
  }

  dom.btnPrev.addEventListener("click", (): void => {
    if (!canGoPrevMonth(s.viewYear, s.viewMonth, s.options.minDate)) return;
    cb.clearRangeHover();
    if (s.viewMonth === 0) {
      s.viewMonth = 11;
      s.viewYear -= 1;
    } else {
      s.viewMonth -= 1;
    }
    cb.render();
  });

  dom.btnNext.addEventListener("click", (): void => {
    if (!canGoNextMonth(s.viewYear, s.viewMonth, s.options.maxDate, mode())) return;
    cb.clearRangeHover();
    if (s.viewMonth === 11) {
      s.viewMonth = 0;
      s.viewYear += 1;
    } else {
      s.viewMonth += 1;
    }
    cb.render();
  });

  dom.btnReset.addEventListener("click", (): void => {
    emitters.clearSelection();
  });

  dom.btnApplyRange.addEventListener("click", (): void => {
    if (mode() === "single" && usesApplyActions()) {
      if (!s.selected) return;
      s.selected = applyHM(
        s.selected,
        dom.timeSingle.hour,
        dom.timeSingle.minute,
        dom.timeSingle.meridiem,
        secondForSingle(),
        use12Hour(),
      );
      emitters.emitSingle();
      if (s.options.hideOnSingleSelect ?? true) {
        cb.hidePanel();
      }
      cb.render();
      return;
    }
    if (mode() !== "range") return;
    const hoverAtApply = s.rangeHoverEnd ? new Date(s.rangeHoverEnd.getTime()) : null;
    if (s.rangeStart && !s.rangeEnd && hoverAtApply) {
      const d0 = startOfDay(s.rangeStart);
      const d1 = startOfDay(hoverAtApply);
      let lo = d0;
      let hi = d1;
      if (compareAsc(lo, hi) > 0) {
        const t = lo;
        lo = hi;
        hi = t;
      }
      s.rangeStart = shouldShowTimeOn(s.options)
        ? applyHM(
            lo,
            dom.timeRangeStart.hour,
            dom.timeRangeStart.minute,
            dom.timeRangeStart.meridiem,
            secondForStart(),
            use12Hour(),
          )
        : lo;
      s.rangeEnd = shouldShowTimeOn(s.options)
        ? applyHM(
            hi,
            dom.timeRangeEnd.hour,
            dom.timeRangeEnd.minute,
            dom.timeRangeEnd.meridiem,
            secondForEnd(),
            use12Hour(),
          )
        : hi;
    }
    cb.clearRangeHover();
    emitters.syncCommittedRange();
    emitters.emitRange();
    cb.hidePanel();
    cb.render();
  });

  dom.btnCancelRange.addEventListener("click", (): void => {
    if (mode() === "single" && usesApplyActions()) {
      s.selected = s.committedSelected ? new Date(s.committedSelected.getTime()) : null;
      cb.hidePanel();
      cb.render();
      return;
    }
    if (mode() !== "range") return;
    cb.clearRangeHover();
    s.rangeStart = s.committedRangeStart ? new Date(s.committedRangeStart.getTime()) : null;
    s.rangeEnd = s.committedRangeEnd ? new Date(s.committedRangeEnd.getTime()) : null;
    cb.hidePanel();
    cb.render();
  });

  dom.monthSelect.addEventListener("change", (): void => {
    cb.clearRangeHover();
    s.viewMonth = Number.parseInt(dom.monthSelect.value, 10);
    cb.render();
  });

  dom.yearInput.addEventListener("blur", (): void => {
    commitYearInput(dom.yearInput, false);
  });
  dom.yearInput.addEventListener("keydown", (e): void => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    commitYearInput(dom.yearInput, false);
    dom.yearInput.blur();
  });

  dom.monthSelectRight.addEventListener("change", (): void => {
    cb.clearRangeHover();
    const nextMonth = Number.parseInt(dom.monthSelectRight.value, 10);
    const parsedYear = parseYearInput(dom.yearInputRight.value);
    if (parsedYear === null) {
      restoreYearInput(dom.yearInputRight, s.viewYear, s.viewMonth, true);
      return;
    }
    const left = addMonths(new Date(clampYear(parsedYear, s.options), nextMonth, 1), -1);
    s.viewYear = left.getFullYear();
    s.viewMonth = left.getMonth();
    cb.render();
  });

  dom.yearInputRight.addEventListener("blur", (): void => {
    commitYearInput(dom.yearInputRight, true);
  });
  dom.yearInputRight.addEventListener("keydown", (e): void => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    commitYearInput(dom.yearInputRight, true);
    dom.yearInputRight.blur();
  });
}
