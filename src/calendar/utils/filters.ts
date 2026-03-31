import { isSameDay } from "date-fns";
import type { DateFilter } from "../types/types";

const matchesFilter = (filter: DateFilter | undefined, day: Date): boolean => {
  if (!filter) return false;
  if (typeof filter === "function") return filter(day);
  return filter.some((d) => isSameDay(d, day));
};

export { matchesFilter };
