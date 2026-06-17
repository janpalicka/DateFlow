import {
  dateOnlyIfNeeded,
  effectiveOutputFormat,
  shouldShowTimeOn,
} from "@/calendar/utils/calendarOptions";
import { describe, expect, it } from "vitest";

describe("effectiveOutputFormat", () => {
  it("uses custom outputFormat when provided", () => {
    expect(effectiveOutputFormat({ outputFormat: "dd/MM/yyyy" })).toBe("dd/MM/yyyy");
  });

  it("returns date-only format when showTime is off", () => {
    expect(effectiveOutputFormat({})).toBe("yyyy-MM-dd");
  });

  it("returns time formats based on options", () => {
    expect(effectiveOutputFormat({ showTime: true })).toBe("yyyy-MM-dd HH:mm");
    expect(effectiveOutputFormat({ showTime: true, use12HourTime: true })).toBe(
      "yyyy-MM-dd hh:mm a",
    );
    expect(effectiveOutputFormat({ showTime: true, showSeconds: true })).toBe(
      "yyyy-MM-dd HH:mm:ss",
    );
    expect(effectiveOutputFormat({ showTime: true, showSeconds: true, use12HourTime: true })).toBe(
      "yyyy-MM-dd hh:mm:ss a",
    );
  });
});

describe("shouldShowTimeOn", () => {
  it("defaults to false", () => {
    expect(shouldShowTimeOn({})).toBe(false);
  });

  it("reflects showTime option", () => {
    expect(shouldShowTimeOn({ showTime: true })).toBe(true);
  });
});

describe("dateOnlyIfNeeded", () => {
  const withTime = new Date(2026, 5, 15, 14, 30);

  it("strips time when showTime is off", () => {
    const result = dateOnlyIfNeeded({}, withTime);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
  });

  it("preserves time when showTime is on", () => {
    expect(dateOnlyIfNeeded({ showTime: true }, withTime)).toEqual(withTime);
  });
});
