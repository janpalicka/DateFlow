import { compareAsc, startOfDay } from "date-fns";
import { applyHM, setHM } from "../time";
import { shouldShowTimeOn } from "../utils";
import type { CustomSelectControl } from "../dom/customSelect";
import type { CalendarDomElements } from "../dom/types";
import type { CalendarCallbacks, CalendarState } from "./ctx";

export type DayClickDeps = {
  s: CalendarState;
  dom: CalendarDomElements;
  mode: () => string;
  use12Hour: () => boolean;
  minuteStepOn: () => number;
  usesApplyActions: () => boolean;
  secondForSingle: () => CustomSelectControl | null;
  secondForStart: () => CustomSelectControl | null;
  secondForEnd: () => CustomSelectControl | null;
  cb: CalendarCallbacks;
};

export function createDayClickHandler({
  s,
  dom,
  mode,
  use12Hour,
  minuteStepOn,
  usesApplyActions,
  secondForSingle,
  secondForStart,
  secondForEnd,
  cb,
}: DayClickDeps): (_dayDate: Date, cellYear: number, cellMonth: number, dayNum: number) => void {
  return function onDayClick(
    _dayDate: Date,
    cellYear: number,
    cellMonth: number,
    dayNum: number,
  ): void {
    s.activeDate = new Date(cellYear, cellMonth, dayNum);
    if (mode() === "single") {
      const dayOnly = new Date(cellYear, cellMonth, dayNum, 0, 0, 0, 0);
      s.selected = shouldShowTimeOn(s.options)
        ? applyHM(
            dayOnly,
            dom.timeSingle.hour,
            dom.timeSingle.minute,
            dom.timeSingle.meridiem,
            secondForSingle(),
            use12Hour(),
          )
        : dayOnly;
      if (!usesApplyActions()) {
        cb.emitSingle();
        if (s.options.hideOnSingleSelect ?? true) {
          cb.hidePanel();
        }
      }
    } else {
      const clicked = new Date(cellYear, cellMonth, dayNum, 0, 0, 0, 0);
      if (!s.rangeStart || (s.rangeStart && s.rangeEnd)) {
        s.rangeStart = shouldShowTimeOn(s.options)
          ? applyHM(
              clicked,
              dom.timeRangeStart.hour,
              dom.timeRangeStart.minute,
              dom.timeRangeStart.meridiem,
              secondForStart(),
              use12Hour(),
            )
          : clicked;
        s.rangeEnd = null;
        s.rangeHoverEnd = startOfDay(s.rangeStart);
        setHM(
          dom.timeRangeEnd.hour,
          dom.timeRangeEnd.minute,
          dom.timeRangeEnd.meridiem,
          secondForEnd(),
          s.rangeStart,
          use12Hour(),
          minuteStepOn(),
        );
      } else {
        cb.clearRangeHover();
        const d0 = startOfDay(s.rangeStart);
        const d1 = startOfDay(clicked);
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
    }
    cb.render();
  };
}
