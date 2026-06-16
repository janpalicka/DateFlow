import {
  addMonths,
  compareAsc,
  differenceInCalendarDays,
  format,
  getDaysInMonth,
  getISOWeek,
  isSameDay,
  isValid,
  parse,
  startOfDay,
} from "date-fns";
import type {
  CalendarMode,
  CalendarOptions,
  CalendarPickerInstance,
  DateRangeValue,
} from "@/calendar/types";
import {
  cloneRange,
  compareCalendarDay,
  dateOnlyIfNeeded,
  dayInInclusiveRange,
  effectiveOutputFormat,
  formatRangeDurationLabel,
  isSelectable,
  mergeLocale,
  parseCalendarDay,
  shouldShowTimeOn,
  yearRange,
} from "@/calendar/utils";
import { attachCalendarPopover, type CalendarPopover } from "./popover";
import "./calendar.css";

const fillSecond = (selectS: HTMLSelectElement): void => {
  selectS.replaceChildren();
  for (let s = 0; s < 60; s += 1) {
    const o = document.createElement("option");
    o.value = String(s);
    o.textContent = s < 10 ? `0${String(s)}` : String(s);
    selectS.append(o);
  }
};

const fillHourMinute = (
  selectH: HTMLSelectElement,
  selectM: HTMLSelectElement,
  selectMeridiem: HTMLSelectElement,
  use12HourTime: boolean,
): void => {
  selectH.replaceChildren();
  selectM.replaceChildren();
  selectMeridiem.replaceChildren();
  const hourFrom = use12HourTime ? 1 : 0;
  const hourTo = use12HourTime ? 12 : 23;
  for (let h = hourFrom; h <= hourTo; h += 1) {
    const o = document.createElement("option");
    o.value = String(h);
    o.textContent = h < 10 ? `0${String(h)}` : String(h);
    selectH.append(o);
  }
  for (let m = 0; m < 60; m += 1) {
    const o = document.createElement("option");
    o.value = String(m);
    o.textContent = m < 10 ? `0${String(m)}` : String(m);
    selectM.append(o);
  }
  for (const value of ["AM", "PM"]) {
    const o = document.createElement("option");
    o.value = value;
    o.textContent = value;
    selectMeridiem.append(o);
  }
};

const setHM = (
  selectH: HTMLSelectElement,
  selectM: HTMLSelectElement,
  selectMeridiem: HTMLSelectElement,
  selectS: HTMLSelectElement | null,
  d: Date,
  use12HourTime: boolean,
): void => {
  const h = d.getHours();
  if (use12HourTime) {
    const isPm = h >= 12;
    const h12 = h % 12 === 0 ? 12 : h % 12;
    selectH.value = String(h12);
    selectMeridiem.value = isPm ? "PM" : "AM";
  } else {
    selectH.value = String(h);
    selectMeridiem.value = h >= 12 ? "PM" : "AM";
  }
  selectM.value = String(d.getMinutes());
  if (selectS) selectS.value = String(d.getSeconds());
};

const applyHM = (
  base: Date,
  selectH: HTMLSelectElement,
  selectM: HTMLSelectElement,
  selectMeridiem: HTMLSelectElement,
  selectS: HTMLSelectElement | null,
  use12HourTime: boolean,
): Date => {
  const rawHour = Number.parseInt(selectH.value, 10);
  const min = Number.parseInt(selectM.value, 10);
  const sec = selectS ? Number.parseInt(selectS.value, 10) : 0;
  const h = use12HourTime ? (rawHour % 12) + (selectMeridiem.value === "PM" ? 12 : 0) : rawHour;
  return new Date(base.getFullYear(), base.getMonth(), base.getDate(), h, min, sec, 0);
};

export const createCalendarPicker = (
  input: HTMLInputElement,
  initial: CalendarOptions = {},
): CalendarPickerInstance => {
  if (!(input instanceof HTMLInputElement)) {
    throw new TypeError("createCalendarPicker expects an HTMLInputElement");
  }

  let options: CalendarOptions = { ...initial };
  const valueInput = input;
  valueInput.classList.add("cal__input");
  if (!valueInput.type) valueInput.type = "text";
  valueInput.spellcheck = false;

  const container = document.createElement("div");
  container.className = "cal-anchor";
  container.hidden = true;
  if (options.inline) {
    valueInput.insertAdjacentElement("afterend", container);
  } else {
    (options.appendTo ?? document.body).append(container);
  }

  let popover: CalendarPopover | null = null;
  const hidePanel = (): void => {
    if (popover) {
      popover.close();
      return;
    }
    container.hidden = true;
  };

  const durationTipIdBase = `cal-dur-${Math.random().toString(36).slice(2, 11)}`;
  const mode = (): CalendarMode => options.mode ?? "single";

  let selected: Date | null = null;
  let rangeStart: Date | null = null;
  let rangeEnd: Date | null = null;
  let committedRangeStart: Date | null = null;
  let committedRangeEnd: Date | null = null;
  /** Tentative end while choosing a range (pointer hover). */
  let rangeHoverEnd: Date | null = null;

  if (mode() === "single") {
    selected = options.value ?? null;
    if (selected && !shouldShowTimeOn(options)) {
      selected = startOfDay(selected);
    }
  } else {
    rangeStart = options.range?.start ? new Date(options.range.start.getTime()) : null;
    rangeEnd = options.range?.end ? new Date(options.range.end.getTime()) : null;
    if (!shouldShowTimeOn(options)) {
      if (rangeStart) rangeStart = startOfDay(rangeStart);
      if (rangeEnd) rangeEnd = startOfDay(rangeEnd);
    }
    committedRangeStart = rangeStart ? new Date(rangeStart.getTime()) : null;
    committedRangeEnd = rangeEnd ? new Date(rangeEnd.getTime()) : null;
  }

  let viewYear: number;
  let viewMonth: number;
  const now = new Date();
  const anchor = selected ?? rangeStart ?? rangeEnd ?? now;
  viewYear = anchor.getFullYear();
  viewMonth = anchor.getMonth();

  const root = document.createElement("div");
  root.className = ["cal", options.className].filter(Boolean).join(" ");
  if (options.theme) root.dataset.calTheme = options.theme;
  root.setAttribute("role", "application");
  root.setAttribute("aria-label", options.ariaLabel ?? "Calendar");

  const header = document.createElement("div");
  header.className = "cal__header";

  const btnPrev = document.createElement("button");
  btnPrev.type = "button";
  btnPrev.className = "cal__nav cal__nav--prev";
  btnPrev.setAttribute("aria-label", "Previous month");
  btnPrev.innerHTML =
    '<svg class="cal__nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>';

  const btnNext = document.createElement("button");
  btnNext.type = "button";
  btnNext.className = "cal__nav cal__nav--next";
  btnNext.setAttribute("aria-label", "Next month");
  btnNext.innerHTML =
    '<svg class="cal__nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>';

  const btnReset = document.createElement("button");
  btnReset.type = "button";
  btnReset.className = "cal__reset";
  btnReset.innerHTML =
    '<svg class="cal__reset-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 2v5h5"/><path d="M3.05 13a9 9 0 1 0 3.36-7.03L3 7"/><path d="M12 7v5l3 2"/></svg>';

  const selectsWrap = document.createElement("div");
  selectsWrap.className = "cal__selects";

  const monthSelect = document.createElement("select");
  monthSelect.className = "cal__select cal__select--month";
  monthSelect.setAttribute("aria-label", "Month");

  const yearSelect = document.createElement("select");
  yearSelect.className = "cal__select cal__select--year";
  yearSelect.setAttribute("aria-label", "Year");

  selectsWrap.append(monthSelect, yearSelect);
  header.append(btnPrev, selectsWrap, btnNext, btnReset);

  const headerRight = document.createElement("div");
  headerRight.className = "cal__header cal__header--sub";
  const selectsWrapRight = document.createElement("div");
  selectsWrapRight.className = "cal__selects";
  const monthSelectRight = document.createElement("select");
  monthSelectRight.className = "cal__select cal__select--month";
  monthSelectRight.setAttribute("aria-label", "Month");
  const yearSelectRight = document.createElement("select");
  yearSelectRight.className = "cal__select cal__select--year";
  yearSelectRight.setAttribute("aria-label", "Year");
  selectsWrapRight.append(monthSelectRight, yearSelectRight);
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

  function clearRangeHover(): void {
    rangeHoverEnd = null;
  }

  function updateRangeHoverFromPointer(e: MouseEvent): void {
    if (mode() !== "range" || !rangeStart || rangeEnd) return;
    const hit = (e.target as HTMLElement | null)?.closest("button.cal__day") as
      | HTMLButtonElement
      | undefined
      | null;
    if (!hit || hit.disabled) return;
    const ds = hit.dataset.date;
    if (!ds) return;
    const dayDate = parseCalendarDay(ds);
    if (
      !isSelectable(
        dayDate,
        options.minDate ?? null,
        options.maxDate ?? null,
        options.enabledDatesOnly ? undefined : options.disabledDates,
        options.enabledDatesOnly,
      )
    ) {
      return;
    }
    const next = startOfDay(dayDate);
    if (rangeHoverEnd && isSameDay(next, rangeHoverEnd)) return;
    rangeHoverEnd = next;
    render();
  }

  const onGridMouseLeave = (): void => {
    if (mode() === "range" && rangeStart && !rangeEnd && rangeHoverEnd !== null) {
      clearRangeHover();
      render();
    }
  };
  grid.addEventListener("mousemove", updateRangeHoverFromPointer);
  grid.addEventListener("mouseleave", onGridMouseLeave);
  gridRight.addEventListener("mousemove", updateRangeHoverFromPointer);
  gridRight.addEventListener("mouseleave", onGridMouseLeave);

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

  const timeRowSingle = document.createElement("div");
  timeRowSingle.className = "cal__time cal__time--single";
  const hourSingle = document.createElement("select");
  hourSingle.className = "cal__select cal__select--hour";
  hourSingle.setAttribute("aria-label", "Hour");
  const minuteSingle = document.createElement("select");
  minuteSingle.className = "cal__select cal__select--minute";
  minuteSingle.setAttribute("aria-label", "Minute");
  const timeSepSecondSingle = document.createElement("span");
  timeSepSecondSingle.className = "cal__time-sep cal__time-sep--second";
  timeSepSecondSingle.textContent = ":";
  const secondSingle = document.createElement("select");
  secondSingle.className = "cal__select cal__select--second";
  secondSingle.setAttribute("aria-label", "Second");
  const meridiemSingle = document.createElement("select");
  meridiemSingle.className = "cal__select cal__select--meridiem";
  meridiemSingle.setAttribute("aria-label", "AM/PM");
  const timeSepSingle = document.createElement("span");
  timeSepSingle.className = "cal__time-sep";
  timeSepSingle.textContent = ":";
  const timeLabelSingle = document.createElement("span");
  timeLabelSingle.className = "cal__time-label";
  timeRowSingle.append(
    timeLabelSingle,
    hourSingle,
    timeSepSingle,
    minuteSingle,
    timeSepSecondSingle,
    secondSingle,
    meridiemSingle,
  );

  const timeRowRangeStart = document.createElement("div");
  timeRowRangeStart.className = "cal__time cal__time--range-start";
  const hourStart = document.createElement("select");
  hourStart.className = "cal__select cal__select--hour";
  hourStart.setAttribute("aria-label", "Start hour");
  const minuteStart = document.createElement("select");
  minuteStart.className = "cal__select cal__select--minute";
  minuteStart.setAttribute("aria-label", "Start minute");
  const sepSecondStart = document.createElement("span");
  sepSecondStart.className = "cal__time-sep cal__time-sep--second";
  sepSecondStart.textContent = ":";
  const secondStart = document.createElement("select");
  secondStart.className = "cal__select cal__select--second";
  secondStart.setAttribute("aria-label", "Start second");
  const meridiemStart = document.createElement("select");
  meridiemStart.className = "cal__select cal__select--meridiem";
  meridiemStart.setAttribute("aria-label", "Start AM/PM");
  const sepStart = document.createElement("span");
  sepStart.className = "cal__time-sep";
  sepStart.textContent = ":";
  const labelStart = document.createElement("span");
  labelStart.className = "cal__time-label";
  timeRowRangeStart.append(
    labelStart,
    hourStart,
    sepStart,
    minuteStart,
    sepSecondStart,
    secondStart,
    meridiemStart,
  );

  const timeRowRangeEnd = document.createElement("div");
  timeRowRangeEnd.className = "cal__time cal__time--range-end";
  const hourEnd = document.createElement("select");
  hourEnd.className = "cal__select cal__select--hour";
  hourEnd.setAttribute("aria-label", "End hour");
  const minuteEnd = document.createElement("select");
  minuteEnd.className = "cal__select cal__select--minute";
  minuteEnd.setAttribute("aria-label", "End minute");
  const sepSecondEnd = document.createElement("span");
  sepSecondEnd.className = "cal__time-sep cal__time-sep--second";
  sepSecondEnd.textContent = ":";
  const secondEnd = document.createElement("select");
  secondEnd.className = "cal__select cal__select--second";
  secondEnd.setAttribute("aria-label", "End second");
  const meridiemEnd = document.createElement("select");
  meridiemEnd.className = "cal__select cal__select--meridiem";
  meridiemEnd.setAttribute("aria-label", "End AM/PM");
  const sepEnd = document.createElement("span");
  sepEnd.className = "cal__time-sep";
  sepEnd.textContent = ":";
  const labelEnd = document.createElement("span");
  labelEnd.className = "cal__time-label";
  labelEnd.textContent = "";
  timeRowRangeEnd.append(
    labelEnd,
    hourEnd,
    sepEnd,
    minuteEnd,
    sepSecondEnd,
    secondEnd,
    meridiemEnd,
  );

  timeWrap.append(timeRowSingle);
  timeWrapRangeStart.append(timeRowRangeStart);
  timeWrapRangeEnd.append(timeRowRangeEnd);

  const paneLeft = document.createElement("div");
  paneLeft.className = "cal__pane";
  paneLeft.append(header, weekdaysRow, grid, timeWrapRangeStart);
  const paneRight = document.createElement("div");
  paneRight.className = "cal__pane";
  paneRight.append(headerRight, weekdaysRowRight, gridRight, timeWrapRangeEnd);
  const panes = document.createElement("div");
  panes.className = "cal__panes";
  panes.append(paneLeft, paneRight);

  root.append(panes, rangeActions, timeWrap);
  container.append(root);

  if (options.popover ?? true) {
    popover = attachCalendarPopover(valueInput, container, {
      floating: !(options.inline ?? false),
    });
  }

  fillHourMinute(hourSingle, minuteSingle, meridiemSingle, options.use12HourTime ?? false);
  fillHourMinute(hourStart, minuteStart, meridiemStart, options.use12HourTime ?? false);
  fillHourMinute(hourEnd, minuteEnd, meridiemEnd, options.use12HourTime ?? false);

  const showSecondsOn = (): boolean => options.showSeconds ?? false;
  const use12Hour = (): boolean => options.use12HourTime ?? false;
  const secondForSingle = (): HTMLSelectElement | null => (showSecondsOn() ? secondSingle : null);
  const secondForStart = (): HTMLSelectElement | null => (showSecondsOn() ? secondStart : null);
  const secondForEnd = (): HTMLSelectElement | null => (showSecondsOn() ? secondEnd : null);

  const emitSingle = (): void => {
    if (!selected) {
      options.onChange?.(null);
      syncInputFromState();
      return;
    }
    options.onChange?.(new Date(dateOnlyIfNeeded(options, selected).getTime()));
    syncInputFromState();
  };

  const emitRange = (): void => {
    options.onRangeChange?.({
      start: rangeStart ? new Date(dateOnlyIfNeeded(options, rangeStart).getTime()) : null,
      end: rangeEnd ? new Date(dateOnlyIfNeeded(options, rangeEnd).getTime()) : null,
    });
    syncInputFromState();
  };

  const allowInputOn = (): boolean => options.allowInput ?? false;
  let syncingInput = false;

  const formatSingleForInput = (d: Date | null): string => {
    if (!d) return "";
    return format(dateOnlyIfNeeded(options, d), effectiveOutputFormat(options));
  };

  const formatRangeForInput = (): string => {
    const sep = options.rangeOutputSeparator ?? " → ";
    const fmt = effectiveOutputFormat(options);
    if (!rangeStart) return "";
    const start = format(dateOnlyIfNeeded(options, rangeStart), fmt);
    if (!rangeEnd) return `${start} …`;
    const end = format(dateOnlyIfNeeded(options, rangeEnd), fmt);
    return `${start}${sep}${end}`;
  };

  const inputPlaceholderFor = (): string => {
    const locale = mergeLocale(options.locale);
    if (mode() === "range") {
      return locale.rangeInputPlaceholder ?? locale.inputPlaceholder ?? "Select date range";
    }
    return locale.inputPlaceholder ?? "Select date";
  };

  const syncInputPlaceholder = (): void => {
    valueInput.placeholder = inputPlaceholderFor();
  };

  const syncInputFromState = (): void => {
    syncingInput = true;
    valueInput.value = mode() === "range" ? formatRangeForInput() : formatSingleForInput(selected);
    syncInputPlaceholder();
    syncingInput = false;
  };

  const applyInputMode = (): void => {
    valueInput.readOnly = !allowInputOn();
  };

  const tryParseDate = (text: string, ref: Date): Date | null => {
    const trimmed = text.trim();
    if (!trimmed) return null;
    try {
      const d = parse(trimmed, effectiveOutputFormat(options), ref);
      return isValid(d) ? d : null;
    } catch {
      return null;
    }
  };

  const applyParsedSingle = (d: Date): boolean => {
    const normalized = dateOnlyIfNeeded(options, d);
    if (
      !isSelectable(
        normalized,
        options.minDate ?? null,
        options.maxDate ?? null,
        options.enabledDatesOnly ? undefined : options.disabledDates,
        options.enabledDatesOnly,
      )
    ) {
      return false;
    }
    selected = shouldShowTimeOn(options) ? d : startOfDay(d);
    viewYear = selected.getFullYear();
    viewMonth = selected.getMonth();
    return true;
  };

  const commitTypedInput = (): boolean => {
    if (syncingInput || !allowInputOn()) return false;
    const text = valueInput.value;
    const ref = selected ?? rangeStart ?? new Date();

    if (mode() === "range") {
      const sep = options.rangeOutputSeparator ?? " → ";
      const trimmed = text.trim();
      if (!trimmed) {
        clearRangeHover();
        rangeStart = null;
        rangeEnd = null;
        syncCommittedRange();
        emitRange();
        render();
        return true;
      }
      const parts = trimmed.split(sep);
      const start = tryParseDate(parts[0] ?? "", ref);
      if (!start) {
        syncInputFromState();
        return false;
      }
      let end: Date | null = null;
      const endPart = (parts[1] ?? "").trim();
      if (endPart && endPart !== "…") {
        end = tryParseDate(endPart, ref);
        if (!end) {
          syncInputFromState();
          return false;
        }
      }
      const startNorm = dateOnlyIfNeeded(options, start);
      const endNorm = end ? dateOnlyIfNeeded(options, end) : null;
      if (
        !isSelectable(
          startNorm,
          options.minDate ?? null,
          options.maxDate ?? null,
          options.enabledDatesOnly ? undefined : options.disabledDates,
          options.enabledDatesOnly,
        )
      ) {
        syncInputFromState();
        return false;
      }
      if (
        endNorm &&
        !isSelectable(
          endNorm,
          options.minDate ?? null,
          options.maxDate ?? null,
          options.enabledDatesOnly ? undefined : options.disabledDates,
          options.enabledDatesOnly,
        )
      ) {
        syncInputFromState();
        return false;
      }
      clearRangeHover();
      rangeStart = shouldShowTimeOn(options) ? start : startOfDay(start);
      rangeEnd = end ? (shouldShowTimeOn(options) ? end : startOfDay(end)) : null;
      if (rangeStart) {
        viewYear = rangeStart.getFullYear();
        viewMonth = rangeStart.getMonth();
      }
      syncCommittedRange();
      emitRange();
      render();
      return true;
    }

    const trimmed = text.trim();
    if (!trimmed) {
      selected = null;
      emitSingle();
      render();
      return true;
    }
    const parsed = tryParseDate(trimmed, ref);
    if (!parsed || !applyParsedSingle(parsed)) {
      syncInputFromState();
      return false;
    }
    emitSingle();
    render();
    return true;
  };

  const onInputBlur = (): void => {
    commitTypedInput();
  };

  const onInputKeydown = (e: KeyboardEvent): void => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const committed = commitTypedInput();
    valueInput.blur();
    if (committed && !(options.keepOpenOnAllowInputEnter ?? false)) {
      hidePanel();
    }
  };

  valueInput.addEventListener("blur", onInputBlur);
  valueInput.addEventListener("keydown", onInputKeydown);

  const syncCommittedRange = (): void => {
    committedRangeStart = rangeStart ? new Date(rangeStart.getTime()) : null;
    committedRangeEnd = rangeEnd ? new Date(rangeEnd.getTime()) : null;
  };

  const normalizeStoredDatesIfDateOnly = (): void => {
    if (shouldShowTimeOn(options)) return;
    if (mode() === "single") {
      if (selected) selected = startOfDay(selected);
    } else {
      if (rangeStart) rangeStart = startOfDay(rangeStart);
      if (rangeEnd) rangeEnd = startOfDay(rangeEnd);
    }
  };

  const fillMonthYearSelects = (): void => {
    const locale = mergeLocale(options.locale);
    monthSelect.replaceChildren();
    monthSelectRight.replaceChildren();
    for (let m = 0; m < 12; m += 1) {
      const o = document.createElement("option");
      o.value = String(m);
      o.textContent = locale.months.longhand[m] ?? String(m);
      monthSelect.append(o);
      const r = document.createElement("option");
      r.value = String(m);
      r.textContent = locale.months.longhand[m] ?? String(m);
      monthSelectRight.append(r);
    }
    monthSelect.value = String(viewMonth);
    const rightView = addMonths(new Date(viewYear, viewMonth, 1), 1);
    monthSelectRight.value = String(rightView.getMonth());

    yearSelect.replaceChildren();
    yearSelectRight.replaceChildren();
    const radius = options.yearDropdownRadius ?? 50;
    const { from, to } = yearRange(viewYear, options.minDate, options.maxDate, radius);
    for (let y = from; y <= to; y += 1) {
      const o = document.createElement("option");
      o.value = String(y);
      o.textContent = String(y);
      yearSelect.append(o);
    }
    yearSelect.value = String(viewYear);
    const { from: rightFrom, to: rightTo } = yearRange(
      rightView.getFullYear(),
      options.minDate,
      options.maxDate,
      radius,
    );
    for (let y = rightFrom; y <= rightTo; y += 1) {
      const o = document.createElement("option");
      o.value = String(y);
      o.textContent = String(y);
      yearSelectRight.append(o);
    }
    yearSelectRight.value = String(rightView.getFullYear());
  };

  const renderWeekdaysRow = (target: HTMLDivElement): void => {
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

  const renderWeekdays = (): void => {
    renderWeekdaysRow(weekdaysRow);
    renderWeekdaysRow(weekdaysRowRight);
  };

  const renderGridForMonth = (
    target: HTMLDivElement,
    panelYear: number,
    panelMonth: number,
  ): void => {
    const locale = mergeLocale(options.locale);
    const showWk = options.showWeekNumbers ?? false;
    target.replaceChildren();
    target.classList.toggle("cal__grid--with-weeks", showWk);

    const first = new Date(panelYear, panelMonth, 1);
    const startWeekday = (first.getDay() - (locale.firstDayOfWeek % 7) + 7) % 7;
    const dim = getDaysInMonth(new Date(panelYear, panelMonth, 1));
    const prevDim = getDaysInMonth(new Date(panelYear, panelMonth - 1, 1));

    const totalCells = 42;

    for (let i = 0; i < totalCells; i += 1) {
      if (showWk && i % 7 === 0) {
        const rowFirstIdx = i;
        let dayNum0: number;
        let cellMonth0: number;
        let cellYear0: number;
        if (rowFirstIdx < startWeekday) {
          cellMonth0 = panelMonth - 1;
          cellYear0 = panelYear;
          if (cellMonth0 < 0) {
            cellMonth0 = 11;
            cellYear0 -= 1;
          }
          dayNum0 = prevDim - (startWeekday - rowFirstIdx - 1);
        } else if (rowFirstIdx < startWeekday + dim) {
          cellMonth0 = panelMonth;
          cellYear0 = panelYear;
          dayNum0 = rowFirstIdx - startWeekday + 1;
        } else {
          cellMonth0 = panelMonth + 1;
          cellYear0 = panelYear;
          if (cellMonth0 > 11) {
            cellMonth0 = 0;
            cellYear0 += 1;
          }
          dayNum0 = rowFirstIdx - (startWeekday + dim) + 1;
        }
        const weekRef = new Date(cellYear0, cellMonth0, dayNum0);
        const wkCell = document.createElement("div");
        wkCell.className = "cal__weeknum";
        wkCell.textContent = String(getISOWeek(weekRef));
        target.append(wkCell);
      }

      let dayNum: number;
      let cellMonth: number;
      let cellYear: number;
      let muted = false;

      if (i < startWeekday) {
        muted = true;
        cellMonth = panelMonth - 1;
        cellYear = panelYear;
        if (cellMonth < 0) {
          cellMonth = 11;
          cellYear -= 1;
        }
        dayNum = prevDim - (startWeekday - i - 1);
      } else if (i < startWeekday + dim) {
        cellMonth = panelMonth;
        cellYear = panelYear;
        dayNum = i - startWeekday + 1;
      } else {
        muted = true;
        cellMonth = panelMonth + 1;
        cellYear = panelYear;
        if (cellMonth > 11) {
          cellMonth = 0;
          cellYear += 1;
        }
        dayNum = i - (startWeekday + dim) + 1;
      }

      const dayDate = new Date(cellYear, cellMonth, dayNum);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cal__day";
      const dayNumEl = document.createElement("span");
      dayNumEl.className = "cal__day__num";
      dayNumEl.textContent = String(dayNum);
      btn.append(dayNumEl);
      btn.dataset.date = format(startOfDay(dayDate), "yyyy-MM-dd");
      if (muted) btn.classList.add("cal__day--muted");

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
      }

      if (mode() === "single") {
        if (selected && isSameDay(dayDate, selected)) {
          btn.classList.add("cal__day--selected");
          btn.setAttribute("aria-selected", "true");
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
              tipEl.id = `${durationTipIdBase}-hover`;
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
            if (isSameDay(dayDate, anchor)) {
              btn.classList.add("cal__day--range-start");
            } else if (isSameDay(dayDate, hover)) {
              btn.classList.add("cal__day--range-preview-end");
              const tipEl = document.createElement("span");
              tipEl.className = "cal__range-duration-tip";
              tipEl.id = `${durationTipIdBase}-hover`;
              tipEl.setAttribute("role", "tooltip");
              tipEl.textContent = formatRangeDurationLabel(mergeLocale(options.locale), spanDays);
              btn.setAttribute("aria-describedby", tipEl.id);
              btn.append(tipEl);
            } else {
              btn.classList.add("cal__day--range-preview-between");
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
        if (mode() === "single") {
          const dayOnly = new Date(cellYear, cellMonth, dayNum, 0, 0, 0, 0);
          selected = shouldShowTimeOn(options)
            ? applyHM(
                dayOnly,
                hourSingle,
                minuteSingle,
                meridiemSingle,
                secondForSingle(),
                use12Hour(),
              )
            : dayOnly;
          emitSingle();
          if (options.hideOnSingleSelect ?? true) {
            hidePanel();
          }
        } else {
          const clicked = new Date(cellYear, cellMonth, dayNum, 0, 0, 0, 0);
          if (!rangeStart || (rangeStart && rangeEnd)) {
            rangeStart = shouldShowTimeOn(options)
              ? applyHM(
                  clicked,
                  hourStart,
                  minuteStart,
                  meridiemStart,
                  secondForStart(),
                  use12Hour(),
                )
              : clicked;
            rangeEnd = null;
            rangeHoverEnd = startOfDay(rangeStart);
            setHM(hourEnd, minuteEnd, meridiemEnd, secondForEnd(), rangeStart, use12Hour());
          } else {
            clearRangeHover();
            const d0 = startOfDay(rangeStart);
            const d1 = startOfDay(clicked);
            let lo = d0;
            let hi = d1;
            if (compareAsc(lo, hi) > 0) {
              const t = lo;
              lo = hi;
              hi = t;
            }
            rangeStart = shouldShowTimeOn(options)
              ? applyHM(lo, hourStart, minuteStart, meridiemStart, secondForStart(), use12Hour())
              : lo;
            rangeEnd = shouldShowTimeOn(options)
              ? applyHM(hi, hourEnd, minuteEnd, meridiemEnd, secondForEnd(), use12Hour())
              : hi;
          }
        }
        render();
      });

      target.append(btn);
    }
  };

  const renderGrid = (): void => {
    renderGridForMonth(grid, viewYear, viewMonth);
    const rightView = addMonths(new Date(viewYear, viewMonth, 1), 1);
    renderGridForMonth(gridRight, rightView.getFullYear(), rightView.getMonth());
  };

  function syncTimeSelectsFromValue(): void {
    const use12 = use12Hour();
    fillHourMinute(hourSingle, minuteSingle, meridiemSingle, use12);
    fillHourMinute(hourStart, minuteStart, meridiemStart, use12);
    fillHourMinute(hourEnd, minuteEnd, meridiemEnd, use12);
    if (showSecondsOn()) {
      fillSecond(secondSingle);
      fillSecond(secondStart);
      fillSecond(secondEnd);
    }
    if (mode() === "single") {
      const base = selected ?? now;
      setHM(hourSingle, minuteSingle, meridiemSingle, secondForSingle(), base, use12);
      return;
    }
    const s = rangeStart ?? now;
    const e = rangeEnd ?? rangeStart ?? now;
    setHM(hourStart, minuteStart, meridiemStart, secondForStart(), s, use12);
    setHM(hourEnd, minuteEnd, meridiemEnd, secondForEnd(), e, use12);
  }

  function canGoPrevMonth(): boolean {
    if (!options.minDate) return true;
    const prev = new Date(viewYear, viewMonth - 1, 1);
    const minM = startOfDay(options.minDate);
    return compareCalendarDay(prev, new Date(minM.getFullYear(), minM.getMonth(), 1)) >= 0;
  }

  function canGoNextMonth(): boolean {
    if (!options.maxDate) return true;
    const nextShift = mode() === "range" ? 2 : 1;
    const next = new Date(viewYear, viewMonth + nextShift, 1);
    const maxM = startOfDay(options.maxDate);
    return compareCalendarDay(next, new Date(maxM.getFullYear(), maxM.getMonth(), 1)) <= 0;
  }

  function updateTimeVisibility(): void {
    const st = options.showTime ?? false;
    const use12 = use12Hour();
    const secs = showSecondsOn();
    const rng = mode() === "range";
    timeWrap.hidden = !st || rng;
    timeWrapRangeStart.hidden = !st || !rng;
    timeWrapRangeEnd.hidden = !st || !rng;
    timeRowSingle.hidden = !st || rng;
    timeRowRangeStart.hidden = !st || !rng;
    timeRowRangeEnd.hidden = !st || !rng;
    meridiemSingle.hidden = !st || !use12 || rng;
    meridiemStart.hidden = !st || !use12 || !rng;
    meridiemEnd.hidden = !st || !use12 || !rng;
    secondSingle.hidden = !st || !secs || rng;
    timeSepSecondSingle.hidden = !st || !secs || rng;
    secondStart.hidden = !st || !secs || !rng;
    sepSecondStart.hidden = !st || !secs || !rng;
    secondEnd.hidden = !st || !secs || !rng;
    sepSecondEnd.hidden = !st || !secs || !rng;
  }

  function updateResetVisibility(): void {
    const visible = options.showResetButton ?? false;
    btnReset.hidden = !visible;
    if (visible) {
      const label = options.resetInputLabel ?? "Reset";
      btnReset.setAttribute("aria-label", label);
      btnReset.title = label;
    }
  }

  function render(): void {
    const isRange = mode() === "range";
    const hasRangeSelection = Boolean(rangeStart || rangeEnd);
    root.classList.toggle("cal--range", isRange);
    paneRight.hidden = !isRange;
    rangeActions.hidden = !isRange || !hasRangeSelection;
    fillMonthYearSelects();
    renderWeekdays();
    renderGrid();
    syncTimeSelectsFromValue();
    updateTimeVisibility();
    updateResetVisibility();
    btnPrev.disabled = !canGoPrevMonth();
    btnNext.disabled = !canGoNextMonth();
    applyInputMode();
    syncInputFromState();
  }

  btnPrev.addEventListener("click", (): void => {
    if (!canGoPrevMonth()) return;
    clearRangeHover();
    if (viewMonth === 0) {
      viewMonth = 11;
      viewYear -= 1;
    } else {
      viewMonth -= 1;
    }
    render();
  });

  btnNext.addEventListener("click", (): void => {
    if (!canGoNextMonth()) return;
    clearRangeHover();
    if (viewMonth === 11) {
      viewMonth = 0;
      viewYear += 1;
    } else {
      viewMonth += 1;
    }
    render();
  });

  btnReset.addEventListener("click", (): void => {
    clearRangeHover();
    if (mode() === "single") {
      selected = null;
      emitSingle();
    } else {
      rangeStart = null;
      rangeEnd = null;
    }
    render();
  });

  btnApplyRange.addEventListener("click", (): void => {
    if (mode() !== "range") return;
    const hoverAtApply = rangeHoverEnd ? new Date(rangeHoverEnd.getTime()) : null;
    if (rangeStart && !rangeEnd && hoverAtApply) {
      const d0 = startOfDay(rangeStart);
      const d1 = startOfDay(hoverAtApply);
      let lo = d0;
      let hi = d1;
      if (compareAsc(lo, hi) > 0) {
        const t = lo;
        lo = hi;
        hi = t;
      }
      rangeStart = shouldShowTimeOn(options)
        ? applyHM(lo, hourStart, minuteStart, meridiemStart, secondForStart(), use12Hour())
        : lo;
      rangeEnd = shouldShowTimeOn(options)
        ? applyHM(hi, hourEnd, minuteEnd, meridiemEnd, secondForEnd(), use12Hour())
        : hi;
    }
    clearRangeHover();
    syncCommittedRange();
    emitRange();
    hidePanel();
    render();
  });

  btnCancelRange.addEventListener("click", (): void => {
    if (mode() !== "range") return;
    clearRangeHover();
    rangeStart = null;
    rangeEnd = null;
    syncCommittedRange();
    emitRange();
    hidePanel();
    render();
  });

  monthSelect.addEventListener("change", (): void => {
    clearRangeHover();
    viewMonth = Number.parseInt(monthSelect.value, 10);
    render();
  });

  yearSelect.addEventListener("change", (): void => {
    clearRangeHover();
    viewYear = Number.parseInt(yearSelect.value, 10);
    render();
  });

  monthSelectRight.addEventListener("change", (): void => {
    clearRangeHover();
    const nextMonth = Number.parseInt(monthSelectRight.value, 10);
    const nextYear = Number.parseInt(yearSelectRight.value, 10);
    const left = addMonths(new Date(nextYear, nextMonth, 1), -1);
    viewYear = left.getFullYear();
    viewMonth = left.getMonth();
    render();
  });

  yearSelectRight.addEventListener("change", (): void => {
    clearRangeHover();
    const nextMonth = Number.parseInt(monthSelectRight.value, 10);
    const nextYear = Number.parseInt(yearSelectRight.value, 10);
    const left = addMonths(new Date(nextYear, nextMonth, 1), -1);
    viewYear = left.getFullYear();
    viewMonth = left.getMonth();
    render();
  });

  const onTimeSingleChange = (): void => {
    if (!selected) return;
    selected = applyHM(
      selected,
      hourSingle,
      minuteSingle,
      meridiemSingle,
      secondForSingle(),
      use12Hour(),
    );
    emitSingle();
  };

  const onTimeRangeStartChange = (): void => {
    if (!rangeStart) return;
    rangeStart = applyHM(
      rangeStart,
      hourStart,
      minuteStart,
      meridiemStart,
      secondForStart(),
      use12Hour(),
    );
    if (rangeEnd && compareCalendarDay(rangeEnd, rangeStart) < 0) {
      rangeEnd = new Date(rangeStart);
      setHM(hourEnd, minuteEnd, meridiemEnd, secondForEnd(), rangeEnd, use12Hour());
    }
    render();
  };

  const onTimeRangeEndChange = (): void => {
    if (!rangeEnd) return;
    rangeEnd = applyHM(rangeEnd, hourEnd, minuteEnd, meridiemEnd, secondForEnd(), use12Hour());
    if (rangeStart && compareCalendarDay(rangeEnd, rangeStart) < 0) {
      rangeStart = new Date(rangeEnd);
      setHM(hourStart, minuteStart, meridiemStart, secondForStart(), rangeStart, use12Hour());
    }
    render();
  };

  hourSingle.addEventListener("change", onTimeSingleChange);
  minuteSingle.addEventListener("change", onTimeSingleChange);
  secondSingle.addEventListener("change", onTimeSingleChange);
  meridiemSingle.addEventListener("change", onTimeSingleChange);
  hourStart.addEventListener("change", onTimeRangeStartChange);
  minuteStart.addEventListener("change", onTimeRangeStartChange);
  secondStart.addEventListener("change", onTimeRangeStartChange);
  meridiemStart.addEventListener("change", onTimeRangeStartChange);
  hourEnd.addEventListener("change", onTimeRangeEndChange);
  minuteEnd.addEventListener("change", onTimeRangeEndChange);
  secondEnd.addEventListener("change", onTimeRangeEndChange);
  meridiemEnd.addEventListener("change", onTimeRangeEndChange);

  applyInputMode();
  syncInputFromState();

  render();

  return {
    getValue(): Date | null {
      if (mode() !== "single") return null;
      if (!selected) return null;
      return new Date(dateOnlyIfNeeded(options, selected).getTime());
    },
    setValue(date: Date | null): void {
      if (mode() !== "single") return;
      selected = date ? new Date(date.getTime()) : null;
      if (selected && !shouldShowTimeOn(options)) {
        selected = startOfDay(selected);
      }
      if (selected) {
        viewYear = selected.getFullYear();
        viewMonth = selected.getMonth();
      }
      render();
    },
    getRange(): DateRangeValue {
      if (mode() === "single") {
        return cloneRange({
          start: selected ? dateOnlyIfNeeded(options, selected) : null,
          end: null,
        });
      }
      return cloneRange({
        start: committedRangeStart ? dateOnlyIfNeeded(options, committedRangeStart) : null,
        end: committedRangeEnd ? dateOnlyIfNeeded(options, committedRangeEnd) : null,
      });
    },
    setRange(range: DateRangeValue): void {
      clearRangeHover();
      if (mode() === "single") {
        selected = range.start ? new Date(range.start.getTime()) : null;
        if (selected && !shouldShowTimeOn(options)) {
          selected = startOfDay(selected);
        }
        if (selected) {
          viewYear = selected.getFullYear();
          viewMonth = selected.getMonth();
        }
        render();
        return;
      }
      rangeStart = range.start ? new Date(range.start.getTime()) : null;
      rangeEnd = range.end ? new Date(range.end.getTime()) : null;
      if (!shouldShowTimeOn(options)) {
        if (rangeStart) rangeStart = startOfDay(rangeStart);
        if (rangeEnd) rangeEnd = startOfDay(rangeEnd);
      }
      const a = rangeStart ?? rangeEnd;
      if (a) {
        viewYear = a.getFullYear();
        viewMonth = a.getMonth();
      }
      syncCommittedRange();
      render();
    },
    setOptions(partial: Partial<CalendarOptions>): void {
      options = { ...options, ...partial };
      if (partial.mode !== undefined || partial.range !== undefined) {
        clearRangeHover();
      }
      if (partial.mode !== undefined) {
        if ((options.mode ?? "single") === "single") {
          rangeStart = null;
          rangeEnd = null;
          committedRangeStart = null;
          committedRangeEnd = null;
          selected =
            options.value === undefined || options.value === null
              ? null
              : new Date(options.value.getTime());
          if (selected) {
            viewYear = selected.getFullYear();
            viewMonth = selected.getMonth();
          }
        } else {
          selected = null;
          rangeStart = options.range?.start ? new Date(options.range.start.getTime()) : null;
          rangeEnd = options.range?.end ? new Date(options.range.end.getTime()) : null;
          syncCommittedRange();
          const a = rangeStart ?? rangeEnd;
          if (a) {
            viewYear = a.getFullYear();
            viewMonth = a.getMonth();
          }
        }
      }
      if (partial.value !== undefined && mode() === "single") {
        selected = partial.value === null ? null : new Date(partial.value.getTime());
        if (selected) {
          viewYear = selected.getFullYear();
          viewMonth = selected.getMonth();
        }
      }
      if (partial.range !== undefined && mode() === "range") {
        rangeStart = partial.range.start ? new Date(partial.range.start.getTime()) : null;
        rangeEnd = partial.range.end ? new Date(partial.range.end.getTime()) : null;
        syncCommittedRange();
        const a = rangeStart ?? rangeEnd;
        if (a) {
          viewYear = a.getFullYear();
          viewMonth = a.getMonth();
        }
      }
      if (partial.theme !== undefined) {
        if (partial.theme) root.dataset.calTheme = partial.theme;
        else delete root.dataset.calTheme;
      }
      if (partial.className !== undefined) {
        root.className = ["cal", options.className].filter(Boolean).join(" ");
      }
      if (partial.ariaLabel !== undefined) {
        root.setAttribute("aria-label", partial.ariaLabel);
      }
      if (partial.allowInput !== undefined) {
        applyInputMode();
      }
      normalizeStoredDatesIfDateOnly();
      if (mode() === "range") {
        syncCommittedRange();
      }
      render();
    },
    getInputElement(): HTMLInputElement {
      return valueInput;
    },
    getCalendarElement(): HTMLElement {
      return container;
    },
    open(): void {
      popover?.open();
    },
    close(): void {
      hidePanel();
    },
    destroy(): void {
      popover?.destroy();
      valueInput.removeEventListener("blur", onInputBlur);
      valueInput.removeEventListener("keydown", onInputKeydown);
      container.remove();
    },
  };
};
