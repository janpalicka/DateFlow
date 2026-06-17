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

  it("shows week numbers when enabled", () => {
    const grid = document.createElement("div");
    renderGridForMonth(grid, 2026, 5, { showWeekNumbers: true }, baseSelection(), {
      onDayClick: vi.fn(),
    });
    expect(grid.classList.contains("cal__grid--with-weeks")).toBe(true);
    expect(grid.querySelectorAll(".cal__weeknum").length).toBeGreaterThan(0);
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
});
