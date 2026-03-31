import { startOfDay } from "date-fns";
import type { CalendarOptions } from "../types/types";

const effectiveOutputFormat = (options: CalendarOptions): string => {
  if (options.outputFormat) return options.outputFormat;
  if (!options.showTime) return "yyyy-MM-dd";
  return options.use12HourTime ? "yyyy-MM-dd hh:mm a" : "yyyy-MM-dd HH:mm";
};

const shouldShowTimeOn = (options: CalendarOptions): boolean => {
  return options.showTime ?? false;
};

/** When time UI is off, values and formatting use calendar date at local midnight. */
const dateOnlyIfNeeded = (options: CalendarOptions, d: Date): Date => {
  return shouldShowTimeOn(options) ? d : startOfDay(d);
};

export { effectiveOutputFormat, shouldShowTimeOn, dateOnlyIfNeeded };
