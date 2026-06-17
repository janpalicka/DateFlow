import { format, isValid, parse, startOfDay } from "date-fns";
import {
  dateOnlyIfNeeded,
  effectiveOutputFormat,
  isSelectable,
  mergeLocale,
  shouldShowTimeOn,
} from "../utils";
import type { CalendarMode, CalendarOptions } from "../types";

export interface InputControllerDeps {
  getOptions: () => CalendarOptions;
  getMode: () => CalendarMode;
  getSelected: () => Date | null;
  getInputSingleValue: () => Date | null;
  setSelected: (d: Date | null) => void;
  getRangeStart: () => Date | null;
  setRangeStart: (d: Date | null) => void;
  getRangeEnd: () => Date | null;
  setRangeEnd: (d: Date | null) => void;
  getViewYear: () => number;
  setViewYear: (y: number) => void;
  getViewMonth: () => number;
  setViewMonth: (m: number) => void;
  clearRangeHover: () => void;
  syncCommittedRange: () => void;
  emitSingle: () => void;
  emitRange: () => void;
  render: () => void;
}

export interface InputController {
  syncInputFromState: () => void;
  applyInputMode: () => void;
  commitTypedInput: () => boolean;
  onInputBlur: () => void;
}

export const createInputController = (
  valueInput: HTMLInputElement,
  deps: InputControllerDeps,
): InputController => {
  let syncingInput = false;

  const allowInputOn = (): boolean => deps.getOptions().allowInput ?? false;

  const formatSingleForInput = (d: Date | null): string => {
    if (!d) return "";
    return format(dateOnlyIfNeeded(deps.getOptions(), d), effectiveOutputFormat(deps.getOptions()));
  };

  const formatRangeForInput = (): string => {
    const options = deps.getOptions();
    const sep = options.rangeOutputSeparator ?? " — ";
    const fmt = effectiveOutputFormat(options);
    const rangeStart = deps.getRangeStart();
    const rangeEnd = deps.getRangeEnd();
    if (!rangeStart) return "";
    const start = format(dateOnlyIfNeeded(options, rangeStart), fmt);
    if (!rangeEnd) return `${start} …`;
    const end = format(dateOnlyIfNeeded(options, rangeEnd), fmt);
    return `${start}${sep}${end}`;
  };

  const inputPlaceholderFor = (): string => {
    const options = deps.getOptions();
    const locale = mergeLocale(options.locale);
    if (deps.getMode() === "range") {
      return locale.rangeInputPlaceholder ?? locale.inputPlaceholder ?? "Select date range";
    }
    return locale.inputPlaceholder ?? "Select date";
  };

  const syncInputPlaceholder = (): void => {
    valueInput.placeholder = inputPlaceholderFor();
  };

  const syncInputFromState = (): void => {
    syncingInput = true;
    valueInput.value =
      deps.getMode() === "range"
        ? formatRangeForInput()
        : formatSingleForInput(deps.getInputSingleValue());
    syncInputPlaceholder();
    syncingInput = false;
  };

  const applyInputMode = (): void => {
    valueInput.readOnly = !allowInputOn();
  };

  const tryParseDate = (text: string, ref: Date): Date | null => {
    const trimmed = text.trim();
    if (!trimmed) return null;
    try {
      const d = parse(trimmed, effectiveOutputFormat(deps.getOptions()), ref);
      return isValid(d) ? d : null;
    } catch {
      return null;
    }
  };

  const applyParsedSingle = (d: Date): boolean => {
    const options = deps.getOptions();
    const normalized = dateOnlyIfNeeded(options, d);
    if (
      !isSelectable(
        normalized,
        options.minDate ?? null,
        options.maxDate ?? null,
        options.enabledDatesOnly ? undefined : options.disabledDates,
        options.enabledDatesOnly,
      )
    ) {
      return false;
    }
    deps.setSelected(shouldShowTimeOn(options) ? d : startOfDay(d));
    deps.setViewYear(deps.getSelected()!.getFullYear());
    deps.setViewMonth(deps.getSelected()!.getMonth());
    return true;
  };

  const commitTypedInput = (): boolean => {
    if (syncingInput || !allowInputOn()) return false;
    const options = deps.getOptions();
    const text = valueInput.value;
    const ref = deps.getSelected() ?? deps.getRangeStart() ?? new Date();

    if (deps.getMode() === "range") {
      const sep = options.rangeOutputSeparator ?? " — ";
      const trimmed = text.trim();
      if (!trimmed) {
        deps.clearRangeHover();
        deps.setRangeStart(null);
        deps.setRangeEnd(null);
        deps.syncCommittedRange();
        deps.emitRange();
        deps.render();
        return true;
      }
      const parts = trimmed.split(sep);
      const start = tryParseDate(parts[0] ?? "", ref);
      if (!start) {
        syncInputFromState();
        return false;
      }
      let end: Date | null = null;
      const endPart = (parts[1] ?? "").trim();
      if (endPart && endPart !== "…") {
        end = tryParseDate(endPart, ref);
        if (!end) {
          syncInputFromState();
          return false;
        }
      }
      const startNorm = dateOnlyIfNeeded(options, start);
      const endNorm = end ? dateOnlyIfNeeded(options, end) : null;
      if (
        !isSelectable(
          startNorm,
          options.minDate ?? null,
          options.maxDate ?? null,
          options.enabledDatesOnly ? undefined : options.disabledDates,
          options.enabledDatesOnly,
        )
      ) {
        syncInputFromState();
        return false;
      }
      if (
        endNorm &&
        !isSelectable(
          endNorm,
          options.minDate ?? null,
          options.maxDate ?? null,
          options.enabledDatesOnly ? undefined : options.disabledDates,
          options.enabledDatesOnly,
        )
      ) {
        syncInputFromState();
        return false;
      }
      deps.clearRangeHover();
      deps.setRangeStart(shouldShowTimeOn(options) ? start : startOfDay(start));
      deps.setRangeEnd(end ? (shouldShowTimeOn(options) ? end : startOfDay(end)) : null);
      if (deps.getRangeStart()) {
        deps.setViewYear(deps.getRangeStart()!.getFullYear());
        deps.setViewMonth(deps.getRangeStart()!.getMonth());
      }
      deps.syncCommittedRange();
      deps.emitRange();
      deps.render();
      return true;
    }

    const trimmed = text.trim();
    if (!trimmed) {
      deps.setSelected(null);
      deps.emitSingle();
      deps.render();
      return true;
    }
    const parsed = tryParseDate(trimmed, ref);
    if (!parsed || !applyParsedSingle(parsed)) {
      syncInputFromState();
      return false;
    }
    deps.emitSingle();
    deps.render();
    return true;
  };

  const onInputBlur = (): void => {
    commitTypedInput();
  };

  return {
    syncInputFromState,
    applyInputMode,
    commitTypedInput,
    onInputBlur,
  };
};
