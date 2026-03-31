import { autoUpdate, computePosition, flip, offset, shift } from "@floating-ui/dom";
import { format } from "date-fns";
import {
  createCalendarPicker,
  czechLocale,
  frenchLocale,
  germanLocale,
  type DateRangeValue,
} from "@/calendar/index";

function formatSelection(d: Date): string {
  return format(d, "yyyy-MM-dd HH:mm");
}

function formatRangeLine(r: DateRangeValue, fmt: string, sep: string): string {
  if (!r.start) return "No range selected";
  if (!r.end) return `${format(r.start, fmt)} …`;
  return `${format(r.start, fmt)}${sep}${format(r.end, fmt)}`;
}

function card(
  title: string,
  description: string,
  mount: HTMLElement,
  extra: HTMLElement[],
): HTMLElement {
  const el = document.createElement("article");
  el.className = "showcase-card";
  const h2 = document.createElement("h2");
  h2.textContent = title;
  const p = document.createElement("p");
  p.className = "showcase-card__desc";
  p.textContent = description;
  const wrap = document.createElement("div");
  wrap.className = "showcase-card__mount";
  wrap.append(mount);
  el.append(h2, p, wrap, ...extra);
  return el;
}

function makeLog(initial: string): HTMLElement {
  const pre = document.createElement("pre");
  pre.className = "showcase-card__log";
  pre.textContent = initial;
  return pre;
}

function mountFloatingCalendarDemo(
  opts: Parameters<typeof createCalendarPicker>[1],
  onValueChange: (value: string) => void,
  onRangeChange?: (value: string) => void,
  onReady?: (api: ReturnType<typeof createCalendarPicker>) => void,
  setupFloating?: (floating: HTMLDivElement) => void,
  formatSingle?: (date: Date | null) => string,
): HTMLElement {
  const options = opts ?? {};
  const wrap = document.createElement("div");
  wrap.className = "showcase-card__floating-trigger-wrap";
  const singleFormatter =
    formatSingle ?? ((date: Date | null): string => (date ? formatSelection(date) : "No date selected"));

  const trigger = document.createElement("pre");
  trigger.className = "showcase-card__log showcase-card__log--trigger";
  trigger.tabIndex = 0;
  trigger.setAttribute("role", "button");
  trigger.setAttribute("aria-label", "Open calendar");
  const setTriggerValue = (value: string): void => {
    trigger.textContent = value;
  };
  setTriggerValue("No date selected");
  wrap.append(trigger);

  const floating = document.createElement("div");
  floating.className = "showcase-floating";
  floating.hidden = true;
  setupFloating?.(floating);
  document.body.append(floating);

  const api = createCalendarPicker(floating, {
    ...options,
    onChange: (d) => {
      options.onChange?.(d);
      const value = singleFormatter(d);
      setTriggerValue(value);
      onValueChange(value);
    },
    onRangeChange: (r) => {
      options.onRangeChange?.(r);
      const fmt = options.outputFormat ?? (options.showTime ? "yyyy-MM-dd HH:mm" : "yyyy-MM-dd");
      const sep = options.rangeOutputSeparator ?? " → ";
      const value = formatRangeLine(r, fmt, sep);
      setTriggerValue(value);
      onRangeChange?.(value);
    },
  });
  onReady?.(api);

  const syncFromInitial = (): void => {
    if ((options.mode ?? "single") === "range") {
      const fmt = options.outputFormat ?? (options.showTime ? "yyyy-MM-dd HH:mm" : "yyyy-MM-dd");
      const sep = options.rangeOutputSeparator ?? " → ";
      const initial = api.getRange();
      const value = formatRangeLine(initial, fmt, sep);
      setTriggerValue(value);
      onRangeChange?.(value);
      return;
    }
    const initial = api.getValue();
    const value = singleFormatter(initial);
    setTriggerValue(value);
    onValueChange(value);
  };
  syncFromInitial();

  let cleanupAutoUpdate: (() => void) | null = null;
  const updatePosition = (): void => {
    void computePosition(trigger, floating, {
      strategy: "fixed",
      placement: "bottom-start",
      middleware: [offset(8), flip(), shift({ padding: 8 })],
    }).then(({ x, y }) => {
      Object.assign(floating.style, {
        left: `${String(Math.round(x))}px`,
        top: `${String(Math.round(y))}px`,
      });
    });
  };

  const close = (): void => {
    floating.hidden = true;
    cleanupAutoUpdate?.();
    cleanupAutoUpdate = null;
    trigger.setAttribute("aria-expanded", "false");
  };

  const open = (): void => {
    floating.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    cleanupAutoUpdate = autoUpdate(trigger, floating, updatePosition);
    updatePosition();
  };

  const toggle = (): void => {
    if (floating.hidden) open();
    else close();
  };

  trigger.addEventListener("click", toggle);
  trigger.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
    if (e.key === "Escape") {
      close();
    }
  });

  document.addEventListener("pointerdown", (e) => {
    if (floating.hidden) return;
    const target = e.target as Node | null;
    if (!target) return;
    if (floating.contains(target) || trigger.contains(target)) return;
    close();
  });

  return wrap;
}

export function mountShowcase(root: HTMLElement): void {
  root.classList.add("showcase");
  const hero = document.createElement("header");
  hero.className = "showcase__hero";
  const h1 = document.createElement("h1");
  h1.textContent = "Calendar picker showcase";
  const lead = document.createElement("p");
  lead.append(
    "TypeScript calendar with localization (see ",
    Object.assign(document.createElement("a"), {
      href: "https://flatpickr.js.org/localization/",
      rel: "noreferrer noopener",
      target: "_blank",
      textContent: "flatpickr localization",
    }),
    "), month & year selects, optional 24-hour time, date ranges with separate start/end times, custom output formats (date-fns), ISO week numbers, allowed / blocked dates, and CSS-variable themes. Layout is mobile-first.",
  );
  hero.append(h1, lead);

  const grid = document.createElement("div");
  grid.className = "showcase__grid";

  /* 1 — Default */
  {
    const pre = makeLog("—");
    const m = mountFloatingCalendarDemo(
      {
        value: new Date(2026, 2, 15, 12, 30),
        showTime: true,
        onChange: () => {
          // handled by mountFloatingCalendarDemo
        },
      },
      (value) => {
        pre.textContent = value;
      },
    );
    grid.append(
      card(
        "1. Floating calendar (click the log line)",
        "Calendar opens as a floating panel anchored to the log `pre` element. Click outside or press Escape to close it.",
        m,
        [],
      ),
    );
  }

  /* 2 — German */
  {
    const pre = makeLog("No date selected");
    const m = mountFloatingCalendarDemo(
      {
      locale: germanLocale,
      onChange: (d) => {
        pre.textContent = d ? formatSelection(d) : "No date selected";
      },
      },
      (value) => {
        pre.textContent = value;
      },
    );
    grid.append(
      card(
        "2. German locale",
        "Full locale object: German month names and Monday as the first day of the week.",
        m,
        [],
      ),
    );
  }

  /* 3 — French */
  {
    const pre = makeLog("No date selected");
    const m = mountFloatingCalendarDemo(
      {
      locale: frenchLocale,
      onChange: (d) => {
        pre.textContent = d ? formatSelection(d) : "No date selected";
      },
      },
      (value) => {
        pre.textContent = value;
      },
    );
    grid.append(
      card("3. French locale", "Another full locale with Monday as the first weekday.", m, []),
    );
  }

  /* 4 — Partial locale override */
  {
    const pre = makeLog("No date selected");
    const m = mountFloatingCalendarDemo(
      {
      locale: {
        ...czechLocale,
        weekNumberHeader: "Tý",
      },
      onChange: (d) => {
        pre.textContent = d ? formatSelection(d) : "No date selected";
      },
      },
      (value) => {
        pre.textContent = value;
      },
    );
    grid.append(
      card(
        "4. Partial locale (Czech labels, Monday week start)",
        "Uses Czech locale defaults (Monday first day) while overriding only the week number header.",
        m,
        [],
      ),
    );
  }

  /* 5 — min / max */
  {
    const pre = makeLog("No date selected");
    const m = mountFloatingCalendarDemo(
      {
      minDate: new Date(2026, 2, 10),
      maxDate: new Date(2026, 2, 25),
      onChange: (d) => {
        pre.textContent = d ? formatSelection(d) : "No date selected";
      },
      },
      (value) => {
        pre.textContent = value;
      },
    );
    grid.append(
      card(
        "5. Allowed date range (min / max)",
        "Only days between 10 Mar 2026 and 25 Mar 2026 (inclusive) are selectable.",
        m,
        [],
      ),
    );
  }

  /* 6 — disabled array */
  {
    const pre = makeLog("No date selected");
    const m = mountFloatingCalendarDemo(
      {
      disabledDates: [new Date(2026, 2, 17), new Date(2026, 2, 18), new Date(2026, 2, 19)],
      onChange: (d) => {
        pre.textContent = d ? formatSelection(d) : "No date selected";
      },
      },
      (value) => {
        pre.textContent = value;
      },
    );
    grid.append(
      card(
        "6. Disallowed specific dates (array)",
        "17–19 March 2026 blocked; useful for holidays or one-off closures.",
        m,
        [],
      ),
    );
  }

  /* 7 — disabled predicate */
  {
    const pre = makeLog("No date selected");
    const m = mountFloatingCalendarDemo(
      {
      disabledDates: (d) => d.getDay() === 0 || d.getDay() === 6,
      onChange: (d) => {
        pre.textContent = d ? formatSelection(d) : "No date selected";
      },
      },
      (value) => {
        pre.textContent = value;
      },
    );
    grid.append(
      card("7. Disallowed pattern (predicate)", "Weekends disabled via (date) => boolean.", m, []),
    );
  }

  /* 8 — whitelist array */
  {
    const pre = makeLog("No date selected");
    const allowed = [5, 12, 19, 26].map((day) => new Date(2026, 2, day));
    const m = mountFloatingCalendarDemo(
      {
      enabledDatesOnly: allowed,
      onChange: (d) => {
        pre.textContent = d ? formatSelection(d) : "No date selected";
      },
      },
      (value) => {
        pre.textContent = value;
      },
    );
    grid.append(
      card(
        "8. Allowed dates only — whitelist array",
        "Only four Thursdays in March 2026 can be picked.",
        m,
        [],
      ),
    );
  }

  /* 9 — whitelist predicate */
  {
    const pre = makeLog("No date selected");
    const m = mountFloatingCalendarDemo(
      {
      enabledDatesOnly: (d) => d.getDate() % 2 === 1,
      onChange: (d) => {
        pre.textContent = d ? formatSelection(d) : "No date selected";
      },
      },
      (value) => {
        pre.textContent = value;
      },
    );
    grid.append(
      card(
        "9. Allowed dates only — predicate",
        "Only odd-numbered calendar days are selectable.",
        m,
        [],
      ),
    );
  }

  /* 10 — time 24h */
  {
    const pre = makeLog("—");
    const m = mountFloatingCalendarDemo(
      {
      showTime: true,
      value: new Date(2026, 2, 20, 14, 45),
      onChange: (d) => {
        pre.textContent = d ? formatSelection(d) : "No date selected";
      },
      },
      (value) => {
        pre.textContent = value;
      },
    );
    grid.append(
      card(
        "10. Time selection (24-hour)",
        "Hour 0–23 and minute 0–59; combined with the selected day.",
        m,
        [],
      ),
    );
  }

  /* 11 — dark theme */
  {
    const pre = makeLog("No date selected");
    const m = mountFloatingCalendarDemo(
      {
      theme: "dark",
      showTime: true,
      onChange: (d) => {
        pre.textContent = d ? formatSelection(d) : "No date selected";
      },
      },
      (value) => {
        pre.textContent = value;
      },
    );
    grid.append(
      card("11. Theme: dark preset", 'Uses data-cal-theme="dark" and bundled CSS variables.', m, []),
    );
  }

  /* 12 — custom CSS variables */
  {
    const pre = makeLog("No date selected");
    const m = mountFloatingCalendarDemo(
      {
        className: "showcase-card__mount--inline-theme",
        onChange: (d) => {
          pre.textContent = d ? formatSelection(d) : "No date selected";
        },
      },
      (value) => {
        pre.textContent = value;
      },
      undefined,
      undefined,
      (floating) => {
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
    );
    grid.append(
      card(
        "12. Custom theme (CSS variables)",
        "Parent sets --cal-* variables; no new theme name required.",
        m,
        [],
      ),
    );
  }

  /* 13 — narrow year dropdown */
  {
    const pre = makeLog("—");
    const m = mountFloatingCalendarDemo(
      {
      yearDropdownRadius: 3,
      value: new Date(2026, 5, 1),
      onChange: (d) => {
        pre.textContent = d ? formatSelection(d) : "No date selected";
      },
      },
      (value) => {
        pre.textContent = value;
      },
    );
    grid.append(
      card(
        "13. Year dropdown span",
        "yearDropdownRadius: 3 → years from 2023 to 2029 in the select (plus min/max clamping when set).",
        m,
        [],
      ),
    );
  }

  /* 14 — setOptions */
  {
    const pre = makeLog("No date selected");
    let rangeMode = false;
    const rangeFmt = "yyyy-MM-dd";
    let api: ReturnType<typeof createCalendarPicker> | null = null;
    const m = mountFloatingCalendarDemo(
      {
        onChange: (d) => {
          if (!rangeMode) {
            pre.textContent = d ? formatSelection(d) : "No date selected";
          }
        },
        onRangeChange: (r) => {
          if (rangeMode) {
            pre.textContent = formatRangeLine(r, rangeFmt, " → ");
          }
        },
      },
      (value) => {
        if (!rangeMode) pre.textContent = value;
      },
      (value) => {
        if (rangeMode) pre.textContent = value;
      },
      (calendarApi) => {
        api = calendarApi;
      },
    );
    const actions = document.createElement("div");
    actions.className = "showcase-card__actions";
    const bDe = document.createElement("button");
    bDe.type = "button";
    bDe.textContent = "Locale → German";
    bDe.addEventListener("click", () => {
      api?.setOptions({ locale: germanLocale });
    });
    const bFr = document.createElement("button");
    bFr.type = "button";
    bFr.textContent = "Locale → French";
    bFr.addEventListener("click", () => {
      api?.setOptions({ locale: frenchLocale });
    });
    const bTime = document.createElement("button");
    bTime.type = "button";
    bTime.textContent = "Toggle time";
    let timeOn = false;
    bTime.addEventListener("click", () => {
      timeOn = !timeOn;
      api?.setOptions({ showTime: timeOn });
    });
    const bMode = document.createElement("button");
    bMode.type = "button";
    bMode.textContent = "Toggle range mode";
    bMode.addEventListener("click", () => {
      if (!api) return;
      if (!rangeMode) {
        const v = api.getValue();
        rangeMode = true;
        api.setOptions({
          mode: "range",
          range: { start: v, end: null },
          outputFormat: rangeFmt,
        });
        pre.textContent = formatRangeLine(api.getRange(), rangeFmt, " → ");
      } else {
        const r = api.getRange();
        rangeMode = false;
        api.setOptions({ mode: "single", value: r.start });
        pre.textContent = r.start ? formatSelection(r.start) : "No date selected";
      }
    });
    actions.append(bDe, bFr, bTime, bMode);
    grid.append(
      card(
        "14. Runtime setOptions",
        "Switch locale, `showTime`, or `mode` / `range` without remounting.",
        m,
        [actions],
      ),
    );
  }

  /* 15 — Combined */
  {
    const pre = makeLog("No date selected");
    const m = mountFloatingCalendarDemo(
      {
      theme: "forest",
      locale: germanLocale,
      minDate: new Date(2026, 2, 1),
      maxDate: new Date(2026, 3, 30),
      disabledDates: (d) => d.getDay() === 3,
      showTime: true,
      onChange: (d) => {
        pre.textContent = d ? formatSelection(d) : "No date selected";
      },
      },
      (value) => {
        pre.textContent = value;
      },
    );
    grid.append(
      card(
        "15. Combined demo",
        "German locale, forest theme, min/max range, Wednesdays blocked, with time.",
        m,
        [],
      ),
    );
  }

  /* 16 — ariaLabel */
  {
    const pre = makeLog("No date selected");
    const m = mountFloatingCalendarDemo(
      {
      ariaLabel: "Delivery date",
      onChange: (d) => {
        pre.textContent = d ? formatSelection(d) : "No date selected";
      },
      },
      (value) => {
        pre.textContent = value;
      },
    );
    grid.append(
      card("16. Accessibility: aria-label", "Root has a custom aria-label for screen readers.", m, []),
    );
  }

  /* 17 — high-contrast preset */
  {
    const pre = makeLog("No date selected");
    const m = mountFloatingCalendarDemo(
      {
      theme: "contrast",
      onChange: (d) => {
        pre.textContent = d ? formatSelection(d) : "No date selected";
      },
      },
      (value) => {
        pre.textContent = value;
      },
    );
    grid.append(
      card(
        "17. Theme: high contrast",
        'data-cal-theme="contrast" — strong borders and yellow accent on black.',
        m,
        [],
      ),
    );
  }

  /* 18 — Time picker off (default) */
  {
    const pre = makeLog("—");
    const m = mountFloatingCalendarDemo(
      {
      value: new Date(2026, 5, 8),
      onChange: (d) => {
        pre.textContent = d ? format(d, "yyyy-MM-dd") : "No date selected";
      },
      },
      (value) => {
        pre.textContent = value;
      },
      undefined,
      undefined,
      undefined,
      (d) => (d ? format(d, "yyyy-MM-dd") : "No date selected"),
    );
    grid.append(
      card(
        "18. Time picker disabled (default)",
        "`showTime` defaults to `false`. Output uses date-only tokens unless you set `outputFormat` or enable time.",
        m,
        [],
      ),
    );
  }

  /* 19 — Custom output format (single) */
  {
    const pre = makeLog("—");
    const m = mountFloatingCalendarDemo(
      {
      value: new Date(2026, 7, 19, 15, 0),
      showTime: true,
      outputFormat: "EEEE, d MMMM yyyy 'at' HH:mm",
      onChange: (d) => {
        pre.textContent = d ? format(d, "EEEE, d MMMM yyyy 'at' HH:mm") : "No date selected";
      },
      },
      (value) => {
        pre.textContent = value;
      },
      undefined,
      undefined,
      undefined,
      (d) => (d ? format(d, "EEEE, d MMMM yyyy 'at' HH:mm") : "No date selected"),
    );
    grid.append(
      card(
        "19. Custom output format",
        "`outputFormat` is a date-fns pattern for the built-in &lt;output&gt; (and you can match it in your own UI).",
        m,
        [],
      ),
    );
  }

  /* 20 — Week numbers (ISO) */
  {
    const pre = makeLog("No date selected");
    const m = mountFloatingCalendarDemo(
      {
      showWeekNumbers: true,
      locale: germanLocale,
      onChange: (d) => {
        pre.textContent = d ? format(d, "yyyy-MM-dd") : "No date selected";
      },
      },
      (value) => {
        pre.textContent = value;
      },
      undefined,
      undefined,
      undefined,
      (d) => (d ? format(d, "yyyy-MM-dd") : "No date selected"),
    );
    grid.append(
      card(
        "20. Week numbers",
        "`showWeekNumbers: true` adds an ISO week column (`getISOWeek`). Optional `locale.weekNumberHeader` (here German locale + default “Wk” from English merge).",
        m,
        [],
      ),
    );
  }

  /* 21 — Date range (no time) */
  {
    const pre = makeLog("—");
    const fmt = "yyyy-MM-dd";
    const m = mountFloatingCalendarDemo(
      {
      mode: "range",
      range: {
        start: new Date(2026, 2, 5),
        end: new Date(2026, 2, 18),
      },
      outputFormat: fmt,
      onRangeChange: (r) => {
        pre.textContent = formatRangeLine(r, fmt, " → ");
      },
      },
      () => {},
      (value) => {
        pre.textContent = value;
      },
    );
    grid.append(
      card(
        "21. Date range",
        '`mode: "range"`: first click starts a range, second completes it (third starts over). Default `range` sets initial start/end.',
        m,
        [],
      ),
    );
  }

  /* 22 — Range + dual times + defaults */
  {
    const pre = makeLog("—");
    const fmt = "yyyy-MM-dd HH:mm";
    const m = mountFloatingCalendarDemo(
      {
      mode: "range",
      showTime: true,
      range: {
        start: new Date(2026, 3, 10, 9, 30),
        end: new Date(2026, 3, 14, 17, 45),
      },
      outputFormat: fmt,
      onRangeChange: (r) => {
        pre.textContent = formatRangeLine(r, fmt, " → ");
      },
      },
      () => {},
      (value) => {
        pre.textContent = value;
      },
    );
    grid.append(
      card(
        "22. Range with start & end time",
        "With `showTime` in range mode you get separate start and end time controls; times apply to the earlier/later calendar day after both days are chosen.",
        m,
        [],
      ),
    );
  }

  /* 23 — Range output separator + format */
  {
    const pre = makeLog("—");
    const fmt = "dd.MM.yyyy HH:mm";
    const sep = " — ";
    const m = mountFloatingCalendarDemo(
      {
      mode: "range",
      showTime: true,
      outputFormat: fmt,
      rangeOutputSeparator: sep,
      range: {
        start: new Date(2026, 8, 1, 8, 0),
        end: new Date(2026, 8, 7, 20, 0),
      },
      onRangeChange: (r) => {
        pre.textContent = formatRangeLine(r, fmt, sep);
      },
      },
      () => {},
      (value) => {
        pre.textContent = value;
      },
    );
    grid.append(
      card(
        "23. Range separator & format",
        "`rangeOutputSeparator` and `outputFormat` control the printed range string.",
        m,
        [],
      ),
    );
  }

  /* 24 — Range + weeks + custom week header */
  {
    const pre = makeLog("—");
    const fmt = "yyyy-MM-dd";
    const m = mountFloatingCalendarDemo(
      {
      mode: "range",
      showWeekNumbers: true,
      locale: { weekNumberHeader: "KW" },
      outputFormat: fmt,
      range: { start: new Date(2026, 0, 6), end: new Date(2026, 0, 20) },
      onRangeChange: (r) => {
        pre.textContent = formatRangeLine(r, fmt, " → ");
      },
      },
      () => {},
      (value) => {
        pre.textContent = value;
      },
    );
    grid.append(
      card(
        "24. Range + week numbers",
        'Combine `mode: "range"`, `showWeekNumbers`, and a localized week column title via `locale.weekNumberHeader` (here “KW”).',
        m,
        [],
      ),
    );
  }

  /* 25 — Date range + dark theme */
  {
    const pre = makeLog("—");
    const fmt = "yyyy-MM-dd";
    const m = mountFloatingCalendarDemo(
      {
      mode: "range",
      theme: "dark",
      outputFormat: fmt,
      range: {
        start: new Date(2026, 4, 12),
        end: new Date(2026, 4, 26),
      },
      onRangeChange: (r) => {
        pre.textContent = formatRangeLine(r, fmt, " → ");
      },
      },
      () => {},
      (value) => {
        pre.textContent = value;
      },
    );
    grid.append(
      card(
        "25. Date range + dark theme",
        '`mode: "range"` with `theme: "dark"` (`data-cal-theme="dark"` and bundled CSS variables).',
        m,
        [],
      ),
    );
  }

  root.append(hero, grid);
}
