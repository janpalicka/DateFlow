import { describe, expect, it } from "vite-plus/test";
import { matchesCompactRangeLayout } from "@/calendar/utils/viewport";

describe("matchesCompactRangeLayout", () => {
  it("returns false when matchMedia is unavailable", () => {
    expect(matchesCompactRangeLayout()).toBe(false);
  });
});
