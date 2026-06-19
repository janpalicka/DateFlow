import {
  addMonths,
  compareAsc,
  differenceInCalendarDays,
  format,
  getDaysInMonth,
  getISOWeek,
  isSameDay,
  startOfDay,
} from "date-fns";
import { dayInInclusiveRange, formatRangeDurationLabel, isSelectable, mergeLocale } from "../utils";
import type { CalendarMode, CalendarOptions } from "../types";

export interface GridSelectionState {
  mode: CalendarMode;
  selected: Date | null;
  rangeStart: Date | null;
  rangeEnd: Date | null;
  rangeHoverEnd: Date | null;
  shouldPseudoSelectToday: boolean;
  now: Date;
  durationTipIdBase: string;
}

export interface GridRenderCallbacks {
  onDayClick: (dayDate: Date, cellYear: number, cellMonth: number, dayNum: number) => void;
}

export const renderGridForMonth = (
  target: HTMLDivElement,
  panelYear: number,
  panelMonth: number,
  options: CalendarOptions,
  selection: GridSelectionState,
  callbacks: GridRenderCallbacks,
): void => {
  const locale = mergeLocale(options.locale);
  const showWk = options.showWeekNumbers ?? false;
  target.replaceChildren();
  target.classList.toggle("cal__grid--with-weeks", showWk);

  const first = new Date(panelYear, panelMonth, 1);
  const startWeekday = (first.getDay() - (locale.firstDayOfWeek % 7) + 7) % 7;
  const dim = getDaysInMonth(first);
  const lastCell = startWeekday + dim;
  const numRows = Math.ceil(lastCell / 7);

  const appendSpacer = (): void => {
    const spacer = document.createElement("div");
    spacer.className = "cal__day-spacer";
    spacer.setAttribute("aria-hidden", "true");
    target.append(spacer);
  };

  const { mode, selected, rangeStart, rangeEnd, rangeHoverEnd, shouldPseudoSelectToday, now } =
    selection;

  for (let row = 0; row < numRows; row += 1) {
    const rowStart = row * 7;

    if (showWk) {
      let weekRef: Date | null = null;
      for (let col = 0; col < 7; col += 1) {
        const i = rowStart + col;
        if (i >= startWeekday && i < startWeekday + dim) {
          weekRef = new Date(panelYear, panelMonth, i - startWeekday + 1);
          break;
        }
      }
      if (weekRef) {
        const wkCell = document.createElement("div");
        wkCell.className = "cal__weeknum";
        wkCell.textContent = String(getISOWeek(weekRef));
        target.append(wkCell);
      } else {
        appendSpacer();
      }
    }

    for (let col = 0; col < 7; col += 1) {
      const i = rowStart + col;
      if (i < startWeekday || i >= startWeekday + dim) {
        appendSpacer();
        continue;
      }

      const dayNum = i - startWeekday + 1;
      const cellYear = panelYear;
      const cellMonth = panelMonth;
      const dayDate = new Date(cellYear, cellMonth, dayNum);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cal__day";
      const dayNumEl = document.createElement("span");
      dayNumEl.className = "cal__day__num";
      dayNumEl.textContent = String(dayNum);
      btn.append(dayNumEl);
      btn.dataset.date = format(startOfDay(dayDate), "yyyy-MM-dd");

      const selectable = isSelectable(
        dayDate,
        options.minDate ?? null,
        options.maxDate ?? null,
        options.enabledDatesOnly ? undefined : options.disabledDates,
        options.enabledDatesOnly,
      );
      if (!selectable) {
        btn.disabled = true;
        btn.classList.add("cal__day--disabled");
        if (options.disabledDatesStrikeThrough) {
          btn.classList.add("cal__day--disabled-strike");
        }
      }

      if (mode === "single") {
        if (selected && isSameDay(dayDate, selected)) {
          btn.classList.add("cal__day--selected");
          btn.setAttribute("aria-selected", "true");
        } else if (shouldPseudoSelectToday && isSameDay(dayDate, now)) {
          btn.classList.add("cal__day--pseudo-selected");
          btn.setAttribute("aria-selected", "false");
        } else {
          btn.setAttribute("aria-selected", "false");
        }
      } else if (rangeStart && rangeEnd) {
        const rs = rangeStart;
        const re = rangeEnd;
        if (isSameDay(dayDate, rs) && isSameDay(dayDate, re)) {
          btn.classList.add("cal__day--range-single");
        } else if (isSameDay(dayDate, rs)) {
          btn.classList.add("cal__day--range-start");
        } else if (isSameDay(dayDate, re)) {
          btn.classList.add("cal__day--range-end");
        } else if (dayInInclusiveRange(dayDate, rs, re)) {
          btn.classList.add("cal__day--range-between");
        }
        btn.setAttribute(
          "aria-selected",
          isSameDay(dayDate, rs) || isSameDay(dayDate, re) ? "true" : "false",
        );
      } else if (rangeStart && !rangeEnd) {
        const anchor = startOfDay(rangeStart);
        const hover = rangeHoverEnd ? startOfDay(rangeHoverEnd) : null;

        if (!hover || isSameDay(anchor, hover)) {
          if (isSameDay(dayDate, anchor)) {
            btn.classList.add("cal__day--range-start");
            btn.setAttribute("aria-selected", "true");
            if (hover && isSameDay(anchor, hover)) {
              const tipEl = document.createElement("span");
              tipEl.className = "cal__range-duration-tip";
              tipEl.id = `${selection.durationTipIdBase}-hover`;
              tipEl.setAttribute("role", "tooltip");
              tipEl.textContent = formatRangeDurationLabel(mergeLocale(options.locale), 1);
              btn.setAttribute("aria-describedby", tipEl.id);
              btn.append(tipEl);
            }
          } else {
            btn.setAttribute("aria-selected", "false");
          }
        } else {
          let lo = anchor;
          let hi = hover;
          if (compareAsc(lo, hi) > 0) {
            const t = lo;
            lo = hi;
            hi = t;
          }

          if (dayInInclusiveRange(dayDate, lo, hi)) {
            const spanDays = differenceInCalendarDays(hi, lo) + 1;
            if (isSameDay(dayDate, lo)) {
              if (isSameDay(anchor, lo)) {
                btn.classList.add("cal__day--range-start");
              } else {
                btn.classList.add("cal__day--range-preview-start");
              }
            } else if (isSameDay(dayDate, hi)) {
              if (isSameDay(anchor, hi)) {
                btn.classList.add("cal__day--range-end");
              } else {
                btn.classList.add("cal__day--range-preview-end");
              }
            } else {
              btn.classList.add("cal__day--range-preview-between");
            }
            if (isSameDay(dayDate, hover)) {
              const tipEl = document.createElement("span");
              tipEl.className = "cal__range-duration-tip";
              tipEl.id = `${selection.durationTipIdBase}-hover`;
              tipEl.setAttribute("role", "tooltip");
              tipEl.textContent = formatRangeDurationLabel(mergeLocale(options.locale), spanDays);
              btn.setAttribute("aria-describedby", tipEl.id);
              btn.append(tipEl);
            }
            btn.setAttribute(
              "aria-selected",
              isSameDay(dayDate, anchor) || isSameDay(dayDate, hover) ? "true" : "false",
            );
          } else {
            btn.setAttribute("aria-selected", "false");
          }
        }
      } else {
        btn.setAttribute("aria-selected", "false");
      }

      if (isSameDay(dayDate, now)) {
        btn.classList.add("cal__day--today");
      }

      btn.addEventListener("click", () => {
        if (!selectable) return;
        callbacks.onDayClick(dayDate, cellYear, cellMonth, dayNum);
      });

      target.append(btn);
    }
  }
};

export const renderGrid = (
  grid: HTMLDivElement,
  gridRight: HTMLDivElement,
  viewYear: number,
  viewMonth: number,
  options: CalendarOptions,
  selection: GridSelectionState,
  callbacks: GridRenderCallbacks,
  compactRange = false,
): void => {
  renderGridForMonth(grid, viewYear, viewMonth, options, selection, callbacks);
  if (compactRange) {
    gridRight.replaceChildren();
    return;
  }
  const rightView = addMonths(new Date(viewYear, viewMonth, 1), 1);
  renderGridForMonth(
    gridRight,
    rightView.getFullYear(),
    rightView.getMonth(),
    options,
    selection,
    callbacks,
  );
};
