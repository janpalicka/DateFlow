import { describe, expect, it } from "vitest";
import { cs, de, en, fr } from "@/calendar/locales";
import { mergeLocale } from "@/calendar/utils/locale";

describe("locales", () => {
  it("exports complete locale objects", () => {
    for (const locale of [en, de, fr, cs]) {
      expect(locale.weekdays.shorthand).toHaveLength(7);
      expect(locale.weekdays.longhand).toHaveLength(7);
      expect(locale.months.shorthand).toHaveLength(12);
      expect(locale.months.longhand).toHaveLength(12);
      expect(locale.localeTag).toBeTruthy();
    }
  });

  it("resolves Monday as first day for de and cs via Intl", () => {
    expect(mergeLocale(de).firstDayOfWeek).toBe(1);
    expect(mergeLocale(cs).firstDayOfWeek).toBe(1);
  });
});
