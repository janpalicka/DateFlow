import {
  addMonths,
  compareAsc,
  differenceInCalendarDays,
  getDaysInMonth,
  getISOWeek,
  isSameDay,
  startOfDay,
} from "date-fns";
import {
  dayInInclusiveRange,
  formatRangeDurationLabel,
  isSelectable,
  mergeLocale,
  toISODate,
} from "../utils";
import type { CalendarMode, CalendarOptions } from "../types";
import type { ResolvedCalendarLocale } from "../types/types";

export interface GridSelectionState {
  mode: CalendarMode;
  selected: Date | null;
  rangeStart: Date | null;
  rangeEnd: Date | null;
  rangeHoverEnd: Date | null;
  shouldPseudoSelectToday: boolean;
  now: Date;
  durationTipIdBase: string;
  /** Day that holds `tabindex="0"` for roving-tabindex keyboard navigation. */
  activeDate: Date | null;
}

export interface GridRenderCallbacks {
  onDayClick: (dayDate: Date, cellYear: number, cellMonth: number, dayNum: number) => void;
}

/**
 * Selection-dependent classes applied during decoration. Cleared and re-applied
 * on every decorate pass, so they must NOT include structural classes such as
 * `cal__day--today` or `cal__day--disabled`.
 */
const DAY_STATE_CLASSES = [
  "cal__day--selected",
  "cal__day--pseudo-selected",
  "cal__day--range-single",
  "cal__day--range-start",
  "cal__day--range-end",
  "cal__day--range-between",
  "cal__day--range-preview-between",
  "cal__day--range-preview-start",
  "cal__day--range-preview-end",
];

interface GridDay {
  date: Date;
  btn: HTMLButtonElement;
}

/**
 * The structural shape of a rendered month, cached per grid element so that
 * selection/hover changes only re-decorate existing day buttons instead of
 * tearing down and rebuilding the whole grid.
 */
interface GridStructure {
  year: number;
  month: number;
  firstDayOfWeek: number;
  /** Locale option reference — drives the per-day `aria-label` month names. */
  localeOption: CalendarOptions["locale"];
  showWk: boolean;
  minDate: Date | null | undefined;
  maxDate: Date | null | undefined;
  disabledDates: CalendarOptions["disabledDates"];
  enabledDatesOnly: CalendarOptions["enabledDatesOnly"];
  strike: CalendarOptions["disabledDatesStrikeThrough"];
  nowTime: number;
  days: GridDay[];
}

const gridStructures = new WeakMap<HTMLElement, GridStructure>();

const structureMatches = (
  cache: GridStructure,
  year: number,
  month: number,
  firstDayOfWeek: number,
  showWk: boolean,
  options: CalendarOptions,
  nowTime: number,
): boolean =>
  cache.year === year &&
  cache.month === month &&
  cache.firstDayOfWeek === firstDayOfWeek &&
  cache.localeOption === options.locale &&
  cache.showWk === showWk &&
  cache.minDate === options.minDate &&
  cache.maxDate === options.maxDate &&
  cache.disabledDates === options.disabledDates &&
  cache.enabledDatesOnly === options.enabledDatesOnly &&
  cache.strike === options.disabledDatesStrikeThrough &&
  cache.nowTime === nowTime;

/** Apply selection/range/hover state to already-built day buttons. */
const decorateDays = (
  days: readonly GridDay[],
  selection: GridSelectionState,
  locale: ResolvedCalendarLocale,
): void => {
  const {
    mode,
    selected,
    rangeStart,
    rangeEnd,
    rangeHoverEnd,
    shouldPseudoSelectToday,
    now,
    activeDate,
    durationTipIdBase,
  } = selection;

  for (const { date: dayDate, btn } of days) {
    btn.classList.remove(...DAY_STATE_CLASSES);
    btn.querySelector(".cal__range-duration-tip")?.remove();
    btn.removeAttribute("aria-describedby");
    btn.tabIndex = activeDate && isSameDay(dayDate, activeDate) ? 0 : -1;

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
            appendDurationTip(btn, durationTipIdBase, formatRangeDurationLabel(locale, 1));
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
            btn.classList.add(
              isSameDay(anchor, lo) ? "cal__day--range-start" : "cal__day--range-preview-start",
            );
          } else if (isSameDay(dayDate, hi)) {
            btn.classList.add(
              isSameDay(anchor, hi) ? "cal__day--range-end" : "cal__day--range-preview-end",
            );
          } else {
            btn.classList.add("cal__day--range-preview-between");
          }
          if (isSameDay(dayDate, hover)) {
            appendDurationTip(btn, durationTipIdBase, formatRangeDurationLabel(locale, spanDays));
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
  }
};

const appendDurationTip = (btn: HTMLButtonElement, idBase: string, label: string): void => {
  const tipEl = document.createElement("span");
  tipEl.className = "cal__range-duration-tip";
  tipEl.id = `${idBase}-hover`;
  tipEl.setAttribute("role", "tooltip");
  tipEl.textContent = label;
  btn.setAttribute("aria-describedby", tipEl.id);
  btn.append(tipEl);
};

/** Build the (selection-independent) day buttons for a month. */
const buildGridStructure = (
  target: HTMLDivElement,
  panelYear: number,
  panelMonth: number,
  options: CalendarOptions,
  locale: ResolvedCalendarLocale,
  showWk: boolean,
  nowTime: number,
  callbacks: GridRenderCallbacks,
): GridStructure => {
  target.replaceChildren();
  target.classList.toggle("cal__grid--with-weeks", showWk);
  target.setAttribute("aria-label", `${locale.months.longhand[panelMonth]} ${panelYear}`);

  const first = new Date(panelYear, panelMonth, 1);
  const startWeekday = (first.getDay() - (locale.firstDayOfWeek % 7) + 7) % 7;
  const dim = getDaysInMonth(first);
  const numRows = Math.ceil((startWeekday + dim) / 7);
  const days: GridDay[] = [];

  const appendSpacer = (rowEl: HTMLDivElement): void => {
    const spacer = document.createElement("div");
    spacer.className = "cal__day-spacer";
    spacer.setAttribute("role", "gridcell");
    spacer.setAttribute("aria-hidden", "true");
    rowEl.append(spacer);
  };

  for (let row = 0; row < numRows; row += 1) {
    const rowStart = row * 7;
    const rowEl = document.createElement("div");
    rowEl.className = "cal__week";
    rowEl.setAttribute("role", "row");

    if (showWk) {
      let weekRef: Date | null = null;
      for (let col = 0; col < 7; col += 1) {
        const i = rowStart + col;
        if (i >= startWeekday && i < startWeekday + dim) {
          weekRef = new Date(panelYear, panelMonth, i - startWeekday + 1);
          break;
        }
      }
      const wkCell = document.createElement("div");
      wkCell.className = "cal__weeknum";
      wkCell.setAttribute("role", "rowheader");
      if (weekRef) {
        wkCell.textContent = String(getISOWeek(weekRef));
      } else {
        wkCell.setAttribute("aria-hidden", "true");
      }
      rowEl.append(wkCell);
    }

    for (let col = 0; col < 7; col += 1) {
      const i = rowStart + col;
      if (i < startWeekday || i >= startWeekday + dim) {
        appendSpacer(rowEl);
        continue;
      }

      const dayNum = i - startWeekday + 1;
      const dayDate = new Date(panelYear, panelMonth, dayNum);
      const cell = document.createElement("div");
      cell.className = "cal__gridcell";
      cell.setAttribute("role", "gridcell");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cal__day";
      btn.setAttribute(
        "aria-label",
        `${dayNum} ${locale.months.longhand[panelMonth]} ${panelYear}`,
      );
      const dayNumEl = document.createElement("span");
      dayNumEl.className = "cal__day__num";
      dayNumEl.textContent = String(dayNum);
      btn.append(dayNumEl);
      btn.dataset.date = toISODate(dayDate);

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

      if (nowTime === startOfDay(dayDate).getTime()) {
        btn.classList.add("cal__day--today");
      }

      btn.addEventListener("click", () => {
        if (!selectable) return;
        callbacks.onDayClick(dayDate, panelYear, panelMonth, dayNum);
      });

      cell.append(btn);
      rowEl.append(cell);
      days.push({ date: dayDate, btn });
    }

    target.append(rowEl);
  }

  return {
    year: panelYear,
    month: panelMonth,
    firstDayOfWeek: locale.firstDayOfWeek,
    localeOption: options.locale,
    showWk,
    minDate: options.minDate,
    maxDate: options.maxDate,
    disabledDates: options.disabledDates,
    enabledDatesOnly: options.enabledDatesOnly,
    strike: options.disabledDatesStrikeThrough,
    nowTime,
    days,
  };
};

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
  const nowTime = startOfDay(selection.now).getTime();

  let structure = gridStructures.get(target);
  if (
    !structure ||
    !structureMatches(
      structure,
      panelYear,
      panelMonth,
      locale.firstDayOfWeek,
      showWk,
      options,
      nowTime,
    )
  ) {
    structure = buildGridStructure(
      target,
      panelYear,
      panelMonth,
      options,
      locale,
      showWk,
      nowTime,
      callbacks,
    );
    gridStructures.set(target, structure);
  }

  decorateDays(structure.days, selection, locale);
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
    gridStructures.delete(gridRight);
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
