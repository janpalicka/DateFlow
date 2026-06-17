import { describe, expect, it } from "vitest";
import { compareCalendarDay, dayInInclusiveRange, parseCalendarDay } from "./days";

describe("parseCalendarDay", () => {
  it("parses ISO date strings to local midnight dates", () => {
    const d = parseCalendarDay("2026-06-15");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(5);
    expect(d.getDate()).toBe(15);
  });
});

describe("compareCalendarDay", () => {
  it("compares calendar days ignoring time", () => {
    const morning = new Date(2026, 5, 15, 8, 0);
    const evening = new Date(2026, 5, 15, 20, 0);
    const next = new Date(2026, 5, 16, 0, 0);
    expect(compareCalendarDay(morning, evening)).toBe(0);
    expect(compareCalendarDay(morning, next)).toBeLessThan(0);
    expect(compareCalendarDay(next, morning)).toBeGreaterThan(0);
  });
});

describe("dayInInclusiveRange", () => {
  const start = new Date(2026, 5, 10);
  const end = new Date(2026, 5, 20);

  it("returns true for days inside the range", () => {
    expect(dayInInclusiveRange(new Date(2026, 5, 15), start, end)).toBe(true);
  });

  it("returns true for range endpoints", () => {
    expect(dayInInclusiveRange(start, start, end)).toBe(true);
    expect(dayInInclusiveRange(end, start, end)).toBe(true);
  });

  it("returns false for days outside the range", () => {
    expect(dayInInclusiveRange(new Date(2026, 5, 9), start, end)).toBe(false);
    expect(dayInInclusiveRange(new Date(2026, 5, 21), start, end)).toBe(false);
  });

  it("works when range endpoints are reversed", () => {
    expect(dayInInclusiveRange(new Date(2026, 5, 15), end, start)).toBe(true);
  });
});
