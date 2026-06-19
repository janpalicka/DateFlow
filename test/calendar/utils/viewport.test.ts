import { describe, expect, it } from "vitest";
import { matchesCompactRangeLayout } from "@/calendar/utils/viewport";

describe("matchesCompactRangeLayout", () => {
  it("returns false when matchMedia is unavailable", () => {
    expect(matchesCompactRangeLayout()).toBe(false);
  });
});
