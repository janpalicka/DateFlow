import { isSameDay, startOfDay } from "date-fns";
import { createCalendarDom } from "./dom/createElements";
import { createInputController } from "./input/createInputController";
import { createDayClickHandler } from "./internal/dayClick";
import { createEmitters } from "./internal/emitters";
import { createGridNav } from "./internal/gridNav";
import { createLayoutHelpers } from "./internal/layoutHelpers";
import { attachNavigationHandlers } from "./internal/navigationHandlers";
import { createPublicApi } from "./internal/publicApi";
import { createTimeManager } from "./internal/timeManager";
import { canGoNextMonth, canGoPrevMonth } from "./navigation";
import { attachCalendarPopover, type CalendarPopover } from "./popover";
import { DESKTOP_RANGE_PRESETS_MEDIA_QUERY, normalizePresetRange } from "./range/rangePresets";
import { renderGrid, type GridSelectionState } from "./render/grid";
import { fillMonthYearSelects, syncYearInputs } from "./render/monthYear";
import { renderWeekdaysRow } from "./render/weekdays";
import { fillHourMinute, normalizeMinuteStep } from "./time";
import { isSelectable, parseCalendarDay, shouldShowTimeOn } from "./utils";
import { COMPACT_RANGE_MEDIA_QUERY, matchesCompactRangeLayout } from "./utils/viewport";
import type { CustomSelectControl } from "./dom/customSelect";
import type { CalendarCallbacks, CalendarState } from "./internal/ctx";
import type { CalendarMode, CalendarOptions, CalendarPickerInstance } from "./types";
import "../styles/calendar.css";

export const buildCalendarPicker = (
  input: HTMLInputElement,
  initial: CalendarOptions = {},
): CalendarPickerInstance => {
  const valueInput = input;
  valueInput.classList.add("cal__input");
  if (!valueInput.type) valueInput.type = "text";
  valueInput.spellcheck = false;

  const dom = createCalendarDom();

  // ── State box ─────────────────────────────────────────────────────────────
  const s: CalendarState = {
    options: { ...initial },
    selected: null,
    rangeStart: null,
    rangeEnd: null,
    committedRangeStart: null,
    committedRangeEnd: null,
    committedSelected: null,
    rangeHoverEnd: null,
    viewYear: 0,
    viewMonth: 0,
    activeDate: new Date(),
    syncingYearInput: false,
    inputController: null!,
  };

  // ── Derived option helpers ─────────────────────────────────────────────────
  const mode = (): CalendarMode => s.options.mode ?? "single";
  const use12Hour = (): boolean => s.options.use12HourTime ?? false;
  const minuteStepOn = (): number => normalizeMinuteStep(s.options.minuteStep);
  const showSecondsOn = (): boolean => s.options.showSeconds ?? false;
  const usesApplyActions = (): boolean => shouldShowTimeOn(s.options);
  const isCompactRangeLayout = (): boolean => mode() === "range" && matchesCompactRangeLayout();
  const secondForSingle = (): CustomSelectControl | null =>
    showSecondsOn() ? dom.timeSingle.second : null;
  const secondForStart = (): CustomSelectControl | null =>
    showSecondsOn() ? dom.timeRangeStart.second : null;
  const secondForEnd = (): CustomSelectControl | null =>
    showSecondsOn() ? dom.timeRangeEnd.second : null;

  // ── Seed initial selection from options ────────────────────────────────────
  if (mode() === "single") {
    s.selected = s.options.value != null ? new Date(s.options.value.getTime()) : null;
    if (s.selected && !shouldShowTimeOn(s.options)) {
      s.selected = startOfDay(s.selected);
    }
    if (usesApplyActions()) {
      s.committedSelected = s.selected ? new Date(s.selected.getTime()) : null;
    }
  } else {
    s.rangeStart = s.options.range?.start ? new Date(s.options.range.start.getTime()) : null;
    s.rangeEnd = s.options.range?.end ? new Date(s.options.range.end.getTime()) : null;
    if (!shouldShowTimeOn(s.options)) {
      if (s.rangeStart) s.rangeStart = startOfDay(s.rangeStart);
      if (s.rangeEnd) s.rangeEnd = startOfDay(s.rangeEnd);
    }
    s.committedRangeStart = s.rangeStart ? new Date(s.rangeStart.getTime()) : null;
    s.committedRangeEnd = s.rangeEnd ? new Date(s.rangeEnd.getTime()) : null;
  }
  const now = new Date();
  const anchor = s.selected ?? s.rangeStart ?? s.rangeEnd ?? now;
  s.viewYear = anchor.getFullYear();
  s.viewMonth = anchor.getMonth();
  s.activeDate = startOfDay(anchor);

  // ── DOM wiring ─────────────────────────────────────────────────────────────
  if (s.options.inline) {
    valueInput.insertAdjacentElement("afterend", dom.container);
  } else {
    (s.options.appendTo ?? document.body).append(dom.container);
  }

  dom.root.className = ["cal", s.options.className].filter(Boolean).join(" ");
  if (s.options.theme) {
    dom.root.dataset.calTheme = s.options.theme;
    valueInput.dataset.calTheme = s.options.theme;
  }
  dom.root.setAttribute("aria-label", s.options.ariaLabel ?? "Calendar");

  // ── Late-binding callbacks shared across modules ───────────────────────────
  const cb = {} as CalendarCallbacks;

  // ── Panel management ───────────────────────────────────────────────────────
  let popover: CalendarPopover | null = null;

  const showPanel = (): void => {
    if (popover) {
      popover.open();
      return;
    }
    if (!dom.container.hidden) return;
    dom.container.hidden = false;
  };
  const hidePanel = (): void => {
    if (popover) {
      popover.close(true);
      return;
    }
    if (dom.container.hidden) return;
    dom.container.hidden = true;
    onPanelClosed();
  };

  function onPanelClosed(): void {
    if (mode() === "single" && usesApplyActions()) {
      s.selected = s.committedSelected ? new Date(s.committedSelected.getTime()) : null;
      cb.render();
      return;
    }
    if (mode() === "range" && usesApplyActions()) {
      cb.clearRangeHover();
      s.rangeStart = s.committedRangeStart ? new Date(s.committedRangeStart.getTime()) : null;
      s.rangeEnd = s.committedRangeEnd ? new Date(s.committedRangeEnd.getTime()) : null;
      cb.render();
      return;
    }
    if (mode() !== "range") return;
    if (!s.rangeStart || s.rangeEnd) return;
    cb.clearRangeHover();
    s.rangeStart = s.committedRangeStart ? new Date(s.committedRangeStart.getTime()) : null;
    s.rangeEnd = s.committedRangeEnd ? new Date(s.committedRangeEnd.getTime()) : null;
    cb.render();
  }

  cb.hidePanel = hidePanel;

  // ── Range hover ────────────────────────────────────────────────────────────
  function clearRangeHover(): void {
    s.rangeHoverEnd = null;
  }
  cb.clearRangeHover = clearRangeHover;

  function updateRangeHoverFromPointer(e: MouseEvent): void {
    if (mode() !== "range" || !s.rangeStart || s.rangeEnd) return;
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
        s.options.minDate ?? null,
        s.options.maxDate ?? null,
        s.options.enabledDatesOnly ? undefined : s.options.disabledDates,
        s.options.enabledDatesOnly,
      )
    ) {
      return;
    }
    const next = startOfDay(dayDate);
    if (s.rangeHoverEnd && isSameDay(next, s.rangeHoverEnd)) return;
    s.rangeHoverEnd = next;
    cb.renderGridsOnly();
  }

  const onGridMouseLeave = (): void => {
    if (mode() === "range" && s.rangeStart && !s.rangeEnd && s.rangeHoverEnd !== null) {
      clearRangeHover();
      cb.renderGridsOnly();
    }
  };

  dom.grid.addEventListener("mousemove", updateRangeHoverFromPointer);
  dom.grid.addEventListener("mouseleave", onGridMouseLeave);
  dom.gridRight.addEventListener("mousemove", updateRangeHoverFromPointer);
  dom.gridRight.addEventListener("mouseleave", onGridMouseLeave);

  // ── Media queries ──────────────────────────────────────────────────────────
  const rangePresetsMediaQuery =
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia(DESKTOP_RANGE_PRESETS_MEDIA_QUERY)
      : null;
  const compactRangeMediaQuery =
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia(COMPACT_RANGE_MEDIA_QUERY)
      : null;

  // ── Popover ────────────────────────────────────────────────────────────────
  if (s.options.popover ?? true) {
    popover = attachCalendarPopover(valueInput, dom.container, {
      floating: !(s.options.inline ?? false),
      onClose: onPanelClosed,
    });
  }

  // ── Range presets ──────────────────────────────────────────────────────────
  const applyRangePreset = (index: number): void => {
    const config = s.options.rangePresets;
    const preset = config?.presets[index];
    if (!preset || mode() !== "range") return;
    clearRangeHover();
    const { start, end } = normalizePresetRange(preset, shouldShowTimeOn(s.options));
    s.rangeStart = start;
    s.rangeEnd = end;
    s.viewYear = start.getFullYear();
    s.viewMonth = start.getMonth();
    cb.render();
  };

  // ── Initial time select population ────────────────────────────────────────
  const durationTipIdBase = `cal-dur-${Math.random().toString(36).slice(2, 11)}`;

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

  // ── Sub-modules ────────────────────────────────────────────────────────────
  const emitters = createEmitters(s, mode, usesApplyActions, cb);
  cb.emitSingle = emitters.emitSingle;
  cb.emitRange = emitters.emitRange;

  const timeMgr = createTimeManager({
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
    emitSingle: emitters.emitSingle,
    cb,
  });

  const onDayClick = createDayClickHandler({
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
  });

  const gridNav = createGridNav({
    s,
    dom,
    mode,
    isCompactRangeLayout,
    getPopover: () => popover,
    cb,
  });

  const layout = createLayoutHelpers({
    s,
    dom,
    mode,
    isCompactRangeLayout,
    applyRangePreset,
  });

  attachNavigationHandlers({
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
  });

  // ── Input controller ───────────────────────────────────────────────────────
  s.inputController = createInputController(valueInput, {
    getOptions: () => s.options,
    getMode: mode,
    getSelected: () => s.selected,
    getInputSingleValue: () => {
      if (usesApplyActions()) {
        return s.committedSelected ? new Date(s.committedSelected.getTime()) : null;
      }
      return s.selected ? new Date(s.selected.getTime()) : null;
    },
    setSelected: (d) => {
      s.selected = d;
    },
    getRangeStart: () => s.rangeStart,
    setRangeStart: (d) => {
      s.rangeStart = d;
    },
    getRangeEnd: () => s.rangeEnd,
    setRangeEnd: (d) => {
      s.rangeEnd = d;
    },
    getViewYear: () => s.viewYear,
    setViewYear: (y) => {
      s.viewYear = y;
    },
    getViewMonth: () => s.viewMonth,
    setViewMonth: (m) => {
      s.viewMonth = m;
    },
    clearRangeHover,
    syncCommittedRange: emitters.syncCommittedRange,
    emitSingle: emitters.emitSingle,
    emitRange: emitters.emitRange,
    render: () => cb.render(),
  });

  const onInputKeydown = (e: KeyboardEvent): void => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const committed = s.inputController.commitTypedInput();
    valueInput.blur();
    if (committed && !(s.options.keepOpenOnAllowInputEnter ?? false)) {
      hidePanel();
    }
  };

  valueInput.addEventListener("blur", s.inputController.onInputBlur);
  valueInput.addEventListener("keydown", onInputKeydown);

  dom.grid.addEventListener("keydown", gridNav.onGridKeydown);
  dom.gridRight.addEventListener("keydown", gridNav.onGridKeydown);

  dom.timeSingle.hour.addEventListener("change", timeMgr.onTimeSingleChange);
  dom.timeSingle.minute.addEventListener("change", timeMgr.onTimeSingleChange);
  dom.timeSingle.second.addEventListener("change", timeMgr.onTimeSingleChange);
  dom.timeSingle.meridiem.addEventListener("change", timeMgr.onTimeSingleChange);
  dom.timeRangeStart.hour.addEventListener("change", timeMgr.onTimeRangeStartChange);
  dom.timeRangeStart.minute.addEventListener("change", timeMgr.onTimeRangeStartChange);
  dom.timeRangeStart.second.addEventListener("change", timeMgr.onTimeRangeStartChange);
  dom.timeRangeStart.meridiem.addEventListener("change", timeMgr.onTimeRangeStartChange);
  dom.timeRangeEnd.hour.addEventListener("change", timeMgr.onTimeRangeEndChange);
  dom.timeRangeEnd.minute.addEventListener("change", timeMgr.onTimeRangeEndChange);
  dom.timeRangeEnd.second.addEventListener("change", timeMgr.onTimeRangeEndChange);
  dom.timeRangeEnd.meridiem.addEventListener("change", timeMgr.onTimeRangeEndChange);

  // ── Media query listeners (defined after layout module is ready) ───────────
  const onRangePresetsLayoutChange = (): void => {
    cb.render();
  };
  const onCompactRangeLayoutChange = (): void => {
    layout.layoutCompactRangePanes();
    cb.render();
  };
  rangePresetsMediaQuery?.addEventListener("change", onRangePresetsLayoutChange);
  compactRangeMediaQuery?.addEventListener("change", onCompactRangeLayoutChange);

  // ── Grid selection helper ──────────────────────────────────────────────────
  const monthIdx = (year: number, month: number): number => year * 12 + month;

  const isActiveDateVisible = (date: Date, compactRange: boolean): boolean => {
    const target = monthIdx(date.getFullYear(), date.getMonth());
    const left = monthIdx(s.viewYear, s.viewMonth);
    if (mode() !== "range" || compactRange) return target === left;
    return target === left || target === left + 1;
  };

  const shouldPseudoSelectToday = (): boolean => mode() === "single" && s.selected === null;

  const shouldShowApplyActions = (): boolean => {
    if (usesApplyActions()) return true;
    return mode() === "range" && Boolean(s.rangeStart || s.rangeEnd);
  };

  const getGridSelection = (): GridSelectionState => ({
    mode: mode(),
    selected: s.selected,
    rangeStart: s.rangeStart,
    rangeEnd: s.rangeEnd,
    rangeHoverEnd: s.rangeHoverEnd,
    shouldPseudoSelectToday: shouldPseudoSelectToday(),
    now,
    durationTipIdBase,
    activeDate: s.activeDate,
  });

  // ── Render ─────────────────────────────────────────────────────────────────
  function render(): void {
    const isRange = mode() === "range";
    const compactRange = isCompactRangeLayout();
    if (!isActiveDateVisible(s.activeDate, compactRange)) {
      s.activeDate = new Date(s.viewYear, s.viewMonth, 1);
    }
    dom.root.classList.toggle("cal--range", isRange);
    dom.root.classList.toggle("cal--range-compact", compactRange);
    dom.paneRight.hidden = !isRange || compactRange;
    layout.layoutCompactRangePanes();
    dom.rangeActions.hidden = !shouldShowApplyActions();
    layout.layoutRangeHeaders();
    fillMonthYearSelects(dom.monthSelect, dom.monthSelectRight, s.viewYear, s.viewMonth, s.options);
    s.syncingYearInput = true;
    syncYearInputs(dom.yearInput, dom.yearInputRight, s.viewYear, s.viewMonth);
    s.syncingYearInput = false;
    renderWeekdaysRow(dom.weekdaysRow, s.options);
    renderWeekdaysRow(dom.weekdaysRowRight, s.options);
    renderGrid(
      dom.grid,
      dom.gridRight,
      s.viewYear,
      s.viewMonth,
      s.options,
      getGridSelection(),
      { onDayClick },
      compactRange,
    );
    timeMgr.syncTimeSelectsFromValue();
    timeMgr.updateTimeVisibility();
    layout.updateResetVisibility();
    layout.syncRangeActionLabels();
    layout.syncRangePresetsPanel();
    dom.btnPrev.disabled = !canGoPrevMonth(s.viewYear, s.viewMonth, s.options.minDate);
    dom.btnNext.disabled = !canGoNextMonth(
      s.viewYear,
      s.viewMonth,
      s.options.maxDate,
      mode(),
      compactRange,
    );
    s.inputController.applyInputMode();
    s.inputController.syncInputFromState();
  }

  const renderGridsOnly = (): void => {
    renderGrid(
      dom.grid,
      dom.gridRight,
      s.viewYear,
      s.viewMonth,
      s.options,
      getGridSelection(),
      { onDayClick },
      isCompactRangeLayout(),
    );
  };

  // Bind render functions now that they are defined
  cb.render = render;
  cb.renderGridsOnly = renderGridsOnly;

  // ── Public API ─────────────────────────────────────────────────────────────
  const publicApi = createPublicApi({
    s,
    dom,
    valueInput,
    popover,
    rangePresetsMediaQuery,
    compactRangeMediaQuery,
    onRangePresetsLayoutChange,
    onCompactRangeLayoutChange,
    onInputKeydown,
    onGridKeydown: gridNav.onGridKeydown,
    onGridMouseMove: updateRangeHoverFromPointer,
    onGridMouseLeave,
    mode,
    usesApplyActions,
    isCompactRangeLayout,
    emitters,
    showPanel,
    cb,
  });

  s.inputController.applyInputMode();
  s.inputController.syncInputFromState();
  render();

  return publicApi;
};
