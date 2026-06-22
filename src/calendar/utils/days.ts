import { compareAsc, startOfDay } from "date-fns";

const parseCalendarDay = (isoDate: string): Date => {
  const [y, mo, d] = isoDate.split("-").map((s) => Number.parseInt(s, 10));
  return new Date(y, mo - 1, d);
};

/** Local-date `yyyy-MM-dd` string without pulling in date-fns' formatter. */
const toISODate = (date: Date): string => {
  const y = String(date.getFullYear()).padStart(4, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const compareCalendarDay = (a: Date, b: Date): number => {
  return compareAsc(startOfDay(a), startOfDay(b));
};

const dayInInclusiveRange = (day: Date, rangeStart: Date, rangeEnd: Date): boolean => {
  const dayMidnight = startOfDay(day).getTime();
  const rangeStartMidnight = startOfDay(rangeStart).getTime();
  const rangeEndMidnight = startOfDay(rangeEnd).getTime();
  const low = Math.min(rangeStartMidnight, rangeEndMidnight);
  const high = Math.max(rangeStartMidnight, rangeEndMidnight);
  return dayMidnight >= low && dayMidnight <= high;
};

export { parseCalendarDay, toISODate, compareCalendarDay, dayInInclusiveRange };
