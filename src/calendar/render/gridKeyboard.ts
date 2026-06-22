import { addDays, addMonths, addYears, startOfDay } from "date-fns";

/** Keys handled by the day-grid roving-tabindex navigation. */
const GRID_NAV_KEYS = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
  "PageUp",
  "PageDown",
]);

const isGridNavKey = (key: string): boolean => GRID_NAV_KEYS.has(key);

/**
 * Given the currently focused day and a navigation key, return the day focus
 * should move to. Returns `null` when the key is not a navigation key.
 *
 * - Arrow keys move by day (±1) or week (±7).
 * - Home/End jump to the start/end of the current week (honouring the locale's
 *   first day of week).
 * - PageUp/PageDown move by month, or by year when Shift is held.
 */
const nextActiveDate = (
  key: string,
  shiftKey: boolean,
  active: Date,
  firstDayOfWeek: number,
): Date | null => {
  const base = startOfDay(active);
  const weekStartOffset = (base.getDay() - (firstDayOfWeek % 7) + 7) % 7;
  switch (key) {
    case "ArrowLeft":
      return addDays(base, -1);
    case "ArrowRight":
      return addDays(base, 1);
    case "ArrowUp":
      return addDays(base, -7);
    case "ArrowDown":
      return addDays(base, 7);
    case "Home":
      return addDays(base, -weekStartOffset);
    case "End":
      return addDays(base, 6 - weekStartOffset);
    case "PageUp":
      return shiftKey ? addYears(base, -1) : addMonths(base, -1);
    case "PageDown":
      return shiftKey ? addYears(base, 1) : addMonths(base, 1);
    default:
      return null;
  }
};

export { GRID_NAV_KEYS, isGridNavKey, nextActiveDate };
