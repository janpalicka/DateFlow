import { describe, expect, it } from "vitest";
import { isGridNavKey, nextActiveDate } from "@/calendar/render/gridKeyboard";

const at = (y: number, m: number, d: number): Date => new Date(y, m, d);

describe("isGridNavKey", () => {
  it("recognises navigation keys", () => {
    for (const key of [
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Home",
      "End",
      "PageUp",
      "PageDown",
    ]) {
      expect(isGridNavKey(key)).toBe(true);
    }
  });

  it("ignores non-navigation keys", () => {
    for (const key of ["Enter", " ", "a", "Tab", "Escape"]) {
      expect(isGridNavKey(key)).toBe(false);
    }
  });
});

describe("nextActiveDate", () => {
  const active = at(2026, 5, 17); // Wed 17 Jun 2026

  it("moves by a day with arrow left/right", () => {
    expect(nextActiveDate("ArrowLeft", false, active, 1)).toEqual(at(2026, 5, 16));
    expect(nextActiveDate("ArrowRight", false, active, 1)).toEqual(at(2026, 5, 18));
  });

  it("moves by a week with arrow up/down", () => {
    expect(nextActiveDate("ArrowUp", false, active, 1)).toEqual(at(2026, 5, 10));
    expect(nextActiveDate("ArrowDown", false, active, 1)).toEqual(at(2026, 5, 24));
  });

  it("crosses month boundaries when stepping by day", () => {
    expect(nextActiveDate("ArrowRight", false, at(2026, 5, 30), 1)).toEqual(at(2026, 6, 1));
    expect(nextActiveDate("ArrowLeft", false, at(2026, 5, 1), 1)).toEqual(at(2026, 4, 31));
  });

  it("jumps to start/end of week honouring firstDayOfWeek", () => {
    // Monday-first: week of Wed 17 Jun runs Mon 15 → Sun 21.
    expect(nextActiveDate("Home", false, active, 1)).toEqual(at(2026, 5, 15));
    expect(nextActiveDate("End", false, active, 1)).toEqual(at(2026, 5, 21));
    // Sunday-first: week runs Sun 14 → Sat 20.
    expect(nextActiveDate("Home", false, active, 0)).toEqual(at(2026, 5, 14));
    expect(nextActiveDate("End", false, active, 0)).toEqual(at(2026, 5, 20));
  });

  it("moves by month with PageUp/PageDown", () => {
    expect(nextActiveDate("PageUp", false, active, 1)).toEqual(at(2026, 4, 17));
    expect(nextActiveDate("PageDown", false, active, 1)).toEqual(at(2026, 6, 17));
  });

  it("moves by year with Shift+PageUp/PageDown", () => {
    expect(nextActiveDate("PageUp", true, active, 1)).toEqual(at(2025, 5, 17));
    expect(nextActiveDate("PageDown", true, active, 1)).toEqual(at(2027, 5, 17));
  });

  it("returns null for unhandled keys", () => {
    expect(nextActiveDate("Enter", false, active, 1)).toBeNull();
  });
});
