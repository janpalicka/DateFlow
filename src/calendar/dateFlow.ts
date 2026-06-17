import { buildCalendarPicker } from "./buildCalendarPicker";
import { resolveCalendarInputs } from "./resolveInputs";
import type { CalendarOptions, CalendarPickerAnchor, CalendarPickerInstance } from "./types";

export function dateFlow(
  anchor: HTMLInputElement,
  initial?: CalendarOptions,
): CalendarPickerInstance;
export function dateFlow(selector: `#${string}`, initial?: CalendarOptions): CalendarPickerInstance;
export function dateFlow(
  selector: `.${string}`,
  initial?: CalendarOptions,
): CalendarPickerInstance[];
export function dateFlow(
  anchor: CalendarPickerAnchor,
  initial: CalendarOptions = {},
): CalendarPickerInstance | CalendarPickerInstance[] {
  const inputs = resolveCalendarInputs(anchor);
  const pickers = inputs.map((input) => buildCalendarPicker(input, initial));
  if (typeof anchor === "string" && anchor.trim().startsWith(".")) {
    return pickers;
  }
  return pickers[0]!;
}
