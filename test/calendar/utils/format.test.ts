import { describe, expect, it } from "vitest";
import { en } from "@/calendar/locales/en";
import { formatRangeDurationLabel } from "@/calendar/utils/format";

describe("formatRangeDurationLabel", () => {
  it("uses singular label for one day", () => {
    expect(formatRangeDurationLabel(en, 1)).toBe("1 day");
  });

  it("substitutes count in plural label", () => {
    expect(formatRangeDurationLabel(en, 5)).toBe("5 days");
  });

  it("falls back to defaults when locale strings are missing", () => {
    expect(formatRangeDurationLabel({} as typeof en, 3)).toBe("3 days");
  });
});
