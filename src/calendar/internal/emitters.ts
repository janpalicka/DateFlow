import { dateOnlyIfNeeded } from "../utils";
import type { CalendarMode } from "../types";
import type { CalendarCallbacks, CalendarState } from "./ctx";

export type Emitters = {
  syncCommittedSingle: () => void;
  syncCommittedRange: () => void;
  emitSingle: () => void;
  emitRange: () => void;
  clearSelection: () => void;
};

export function createEmitters(
  s: CalendarState,
  mode: () => CalendarMode,
  usesApplyActions: () => boolean,
  cb: CalendarCallbacks,
): Emitters {
  function syncCommittedSingle(): void {
    s.committedSelected = s.selected ? new Date(s.selected.getTime()) : null;
  }

  function syncCommittedRange(): void {
    s.committedRangeStart = s.rangeStart ? new Date(s.rangeStart.getTime()) : null;
    s.committedRangeEnd = s.rangeEnd ? new Date(s.rangeEnd.getTime()) : null;
  }

  function emitSingle(): void {
    if (usesApplyActions()) {
      syncCommittedSingle();
    }
    if (!s.selected) {
      s.options.onChange?.(null);
      s.inputController.syncInputFromState();
      return;
    }
    s.options.onChange?.(new Date(dateOnlyIfNeeded(s.options, s.selected).getTime()));
    s.inputController.syncInputFromState();
  }

  function emitRange(): void {
    s.options.onRangeChange?.({
      start: s.rangeStart ? new Date(dateOnlyIfNeeded(s.options, s.rangeStart).getTime()) : null,
      end: s.rangeEnd ? new Date(dateOnlyIfNeeded(s.options, s.rangeEnd).getTime()) : null,
    });
    s.inputController.syncInputFromState();
  }

  function clearSelection(): void {
    cb.clearRangeHover();
    if (mode() === "single") {
      s.selected = null;
      emitSingle();
    } else {
      s.rangeStart = null;
      s.rangeEnd = null;
      syncCommittedRange();
      emitRange();
    }
    cb.render();
  }

  return { syncCommittedSingle, syncCommittedRange, emitSingle, emitRange, clearSelection };
}
