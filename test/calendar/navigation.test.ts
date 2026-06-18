import { describe, expect, it } from "vitest";
import { canGoNextMonth, canGoPrevMonth } from "@/calendar/navigation";

describe("canGoPrevMonth", () => {
  it("allows navigation when no minDate is set", () => {
    expect(canGoPrevMonth(2026, 5, undefined)).toBe(true);
  });

  it("blocks when previous month is before minDate month", () => {
    expect(canGoPrevMonth(2026, 5, new Date(2026, 5, 1))).toBe(false);
    expect(canGoPrevMonth(2026, 6, new Date(2026, 5, 15))).toBe(true);
  });
});

describe("canGoNextMonth", () => {
  it("allows navigation when no maxDate is set", () => {
    expect(canGoNextMonth(2026, 5, undefined, "single")).toBe(true);
  });

  it("uses two-month shift in range mode", () => {
    expect(canGoNextMonth(2026, 4, new Date(2026, 5, 30), "range")).toBe(false);
    expect(canGoNextMonth(2026, 3, new Date(2026, 5, 30), "range")).toBe(true);
  });

  it("uses one-month shift in compact range mode", () => {
    expect(canGoNextMonth(2026, 4, new Date(2026, 5, 30), "range", true)).toBe(true);
    expect(canGoNextMonth(2026, 5, new Date(2026, 5, 30), "range", true)).toBe(false);
  });

  it("blocks when next visible month exceeds maxDate month", () => {
    expect(canGoNextMonth(2026, 5, new Date(2026, 5, 30), "single")).toBe(false);
    expect(canGoNextMonth(2026, 4, new Date(2026, 5, 30), "single")).toBe(true);
  });
});
