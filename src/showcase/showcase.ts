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
    const m = document.createElement("div");
    const pre = makeLog("—");
    const api = createCalendarPicker(m, {
      value: new Date(2026, 2, 15, 12, 30),
      showTime: true,
      onChange: (d) => {
        pre.textContent = d ? formatSelection(d) : "No date selected";
      },
    });
    const initial = api.getValue();
    pre.textContent = initial ? formatSelection(initial) : "No date selected";
    grid.append(
      card(
        "1. Default (English, Sunday week start)",
        "Default locale: US-style week (Sunday first). `showTime: true` so the preset time (12:30) is visible and editable.",
        m,
        [pre],
      ),
    );
  }

  /* 2 — German */
  {
    const m = document.createElement("div");
    const pre = makeLog("No date selected");
    createCalendarPicker(m, {
      locale: germanLocale,
      onChange: (d) => {
        pre.textContent = d ? formatSelection(d) : "No date selected";
      },
    });
    grid.append(
      card(
        "2. German locale",
        "Full locale object: German month names and Monday as the first day of the week.",
        m,
        [pre],
      ),
    );
  }

  /* 3 — French */
  {
    const m = document.createElement("div");
    const pre = makeLog("No date selected");
    createCalendarPicker(m, {
      locale: frenchLocale,
      onChange: (d) => {
        pre.textContent = d ? formatSelection(d) : "No date selected";
      },
    });
    grid.append(
      card("3. French locale", "Another full locale with Monday as the first weekday.", m, [pre]),
    );
  }

  /* 4 — Partial locale override */
  {
    const m = document.createElement("div");
    const pre = makeLog("No date selected");
    createCalendarPicker(m, {
      locale: {
        ...czechLocale,
        weekNumberHeader: "Tý",
      },
      onChange: (d) => {
        pre.textContent = d ? formatSelection(d) : "No date selected";
      },
    });
    grid.append(
      card(
        "4. Partial locale (Czech labels, Monday week start)",
        "Uses Czech locale defaults (Monday first day) while overriding only the week number header.",
        m,
        [pre],
      ),
    );
  }

  /* 5 — min / max */
  {
    const m = document.createElement("div");
    const pre = makeLog("No date selected");
    createCalendarPicker(m, {
      minDate: new Date(2026, 2, 10),
      maxDate: new Date(2026, 2, 25),
      onChange: (d) => {
        pre.textContent = d ? formatSelection(d) : "No date selected";
      },
    });
    grid.append(
      card(
        "5. Allowed date range (min / max)",
        "Only days between 10 Mar 2026 and 25 Mar 2026 (inclusive) are selectable.",
        m,
        [pre],
      ),
    );
  }

  /* 6 — disabled array */
  {
    const m = document.createElement("div");
    const pre = makeLog("No date selected");
    createCalendarPicker(m, {
      disabledDates: [new Date(2026, 2, 17), new Date(2026, 2, 18), new Date(2026, 2, 19)],
      onChange: (d) => {
        pre.textContent = d ? formatSelection(d) : "No date selected";
      },
    });
    grid.append(
      card(
        "6. Disallowed specific dates (array)",
        "17–19 March 2026 blocked; useful for holidays or one-off closures.",
        m,
        [pre],
      ),
    );
  }

  /* 7 — disabled predicate */
  {
    const m = document.createElement("div");
    const pre = makeLog("No date selected");
    createCalendarPicker(m, {
      disabledDates: (d) => d.getDay() === 0 || d.getDay() === 6,
      onChange: (d) => {
        pre.textContent = d ? formatSelection(d) : "No date selected";
      },
    });
    grid.append(
      card("7. Disallowed pattern (predicate)", "Weekends disabled via (date) => boolean.", m, [
        pre,
      ]),
    );
  }

  /* 8 — whitelist array */
  {
    const m = document.createElement("div");
    const pre = makeLog("No date selected");
    const allowed = [5, 12, 19, 26].map((day) => new Date(2026, 2, day));
    createCalendarPicker(m, {
      enabledDatesOnly: allowed,
      onChange: (d) => {
        pre.textContent = d ? formatSelection(d) : "No date selected";
      },
    });
    grid.append(
      card(
        "8. Allowed dates only — whitelist array",
        "Only four Thursdays in March 2026 can be picked.",
        m,
        [pre],
      ),
    );
  }

  /* 9 — whitelist predicate */
  {
    const m = document.createElement("div");
    const pre = makeLog("No date selected");
    createCalendarPicker(m, {
      enabledDatesOnly: (d) => d.getDate() % 2 === 1,
      onChange: (d) => {
        pre.textContent = d ? formatSelection(d) : "No date selected";
      },
    });
    grid.append(
      card(
        "9. Allowed dates only — predicate",
        "Only odd-numbered calendar days are selectable.",
        m,
        [pre],
      ),
    );
  }

  /* 10 — time 24h */
  {
    const m = document.createElement("div");
    const pre = makeLog("—");
    const api = createCalendarPicker(m, {
      showTime: true,
      value: new Date(2026, 2, 20, 14, 45),
      onChange: (d) => {
        pre.textContent = d ? formatSelection(d) : "No date selected";
      },
    });
    const t0 = api.getValue();
    pre.textContent = t0 ? formatSelection(t0) : "No date selected";
    grid.append(
      card(
        "10. Time selection (24-hour)",
        "Hour 0–23 and minute 0–59; combined with the selected day.",
        m,
        [pre],
      ),
    );
  }

  /* 11 — dark theme */
  {
    const m = document.createElement("div");
    const pre = makeLog("No date selected");
    createCalendarPicker(m, {
      theme: "dark",
      showTime: true,
      onChange: (d) => {
        pre.textContent = d ? formatSelection(d) : "No date selected";
      },
    });
    grid.append(
      card("11. Theme: dark preset", 'Uses data-cal-theme="dark" and bundled CSS variables.', m, [
        pre,
      ]),
    );
  }

  /* 12 — custom CSS variables */
  {
    const m = document.createElement("div");
    m.classList.add("showcase-card__mount--inline-theme");
    m.style.cssText = `
      --cal-bg: #fff7ed;
      --cal-surface: #ffedd5;
      --cal-text: #431407;
      --cal-muted: #9a3412;
      --cal-border: #fdba74;
      --cal-accent: #c2410c;
      --cal-accent-contrast: #fff7ed;
    `;
    const pre = makeLog("No date selected");
    createCalendarPicker(m, {
      onChange: (d) => {
        pre.textContent = d ? formatSelection(d) : "No date selected";
      },
    });
    grid.append(
      card(
        "12. Custom theme (CSS variables)",
        "Parent sets --cal-* variables; no new theme name required.",
        m,
        [pre],
      ),
    );
  }

  /* 13 — narrow year dropdown */
  {
    const m = document.createElement("div");
    const pre = makeLog("—");
    const api = createCalendarPicker(m, {
      yearDropdownRadius: 3,
      value: new Date(2026, 5, 1),
      onChange: (d) => {
        pre.textContent = d ? formatSelection(d) : "No date selected";
      },
    });
    const y0 = api.getValue();
    pre.textContent = y0 ? formatSelection(y0) : "No date selected";
    grid.append(
      card(
        "13. Year dropdown span",
        "yearDropdownRadius: 3 → years from 2023 to 2029 in the select (plus min/max clamping when set).",
        m,
        [pre],
      ),
    );
  }

  /* 14 — setOptions */
  {
    const m = document.createElement("div");
    const pre = makeLog("No date selected");
    let rangeMode = false;
    const rangeFmt = "yyyy-MM-dd";
    const api = createCalendarPicker(m, {
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
    });
    const actions = document.createElement("div");
    actions.className = "showcase-card__actions";
    const bDe = document.createElement("button");
    bDe.type = "button";
    bDe.textContent = "Locale → German";
    bDe.addEventListener("click", () => {
      api.setOptions({ locale: germanLocale });
    });
    const bFr = document.createElement("button");
    bFr.type = "button";
    bFr.textContent = "Locale → French";
    bFr.addEventListener("click", () => {
      api.setOptions({ locale: frenchLocale });
    });
    const bTime = document.createElement("button");
    bTime.type = "button";
    bTime.textContent = "Toggle time";
    let timeOn = false;
    bTime.addEventListener("click", () => {
      timeOn = !timeOn;
      api.setOptions({ showTime: timeOn });
    });
    const bMode = document.createElement("button");
    bMode.type = "button";
    bMode.textContent = "Toggle range mode";
    bMode.addEventListener("click", () => {
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
        [actions, pre],
      ),
    );
  }

  /* 15 — Combined */
  {
    const m = document.createElement("div");
    const pre = makeLog("No date selected");
    createCalendarPicker(m, {
      theme: "forest",
      locale: germanLocale,
      minDate: new Date(2026, 2, 1),
      maxDate: new Date(2026, 3, 30),
      disabledDates: (d) => d.getDay() === 3,
      showTime: true,
      onChange: (d) => {
        pre.textContent = d ? formatSelection(d) : "No date selected";
      },
    });
    grid.append(
      card(
        "15. Combined demo",
        "German locale, forest theme, min/max range, Wednesdays blocked, with time.",
        m,
        [pre],
      ),
    );
  }

  /* 16 — ariaLabel */
  {
    const m = document.createElement("div");
    const pre = makeLog("No date selected");
    createCalendarPicker(m, {
      ariaLabel: "Delivery date",
      onChange: (d) => {
        pre.textContent = d ? formatSelection(d) : "No date selected";
      },
    });
    grid.append(
      card("16. Accessibility: aria-label", "Root has a custom aria-label for screen readers.", m, [
        pre,
      ]),
    );
  }

  /* 17 — high-contrast preset */
  {
    const m = document.createElement("div");
    const pre = makeLog("No date selected");
    createCalendarPicker(m, {
      theme: "contrast",
      onChange: (d) => {
        pre.textContent = d ? formatSelection(d) : "No date selected";
      },
    });
    grid.append(
      card(
        "17. Theme: high contrast",
        'data-cal-theme="contrast" — strong borders and yellow accent on black.',
        m,
        [pre],
      ),
    );
  }

  /* 18 — Time picker off (default) */
  {
    const m = document.createElement("div");
    const pre = makeLog("—");
    const api = createCalendarPicker(m, {
      value: new Date(2026, 5, 8),
      onChange: (d) => {
        pre.textContent = d ? format(d, "yyyy-MM-dd") : "No date selected";
      },
    });
    const v0 = api.getValue();
    pre.textContent = v0 ? format(v0, "yyyy-MM-dd") : "No date selected";
    grid.append(
      card(
        "18. Time picker disabled (default)",
        "`showTime` defaults to `false`. Output uses date-only tokens unless you set `outputFormat` or enable time.",
        m,
        [pre],
      ),
    );
  }

  /* 19 — Custom output format (single) */
  {
    const m = document.createElement("div");
    const pre = makeLog("—");
    const api = createCalendarPicker(m, {
      value: new Date(2026, 7, 19, 15, 0),
      showTime: true,
      outputFormat: "EEEE, d MMMM yyyy 'at' HH:mm",
      onChange: (d) => {
        pre.textContent = d ? format(d, "EEEE, d MMMM yyyy 'at' HH:mm") : "No date selected";
      },
    });
    const v = api.getValue();
    pre.textContent = v ? format(v, "EEEE, d MMMM yyyy 'at' HH:mm") : "No date selected";
    grid.append(
      card(
        "19. Custom output format",
        "`outputFormat` is a date-fns pattern for the built-in &lt;output&gt; (and you can match it in your own UI).",
        m,
        [pre],
      ),
    );
  }

  /* 20 — Week numbers (ISO) */
  {
    const m = document.createElement("div");
    const pre = makeLog("No date selected");
    createCalendarPicker(m, {
      showWeekNumbers: true,
      locale: germanLocale,
      onChange: (d) => {
        pre.textContent = d ? format(d, "yyyy-MM-dd") : "No date selected";
      },
    });
    grid.append(
      card(
        "20. Week numbers",
        "`showWeekNumbers: true` adds an ISO week column (`getISOWeek`). Optional `locale.weekNumberHeader` (here German locale + default “Wk” from English merge).",
        m,
        [pre],
      ),
    );
  }

  /* 21 — Date range (no time) */
  {
    const m = document.createElement("div");
    const pre = makeLog("—");
    const fmt = "yyyy-MM-dd";
    const api = createCalendarPicker(m, {
      mode: "range",
      range: {
        start: new Date(2026, 2, 5),
        end: new Date(2026, 2, 18),
      },
      outputFormat: fmt,
      onRangeChange: (r) => {
        pre.textContent = formatRangeLine(r, fmt, " → ");
      },
    });
    pre.textContent = formatRangeLine(api.getRange(), fmt, " → ");
    grid.append(
      card(
        "21. Date range",
        '`mode: "range"`: first click starts a range, second completes it (third starts over). Default `range` sets initial start/end.',
        m,
        [pre],
      ),
    );
  }

  /* 22 — Range + dual times + defaults */
  {
    const m = document.createElement("div");
    const pre = makeLog("—");
    const fmt = "yyyy-MM-dd HH:mm";
    const api = createCalendarPicker(m, {
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
    });
    pre.textContent = formatRangeLine(api.getRange(), fmt, " → ");
    grid.append(
      card(
        "22. Range with start & end time",
        "With `showTime` in range mode you get separate start and end time controls; times apply to the earlier/later calendar day after both days are chosen.",
        m,
        [pre],
      ),
    );
  }

  /* 23 — Range output separator + format */
  {
    const m = document.createElement("div");
    const pre = makeLog("—");
    const fmt = "dd.MM.yyyy HH:mm";
    const sep = " — ";
    const api = createCalendarPicker(m, {
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
    });
    pre.textContent = formatRangeLine(api.getRange(), fmt, sep);
    grid.append(
      card(
        "23. Range separator & format",
        "`rangeOutputSeparator` and `outputFormat` control the printed range string.",
        m,
        [pre],
      ),
    );
  }

  /* 24 — Range + weeks + custom week header */
  {
    const m = document.createElement("div");
    const pre = makeLog("—");
    const fmt = "yyyy-MM-dd";
    const api = createCalendarPicker(m, {
      mode: "range",
      showWeekNumbers: true,
      locale: { weekNumberHeader: "KW" },
      outputFormat: fmt,
      range: { start: new Date(2026, 0, 6), end: new Date(2026, 0, 20) },
      onRangeChange: (r) => {
        pre.textContent = formatRangeLine(r, fmt, " → ");
      },
    });
    pre.textContent = formatRangeLine(api.getRange(), fmt, " → ");
    grid.append(
      card(
        "24. Range + week numbers",
        'Combine `mode: "range"`, `showWeekNumbers`, and a localized week column title via `locale.weekNumberHeader` (here “KW”).',
        m,
        [pre],
      ),
    );
  }

  /* 25 — Date range + dark theme */
  {
    const m = document.createElement("div");
    const pre = makeLog("—");
    const fmt = "yyyy-MM-dd";
    const api = createCalendarPicker(m, {
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
    });
    pre.textContent = formatRangeLine(api.getRange(), fmt, " → ");
    grid.append(
      card(
        "25. Date range + dark theme",
        '`mode: "range"` with `theme: "dark"` (`data-cal-theme="dark"` and bundled CSS variables).',
        m,
        [pre],
      ),
    );
  }

  root.append(hero, grid);
}
