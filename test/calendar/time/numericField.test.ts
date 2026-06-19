import { describe, expect, it } from "vitest";
import {
  clampTimeNumericField,
  parseTimeNumericInput,
  snapMinuteToStep,
} from "@/calendar/time/numericField";

describe("parseTimeNumericInput", () => {
  it("parses one- and two-digit values", () => {
    expect(parseTimeNumericInput("5")).toBe(5);
    expect(parseTimeNumericInput(" 09 ")).toBe(9);
  });

  it("rejects invalid input", () => {
    expect(parseTimeNumericInput("")).toBeNull();
    expect(parseTimeNumericInput("abc")).toBeNull();
    expect(parseTimeNumericInput("123")).toBeNull();
  });
});

describe("clampTimeNumericField", () => {
  it("clamps 24-hour hours", () => {
    expect(clampTimeNumericField("hour", 25, { use12Hour: false, minuteStep: 5 })).toBe(23);
    expect(clampTimeNumericField("hour", -1, { use12Hour: false, minuteStep: 5 })).toBe(0);
  });

  it("clamps 12-hour hours", () => {
    expect(clampTimeNumericField("hour", 0, { use12Hour: true, minuteStep: 5 })).toBe(1);
    expect(clampTimeNumericField("hour", 13, { use12Hour: true, minuteStep: 5 })).toBe(12);
  });

  it("snaps minutes to step", () => {
    expect(clampTimeNumericField("minute", 37, { use12Hour: false, minuteStep: 5 })).toBe(35);
    expect(clampTimeNumericField("minute", 37, { use12Hour: false, minuteStep: 15 })).toBe(30);
  });

  it("clamps seconds", () => {
    expect(clampTimeNumericField("second", 70, { use12Hour: false, minuteStep: 5 })).toBe(59);
  });
});

describe("snapMinuteToStep", () => {
  it("snaps to nearest step within bounds", () => {
    expect(snapMinuteToStep(14, 5)).toBe(15);
    expect(snapMinuteToStep(58, 5)).toBe(55);
  });
});
