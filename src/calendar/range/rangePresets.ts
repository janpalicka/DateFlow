import { compareAsc, isSameDay, startOfDay } from "date-fns";
import type { RangePreset } from "../types";

export const normalizePresetRange = (
  preset: RangePreset,
  showTime: boolean,
): { start: Date; end: Date } => {
  let start = new Date(preset.start.getTime());
  let end = new Date(preset.end.getTime());
  if (!showTime) {
    start = startOfDay(start);
    end = startOfDay(end);
  }
  if (compareAsc(start, end) > 0) {
    return { start: end, end: start };
  }
  return { start, end };
};

export const presetMatchesRange = (
  preset: RangePreset,
  start: Date | null,
  end: Date | null,
  showTime: boolean,
): boolean => {
  if (!start || !end) return false;
  const normalized = normalizePresetRange(preset, showTime);
  if (showTime) {
    return (
      start.getTime() === normalized.start.getTime() && end.getTime() === normalized.end.getTime()
    );
  }
  return isSameDay(start, normalized.start) && isSameDay(end, normalized.end);
};

export const findMatchingPresetIndex = (
  presets: readonly RangePreset[],
  start: Date | null,
  end: Date | null,
  showTime: boolean,
): number | null => {
  for (let index = 0; index < presets.length; index += 1) {
    if (presetMatchesRange(presets[index], start, end, showTime)) return index;
  }
  return null;
};

export const DESKTOP_RANGE_PRESETS_MEDIA_QUERY = "(min-width: 900px)";

export const shouldShowRangePresetsPanel = (
  isRangeMode: boolean,
  presets: readonly RangePreset[] | undefined,
): boolean => {
  if (!isRangeMode || !presets?.length) return false;
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return true;
  }
  return window.matchMedia(DESKTOP_RANGE_PRESETS_MEDIA_QUERY).matches;
};
