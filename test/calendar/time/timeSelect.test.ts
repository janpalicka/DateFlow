import { describe, expect, it } from "vitest";
import { createCustomSelect } from "@/calendar/dom/customSelect";
import {
  applyHM,
  createTimeRow,
  fillHourMinute,
  fillSecond,
  normalizeMinuteStep,
  setHM,
  snapMinuteToStep,
} from "@/calendar/time/timeSelect";

describe("normalizeMinuteStep", () => {
  it("defaults to 5", () => {
    expect(normalizeMinuteStep()).toBe(5);
  });

  it("clamps invalid values to 5", () => {
    expect(normalizeMinuteStep(0)).toBe(5);
    expect(normalizeMinuteStep(-1)).toBe(5);
    expect(normalizeMinuteStep(Number.NaN)).toBe(5);
  });

  it("floors and caps valid steps", () => {
    expect(normalizeMinuteStep(7.8)).toBe(7);
    expect(normalizeMinuteStep(120)).toBe(60);
  });
});

describe("snapMinuteToStep", () => {
  it("snaps to nearest step within bounds", () => {
    expect(snapMinuteToStep(14, 5)).toBe(15);
    expect(snapMinuteToStep(12, 5)).toBe(10);
    expect(snapMinuteToStep(58, 5)).toBe(55);
  });
});

describe("fillSecond", () => {
  it("creates 60 second options", () => {
    const select = createCustomSelect("Second", "time");
    fillSecond(select);
    expect(select.root.querySelectorAll(".cal__list-select__option")).toHaveLength(60);
    expect(select.value).toBe("0");
    select.value = "59";
    expect(select.value).toBe("59");
  });
});

describe("fillHourMinute", () => {
  it("fills 24-hour options", () => {
    const hour = createCustomSelect("Hour", "time");
    const minute = createCustomSelect("Minute", "time");
    const meridiem = createCustomSelect("AM/PM", "time");
    fillHourMinute(hour, minute, meridiem, false, 15);
    expect(hour.root.querySelectorAll(".cal__list-select__option")).toHaveLength(24);
    expect(minute.root.querySelectorAll(".cal__list-select__option")).toHaveLength(4);
    expect(meridiem.root.querySelectorAll(".cal__list-select__option")).toHaveLength(2);
  });

  it("fills 12-hour options", () => {
    const hour = createCustomSelect("Hour", "time");
    const minute = createCustomSelect("Minute", "time");
    const meridiem = createCustomSelect("AM/PM", "time");
    fillHourMinute(hour, minute, meridiem, true, 5);
    expect(hour.root.querySelectorAll(".cal__list-select__option")).toHaveLength(12);
    hour.value = "1";
    expect(hour.value).toBe("1");
    hour.value = "12";
    expect(hour.value).toBe("12");
  });
});

describe("setHM and applyHM", () => {
  it("round-trips 24-hour time", () => {
    const hour = createCustomSelect("Hour", "time");
    const minute = createCustomSelect("Minute", "time");
    const meridiem = createCustomSelect("AM/PM", "time");
    const second = createCustomSelect("Second", "time");
    fillHourMinute(hour, minute, meridiem, false, 5);
    fillSecond(second);

    const source = new Date(2026, 5, 15, 14, 32, 45);
    setHM(hour, minute, meridiem, second, source, false, 5);
    const result = applyHM(new Date(2026, 5, 15), hour, minute, meridiem, second, false);
    expect(result.getHours()).toBe(14);
    expect(result.getMinutes()).toBe(30);
    expect(result.getSeconds()).toBe(45);
  });

  it("round-trips 12-hour PM time", () => {
    const hour = createCustomSelect("Hour", "time");
    const minute = createCustomSelect("Minute", "time");
    const meridiem = createCustomSelect("AM/PM", "time");
    fillHourMinute(hour, minute, meridiem, true, 5);

    const source = new Date(2026, 5, 15, 15, 10);
    setHM(hour, minute, meridiem, null, source, true, 5);
    const result = applyHM(new Date(2026, 5, 15), hour, minute, meridiem, null, true);
    expect(result.getHours()).toBe(15);
    expect(result.getMinutes()).toBe(10);
  });
});

describe("createTimeRow", () => {
  it("creates labeled time controls", () => {
    const row = createTimeRow("cal__time", {
      hour: "Hour",
      minute: "Minute",
      second: "Second",
      meridiem: "AM/PM",
    });
    expect(row.row.className).toBe("cal__time");
    expect(row.hour.root.querySelector("input")?.getAttribute("aria-label")).toBe("Hour");
    expect(row.row.contains(row.minute.root)).toBe(true);
  });
});
