import { describe, expect, it } from "vitest";
import { matchesFilter } from "./filters";

describe("matchesFilter", () => {
  const day = new Date(2026, 5, 15);

  it("returns false when filter is undefined", () => {
    expect(matchesFilter(undefined, day)).toBe(false);
  });

  it("matches predicate functions", () => {
    expect(matchesFilter((d) => d.getDate() === 15, day)).toBe(true);
    expect(matchesFilter((d) => d.getDate() === 16, day)).toBe(false);
  });

  it("matches date arrays by calendar day", () => {
    expect(matchesFilter([new Date(2026, 5, 15, 23, 59)], day)).toBe(true);
    expect(matchesFilter([new Date(2026, 5, 16)], day)).toBe(false);
  });
});
