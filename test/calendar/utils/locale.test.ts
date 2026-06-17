import { describe, expect, it } from "vitest";
import { DEFAULT_LOCALE } from "@/calendar/locales";
import { mergeLocale } from "@/calendar/utils/locale";

describe("mergeLocale", () => {
  it("returns default locale when partial is undefined", () => {
    expect(mergeLocale(undefined)).toBe(DEFAULT_LOCALE);
  });

  it("merges partial weekday and month overrides", () => {
    const merged = mergeLocale({
      weekdays: {
        shorthand: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
        longhand: DEFAULT_LOCALE.weekdays.longhand,
      },
      months: { shorthand: ["Jan"], longhand: ["Jan"] },
      firstDayOfWeek: 1,
      inputPlaceholder: "Pick a date",
    });
    expect(merged.weekdays.shorthand[0]).toBe("Su");
    expect(merged.months.longhand[0]).toBe("Jan");
    expect(merged.months.longhand[1]).toBeUndefined();
    expect(merged.firstDayOfWeek).toBe(1);
    expect(merged.inputPlaceholder).toBe("Pick a date");
  });
});
