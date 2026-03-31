import { compareAsc, startOfDay } from "date-fns";

const parseCalendarDay = (isoDate: string): Date => {
  const [y, mo, d] = isoDate.split("-").map((s) => Number.parseInt(s, 10));
  return new Date(y, mo - 1, d);
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

export { parseCalendarDay, compareCalendarDay, dayInInclusiveRange };
