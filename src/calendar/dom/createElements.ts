import { ICON_NEXT_MONTH, ICON_PREV_MONTH, ICON_RESET } from "../icons";
import { createTimeRow } from "../time";
import type { CalendarDomElements } from "./types";

export const createCalendarDom = (): CalendarDomElements => {
  const container = document.createElement("div");
  container.className = "cal-anchor";
  container.hidden = true;

  const root = document.createElement("div");
  root.setAttribute("role", "application");

  const header = document.createElement("div");
  header.className = "cal__header";

  const btnPrev = document.createElement("button");
  btnPrev.type = "button";
  btnPrev.className = "cal__nav cal__nav--prev";
  btnPrev.setAttribute("aria-label", "Previous month");
  btnPrev.innerHTML = ICON_PREV_MONTH;

  const btnNext = document.createElement("button");
  btnNext.type = "button";
  btnNext.className = "cal__nav cal__nav--next";
  btnNext.setAttribute("aria-label", "Next month");
  btnNext.innerHTML = ICON_NEXT_MONTH;

  const btnReset = document.createElement("button");
  btnReset.type = "button";
  btnReset.className = "cal__reset";
  btnReset.innerHTML = ICON_RESET;

  const selectsWrap = document.createElement("div");
  selectsWrap.className = "cal__selects";

  const monthSelect = document.createElement("select");
  monthSelect.className = "cal__select cal__select--month";
  monthSelect.setAttribute("aria-label", "Month");

  const yearInput = document.createElement("input");
  yearInput.type = "text";
  yearInput.inputMode = "numeric";
  yearInput.className = "cal__year-input";
  yearInput.setAttribute("aria-label", "Year");
  yearInput.maxLength = 4;
  yearInput.spellcheck = false;

  selectsWrap.append(monthSelect, yearInput);
  header.append(btnPrev, selectsWrap, btnNext, btnReset);

  const headerRight = document.createElement("div");
  headerRight.className = "cal__header cal__header--sub";
  const selectsWrapRight = document.createElement("div");
  selectsWrapRight.className = "cal__selects";
  const monthSelectRight = document.createElement("select");
  monthSelectRight.className = "cal__select cal__select--month";
  monthSelectRight.setAttribute("aria-label", "Month");
  const yearInputRight = document.createElement("input");
  yearInputRight.type = "text";
  yearInputRight.inputMode = "numeric";
  yearInputRight.className = "cal__year-input";
  yearInputRight.setAttribute("aria-label", "Year");
  yearInputRight.maxLength = 4;
  yearInputRight.spellcheck = false;
  selectsWrapRight.append(monthSelectRight, yearInputRight);
  headerRight.append(selectsWrapRight);

  const weekdaysRow = document.createElement("div");
  weekdaysRow.className = "cal__weekdays";
  const weekdaysRowRight = document.createElement("div");
  weekdaysRowRight.className = "cal__weekdays";

  const grid = document.createElement("div");
  grid.className = "cal__grid";
  grid.setAttribute("role", "grid");
  const gridRight = document.createElement("div");
  gridRight.className = "cal__grid";
  gridRight.setAttribute("role", "grid");

  const timeWrap = document.createElement("div");
  timeWrap.className = "cal__time-wrap";
  const rangeActions = document.createElement("div");
  rangeActions.className = "cal__range-actions";
  const btnCancelRange = document.createElement("button");
  btnCancelRange.type = "button";
  btnCancelRange.className = "cal__action-btn cal__action-btn--ghost";
  btnCancelRange.textContent = "Cancel";
  const btnApplyRange = document.createElement("button");
  btnApplyRange.type = "button";
  btnApplyRange.className = "cal__action-btn cal__action-btn--primary";
  btnApplyRange.textContent = "Apply";
  rangeActions.append(btnCancelRange, btnApplyRange);

  const timeWrapRangeStart = document.createElement("div");
  timeWrapRangeStart.className = "cal__time-wrap cal__time-wrap--pane";
  const timeWrapRangeEnd = document.createElement("div");
  timeWrapRangeEnd.className = "cal__time-wrap cal__time-wrap--pane";

  const timeSingle = createTimeRow("cal__time cal__time--single", {
    hour: "Hour",
    minute: "Minute",
    second: "Second",
    meridiem: "AM/PM",
  });
  const timeRangeStart = createTimeRow("cal__time cal__time--range-start", {
    hour: "Start hour",
    minute: "Start minute",
    second: "Start second",
    meridiem: "Start AM/PM",
  });
  const timeRangeEnd = createTimeRow("cal__time cal__time--range-end", {
    hour: "End hour",
    minute: "End minute",
    second: "End second",
    meridiem: "End AM/PM",
  });

  timeWrap.append(timeSingle.row);
  timeWrapRangeStart.append(timeRangeStart.row);
  timeWrapRangeEnd.append(timeRangeEnd.row);

  const paneLeft = document.createElement("div");
  paneLeft.className = "cal__pane";
  paneLeft.append(header, weekdaysRow, grid, timeWrapRangeStart);
  const paneRight = document.createElement("div");
  paneRight.className = "cal__pane";
  paneRight.append(headerRight, weekdaysRowRight, gridRight, timeWrapRangeEnd);
  const panes = document.createElement("div");
  panes.className = "cal__panes";
  panes.append(paneLeft, paneRight);

  root.append(panes, timeWrap, rangeActions);
  container.append(root);

  return {
    container,
    root,
    paneLeft,
    paneRight,
    header,
    headerRight,
    btnPrev,
    btnNext,
    btnReset,
    monthSelect,
    monthSelectRight,
    yearInput,
    yearInputRight,
    weekdaysRow,
    weekdaysRowRight,
    grid,
    gridRight,
    timeWrap,
    timeWrapRangeStart,
    timeWrapRangeEnd,
    rangeActions,
    btnCancelRange,
    btnApplyRange,
    timeSingle,
    timeRangeStart,
    timeRangeEnd,
  };
};
