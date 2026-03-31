import { startOfDay } from "date-fns";
import type { CalendarOptions } from "../types/types";

const effectiveOutputFormat = (options: CalendarOptions): string => {
  if (options.outputFormat) return options.outputFormat;
  return options.showTime ? "yyyy-MM-dd HH:mm" : "yyyy-MM-dd";
};

const shouldShowTimeOn = (options: CalendarOptions): boolean => {
  return options.showTime ?? false;
};

/** When time UI is off, values and formatting use calendar date at local midnight. */
const dateOnlyIfNeeded = (options: CalendarOptions, d: Date): Date => {
  return shouldShowTimeOn(options) ? d : startOfDay(d);
};

export { effectiveOutputFormat, shouldShowTimeOn, dateOnlyIfNeeded };
