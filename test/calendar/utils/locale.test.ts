import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_LOCALE } from "@/calendar/locales";
import { mergeLocale, resolveFirstDayOfWeek } from "@/calendar/utils/locale";

describe("resolveFirstDayOfWeek", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses an explicit override", () => {
    expect(resolveFirstDayOfWeek(3)).toBe(3);
    expect(resolveFirstDayOfWeek(0)).toBe(0);
  });

  it("falls back to Monday when Intl week info is unavailable", () => {
    vi.stubGlobal("Intl", { Locale: undefined });
    expect(resolveFirstDayOfWeek(undefined, "de-DE")).toBe(1);
  });

  it("maps Intl week info to calendar weekday indices", () => {
    class MockLocale {
      constructor(private readonly tag: string) {}
      getWeekInfo() {
        return { firstDay: this.tag.startsWith("en") ? 7 : 1 };
      }
    }
    vi.stubGlobal("Intl", { Locale: MockLocale });

    expect(resolveFirstDayOfWeek(undefined, "en-US")).toBe(0);
    expect(resolveFirstDayOfWeek(undefined, "de-DE")).toBe(1);
  });
});

describe("mergeLocale", () => {
  it("returns default strings with resolved first day of week", () => {
    const merged = mergeLocale(undefined);
    expect(merged.weekdays).toEqual(DEFAULT_LOCALE.weekdays);
    expect(merged.months).toEqual(DEFAULT_LOCALE.months);
    expect(merged.firstDayOfWeek).toBe(resolveFirstDayOfWeek());
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
