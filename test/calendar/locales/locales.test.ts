import { cs, de, en, fr } from "@/calendar/locales";
import { describe, expect, it } from "vitest";

describe("locales", () => {
  it("exports complete locale objects", () => {
    for (const locale of [en, de, fr, cs]) {
      expect(locale.weekdays.shorthand).toHaveLength(7);
      expect(locale.weekdays.longhand).toHaveLength(7);
      expect(locale.months.shorthand).toHaveLength(12);
      expect(locale.months.longhand).toHaveLength(12);
      expect(locale.firstDayOfWeek).toBeGreaterThanOrEqual(0);
      expect(locale.firstDayOfWeek).toBeLessThanOrEqual(6);
    }
  });

  it("uses Monday as first day for de and cs", () => {
    expect(de.firstDayOfWeek).toBe(1);
    expect(cs.firstDayOfWeek).toBe(1);
  });
});
