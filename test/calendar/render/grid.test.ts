import { describe, expect, it, vi } from "vitest";
import { renderGrid, renderGridForMonth } from "@/calendar/render/grid";
import type { GridSelectionState } from "@/calendar/render/grid";

const baseSelection = (overrides: Partial<GridSelectionState> = {}): GridSelectionState => ({
  mode: "single",
  selected: null,
  rangeStart: null,
  rangeEnd: null,
  rangeHoverEnd: null,
  shouldPseudoSelectToday: false,
  now: new Date(2026, 5, 17),
  durationTipIdBase: "tip",
  activeDate: null,
  ...overrides,
});

describe("renderGridForMonth", () => {
  it("renders day buttons for the month", () => {
    const grid = document.createElement("div");
    renderGridForMonth(grid, 2026, 5, {}, baseSelection(), { onDayClick: vi.fn() });
    const days = grid.querySelectorAll("button.cal__day");
    expect(days.length).toBe(30);
    const firstDay = days[0] as HTMLButtonElement | undefined;
    expect(firstDay?.dataset.date).toBe("2026-06-01");
  });

  it("marks selected day in single mode", () => {
    const grid = document.createElement("div");
    renderGridForMonth(grid, 2026, 5, {}, baseSelection({ selected: new Date(2026, 5, 15) }), {
      onDayClick: vi.fn(),
    });
    const selected = grid.querySelector('button.cal__day[data-date="2026-06-15"]');
    expect(selected?.classList.contains("cal__day--selected")).toBe(true);
  });

  it("marks range endpoints and between days", () => {
    const grid = document.createElement("div");
    renderGridForMonth(
      grid,
      2026,
      5,
      {},
      baseSelection({
        mode: "range",
        rangeStart: new Date(2026, 5, 10),
        rangeEnd: new Date(2026, 5, 12),
      }),
      { onDayClick: vi.fn() },
    );
    expect(
      grid
        .querySelector('button.cal__day[data-date="2026-06-10"]')
        ?.classList.contains("cal__day--range-start"),
    ).toBe(true);
    expect(
      grid
        .querySelector('button.cal__day[data-date="2026-06-12"]')
        ?.classList.contains("cal__day--range-end"),
    ).toBe(true);
    expect(
      grid
        .querySelector('button.cal__day[data-date="2026-06-11"]')
        ?.classList.contains("cal__day--range-between"),
    ).toBe(true);
  });

  it("disables non-selectable days", () => {
    const grid = document.createElement("div");
    renderGridForMonth(grid, 2026, 5, { minDate: new Date(2026, 5, 10) }, baseSelection(), {
      onDayClick: vi.fn(),
    });
    const early = grid.querySelector(
      'button.cal__day[data-date="2026-06-05"]',
    ) as HTMLButtonElement;
    expect(early.disabled).toBe(true);
    expect(early.classList.contains("cal__day--disabled")).toBe(true);
  });

  it("invokes onDayClick when a day is clicked", () => {
    const grid = document.createElement("div");
    const onDayClick = vi.fn();
    renderGridForMonth(grid, 2026, 5, {}, baseSelection(), { onDayClick });
    const day = grid.querySelector('button.cal__day[data-date="2026-06-15"]') as HTMLButtonElement;
    day.click();
    expect(onDayClick).toHaveBeenCalledWith(new Date(2026, 5, 15), 2026, 5, 15);
  });

  it("wraps days in ARIA rows and gridcells", () => {
    const grid = document.createElement("div");
    grid.setAttribute("role", "grid");
    renderGridForMonth(grid, 2026, 5, {}, baseSelection(), { onDayClick: vi.fn() });
    expect(grid.getAttribute("aria-label")).toBe("June 2026");
    expect(grid.querySelectorAll('[role="row"]').length).toBeGreaterThan(0);
    const day = grid.querySelector('button.cal__day[data-date="2026-06-15"]');
    expect(day?.parentElement?.getAttribute("role")).toBe("gridcell");
    expect(day?.closest('[role="row"]')).toBeTruthy();
  });

  it("gives each day a descriptive aria-label", () => {
    const grid = document.createElement("div");
    renderGridForMonth(grid, 2026, 5, {}, baseSelection(), { onDayClick: vi.fn() });
    const day = grid.querySelector('button.cal__day[data-date="2026-06-15"]');
    expect(day?.getAttribute("aria-label")).toBe("15 June 2026");
  });

  it("applies roving tabindex to the active day only", () => {
    const grid = document.createElement("div");
    renderGridForMonth(grid, 2026, 5, {}, baseSelection({ activeDate: new Date(2026, 5, 15) }), {
      onDayClick: vi.fn(),
    });
    const tabbable = grid.querySelectorAll('button.cal__day[tabindex="0"]');
    expect(tabbable.length).toBe(1);
    expect((tabbable[0] as HTMLElement).getAttribute("data-date")).toBe("2026-06-15");
    const others = grid.querySelectorAll('button.cal__day[tabindex="-1"]');
    expect(others.length).toBe(29);
  });

  it("marks week-number cells as row headers", () => {
    const grid = document.createElement("div");
    renderGridForMonth(grid, 2026, 5, { showWeekNumbers: true }, baseSelection(), {
      onDayClick: vi.fn(),
    });
    expect(grid.querySelectorAll('.cal__weeknum[role="rowheader"]').length).toBeGreaterThan(0);
  });

  it("shows week numbers when enabled", () => {
    const grid = document.createElement("div");
    renderGridForMonth(grid, 2026, 5, { showWeekNumbers: true }, baseSelection(), {
      onDayClick: vi.fn(),
    });
    expect(grid.classList.contains("cal__grid--with-weeks")).toBe(true);
    expect(grid.querySelectorAll(".cal__weeknum").length).toBeGreaterThan(0);
  });
});

describe("renderGridForMonth caching", () => {
  it("reuses day button nodes when only the selection changes", () => {
    const grid = document.createElement("div");
    renderGridForMonth(grid, 2026, 5, {}, baseSelection(), { onDayClick: vi.fn() });
    const before = grid.querySelector('button.cal__day[data-date="2026-06-15"]');
    renderGridForMonth(grid, 2026, 5, {}, baseSelection({ selected: new Date(2026, 5, 15) }), {
      onDayClick: vi.fn(),
    });
    const after = grid.querySelector('button.cal__day[data-date="2026-06-15"]');
    expect(after).toBe(before); // same node — decorated, not rebuilt
    expect(after?.classList.contains("cal__day--selected")).toBe(true);
  });

  it("rebuilds when the month changes", () => {
    const grid = document.createElement("div");
    renderGridForMonth(grid, 2026, 5, {}, baseSelection(), { onDayClick: vi.fn() });
    const june = grid.querySelector("button.cal__day");
    renderGridForMonth(grid, 2026, 6, {}, baseSelection(), { onDayClick: vi.fn() });
    expect(grid.getAttribute("aria-label")).toBe("July 2026");
    expect(grid.contains(june)).toBe(false);
  });

  it("rebuilds when selectability options change", () => {
    const grid = document.createElement("div");
    renderGridForMonth(grid, 2026, 5, {}, baseSelection(), { onDayClick: vi.fn() });
    const before = grid.querySelector(
      'button.cal__day[data-date="2026-06-05"]',
    ) as HTMLButtonElement;
    expect(before.disabled).toBe(false);
    renderGridForMonth(grid, 2026, 5, { minDate: new Date(2026, 5, 10) }, baseSelection(), {
      onDayClick: vi.fn(),
    });
    const after = grid.querySelector(
      'button.cal__day[data-date="2026-06-05"]',
    ) as HTMLButtonElement;
    expect(after).not.toBe(before); // structure rebuilt
    expect(after.disabled).toBe(true);
  });

  it("rebuilds when the locale option changes", () => {
    const grid = document.createElement("div");
    renderGridForMonth(grid, 2026, 5, {}, baseSelection(), { onDayClick: vi.fn() });
    const before = grid.querySelector('button.cal__day[data-date="2026-06-15"]');
    expect(before?.getAttribute("aria-label")).toBe("15 June 2026");

    const de = {
      months: {
        shorthand: [
          "Jan",
          "Feb",
          "Mär",
          "Apr",
          "Mai",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Okt",
          "Nov",
          "Dez",
        ],
        longhand: [
          "Januar",
          "Februar",
          "März",
          "April",
          "Mai",
          "Juni",
          "Juli",
          "August",
          "September",
          "Oktober",
          "November",
          "Dezember",
        ],
      },
    };
    renderGridForMonth(grid, 2026, 5, { locale: de }, baseSelection(), { onDayClick: vi.fn() });
    const after = grid.querySelector('button.cal__day[data-date="2026-06-15"]');
    expect(after).not.toBe(before); // rebuilt so labels refresh
    expect(after?.getAttribute("aria-label")).toBe("15 Juni 2026");
  });

  it("does not accumulate range-duration tooltips across re-decoration", () => {
    const grid = document.createElement("div");
    const hoverAt = (day: number): GridSelectionState =>
      baseSelection({
        mode: "range",
        rangeStart: new Date(2026, 5, 10),
        rangeEnd: null,
        rangeHoverEnd: new Date(2026, 5, day),
      });
    renderGridForMonth(grid, 2026, 5, {}, hoverAt(12), { onDayClick: vi.fn() });
    expect(grid.querySelectorAll(".cal__range-duration-tip").length).toBe(1);
    renderGridForMonth(grid, 2026, 5, {}, hoverAt(14), { onDayClick: vi.fn() });
    expect(grid.querySelectorAll(".cal__range-duration-tip").length).toBe(1);
  });
});

describe("renderGrid", () => {
  it("renders left and right month panes", () => {
    const left = document.createElement("div");
    const right = document.createElement("div");
    renderGrid(left, right, 2026, 5, {}, baseSelection(), { onDayClick: vi.fn() });
    expect(left.querySelectorAll("button.cal__day")).toHaveLength(30);
    expect(right.querySelectorAll("button.cal__day")).toHaveLength(31);
  });

  it("renders only the left month pane in compact range mode", () => {
    const left = document.createElement("div");
    const right = document.createElement("div");
    right.innerHTML = "<button type='button' class='cal__day'></button>";
    renderGrid(left, right, 2026, 5, {}, baseSelection(), { onDayClick: vi.fn() }, true);
    expect(left.querySelectorAll("button.cal__day")).toHaveLength(30);
    expect(right.querySelectorAll("button.cal__day")).toHaveLength(0);
  });
});
