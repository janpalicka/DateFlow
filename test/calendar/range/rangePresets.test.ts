import { describe, expect, it } from "vitest";
import {
  findMatchingPresetIndex,
  normalizePresetRange,
  presetMatchesRange,
  shouldShowRangePresetsPanel,
} from "@/calendar/range/rangePresets";

describe("normalizePresetRange", () => {
  it("orders reversed dates and strips time when showTime is false", () => {
    const result = normalizePresetRange(
      {
        caption: "Reversed",
        start: new Date(2026, 5, 20, 15, 30),
        end: new Date(2026, 5, 10, 9, 0),
      },
      false,
    );
    expect(result.start.getDate()).toBe(10);
    expect(result.end.getDate()).toBe(20);
    expect(result.start.getHours()).toBe(0);
    expect(result.end.getHours()).toBe(0);
  });
});

describe("presetMatchesRange", () => {
  const preset = {
    caption: "Week",
    start: new Date(2026, 5, 10),
    end: new Date(2026, 5, 16),
  };

  it("matches day-only ranges", () => {
    expect(
      presetMatchesRange(preset, new Date(2026, 5, 10), new Date(2026, 5, 16), false),
    ).toBe(true);
    expect(
      presetMatchesRange(preset, new Date(2026, 5, 11), new Date(2026, 5, 16), false),
    ).toBe(false);
  });

  it("matches exact instants when showTime is enabled", () => {
    const timedPreset = {
      caption: "Timed",
      start: new Date(2026, 5, 10, 9, 30),
      end: new Date(2026, 5, 16, 17, 45),
    };
    expect(
      presetMatchesRange(
        timedPreset,
        new Date(2026, 5, 10, 9, 30),
        new Date(2026, 5, 16, 17, 45),
        true,
      ),
    ).toBe(true);
  });
});

describe("findMatchingPresetIndex", () => {
  it("returns the matching preset index", () => {
    const presets = [
      { caption: "A", start: new Date(2026, 5, 1), end: new Date(2026, 5, 3) },
      { caption: "B", start: new Date(2026, 5, 10), end: new Date(2026, 5, 16) },
    ];
    expect(
      findMatchingPresetIndex(presets, new Date(2026, 5, 10), new Date(2026, 5, 16), false),
    ).toBe(1);
    expect(findMatchingPresetIndex(presets, null, null, false)).toBeNull();
  });
});

describe("shouldShowRangePresetsPanel", () => {
  it("requires range mode and presets", () => {
    expect(shouldShowRangePresetsPanel(false, [{ caption: "A", start: new Date(), end: new Date() }])).toBe(
      false,
    );
    expect(shouldShowRangePresetsPanel(true, [])).toBe(false);
    expect(shouldShowRangePresetsPanel(true, undefined)).toBe(false);
  });
});
