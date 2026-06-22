import { applyHM, fillHourMinute, fillSecond, setHM, snapMinuteToStep } from "../time";
import { compareCalendarDay, shouldShowTimeOn } from "../utils";
import type { CustomSelectControl } from "../dom/customSelect";
import type { CalendarDomElements } from "../dom/types";
import type { CalendarCallbacks, CalendarState } from "./ctx";

export type TimeManagerDeps = {
  s: CalendarState;
  dom: CalendarDomElements;
  now: Date;
  mode: () => string;
  use12Hour: () => boolean;
  minuteStepOn: () => number;
  showSecondsOn: () => boolean;
  usesApplyActions: () => boolean;
  secondForSingle: () => CustomSelectControl | null;
  secondForStart: () => CustomSelectControl | null;
  secondForEnd: () => CustomSelectControl | null;
  emitSingle: () => void;
  cb: CalendarCallbacks;
};

export type TimeManager = {
  syncTimeSelectsFromValue: () => void;
  syncTimeFieldControls: () => void;
  updateTimeVisibility: () => void;
  onTimeSingleChange: () => void;
  onTimeRangeStartChange: () => void;
  onTimeRangeEndChange: () => void;
};

export function createTimeManager({
  s,
  dom,
  now,
  mode,
  use12Hour,
  minuteStepOn,
  showSecondsOn,
  usesApplyActions,
  secondForSingle,
  secondForStart,
  secondForEnd,
  emitSingle,
  cb,
}: TimeManagerDeps): TimeManager {
  function syncTimeSelectsFromValue(): void {
    const use12 = use12Hour();
    const step = minuteStepOn();

    const snapStoredMinutes = (date: Date | null): Date | null => {
      if (!date || !shouldShowTimeOn(s.options)) return date;
      const snapped = snapMinuteToStep(date.getMinutes(), step);
      if (snapped === date.getMinutes()) return date;
      const next = new Date(date);
      next.setMinutes(snapped, 0, 0);
      return next;
    };

    if (mode() === "single") {
      s.selected = snapStoredMinutes(s.selected);
    } else {
      s.rangeStart = snapStoredMinutes(s.rangeStart);
      s.rangeEnd = snapStoredMinutes(s.rangeEnd);
    }

    fillHourMinute(
      dom.timeSingle.hour,
      dom.timeSingle.minute,
      dom.timeSingle.meridiem,
      use12,
      step,
    );
    fillHourMinute(
      dom.timeRangeStart.hour,
      dom.timeRangeStart.minute,
      dom.timeRangeStart.meridiem,
      use12,
      step,
    );
    fillHourMinute(
      dom.timeRangeEnd.hour,
      dom.timeRangeEnd.minute,
      dom.timeRangeEnd.meridiem,
      use12,
      step,
    );

    if (showSecondsOn()) {
      fillSecond(dom.timeSingle.second);
      fillSecond(dom.timeRangeStart.second);
      fillSecond(dom.timeRangeEnd.second);
    }

    if (mode() === "single") {
      const base = s.selected ?? now;
      setHM(
        dom.timeSingle.hour,
        dom.timeSingle.minute,
        dom.timeSingle.meridiem,
        secondForSingle(),
        base,
        use12,
        step,
      );
      return;
    }
    const start = s.rangeStart ?? now;
    const end = s.rangeEnd ?? s.rangeStart ?? now;
    setHM(
      dom.timeRangeStart.hour,
      dom.timeRangeStart.minute,
      dom.timeRangeStart.meridiem,
      secondForStart(),
      start,
      use12,
      step,
    );
    setHM(
      dom.timeRangeEnd.hour,
      dom.timeRangeEnd.minute,
      dom.timeRangeEnd.meridiem,
      secondForEnd(),
      end,
      use12,
      step,
    );
  }

  function syncTimeFieldControls(): void {
    const editable = s.options.allowTimeInput ?? true;
    const context = { use12Hour: use12Hour(), minuteStep: minuteStepOn() };
    for (const row of [dom.timeSingle, dom.timeRangeStart, dom.timeRangeEnd]) {
      for (const field of [row.hour, row.minute, row.second] as const) {
        field.setEditable?.(editable);
        field.setClampContext?.(context);
      }
    }
  }

  function updateTimeVisibility(): void {
    const st = s.options.showTime ?? false;
    const use12 = use12Hour();
    const secs = showSecondsOn();
    const rng = mode() === "range";
    dom.timeWrap.hidden = !st || rng;
    dom.timeWrapRangeStart.hidden = !st || !rng;
    dom.timeWrapRangeEnd.hidden = !st || !rng;
    dom.timeSingle.row.hidden = !st || rng;
    dom.timeRangeStart.row.hidden = !st || !rng;
    dom.timeRangeEnd.row.hidden = !st || !rng;
    dom.timeSingle.meridiem.root.hidden = !st || !use12 || rng;
    dom.timeRangeStart.meridiem.root.hidden = !st || !use12 || !rng;
    dom.timeRangeEnd.meridiem.root.hidden = !st || !use12 || !rng;
    dom.timeSingle.second.root.hidden = !st || !secs || rng;
    dom.timeSingle.sepSecond.hidden = !st || !secs || rng;
    dom.timeRangeStart.second.root.hidden = !st || !secs || !rng;
    dom.timeRangeStart.sepSecond.hidden = !st || !secs || !rng;
    dom.timeRangeEnd.second.root.hidden = !st || !secs || !rng;
    dom.timeRangeEnd.sepSecond.hidden = !st || !secs || !rng;
    syncTimeFieldControls();
  }

  function onTimeSingleChange(): void {
    if (!s.selected) return;
    s.selected = applyHM(
      s.selected,
      dom.timeSingle.hour,
      dom.timeSingle.minute,
      dom.timeSingle.meridiem,
      secondForSingle(),
      use12Hour(),
    );
    if (!usesApplyActions()) {
      emitSingle();
    }
  }

  function onTimeRangeStartChange(): void {
    if (!s.rangeStart) return;
    s.rangeStart = applyHM(
      s.rangeStart,
      dom.timeRangeStart.hour,
      dom.timeRangeStart.minute,
      dom.timeRangeStart.meridiem,
      secondForStart(),
      use12Hour(),
    );
    if (s.rangeEnd && compareCalendarDay(s.rangeEnd, s.rangeStart) < 0) {
      s.rangeEnd = new Date(s.rangeStart);
      setHM(
        dom.timeRangeEnd.hour,
        dom.timeRangeEnd.minute,
        dom.timeRangeEnd.meridiem,
        secondForEnd(),
        s.rangeEnd,
        use12Hour(),
        minuteStepOn(),
      );
    }
    cb.render();
  }

  function onTimeRangeEndChange(): void {
    if (!s.rangeEnd) return;
    s.rangeEnd = applyHM(
      s.rangeEnd,
      dom.timeRangeEnd.hour,
      dom.timeRangeEnd.minute,
      dom.timeRangeEnd.meridiem,
      secondForEnd(),
      use12Hour(),
    );
    if (s.rangeStart && compareCalendarDay(s.rangeEnd, s.rangeStart) < 0) {
      s.rangeStart = new Date(s.rangeEnd);
      setHM(
        dom.timeRangeStart.hour,
        dom.timeRangeStart.minute,
        dom.timeRangeStart.meridiem,
        secondForStart(),
        s.rangeStart,
        use12Hour(),
        minuteStepOn(),
      );
    }
    cb.render();
  }

  return {
    syncTimeSelectsFromValue,
    syncTimeFieldControls,
    updateTimeVisibility,
    onTimeSingleChange,
    onTimeRangeStartChange,
    onTimeRangeEndChange,
  };
}
