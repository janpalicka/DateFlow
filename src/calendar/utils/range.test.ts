import { describe, expect, it } from "vitest";
import { cloneRange, isSelectable, yearRange } from "./range";

describe("isSelectable", () => {
  const day = new Date(2026, 5, 15);

  it("respects min and max dates", () => {
    expect(isSelectable(day, new Date(2026, 5, 20), null, undefined, undefined)).toBe(false);
    expect(isSelectable(day, null, new Date(2026, 5, 10), undefined, undefined)).toBe(false);
    expect(
      isSelectable(day, new Date(2026, 5, 1), new Date(2026, 5, 30), undefined, undefined),
    ).toBe(true);
  });

  it("excludes disabled dates", () => {
    expect(isSelectable(day, null, null, [day], undefined)).toBe(false);
    expect(isSelectable(day, null, null, [new Date(2026, 5, 16)], undefined)).toBe(true);
  });

  it("allows only enabled dates when enabledDatesOnly is set", () => {
    expect(isSelectable(day, null, null, undefined, [day])).toBe(true);
    expect(isSelectable(day, null, null, undefined, [new Date(2026, 5, 16)])).toBe(false);
  });
});

describe("yearRange", () => {
  it("centers on view year within radius", () => {
    expect(yearRange(2026, null, null, 2)).toEqual({ from: 2024, to: 2028 });
  });

  it("clamps to min and max date years", () => {
    expect(yearRange(2026, new Date(2025, 0, 1), new Date(2027, 11, 31), 5)).toEqual({
      from: 2025,
      to: 2027,
    });
  });

  it("collapses when min year exceeds max year", () => {
    expect(yearRange(2026, new Date(2030, 0, 1), new Date(2020, 0, 1), 2)).toEqual({
      from: 2026,
      to: 2026,
    });
  });
});

describe("cloneRange", () => {
  it("deep-clones date values", () => {
    const start = new Date(2026, 5, 1);
    const end = new Date(2026, 5, 10);
    const cloned = cloneRange({ start, end });
    expect(cloned.start).toEqual(start);
    expect(cloned.end).toEqual(end);
    expect(cloned.start).not.toBe(start);
    expect(cloned.end).not.toBe(end);
  });

  it("preserves null endpoints", () => {
    expect(cloneRange({ start: null, end: null })).toEqual({ start: null, end: null });
  });
});
