import { format } from "date-fns";
import { dateFlow } from "../src/calendar/index.ts";
import { cs, de, en, fr } from "../src/calendar/locales/index.ts";

/** @param {import('../src/calendar/types/types.ts').DateRangeValue} r */
function formatRangeLine(r, fmt, sep) {
  if (!r.start) return "No range selected";
  if (!r.end) return `${format(r.start, fmt)} …`;
  return `${format(r.start, fmt)}${sep}${format(r.end, fmt)}`;
}

function startOfLocalDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addLocalDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function addLocalMonths(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, date.getDate());
}

function buildDemoRangePresets(now = new Date()) {
  const today = startOfLocalDay(now);
  return {
    position: "left",
    presets: [
      { caption: "Today", start: today, end: today },
      { caption: "Last 7 Days", start: addLocalDays(today, -6), end: today },
      { caption: "Last Month", start: addLocalMonths(today, -1), end: today },
      { caption: "Last 6 Months", start: addLocalMonths(today, -6), end: today },
      { caption: "Last 12 Months", start: addLocalMonths(today, -12), end: today },
      { caption: "Next 7 Days", start: today, end: addLocalDays(today, 6) },
      { caption: "Next Month", start: today, end: addLocalMonths(today, 1) },
      { caption: "Next 6 Months", start: today, end: addLocalMonths(today, 6) },
    ],
  };
}

function mountFloatingCalendarDemo(opts, hooks = {}) {
  const options = opts ?? {};
  const wrap = document.createElement("div");
  wrap.className = "showcase-card__floating-trigger-wrap";

  const defaultTimeFormat = () => {
    if (options.showSeconds) {
      return options.use12HourTime ? "yyyy-MM-dd hh:mm:ss a" : "yyyy-MM-dd HH:mm:ss";
    }
    return options.use12HourTime ? "yyyy-MM-dd hh:mm a" : "yyyy-MM-dd HH:mm";
  };

  const singleFormatter =
    hooks.formatSingle ??
    ((date) => {
      if (!date) return "No date selected";
      if (!options.showTime) return format(date, "yyyy-MM-dd");
      return format(date, defaultTimeFormat());
    });

  const trigger = document.createElement("input");
  trigger.type = "text";
  trigger.classList.add("showcase-card__input", "showcase-card__input--trigger");
  wrap.append(trigger);

  const picker = dateFlow(trigger, {
    ...options,
    onChange: (d) => {
      options.onChange?.(d);
      hooks.onValueChange?.(singleFormatter(d));
    },
    onRangeChange: (r) => {
      options.onRangeChange?.(r);
      const fmt = options.outputFormat
        ? options.outputFormat
        : options.showTime
          ? defaultTimeFormat()
          : "yyyy-MM-dd";
      const sep = options.rangeOutputSeparator ?? "—";
      hooks.onRangeChange?.(formatRangeLine(r, fmt, sep));
    },
  });
  hooks.setupFloating?.(picker.getCalendarElement());
  hooks.onReady?.(picker);

  return { wrap, picker };
}

/** @param {import('../src/calendar/types/types.ts').CalendarSelectedDates} dates */
function formatSelectedDatesPreview(dates) {
  const fmt = (d) => (d ? format(d, "yyyy-MM-dd") : null);
  if ("selectedDate" in dates) {
    return JSON.stringify({ selectedDate: fmt(dates.selectedDate) }, null, 2);
  }
  return JSON.stringify({ start: fmt(dates.start), end: fmt(dates.end) }, null, 2);
}

/** @param {import('../src/calendar/types/types.ts').CalendarCurrentYear} years */
function formatCurrentYearPreview(years) {
  if ("currentYear" in years) {
    return JSON.stringify({ currentYear: years.currentYear }, null, 2);
  }
  return JSON.stringify({ startYear: years.startYear, endYear: years.endYear }, null, 2);
}

/** @param {import('../src/calendar/types/types.ts').CalendarPickerInstance} picker */
function watchCalendarView(picker, update) {
  update();
  const root = picker.getCalendarElement();
  root.addEventListener("click", (e) => {
    if (e.target.closest(".cal__nav, .cal__select, .cal__year-input, .cal__day")) {
      queueMicrotask(update);
    }
  });
  root.addEventListener("change", () => queueMicrotask(update));
}

function mountSelectedDatesDemo(mode) {
  const wrap = document.createElement("div");
  wrap.className = "showcase-card__selected-dates-wrap";

  const trigger = document.createElement("input");
  trigger.type = "text";
  trigger.className = "showcase-card__input showcase-card__input--trigger";

  const output = document.createElement("pre");
  output.className = "showcase-card__selected-dates-output";
  output.setAttribute("aria-live", "polite");

  wrap.append(trigger, output);

  const options =
    mode === "range"
      ? {
          mode: "range",
          range: { start: new Date(2026, 2, 5), end: new Date(2026, 2, 18) },
        }
      : { value: new Date(2026, 3, 14) };

  const picker = dateFlow(trigger, {
    ...options,
    onChange: () => {
      output.textContent = formatSelectedDatesPreview(picker.selectedDates);
    },
    onRangeChange: () => {
      output.textContent = formatSelectedDatesPreview(picker.selectedDates);
    },
  });

  output.textContent = formatSelectedDatesPreview(picker.selectedDates);

  return wrap;
}

function mountCurrentYearDemo(mode) {
  const wrap = document.createElement("div");
  wrap.className = "showcase-card__selected-dates-wrap";

  const trigger = document.createElement("input");
  trigger.type = "text";
  trigger.className = "showcase-card__input showcase-card__input--trigger";
  trigger.placeholder = "Open calendar and change month/year";

  const output = document.createElement("pre");
  output.className = "showcase-card__selected-dates-output";
  output.setAttribute("aria-live", "polite");

  wrap.append(trigger, output);

  const options =
    mode === "range"
      ? {
          mode: "range",
          range: { start: new Date(2026, 2, 5), end: new Date(2026, 2, 18) },
        }
      : { value: new Date(2026, 3, 14) };

  const picker = dateFlow(trigger, options);
  watchCalendarView(picker, () => {
    output.textContent = formatCurrentYearPreview(picker.currentYear);
  });

  return wrap;
}

function readViewMonthLabel(picker) {
  const select = picker.getCalendarElement().querySelector(".cal__select--month");
  const month = Number.parseInt(select?.value ?? "0", 10);
  const name = format(new Date(2026, month, 1), "MMMM");
  return `viewMonth: ${month} (${name})`;
}

function mountChangeMonthDemo() {
  const wrap = document.createElement("div");
  wrap.className = "showcase-card__selected-dates-wrap";

  const trigger = document.createElement("input");
  trigger.type = "text";
  trigger.className = "showcase-card__input showcase-card__input--trigger";
  trigger.placeholder = "Open calendar, then use the buttons below";

  const output = document.createElement("pre");
  output.className = "showcase-card__selected-dates-output";
  output.setAttribute("aria-live", "polite");

  wrap.append(trigger, output);

  const picker = dateFlow(trigger, { value: new Date(2026, 5, 15) });

  const update = () => {
    output.textContent = readViewMonthLabel(picker);
  };
  watchCalendarView(picker, update);

  const actions = document.getElementById("change-month-actions");
  actions?.querySelector('[data-action="month-plus"]')?.addEventListener("click", () => {
    picker.changeMonth(1);
    update();
  });
  actions?.querySelector('[data-action="month-minus"]')?.addEventListener("click", () => {
    picker.changeMonth(-1);
    update();
  });
  actions?.querySelector('[data-action="month-same"]')?.addEventListener("click", () => {
    picker.changeMonth(0);
    update();
  });
  actions?.querySelector('[data-action="month-jan"]')?.addEventListener("click", () => {
    picker.changeMonth(0, false);
    update();
  });

  return wrap;
}

function mountClearDemo() {
  const wrap = document.createElement("div");
  wrap.className = "showcase-card__selected-dates-wrap";

  const trigger = document.createElement("input");
  trigger.type = "text";
  trigger.className = "showcase-card__input showcase-card__input--trigger";
  trigger.placeholder = "Pick a date, then clear()";

  const output = document.createElement("pre");
  output.className = "showcase-card__selected-dates-output";
  output.setAttribute("aria-live", "polite");

  wrap.append(trigger, output);

  const update = (picker) => {
    output.textContent = formatSelectedDatesPreview(picker.selectedDates);
  };

  const picker = dateFlow(trigger, {
    value: new Date(2026, 3, 14),
    showResetButton: true,
    resetInputLabel: "Reset",
    onChange: () => update(picker),
  });

  update(picker);

  document
    .getElementById("clear-method-actions")
    ?.querySelector('[data-action="clear"]')
    ?.addEventListener("click", () => {
      picker.clear();
      update(picker);
    });

  return wrap;
}

function mountSetDateDemo() {
  const wrap = document.createElement("div");
  wrap.className = "showcase-card__selected-dates-wrap";

  const singleLabel = document.createElement("span");
  singleLabel.className = "showcase-card__multi-picker-label";
  singleLabel.textContent = "Single mode";

  const singleInput = document.createElement("input");
  singleInput.type = "text";
  singleInput.className = "showcase-card__input showcase-card__input--trigger";
  singleInput.placeholder = "Single picker — use buttons below";

  const rangeLabel = document.createElement("span");
  rangeLabel.className = "showcase-card__multi-picker-label";
  rangeLabel.textContent = "Range mode";

  const rangeInput = document.createElement("input");
  rangeInput.type = "text";
  rangeInput.className = "showcase-card__input showcase-card__input--trigger";
  rangeInput.placeholder = "Range picker — use buttons below";

  const singleStateBlock = document.createElement("div");
  singleStateBlock.className = "showcase-card__output-block";

  const singleStateLabel = document.createElement("span");
  singleStateLabel.className = "showcase-card__multi-picker-label";
  singleStateLabel.textContent = "Single selectedDates:";

  const singleStateOutput = document.createElement("pre");
  singleStateOutput.className = "showcase-card__selected-dates-output";
  singleStateOutput.setAttribute("aria-live", "polite");
  singleStateBlock.append(singleStateLabel, singleStateOutput);

  const rangeStateBlock = document.createElement("div");
  rangeStateBlock.className = "showcase-card__output-block";

  const rangeStateLabel = document.createElement("span");
  rangeStateLabel.className = "showcase-card__multi-picker-label";
  rangeStateLabel.textContent = "Range selectedDates:";

  const rangeStateOutput = document.createElement("pre");
  rangeStateOutput.className = "showcase-card__selected-dates-output";
  rangeStateOutput.setAttribute("aria-live", "polite");
  rangeStateBlock.append(rangeStateLabel, rangeStateOutput);

  const eventLogBlock = document.createElement("div");
  eventLogBlock.className = "showcase-card__output-block";

  const eventLogLabel = document.createElement("span");
  eventLogLabel.className = "showcase-card__multi-picker-label";
  eventLogLabel.textContent = "Event log (onChange / onRangeChange):";

  const eventLog = document.createElement("pre");
  eventLog.className = "showcase-card__selected-dates-output showcase-card__set-date-log";
  eventLog.textContent = "—";
  eventLogBlock.append(eventLogLabel, eventLog);

  wrap.append(
    singleLabel,
    singleInput,
    rangeLabel,
    rangeInput,
    singleStateBlock,
    rangeStateBlock,
    eventLogBlock,
  );

  const fmt = "yyyy-MM-dd";
  const rangeSep = " — ";

  /** @type {string[]} */
  const logLines = [];
  const appendLog = (label, detail) => {
    const stamp = new Date().toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    logLines.unshift(`[${stamp}] ${label}\n  ${detail}`);
    eventLog.textContent = logLines.length ? logLines.slice(0, 8).join("\n\n") : "—";
  };

  const updateState = (singlePicker, rangePicker) => {
    singleStateOutput.textContent = formatSelectedDatesPreview(singlePicker.selectedDates);
    rangeStateOutput.textContent = formatSelectedDatesPreview(rangePicker.selectedDates);
  };

  const singlePicker = dateFlow(singleInput, {
    value: new Date(2026, 3, 14),
    outputFormat: fmt,
    onChange: (d) => {
      appendLog("onChange (single)", d ? format(d, fmt) : "null");
      updateState(singlePicker, rangePicker);
    },
  });

  const rangePicker = dateFlow(rangeInput, {
    mode: "range",
    outputFormat: fmt,
    range: { start: new Date(2026, 2, 5), end: new Date(2026, 2, 18) },
    onRangeChange: (r) => {
      appendLog("onRangeChange", formatRangeLine(r, fmt, rangeSep));
      updateState(singlePicker, rangePicker);
    },
  });

  updateState(singlePicker, rangePicker);

  const actions = document.getElementById("set-date-actions");
  const bind = (selector, handler) => {
    actions?.querySelector(selector)?.addEventListener("click", handler);
  };

  bind('[data-action="single-date"]', () => {
    singlePicker.setDate([new Date(2026, 9, 20)]);
    updateState(singlePicker, rangePicker);
  });
  bind('[data-action="single-string"]', () => {
    singlePicker.setDate(["2026-10-01"]);
    updateState(singlePicker, rangePicker);
  });
  bind('[data-action="single-format"]', () => {
    singlePicker.setDate(["01/10/2026"], "dd/MM/yyyy");
    updateState(singlePicker, rangePicker);
  });
  bind('[data-action="single-clear"]', () => {
    singlePicker.setDate([]);
    updateState(singlePicker, rangePicker);
  });
  bind('[data-action="single-silent"]', () => {
    singlePicker.setDate([new Date(2026, 11, 25)], undefined, true);
    updateState(singlePicker, rangePicker);
  });

  bind('[data-action="range-dates"]', () => {
    rangePicker.setDate([new Date(2026, 4, 1), new Date(2026, 4, 15)]);
    updateState(singlePicker, rangePicker);
  });
  bind('[data-action="range-strings"]', () => {
    rangePicker.setDate(["2026-06-01", "2026-06-30"]);
    updateState(singlePicker, rangePicker);
  });
  bind('[data-action="range-format"]', () => {
    rangePicker.setDate(["01.06.2026", "30.06.2026"], "dd.MM.yyyy");
    updateState(singlePicker, rangePicker);
  });
  bind('[data-action="range-start"]', () => {
    rangePicker.setDate([new Date(2026, 7, 10)]);
    updateState(singlePicker, rangePicker);
  });
  bind('[data-action="range-clear"]', () => {
    rangePicker.setDate([]);
    updateState(singlePicker, rangePicker);
  });
  bind('[data-action="range-silent"]', () => {
    rangePicker.setDate([new Date(2026, 0, 1), new Date(2026, 0, 7)], undefined, true);
    updateState(singlePicker, rangePicker);
  });

  return wrap;
}

function mountOpenDemo() {
  const wrap = document.createElement("div");
  wrap.className = "showcase-card__selected-dates-wrap";

  const trigger = document.createElement("input");
  trigger.type = "text";
  trigger.readOnly = true;
  trigger.className = "showcase-card__input showcase-card__input--trigger";
  trigger.placeholder = "Use the buttons below — no need to focus";

  const output = document.createElement("pre");
  output.className = "showcase-card__selected-dates-output";
  output.setAttribute("aria-live", "polite");

  wrap.append(trigger, output);

  const picker = dateFlow(trigger, {
    value: new Date(2026, 3, 14),
  });

  const update = () => {
    const expanded = picker.getInputElement().getAttribute("aria-expanded");
    const hidden = picker.getCalendarElement().hidden;
    output.textContent = `aria-expanded: ${expanded}\npanel hidden: ${hidden}`;
  };

  update();

  document
    .getElementById("open-method-actions")
    ?.querySelector('[data-action="open"]')
    ?.addEventListener("click", () => {
      picker.open();
      update();
    });
  document
    .getElementById("open-method-actions")
    ?.querySelector('[data-action="close"]')
    ?.addEventListener("click", () => {
      picker.close();
      update();
    });

  return wrap;
}

function mountSelectorIdDemo() {
  const wrap = document.createElement("div");
  wrap.className = "showcase-card__floating-trigger-wrap";

  const input = document.createElement("input");
  input.type = "text";
  input.id = "getting-started-id-picker";
  input.className = "showcase-card__input showcase-card__input--trigger";
  input.placeholder = "Pick a date";
  wrap.append(input);

  return {
    wrap,
    setup() {
      dateFlow("#getting-started-id-picker", {
        value: new Date(2026, 2, 20),
      });
    },
  };
}

function mountSelectorClassDemo() {
  const wrap = document.createElement("div");
  wrap.className = "showcase-card__multi-picker-wrap";

  for (const label of ["Start", "End", "Deadline"]) {
    const row = document.createElement("div");
    row.className = "showcase-card__multi-picker-row";

    const rowLabel = document.createElement("span");
    rowLabel.className = "showcase-card__multi-picker-label";
    rowLabel.textContent = label;

    const input = document.createElement("input");
    input.type = "text";
    input.className =
      "showcase-card__input showcase-card__input--trigger getting-started-multi-picker";
    input.placeholder = label;

    row.append(rowLabel, input);
    wrap.append(row);
  }

  return {
    wrap,
    setup() {
      dateFlow(".getting-started-multi-picker", {
        value: new Date(2026, 2, 20),
      });
    },
  };
}

function mountDemo(key) {
  switch (key) {
    case "basic-time":
      return mountFloatingCalendarDemo({
        value: new Date(2026, 2, 15, 12, 30),
        showTime: true,
      }).wrap;
    case "date-only":
      return mountFloatingCalendarDemo({ value: new Date(2026, 5, 8) }).wrap;
    case "set-options":
      return mountSetOptionsDemo();
    case "selector-id":
      return mountSelectorIdDemo();
    case "selector-class":
      return mountSelectorClassDemo();
    case "selected-dates-single":
      return mountSelectedDatesDemo("single");
    case "selected-dates-range":
      return mountSelectedDatesDemo("range");
    case "current-year-single":
      return mountCurrentYearDemo("single");
    case "current-year-range":
      return mountCurrentYearDemo("range");
    case "change-month":
      return mountChangeMonthDemo();
    case "clear-method":
      return mountClearDemo();
    case "set-date-method":
      return mountSetDateDemo();
    case "open-method":
      return mountOpenDemo();
    case "locale-de":
      return mountFloatingCalendarDemo({
        showWeekNumbers: true,
        value: new Date(2026, 3, 14),
        locale: de,
      }).wrap;
    case "locale-fr":
      return mountFloatingCalendarDemo({ locale: fr }).wrap;
    case "locale-week-start":
      return mountFloatingCalendarDemo({
        showWeekNumbers: true,
        value: new Date(2026, 3, 14),
        locale: {
          ...en,
          firstDayOfWeek: 0,
        },
      }).wrap;
    case "locale-partial":
      return mountFloatingCalendarDemo({
        showTime: true,
        showWeekNumbers: true,
        value: new Date(2026, 5, 18, 12, 30),
        locale: {
          ...cs,
          weekNumberHeader: "Tý",
        },
      }).wrap;
    case "min-max":
      return mountFloatingCalendarDemo({
        value: new Date(2026, 3, 14),
        minDate: new Date(2026, 2, 10),
        maxDate: new Date(2026, 2, 25),
      }).wrap;
    case "disabled-array":
      return mountFloatingCalendarDemo({
        value: new Date(2026, 3, 14),
        disabledDates: [new Date(2026, 2, 17), new Date(2026, 2, 18), new Date(2026, 2, 19)],
      }).wrap;
    case "disabled-strike":
      return mountFloatingCalendarDemo({
        value: new Date(2026, 3, 14),
        disabledDatesStrikeThrough: true,
        disabledDates: [new Date(2026, 2, 17), new Date(2026, 2, 18), new Date(2026, 2, 19)],
      }).wrap;
    case "disabled-predicate":
      return mountFloatingCalendarDemo({
        disabledDates: (d) => d.getDay() === 0 || d.getDay() === 6,
      }).wrap;
    case "enabled-array":
      return mountFloatingCalendarDemo({
        value: new Date(2026, 2, 12),
        enabledDatesOnly: [5, 12, 19, 26].map((day) => new Date(2026, 2, day)),
      }).wrap;
    case "enabled-predicate":
      return mountFloatingCalendarDemo({
        enabledDatesOnly: (d) => d.getDate() % 2 === 1,
      }).wrap;
    case "time-24h":
      return mountFloatingCalendarDemo({
        showTime: true,
        value: new Date(2026, 2, 20, 14, 45),
        minuteStep: 1,
      }).wrap;
    case "time-12h":
      return mountFloatingCalendarDemo({
        showTime: true,
        use12HourTime: true,
        value: new Date(2026, 6, 9, 15, 30),
      }).wrap;
    case "time-seconds-24h":
      return mountFloatingCalendarDemo({
        value: new Date(2026, 2, 15, 14, 30, 45),
        showTime: true,
        showSeconds: true,
      }).wrap;
    case "time-seconds-12h":
      return mountFloatingCalendarDemo({
        value: new Date(2026, 2, 15, 15, 30, 45),
        showTime: true,
        showSeconds: true,
        use12HourTime: true,
      }).wrap;
    case "time-no-input":
      return mountFloatingCalendarDemo({
        showTime: true,
        allowTimeInput: false,
        value: new Date(2026, 2, 20, 14, 45),
      }).wrap;
    case "allow-input-date":
      return mountFloatingCalendarDemo({
        value: new Date(2026, 3, 14),
        outputFormat: "yyyy-MM-dd",
        allowInput: true,
      }).wrap;
    case "allow-input-time-24h":
      return mountFloatingCalendarDemo({
        value: new Date(2026, 2, 15, 14, 30),
        showTime: true,
        allowInput: true,
      }).wrap;
    case "allow-input-time-12h":
      return mountFloatingCalendarDemo({
        value: new Date(2026, 2, 15, 15, 30),
        showTime: true,
        use12HourTime: true,
        allowInput: true,
      }).wrap;
    case "allow-input-keep-open":
      return mountFloatingCalendarDemo({
        value: new Date(2026, 2, 15, 14, 30),
        showTime: true,
        allowInput: true,
        keepOpenOnAllowInputEnter: true,
      }).wrap;
    case "range-basic":
      return mountFloatingCalendarDemo({
        mode: "range",
        range: { start: new Date(2026, 2, 5), end: new Date(2026, 2, 18) },
        outputFormat: "yyyy-MM-dd",
      }).wrap;
    case "range-presets":
      return mountFloatingCalendarDemo({
        mode: "range",
        showTime: true,
        rangePresets: buildDemoRangePresets(),
      }).wrap;
    case "range-presets-right":
      return mountFloatingCalendarDemo({
        mode: "range",
        rangePresets: {
          position: "right",
          presets: buildDemoRangePresets().presets,
        },
      }).wrap;
    case "range-time":
      return mountFloatingCalendarDemo({
        mode: "range",
        showTime: true,
        range: {
          start: new Date(2026, 3, 10, 9, 30),
          end: new Date(2026, 3, 14, 17, 45),
        },
        outputFormat: "yyyy-MM-dd HH:mm",
      }).wrap;
    case "range-format":
      return mountFloatingCalendarDemo({
        mode: "range",
        showTime: true,
        outputFormat: "dd.MM.yyyy HH:mm",
        rangeOutputSeparator: " → ",
        range: {
          start: new Date(2026, 8, 1, 8, 0),
          end: new Date(2026, 8, 7, 20, 0),
        },
      }).wrap;
    case "range-weeks":
      return mountFloatingCalendarDemo({
        mode: "range",
        showWeekNumbers: true,
        locale: { weekNumberHeader: "KW" },
        outputFormat: "yyyy-MM-dd",
        range: { start: new Date(2026, 0, 6), end: new Date(2026, 0, 20) },
      }).wrap;
    case "range-dark":
      return mountFloatingCalendarDemo({
        mode: "range",
        theme: "dark",
        outputFormat: "yyyy-MM-dd",
        range: { start: new Date(2026, 4, 12), end: new Date(2026, 4, 26) },
      }).wrap;
    case "output-format":
      return mountFloatingCalendarDemo({
        value: new Date(2026, 7, 19, 15, 0),
        showTime: true,
        outputFormat: "EEEE, d MMMM yyyy 'at' HH:mm",
      }).wrap;
    case "theme-dark":
      return mountFloatingCalendarDemo({ theme: "dark", showTime: true }).wrap;
    case "theme-contrast":
      return mountFloatingCalendarDemo({ theme: "contrast" }).wrap;
    case "theme-custom-vars":
      return mountFloatingCalendarDemo(
        {},
        {
          setupFloating: (panel) => {
            panel.style.setProperty("--cal-bg", "#fff7ed");
            panel.style.setProperty("--cal-surface", "#ffedd5");
            panel.style.setProperty("--cal-text", "#431407");
            panel.style.setProperty("--cal-muted", "#9a3412");
            panel.style.setProperty("--cal-border", "#fdba74");
            panel.style.setProperty("--cal-accent", "#c2410c");
            panel.style.setProperty("--cal-accent-contrast", "#fff7ed");
          },
        },
      ).wrap;
    case "theme-forest-combined":
      return mountFloatingCalendarDemo({
        theme: "forest",
        locale: de,
        minDate: new Date(2026, 2, 1),
        maxDate: new Date(2026, 3, 30),
        disabledDates: (d) => d.getDay() === 3,
        showTime: true,
      }).wrap;
    case "aria-label":
      return mountFloatingCalendarDemo({ ariaLabel: "Delivery date" }).wrap;
    case "reset-button":
      return mountFloatingCalendarDemo({
        value: new Date(2026, 2, 13, 14, 15),
        showTime: true,
        showResetButton: true,
        resetInputLabel: "Reset",
      }).wrap;
    case "year-radius":
      return mountFloatingCalendarDemo({
        minDate: new Date(2026, 2, 1),
        maxDate: new Date(2026, 8, 30),
        value: new Date(2026, 5, 1),
      }).wrap;
    default:
      return null;
  }
}

function mountSetOptionsDemo() {
  let rangeMode = false;
  const rangeFmt = "yyyy-MM-dd";
  let picker = null;
  const { wrap } = mountFloatingCalendarDemo({}, { onReady: (instance) => (picker = instance) });

  const actions = document.getElementById("set-options-actions");
  if (!actions) return wrap;

  actions.querySelector('[data-action="locale-de"]')?.addEventListener("click", () => {
    picker?.setOptions({ locale: de });
  });
  actions.querySelector('[data-action="locale-fr"]')?.addEventListener("click", () => {
    picker?.setOptions({ locale: fr });
  });

  let timeOn = false;
  actions.querySelector('[data-action="toggle-time"]')?.addEventListener("click", () => {
    timeOn = !timeOn;
    picker?.setOptions({ showTime: timeOn });
  });

  actions.querySelector('[data-action="toggle-range"]')?.addEventListener("click", () => {
    if (!picker) return;
    if (!rangeMode) {
      rangeMode = true;
      picker.setOptions({
        mode: "range",
        range: { start: picker.getValue(), end: null },
        outputFormat: rangeFmt,
      });
    } else {
      const r = picker.getRange();
      rangeMode = false;
      picker.setOptions({ mode: "single", value: r.start });
    }
  });

  return wrap;
}

function mountQuickStartDemo() {
  const input = document.getElementById("quick-start-date-field");
  if (!(input instanceof HTMLInputElement)) return;

  dateFlow(input, {
    value: new Date(2026, 5, 8),
    onChange: (date) => console.log("Selected:", date),
  });
}

function syncDocsLayoutMetrics() {
  const header = document.querySelector(".site-header");
  if (header instanceof HTMLElement) {
    document.documentElement.style.setProperty(
      "--site-header-height",
      `${header.offsetHeight}px`,
    );
  }
}

function initTocSpy() {
  const disclosure = document.querySelector(".showcase-toc__disclosure");
  const currentLabel = document.querySelector("[data-toc-current]");
  const links = [...document.querySelectorAll(".showcase-toc__link")];
  const sections = links
    .map((link) => {
      const id = link.getAttribute("href")?.slice(1);
      const el = id ? document.getElementById(id) : null;
      return el instanceof HTMLElement ? { id, el, link } : null;
    })
    .filter(Boolean);

  if (!sections.length) return;

  let lastActiveId = null;
  let navigationLockUntil = 0;

  const isMobileToc = () => window.matchMedia("(max-width: 959px)").matches;

  const syncDisclosureMode = () => {
    if (!(disclosure instanceof HTMLDetailsElement)) return;
    disclosure.open = !isMobileToc();
  };

  const setActive = (id) => {
    for (const section of sections) {
      section.link.classList.toggle("is-active", section.id === id);
    }
    const activeSection = sections.find((section) => section.id === id);
    if (currentLabel instanceof HTMLElement && activeSection) {
      currentLabel.textContent = activeSection.link.textContent.trim();
    }
  };

  const scrollOffset = () => {
    const header = document.querySelector(".site-header");
    let offset = (header instanceof HTMLElement ? header.offsetHeight : 52) + 12;
    if (isMobileToc()) {
      const tocBar = document.querySelector(".showcase-sidebar");
      if (tocBar instanceof HTMLElement) {
        offset += tocBar.offsetHeight;
      }
    } else {
      offset += 36;
    }
    return offset;
  };

  const scrollToSection = (id, behavior = "smooth") => {
    const section = sections.find((entry) => entry.id === id);
    if (!section) return;

    const top =
      section.el.getBoundingClientRect().top + window.scrollY - scrollOffset();
    navigationLockUntil = performance.now() + (behavior === "smooth" ? 900 : 0);
    window.scrollTo({ top: Math.max(0, top), behavior });
    history.replaceState(null, "", `#${id}`);
    lastActiveId = id;
    setActive(id);

    if (disclosure instanceof HTMLDetailsElement && isMobileToc()) {
      disclosure.open = false;
    }
  };

  const updateActive = () => {
    if (performance.now() < navigationLockUntil) return;

    const offset = scrollOffset();
    let activeId = sections[0].id;

    for (const section of sections) {
      if (section.el.getBoundingClientRect().top <= offset) {
        activeId = section.id;
      }
    }

    if (activeId !== lastActiveId) {
      lastActiveId = activeId;
      setActive(activeId);
    }
  };

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateActive();
      ticking = false;
    });
  };

  for (const section of sections) {
    section.link.addEventListener("click", (event) => {
      event.preventDefault();
      scrollToSection(section.id);
    });
  }

  for (const anchor of document.querySelectorAll("a[href^='#']")) {
    const href = anchor.getAttribute("href");
    if (!href || href === "#" || href === "#top") continue;
    const id = href.slice(1);
    if (!sections.some((section) => section.id === id)) continue;
    if (anchor.classList.contains("showcase-toc__link")) continue;
    anchor.addEventListener("click", (event) => {
      event.preventDefault();
      scrollToSection(id);
    });
  }

  syncDisclosureMode();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => {
    syncDisclosureMode();
    onScroll();
  });
  window.addEventListener("hashchange", () => {
    const hash = location.hash.slice(1);
    if (sections.some((section) => section.id === hash)) {
      scrollToSection(hash, "auto");
    }
  });

  const initialHash = location.hash.slice(1);
  if (sections.some((section) => section.id === initialHash)) {
    scrollToSection(initialHash, "auto");
  } else {
    updateActive();
  }
}

function initDocsMeta() {
  const versionEl = document.querySelector("[data-docs-version]");
  if (versionEl instanceof HTMLElement) {
    versionEl.textContent = `v${__DOCS_VERSION__}`;
  }

  const previewBanner = document.querySelector("[data-docs-preview-banner]");
  if (previewBanner instanceof HTMLElement && __DOCS_CHANNEL__ === "preview") {
    previewBanner.hidden = false;
  }
}

function initShowcase() {
  initDocsMeta();
  syncDocsLayoutMetrics();
  window.addEventListener("resize", syncDocsLayoutMetrics, { passive: true });
  mountQuickStartDemo();
  initTocSpy();
  for (const mount of document.querySelectorAll("[data-demo]")) {
    const key = mount.dataset.demo;
    if (!key) continue;
    const demo = mountDemo(key);
    if (!demo) continue;
    if (demo instanceof HTMLElement) {
      mount.append(demo);
    } else {
      mount.append(demo.wrap);
      demo.setup?.();
    }
  }
}

initShowcase();
