import { describe, expect, it } from "vitest";
import {
  clampYear,
  fillMonthYearSelects,
  parseYearInput,
  restoreYearInput,
  syncYearInputs,
} from "../render/monthYear";

describe("parseYearInput", () => {
  it("parses 1-4 digit years", () => {
    expect(parseYearInput("2026")).toBe(2026);
    expect(parseYearInput(" 99 ")).toBe(99);
  });

  it("rejects invalid years", () => {
    expect(parseYearInput("")).toBeNull();
    expect(parseYearInput("abcd")).toBeNull();
    expect(parseYearInput("10000")).toBeNull();
    expect(parseYearInput("0")).toBeNull();
  });
});

describe("clampYear", () => {
  it("clamps to min and max date years", () => {
    const options = {
      minDate: new Date(2020, 0, 1),
      maxDate: new Date(2025, 11, 31),
    };
    expect(clampYear(2010, options)).toBe(2020);
    expect(clampYear(2030, options)).toBe(2025);
    expect(clampYear(2023, options)).toBe(2023);
  });
});

describe("restoreYearInput", () => {
  it("restores left pane year", () => {
    const input = document.createElement("input");
    restoreYearInput(input, 2026, 5, false);
    expect(input.value).toBe("2026");
  });

  it("restores right pane year as next month", () => {
    const input = document.createElement("input");
    restoreYearInput(input, 2026, 11, true);
    expect(input.value).toBe("2027");
  });
});

describe("fillMonthYearSelects", () => {
  it("fills month options and syncs values", () => {
    const left = document.createElement("select");
    const right = document.createElement("select");
    fillMonthYearSelects(left, right, 2026, 5, {});
    expect(left.options).toHaveLength(12);
    expect(right.options).toHaveLength(12);
    expect(left.value).toBe("5");
    expect(right.value).toBe("6");
  });
});

describe("syncYearInputs", () => {
  it("writes years unless inputs are focused", () => {
    const left = document.createElement("input");
    const right = document.createElement("input");
    document.body.append(left, right);
    syncYearInputs(left, right, 2026, 5);
    expect(left.value).toBe("2026");
    expect(right.value).toBe("2026");
    left.focus();
    left.value = "draft";
    syncYearInputs(left, right, 2027, 0);
    expect(left.value).toBe("draft");
    expect(right.value).toBe("2027");
    left.blur();
    document.body.replaceChildren();
  });
});
