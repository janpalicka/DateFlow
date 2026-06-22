import { addMonths, startOfDay } from "date-fns";
import { coerceSetDateEntry } from "../setDate";
import { cloneRange, dateOnlyIfNeeded, effectiveOutputFormat, shouldShowTimeOn } from "../utils";
import type { CalendarDomElements } from "../dom/types";
import type { CalendarPopover } from "../popover";
import type {
  CalendarCurrentYear,
  CalendarMode,
  CalendarOptions,
  CalendarPickerInstance,
  CalendarSelectedDates,
  CalendarSetDateInput,
  DateRangeValue,
} from "../types";
import type { CalendarCallbacks, CalendarState } from "./ctx";
import type { Emitters } from "./emitters";

export type PublicApiDeps = {
  s: CalendarState;
  dom: CalendarDomElements;
  valueInput: HTMLInputElement;
  popover: CalendarPopover | null;
  rangePresetsMediaQuery: MediaQueryList | null;
  compactRangeMediaQuery: MediaQueryList | null;
  onRangePresetsLayoutChange: () => void;
  onCompactRangeLayoutChange: () => void;
  onInputKeydown: (e: KeyboardEvent) => void;
  onGridKeydown: (e: KeyboardEvent) => void;
  onGridMouseMove: (e: MouseEvent) => void;
  onGridMouseLeave: () => void;
  mode: () => CalendarMode;
  usesApplyActions: () => boolean;
  isCompactRangeLayout: () => boolean;
  emitters: Emitters;
  showPanel: () => void;
  cb: CalendarCallbacks;
};

export function createPublicApi({
  s,
  dom,
  valueInput,
  popover,
  rangePresetsMediaQuery,
  compactRangeMediaQuery,
  onRangePresetsLayoutChange,
  onCompactRangeLayoutChange,
  onInputKeydown,
  onGridKeydown,
  onGridMouseMove,
  onGridMouseLeave,
  mode,
  usesApplyActions,
  isCompactRangeLayout,
  emitters,
  showPanel,
  cb,
}: PublicApiDeps): CalendarPickerInstance {
  function applyTheme(theme?: string): void {
    if (theme) {
      dom.root.dataset.calTheme = theme;
      valueInput.dataset.calTheme = theme;
    } else {
      delete dom.root.dataset.calTheme;
      delete valueInput.dataset.calTheme;
    }
  }

  function normalizeStoredDatesIfDateOnly(): void {
    if (shouldShowTimeOn(s.options)) return;
    if (mode() === "single") {
      if (s.selected) s.selected = startOfDay(s.selected);
    } else {
      if (s.rangeStart) s.rangeStart = startOfDay(s.rangeStart);
      if (s.rangeEnd) s.rangeEnd = startOfDay(s.rangeEnd);
    }
  }

  function readSelectedDates(): CalendarSelectedDates {
    if (mode() === "single") {
      const value = usesApplyActions() ? s.committedSelected : s.selected;
      return {
        selectedDate: value ? new Date(dateOnlyIfNeeded(s.options, value).getTime()) : null,
      };
    }
    return {
      start: s.rangeStart ? new Date(dateOnlyIfNeeded(s.options, s.rangeStart).getTime()) : null,
      end: s.rangeEnd ? new Date(dateOnlyIfNeeded(s.options, s.rangeEnd).getTime()) : null,
    };
  }

  function readCurrentYear(): CalendarCurrentYear {
    if (mode() === "single") {
      return { currentYear: s.viewYear };
    }
    const rightView = addMonths(new Date(s.viewYear, s.viewMonth, 1), 1);
    return {
      startYear: s.viewYear,
      endYear: isCompactRangeLayout() ? s.viewYear : rightView.getFullYear(),
    };
  }

  return {
    get selectedDates(): CalendarSelectedDates {
      return readSelectedDates();
    },
    get currentYear(): CalendarCurrentYear {
      return readCurrentYear();
    },
    changeMonth(months: number, relative = true): void {
      cb.clearRangeHover();
      if (relative) {
        const next = addMonths(new Date(s.viewYear, s.viewMonth, 1), months);
        s.viewYear = next.getFullYear();
        s.viewMonth = next.getMonth();
      } else {
        s.viewMonth = Math.min(11, Math.max(0, Math.floor(months)));
      }
      cb.render();
    },
    clear(): void {
      emitters.clearSelection();
    },
    getValue(): Date | null {
      if (mode() !== "single") return null;
      const value = usesApplyActions() ? s.committedSelected : s.selected;
      if (!value) return null;
      return new Date(dateOnlyIfNeeded(s.options, value).getTime());
    },
    setValue(date: Date | null): void {
      if (mode() !== "single") return;
      s.selected = date ? new Date(date.getTime()) : null;
      if (s.selected && !shouldShowTimeOn(s.options)) {
        s.selected = startOfDay(s.selected);
      }
      if (usesApplyActions()) {
        emitters.syncCommittedSingle();
      }
      if (s.selected) {
        s.viewYear = s.selected.getFullYear();
        s.viewMonth = s.selected.getMonth();
      }
      cb.render();
    },
    setDate(newDate: CalendarSetDateInput, format?: string, silent = false): void {
      cb.clearRangeHover();
      const parseFormat = format ?? effectiveOutputFormat(s.options);
      const ref = s.selected ?? s.rangeStart ?? new Date();

      if (mode() === "single") {
        const parsed =
          newDate.length === 0 ? null : coerceSetDateEntry(newDate[0], parseFormat, ref);
        s.selected = parsed ? new Date(parsed.getTime()) : null;
        if (s.selected && !shouldShowTimeOn(s.options)) {
          s.selected = startOfDay(s.selected);
        }
        if (usesApplyActions()) {
          emitters.syncCommittedSingle();
        }
        if (s.selected) {
          s.viewYear = s.selected.getFullYear();
          s.viewMonth = s.selected.getMonth();
        }
        cb.render();
        if (!silent) emitters.emitSingle();
        return;
      }

      const startParsed =
        newDate.length === 0 ? null : coerceSetDateEntry(newDate[0], parseFormat, ref);
      const endParsed =
        newDate.length < 2 ? null : coerceSetDateEntry(newDate[1], parseFormat, ref);
      s.rangeStart = startParsed ? new Date(startParsed.getTime()) : null;
      s.rangeEnd = endParsed ? new Date(endParsed.getTime()) : null;
      if (!shouldShowTimeOn(s.options)) {
        if (s.rangeStart) s.rangeStart = startOfDay(s.rangeStart);
        if (s.rangeEnd) s.rangeEnd = startOfDay(s.rangeEnd);
      }
      const anchorDate = s.rangeStart ?? s.rangeEnd;
      if (anchorDate) {
        s.viewYear = anchorDate.getFullYear();
        s.viewMonth = anchorDate.getMonth();
      }
      emitters.syncCommittedRange();
      cb.render();
      if (!silent) emitters.emitRange();
    },
    getRange(): DateRangeValue {
      if (mode() === "single") {
        return cloneRange({
          start: s.selected ? dateOnlyIfNeeded(s.options, s.selected) : null,
          end: null,
        });
      }
      return cloneRange({
        start: s.committedRangeStart ? dateOnlyIfNeeded(s.options, s.committedRangeStart) : null,
        end: s.committedRangeEnd ? dateOnlyIfNeeded(s.options, s.committedRangeEnd) : null,
      });
    },
    setRange(range: DateRangeValue): void {
      cb.clearRangeHover();
      if (mode() === "single") {
        s.selected = range.start ? new Date(range.start.getTime()) : null;
        if (s.selected && !shouldShowTimeOn(s.options)) {
          s.selected = startOfDay(s.selected);
        }
        if (s.selected) {
          s.viewYear = s.selected.getFullYear();
          s.viewMonth = s.selected.getMonth();
        }
        cb.render();
        return;
      }
      s.rangeStart = range.start ? new Date(range.start.getTime()) : null;
      s.rangeEnd = range.end ? new Date(range.end.getTime()) : null;
      if (!shouldShowTimeOn(s.options)) {
        if (s.rangeStart) s.rangeStart = startOfDay(s.rangeStart);
        if (s.rangeEnd) s.rangeEnd = startOfDay(s.rangeEnd);
      }
      const a = s.rangeStart ?? s.rangeEnd;
      if (a) {
        s.viewYear = a.getFullYear();
        s.viewMonth = a.getMonth();
      }
      emitters.syncCommittedRange();
      cb.render();
    },
    setOptions(partial: Partial<CalendarOptions>): void {
      s.options = { ...s.options, ...partial };
      if (partial.mode !== undefined || partial.range !== undefined) {
        cb.clearRangeHover();
      }
      if (partial.mode !== undefined) {
        if ((s.options.mode ?? "single") === "single") {
          s.rangeStart = null;
          s.rangeEnd = null;
          s.committedRangeStart = null;
          s.committedRangeEnd = null;
          s.selected = s.options.value != null ? new Date(s.options.value.getTime()) : null;
          if (s.selected && !shouldShowTimeOn(s.options)) {
            s.selected = startOfDay(s.selected);
          }
          if (usesApplyActions()) {
            emitters.syncCommittedSingle();
          }
          if (s.selected) {
            s.viewYear = s.selected.getFullYear();
            s.viewMonth = s.selected.getMonth();
          }
        } else {
          s.selected = null;
          s.rangeStart = s.options.range?.start ? new Date(s.options.range.start.getTime()) : null;
          s.rangeEnd = s.options.range?.end ? new Date(s.options.range.end.getTime()) : null;
          emitters.syncCommittedRange();
          const a = s.rangeStart ?? s.rangeEnd;
          if (a) {
            s.viewYear = a.getFullYear();
            s.viewMonth = a.getMonth();
          }
        }
      }
      if (partial.value !== undefined && mode() === "single") {
        s.selected = partial.value === null ? null : new Date(partial.value.getTime());
        if (usesApplyActions()) {
          emitters.syncCommittedSingle();
        }
        if (s.selected) {
          s.viewYear = s.selected.getFullYear();
          s.viewMonth = s.selected.getMonth();
        }
      }
      if (partial.range !== undefined && mode() === "range") {
        s.rangeStart = partial.range.start ? new Date(partial.range.start.getTime()) : null;
        s.rangeEnd = partial.range.end ? new Date(partial.range.end.getTime()) : null;
        emitters.syncCommittedRange();
        const a = s.rangeStart ?? s.rangeEnd;
        if (a) {
          s.viewYear = a.getFullYear();
          s.viewMonth = a.getMonth();
        }
      }
      if (partial.theme !== undefined) {
        applyTheme(partial.theme || undefined);
      }
      if (partial.className !== undefined) {
        dom.root.className = ["cal", s.options.className].filter(Boolean).join(" ");
      }
      if (partial.ariaLabel !== undefined) {
        dom.root.setAttribute("aria-label", partial.ariaLabel);
      }
      if (partial.allowInput !== undefined) {
        s.inputController.applyInputMode();
      }
      normalizeStoredDatesIfDateOnly();
      if (mode() === "range") {
        emitters.syncCommittedRange();
      } else if (usesApplyActions()) {
        emitters.syncCommittedSingle();
      }
      cb.render();
    },
    getInputElement(): HTMLInputElement {
      return valueInput;
    },
    getCalendarElement(): HTMLElement {
      return dom.container;
    },
    open(): void {
      showPanel();
    },
    close(): void {
      cb.hidePanel();
    },
    destroy(): void {
      rangePresetsMediaQuery?.removeEventListener("change", onRangePresetsLayoutChange);
      compactRangeMediaQuery?.removeEventListener("change", onCompactRangeLayoutChange);
      popover?.destroy();
      valueInput.removeEventListener("blur", s.inputController.onInputBlur);
      valueInput.removeEventListener("keydown", onInputKeydown);
      dom.grid.removeEventListener("keydown", onGridKeydown);
      dom.gridRight.removeEventListener("keydown", onGridKeydown);
      dom.grid.removeEventListener("mousemove", onGridMouseMove);
      dom.grid.removeEventListener("mouseleave", onGridMouseLeave);
      dom.gridRight.removeEventListener("mousemove", onGridMouseMove);
      dom.gridRight.removeEventListener("mouseleave", onGridMouseLeave);
      dom.monthSelect.close();
      dom.monthSelectRight.close();
      dom.timeSingle.hour.close();
      dom.timeSingle.minute.close();
      dom.timeSingle.second.close();
      dom.timeSingle.meridiem.close();
      dom.timeRangeStart.hour.close();
      dom.timeRangeStart.minute.close();
      dom.timeRangeStart.second.close();
      dom.timeRangeStart.meridiem.close();
      dom.timeRangeEnd.hour.close();
      dom.timeRangeEnd.minute.close();
      dom.timeRangeEnd.second.close();
      dom.timeRangeEnd.meridiem.close();
      dom.container.remove();
    },
  };
}
