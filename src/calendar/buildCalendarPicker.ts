import { addMonths, compareAsc, isSameDay, startOfDay } from "date-fns";
import { createCalendarDom } from "./dom/createElements";
import { createInputController, type InputController } from "./input/createInputController";
import { canGoNextMonth, canGoPrevMonth } from "./navigation";
import { attachCalendarPopover, type CalendarPopover } from "./popover";
import { renderGrid, type GridSelectionState } from "./render/grid";
import {
  clampYear,
  fillMonthYearSelects,
  parseYearInput,
  restoreYearInput,
  syncYearInputs,
} from "./render/monthYear";
import { renderWeekdaysRow } from "./render/weekdays";
import { coerceSetDateEntry } from "./setDate";
import {
  applyHM,
  fillHourMinute,
  fillSecond,
  normalizeMinuteStep,
  setHM,
  snapMinuteToStep,
} from "./time";
import {
  cloneRange,
  compareCalendarDay,
  dateOnlyIfNeeded,
  effectiveOutputFormat,
  isSelectable,
  mergeLocale,
  parseCalendarDay,
  shouldShowTimeOn,
} from "./utils";
import { COMPACT_RANGE_MEDIA_QUERY, matchesCompactRangeLayout } from "./utils/viewport";
import type { CustomSelectControl } from "./dom/customSelect";
import type {
  CalendarMode,
  CalendarOptions,
  CalendarPickerInstance,
  CalendarCurrentYear,
  CalendarSelectedDates,
  CalendarSetDateInput,
  DateRangeValue,
} from "./types";
import "./calendar.css";

export const buildCalendarPicker = (
  input: HTMLInputElement,
  initial: CalendarOptions = {},
): CalendarPickerInstance => {
  let options: CalendarOptions = { ...initial };
  const valueInput = input;
  valueInput.classList.add("cal__input");
  if (!valueInput.type) valueInput.type = "text";
  valueInput.spellcheck = false;

  const dom = createCalendarDom();
  const { container, root } = dom;

  if (options.inline) {
    valueInput.insertAdjacentElement("afterend", container);
  } else {
    (options.appendTo ?? document.body).append(container);
  }

  let popover: CalendarPopover | null = null;
  const showPanel = (): void => {
    if (popover) {
      popover.open();
      return;
    }
    if (!container.hidden) return;
    container.hidden = false;
  };
  const hidePanel = (): void => {
    if (popover) {
      popover.close();
      return;
    }
    if (container.hidden) return;
    container.hidden = true;
    onPanelClosed();
  };

  const durationTipIdBase = `cal-dur-${Math.random().toString(36).slice(2, 11)}`;
  const mode = (): CalendarMode => options.mode ?? "single";

  let selected: Date | null = null;
  let rangeStart: Date | null = null;
  let rangeEnd: Date | null = null;
  let committedRangeStart: Date | null = null;
  let committedRangeEnd: Date | null = null;
  let committedSelected: Date | null = null;
  let rangeHoverEnd: Date | null = null;

  const usesApplyActions = (): boolean => shouldShowTimeOn(options);

  const shouldShowApplyActions = (): boolean => {
    if (usesApplyActions()) return true;
    return mode() === "range" && Boolean(rangeStart || rangeEnd);
  };

  const syncCommittedSingle = (): void => {
    committedSelected = selected ? new Date(selected.getTime()) : null;
  };

  const shouldPseudoSelectToday = (): boolean => mode() === "single" && selected === null;

  function onPanelClosed(): void {
    if (mode() === "single" && usesApplyActions()) {
      selected = committedSelected ? new Date(committedSelected.getTime()) : null;
      render();
      return;
    }
    if (mode() === "range" && usesApplyActions()) {
      clearRangeHover();
      rangeStart = committedRangeStart ? new Date(committedRangeStart.getTime()) : null;
      rangeEnd = committedRangeEnd ? new Date(committedRangeEnd.getTime()) : null;
      render();
      return;
    }
    if (mode() !== "range") return;
    if (!rangeStart || rangeEnd) return;
    clearRangeHover();
    rangeStart = committedRangeStart ? new Date(committedRangeStart.getTime()) : null;
    rangeEnd = committedRangeEnd ? new Date(committedRangeEnd.getTime()) : null;
    render();
  }

  if (mode() === "single") {
    selected = options.value != null ? new Date(options.value.getTime()) : null;
    if (selected && !shouldShowTimeOn(options)) {
      selected = startOfDay(selected);
    }
    if (usesApplyActions()) {
      committedSelected = selected ? new Date(selected.getTime()) : null;
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

  const now = new Date();
  const anchor = selected ?? rangeStart ?? rangeEnd ?? now;
  let viewYear = anchor.getFullYear();
  let viewMonth = anchor.getMonth();

  const applyTheme = (theme?: string): void => {
    if (theme) {
      root.dataset.calTheme = theme;
      valueInput.dataset.calTheme = theme;
    } else {
      delete root.dataset.calTheme;
      delete valueInput.dataset.calTheme;
    }
  };

  root.className = ["cal", options.className].filter(Boolean).join(" ");
  if (options.theme) applyTheme(options.theme);
  root.setAttribute("aria-label", options.ariaLabel ?? "Calendar");

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
  dom.grid.addEventListener("mousemove", updateRangeHoverFromPointer);
  dom.grid.addEventListener("mouseleave", onGridMouseLeave);
  dom.gridRight.addEventListener("mousemove", updateRangeHoverFromPointer);
  dom.gridRight.addEventListener("mouseleave", onGridMouseLeave);

  const compactRangeMediaQuery =
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia(COMPACT_RANGE_MEDIA_QUERY)
      : null;
  const onCompactRangeLayoutChange = (): void => {
    layoutCompactRangePanes();
    render();
  };
  compactRangeMediaQuery?.addEventListener("change", onCompactRangeLayoutChange);

  const isCompactRangeLayout = (): boolean => mode() === "range" && matchesCompactRangeLayout();

  function layoutCompactRangePanes(): void {
    const compact = isCompactRangeLayout();
    if (compact) {
      if (!dom.paneLeft.contains(dom.timeWrapRangeEnd)) {
        dom.paneLeft.append(dom.timeWrapRangeEnd);
      }
      return;
    }
    if (mode() === "range" && !dom.paneRight.contains(dom.timeWrapRangeEnd)) {
      dom.paneRight.append(dom.timeWrapRangeEnd);
    }
  }

  if (options.popover ?? true) {
    popover = attachCalendarPopover(valueInput, container, {
      floating: !(options.inline ?? false),
      onClose: onPanelClosed,
    });
  }

  const minuteStepOn = (): number => normalizeMinuteStep(options.minuteStep);
  const use12Hour = (): boolean => options.use12HourTime ?? false;
  const showSecondsOn = (): boolean => options.showSeconds ?? false;
  const secondForSingle = (): CustomSelectControl | null =>
    showSecondsOn() ? dom.timeSingle.second : null;
  const secondForStart = (): CustomSelectControl | null =>
    showSecondsOn() ? dom.timeRangeStart.second : null;
  const secondForEnd = (): CustomSelectControl | null =>
    showSecondsOn() ? dom.timeRangeEnd.second : null;

  fillHourMinute(
    dom.timeSingle.hour,
    dom.timeSingle.minute,
    dom.timeSingle.meridiem,
    use12Hour(),
    minuteStepOn(),
  );
  fillHourMinute(
    dom.timeRangeStart.hour,
    dom.timeRangeStart.minute,
    dom.timeRangeStart.meridiem,
    use12Hour(),
    minuteStepOn(),
  );
  fillHourMinute(
    dom.timeRangeEnd.hour,
    dom.timeRangeEnd.minute,
    dom.timeRangeEnd.meridiem,
    use12Hour(),
    minuteStepOn(),
  );

  const syncCommittedRange = (): void => {
    committedRangeStart = rangeStart ? new Date(rangeStart.getTime()) : null;
    committedRangeEnd = rangeEnd ? new Date(rangeEnd.getTime()) : null;
  };

  let inputController: InputController;

  function emitSingle(): void {
    if (usesApplyActions()) {
      syncCommittedSingle();
    }
    if (!selected) {
      options.onChange?.(null);
      inputController.syncInputFromState();
      return;
    }
    options.onChange?.(new Date(dateOnlyIfNeeded(options, selected).getTime()));
    inputController.syncInputFromState();
  }

  function emitRange(): void {
    options.onRangeChange?.({
      start: rangeStart ? new Date(dateOnlyIfNeeded(options, rangeStart).getTime()) : null,
      end: rangeEnd ? new Date(dateOnlyIfNeeded(options, rangeEnd).getTime()) : null,
    });
    inputController.syncInputFromState();
  }

  const clearSelection = (): void => {
    clearRangeHover();
    if (mode() === "single") {
      selected = null;
      emitSingle();
    } else {
      rangeStart = null;
      rangeEnd = null;
    }
    render();
  };

  let syncingYearInput = false;

  const normalizeStoredDatesIfDateOnly = (): void => {
    if (shouldShowTimeOn(options)) return;
    if (mode() === "single") {
      if (selected) selected = startOfDay(selected);
    } else {
      if (rangeStart) rangeStart = startOfDay(rangeStart);
      if (rangeEnd) rangeEnd = startOfDay(rangeEnd);
    }
  };

  const getGridSelection = (): GridSelectionState => ({
    mode: mode(),
    selected,
    rangeStart,
    rangeEnd,
    rangeHoverEnd,
    shouldPseudoSelectToday: shouldPseudoSelectToday(),
    now,
    durationTipIdBase,
  });

  const onDayClick = (
    _dayDate: Date,
    cellYear: number,
    cellMonth: number,
    dayNum: number,
  ): void => {
    if (mode() === "single") {
      const dayOnly = new Date(cellYear, cellMonth, dayNum, 0, 0, 0, 0);
      selected = shouldShowTimeOn(options)
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
        emitSingle();
        if (options.hideOnSingleSelect ?? true) {
          hidePanel();
        }
      }
    } else {
      const clicked = new Date(cellYear, cellMonth, dayNum, 0, 0, 0, 0);
      if (!rangeStart || (rangeStart && rangeEnd)) {
        rangeStart = shouldShowTimeOn(options)
          ? applyHM(
              clicked,
              dom.timeRangeStart.hour,
              dom.timeRangeStart.minute,
              dom.timeRangeStart.meridiem,
              secondForStart(),
              use12Hour(),
            )
          : clicked;
        rangeEnd = null;
        rangeHoverEnd = startOfDay(rangeStart);
        setHM(
          dom.timeRangeEnd.hour,
          dom.timeRangeEnd.minute,
          dom.timeRangeEnd.meridiem,
          secondForEnd(),
          rangeStart,
          use12Hour(),
          minuteStepOn(),
        );
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
          ? applyHM(
              lo,
              dom.timeRangeStart.hour,
              dom.timeRangeStart.minute,
              dom.timeRangeStart.meridiem,
              secondForStart(),
              use12Hour(),
            )
          : lo;
        rangeEnd = shouldShowTimeOn(options)
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
    render();
  };

  function syncTimeSelectsFromValue(): void {
    const use12 = use12Hour();
    const step = minuteStepOn();

    const snapStoredMinutes = (date: Date | null): Date | null => {
      if (!date || !shouldShowTimeOn(options)) return date;
      const snapped = snapMinuteToStep(date.getMinutes(), step);
      if (snapped === date.getMinutes()) return date;
      const next = new Date(date);
      next.setMinutes(snapped, 0, 0);
      return next;
    };

    if (mode() === "single") {
      selected = snapStoredMinutes(selected);
    } else {
      rangeStart = snapStoredMinutes(rangeStart);
      rangeEnd = snapStoredMinutes(rangeEnd);
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
      const base = selected ?? now;
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
    const s = rangeStart ?? now;
    const e = rangeEnd ?? rangeStart ?? now;
    setHM(
      dom.timeRangeStart.hour,
      dom.timeRangeStart.minute,
      dom.timeRangeStart.meridiem,
      secondForStart(),
      s,
      use12,
      step,
    );
    setHM(
      dom.timeRangeEnd.hour,
      dom.timeRangeEnd.minute,
      dom.timeRangeEnd.meridiem,
      secondForEnd(),
      e,
      use12,
      step,
    );
  }

  function updateTimeVisibility(): void {
    const st = options.showTime ?? false;
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
  }

  function updateResetVisibility(): void {
    const visible = options.showResetButton ?? false;
    dom.btnReset.hidden = !visible;
    if (visible) {
      const label = options.resetInputLabel ?? "Reset";
      dom.btnReset.setAttribute("aria-label", label);
      dom.btnReset.title = label;
    }
  }

  function layoutRangeHeaders(): void {
    const isRange = mode() === "range";
    const compact = isCompactRangeLayout();
    if (isRange && !compact) {
      if (dom.btnNext.parentElement !== dom.headerRight) {
        dom.headerRight.append(dom.btnNext);
      }
      dom.header.classList.add("cal__header--range-start");
      dom.headerRight.classList.add("cal__header--range-end");
      return;
    }
    if (dom.btnNext.parentElement !== dom.header) {
      dom.header.insertBefore(dom.btnNext, dom.btnReset);
    }
    dom.header.classList.remove("cal__header--range-start");
    dom.headerRight.classList.remove("cal__header--range-end");
  }

  function syncRangeActionLabels(): void {
    const locale = mergeLocale(options.locale);
    dom.btnCancelRange.textContent = locale.rangeCancel ?? "Cancel";
    dom.btnApplyRange.textContent = locale.rangeApply ?? "Apply";
  }

  function render(): void {
    const isRange = mode() === "range";
    const compactRange = isCompactRangeLayout();
    root.classList.toggle("cal--range", isRange);
    root.classList.toggle("cal--range-compact", compactRange);
    dom.paneRight.hidden = !isRange || compactRange;
    layoutCompactRangePanes();
    dom.rangeActions.hidden = !shouldShowApplyActions();
    layoutRangeHeaders();
    fillMonthYearSelects(dom.monthSelect, dom.monthSelectRight, viewYear, viewMonth, options);
    syncingYearInput = true;
    syncYearInputs(dom.yearInput, dom.yearInputRight, viewYear, viewMonth);
    syncingYearInput = false;
    renderWeekdaysRow(dom.weekdaysRow, options);
    renderWeekdaysRow(dom.weekdaysRowRight, options);
    renderGrid(
      dom.grid,
      dom.gridRight,
      viewYear,
      viewMonth,
      options,
      getGridSelection(),
      {
        onDayClick,
      },
      compactRange,
    );
    syncTimeSelectsFromValue();
    updateTimeVisibility();
    updateResetVisibility();
    syncRangeActionLabels();
    dom.btnPrev.disabled = !canGoPrevMonth(viewYear, viewMonth, options.minDate);
    dom.btnNext.disabled = !canGoNextMonth(
      viewYear,
      viewMonth,
      options.maxDate,
      mode(),
      compactRange,
    );
    inputController.applyInputMode();
    inputController.syncInputFromState();
  }

  inputController = createInputController(valueInput, {
    getOptions: () => options,
    getMode: mode,
    getSelected: () => selected,
    getInputSingleValue: () => {
      if (usesApplyActions()) {
        return committedSelected ? new Date(committedSelected.getTime()) : null;
      }
      return selected ? new Date(selected.getTime()) : null;
    },
    setSelected: (d) => {
      selected = d;
    },
    getRangeStart: () => rangeStart,
    setRangeStart: (d) => {
      rangeStart = d;
    },
    getRangeEnd: () => rangeEnd,
    setRangeEnd: (d) => {
      rangeEnd = d;
    },
    getViewYear: () => viewYear,
    setViewYear: (y) => {
      viewYear = y;
    },
    getViewMonth: () => viewMonth,
    setViewMonth: (m) => {
      viewMonth = m;
    },
    clearRangeHover,
    syncCommittedRange,
    emitSingle,
    emitRange,
    render,
  });

  const onInputKeydown = (e: KeyboardEvent): void => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const committed = inputController.commitTypedInput();
    valueInput.blur();
    if (committed && !(options.keepOpenOnAllowInputEnter ?? false)) {
      hidePanel();
    }
  };

  valueInput.addEventListener("blur", inputController.onInputBlur);
  valueInput.addEventListener("keydown", onInputKeydown);

  const commitYearInput = (input: HTMLInputElement, forRightPane: boolean): void => {
    if (syncingYearInput) return;
    const parsed = parseYearInput(input.value);
    if (parsed === null) {
      restoreYearInput(input, viewYear, viewMonth, forRightPane);
      return;
    }
    clearRangeHover();
    const year = clampYear(parsed, options);
    if (forRightPane) {
      const nextMonth = Number.parseInt(dom.monthSelectRight.value, 10);
      const left = addMonths(new Date(year, nextMonth, 1), -1);
      viewYear = left.getFullYear();
      viewMonth = left.getMonth();
    } else {
      viewYear = year;
    }
    render();
  };

  dom.btnPrev.addEventListener("click", (): void => {
    if (!canGoPrevMonth(viewYear, viewMonth, options.minDate)) return;
    clearRangeHover();
    if (viewMonth === 0) {
      viewMonth = 11;
      viewYear -= 1;
    } else {
      viewMonth -= 1;
    }
    render();
  });

  dom.btnNext.addEventListener("click", (): void => {
    if (!canGoNextMonth(viewYear, viewMonth, options.maxDate, mode())) return;
    clearRangeHover();
    if (viewMonth === 11) {
      viewMonth = 0;
      viewYear += 1;
    } else {
      viewMonth += 1;
    }
    render();
  });

  dom.btnReset.addEventListener("click", (): void => {
    clearSelection();
  });

  dom.btnApplyRange.addEventListener("click", (): void => {
    if (mode() === "single" && usesApplyActions()) {
      if (!selected) return;
      selected = applyHM(
        selected,
        dom.timeSingle.hour,
        dom.timeSingle.minute,
        dom.timeSingle.meridiem,
        secondForSingle(),
        use12Hour(),
      );
      emitSingle();
      if (options.hideOnSingleSelect ?? true) {
        hidePanel();
      }
      render();
      return;
    }
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
        ? applyHM(
            lo,
            dom.timeRangeStart.hour,
            dom.timeRangeStart.minute,
            dom.timeRangeStart.meridiem,
            secondForStart(),
            use12Hour(),
          )
        : lo;
      rangeEnd = shouldShowTimeOn(options)
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
    clearRangeHover();
    syncCommittedRange();
    emitRange();
    hidePanel();
    render();
  });

  dom.btnCancelRange.addEventListener("click", (): void => {
    if (mode() === "single" && usesApplyActions()) {
      selected = committedSelected ? new Date(committedSelected.getTime()) : null;
      hidePanel();
      render();
      return;
    }
    if (mode() !== "range") return;
    clearRangeHover();
    rangeStart = null;
    rangeEnd = null;
    syncCommittedRange();
    emitRange();
    hidePanel();
    render();
  });

  dom.monthSelect.addEventListener("change", (): void => {
    clearRangeHover();
    viewMonth = Number.parseInt(dom.monthSelect.value, 10);
    render();
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
    clearRangeHover();
    const nextMonth = Number.parseInt(dom.monthSelectRight.value, 10);
    const parsedYear = parseYearInput(dom.yearInputRight.value);
    if (parsedYear === null) {
      restoreYearInput(dom.yearInputRight, viewYear, viewMonth, true);
      return;
    }
    const left = addMonths(new Date(clampYear(parsedYear, options), nextMonth, 1), -1);
    viewYear = left.getFullYear();
    viewMonth = left.getMonth();
    render();
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

  const onTimeSingleChange = (): void => {
    if (!selected) return;
    selected = applyHM(
      selected,
      dom.timeSingle.hour,
      dom.timeSingle.minute,
      dom.timeSingle.meridiem,
      secondForSingle(),
      use12Hour(),
    );
    if (!usesApplyActions()) {
      emitSingle();
    }
  };

  const onTimeRangeStartChange = (): void => {
    if (!rangeStart) return;
    rangeStart = applyHM(
      rangeStart,
      dom.timeRangeStart.hour,
      dom.timeRangeStart.minute,
      dom.timeRangeStart.meridiem,
      secondForStart(),
      use12Hour(),
    );
    if (rangeEnd && compareCalendarDay(rangeEnd, rangeStart) < 0) {
      rangeEnd = new Date(rangeStart);
      setHM(
        dom.timeRangeEnd.hour,
        dom.timeRangeEnd.minute,
        dom.timeRangeEnd.meridiem,
        secondForEnd(),
        rangeEnd,
        use12Hour(),
        minuteStepOn(),
      );
    }
    render();
  };

  const onTimeRangeEndChange = (): void => {
    if (!rangeEnd) return;
    rangeEnd = applyHM(
      rangeEnd,
      dom.timeRangeEnd.hour,
      dom.timeRangeEnd.minute,
      dom.timeRangeEnd.meridiem,
      secondForEnd(),
      use12Hour(),
    );
    if (rangeStart && compareCalendarDay(rangeEnd, rangeStart) < 0) {
      rangeStart = new Date(rangeEnd);
      setHM(
        dom.timeRangeStart.hour,
        dom.timeRangeStart.minute,
        dom.timeRangeStart.meridiem,
        secondForStart(),
        rangeStart,
        use12Hour(),
        minuteStepOn(),
      );
    }
    render();
  };

  dom.timeSingle.hour.addEventListener("change", onTimeSingleChange);
  dom.timeSingle.minute.addEventListener("change", onTimeSingleChange);
  dom.timeSingle.second.addEventListener("change", onTimeSingleChange);
  dom.timeSingle.meridiem.addEventListener("change", onTimeSingleChange);
  dom.timeRangeStart.hour.addEventListener("change", onTimeRangeStartChange);
  dom.timeRangeStart.minute.addEventListener("change", onTimeRangeStartChange);
  dom.timeRangeStart.second.addEventListener("change", onTimeRangeStartChange);
  dom.timeRangeStart.meridiem.addEventListener("change", onTimeRangeStartChange);
  dom.timeRangeEnd.hour.addEventListener("change", onTimeRangeEndChange);
  dom.timeRangeEnd.minute.addEventListener("change", onTimeRangeEndChange);
  dom.timeRangeEnd.second.addEventListener("change", onTimeRangeEndChange);
  dom.timeRangeEnd.meridiem.addEventListener("change", onTimeRangeEndChange);

  inputController.applyInputMode();
  inputController.syncInputFromState();
  render();

  const readSelectedDates = (): CalendarSelectedDates => {
    if (mode() === "single") {
      const value = usesApplyActions() ? committedSelected : selected;
      return {
        selectedDate: value ? new Date(dateOnlyIfNeeded(options, value).getTime()) : null,
      };
    }
    return {
      start: rangeStart ? new Date(dateOnlyIfNeeded(options, rangeStart).getTime()) : null,
      end: rangeEnd ? new Date(dateOnlyIfNeeded(options, rangeEnd).getTime()) : null,
    };
  };

  const readCurrentYear = (): CalendarCurrentYear => {
    if (mode() === "single") {
      return { currentYear: viewYear };
    }
    const rightView = addMonths(new Date(viewYear, viewMonth, 1), 1);
    return {
      startYear: viewYear,
      endYear: isCompactRangeLayout() ? viewYear : rightView.getFullYear(),
    };
  };

  return {
    get selectedDates(): CalendarSelectedDates {
      return readSelectedDates();
    },
    get currentYear(): CalendarCurrentYear {
      return readCurrentYear();
    },
    changeMonth(months: number, relative = true): void {
      clearRangeHover();
      if (relative) {
        const next = addMonths(new Date(viewYear, viewMonth, 1), months);
        viewYear = next.getFullYear();
        viewMonth = next.getMonth();
      } else {
        viewMonth = Math.min(11, Math.max(0, Math.floor(months)));
      }
      render();
    },
    clear(): void {
      clearSelection();
    },
    getValue(): Date | null {
      if (mode() !== "single") return null;
      const value = usesApplyActions() ? committedSelected : selected;
      if (!value) return null;
      return new Date(dateOnlyIfNeeded(options, value).getTime());
    },
    setValue(date: Date | null): void {
      if (mode() !== "single") return;
      selected = date ? new Date(date.getTime()) : null;
      if (selected && !shouldShowTimeOn(options)) {
        selected = startOfDay(selected);
      }
      if (usesApplyActions()) {
        syncCommittedSingle();
      }
      if (selected) {
        viewYear = selected.getFullYear();
        viewMonth = selected.getMonth();
      }
      render();
    },
    setDate(newDate: CalendarSetDateInput, format?: string, silent = false): void {
      clearRangeHover();
      const parseFormat = format ?? effectiveOutputFormat(options);
      const ref = selected ?? rangeStart ?? new Date();

      if (mode() === "single") {
        const parsed =
          newDate.length === 0 ? null : coerceSetDateEntry(newDate[0], parseFormat, ref);
        selected = parsed ? new Date(parsed.getTime()) : null;
        if (selected && !shouldShowTimeOn(options)) {
          selected = startOfDay(selected);
        }
        if (usesApplyActions()) {
          syncCommittedSingle();
        }
        if (selected) {
          viewYear = selected.getFullYear();
          viewMonth = selected.getMonth();
        }
        render();
        if (!silent) emitSingle();
        return;
      }

      const startParsed =
        newDate.length === 0 ? null : coerceSetDateEntry(newDate[0], parseFormat, ref);
      const endParsed =
        newDate.length < 2 ? null : coerceSetDateEntry(newDate[1], parseFormat, ref);
      rangeStart = startParsed ? new Date(startParsed.getTime()) : null;
      rangeEnd = endParsed ? new Date(endParsed.getTime()) : null;
      if (!shouldShowTimeOn(options)) {
        if (rangeStart) rangeStart = startOfDay(rangeStart);
        if (rangeEnd) rangeEnd = startOfDay(rangeEnd);
      }
      const anchorDate = rangeStart ?? rangeEnd;
      if (anchorDate) {
        viewYear = anchorDate.getFullYear();
        viewMonth = anchorDate.getMonth();
      }
      syncCommittedRange();
      render();
      if (!silent) emitRange();
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
          selected = options.value != null ? new Date(options.value.getTime()) : null;
          if (selected && !shouldShowTimeOn(options)) {
            selected = startOfDay(selected);
          }
          if (usesApplyActions()) {
            syncCommittedSingle();
          }
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
        if (usesApplyActions()) {
          syncCommittedSingle();
        }
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
        applyTheme(partial.theme || undefined);
      }
      if (partial.className !== undefined) {
        root.className = ["cal", options.className].filter(Boolean).join(" ");
      }
      if (partial.ariaLabel !== undefined) {
        root.setAttribute("aria-label", partial.ariaLabel);
      }
      if (partial.allowInput !== undefined) {
        inputController.applyInputMode();
      }
      normalizeStoredDatesIfDateOnly();
      if (mode() === "range") {
        syncCommittedRange();
      } else if (usesApplyActions()) {
        syncCommittedSingle();
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
      showPanel();
    },
    close(): void {
      hidePanel();
    },
    destroy(): void {
      compactRangeMediaQuery?.removeEventListener("change", onCompactRangeLayoutChange);
      popover?.destroy();
      valueInput.removeEventListener("blur", inputController.onInputBlur);
      valueInput.removeEventListener("keydown", onInputKeydown);
      container.remove();
    },
  };
};
