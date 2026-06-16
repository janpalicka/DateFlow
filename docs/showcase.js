import { format } from "date-fns";
import { createCalendarPicker } from "../src/calendar/index.ts";
import { cs, de, fr } from "../src/calendar/locales/index.ts";

/** @param {import('../src/calendar/types/types.ts').DateRangeValue} r */
function formatRangeLine(r, fmt, sep) {
  if (!r.start) return "No range selected";
  if (!r.end) return `${format(r.start, fmt)} …`;
  return `${format(r.start, fmt)}${sep}${format(r.end, fmt)}`;
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

  const picker = createCalendarPicker(trigger, {
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
    case "locale-de":
      return mountFloatingCalendarDemo({ locale: de }).wrap;
    case "locale-fr":
      return mountFloatingCalendarDemo({ locale: fr }).wrap;
    case "locale-partial":
      return mountFloatingCalendarDemo({
        showWeekNumbers: true,
        locale: { ...cs, weekNumberHeader: "Tý" },
      }).wrap;
    case "min-max":
      return mountFloatingCalendarDemo({
        value: new Date(2026, 2, 15),
        minDate: new Date(2026, 2, 10),
        maxDate: new Date(2026, 2, 25),
      }).wrap;
    case "disabled-array":
      return mountFloatingCalendarDemo({
        value: new Date(2026, 2, 15),
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
    case "allow-input-date":
      return mountFloatingCalendarDemo({
        value: new Date(2026, 2, 15),
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
        { className: "showcase-card__mount--inline-theme" },
        {
          setupFloating: (floating) => {
            floating.style.cssText = `
      --cal-bg: #fff7ed;
      --cal-surface: #ffedd5;
      --cal-text: #431407;
      --cal-muted: #9a3412;
      --cal-border: #fdba74;
      --cal-accent: #c2410c;
      --cal-accent-contrast: #fff7ed;
    `;
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

  createCalendarPicker(input, {
    value: new Date(2026, 5, 8),
    onChange: (date) => console.log("Selected:", date),
  });
}

function initShowcase() {
  mountQuickStartDemo();
  for (const mount of document.querySelectorAll("[data-demo]")) {
    const key = mount.dataset.demo;
    if (!key) continue;
    const demo = mountDemo(key);
    if (demo) mount.append(demo);
  }
}

initShowcase();
