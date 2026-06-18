export type TimeNumericField = "hour" | "minute" | "second";

export interface TimeFieldClampContext {
  use12Hour: boolean;
  minuteStep: number;
}

export const normalizeMinuteStep = (step?: number): number => {
  if (step === undefined) return 5;
  if (!Number.isFinite(step) || step < 1) return 5;
  return Math.min(60, Math.max(1, Math.floor(step)));
};

export const snapMinuteToStep = (minute: number, step: number): number => {
  const max = 60 - (60 % step || step);
  const snapped = Math.round(minute / step) * step;
  return Math.min(max, Math.max(0, snapped));
};

export const parseTimeNumericInput = (text: string): number | null => {
  const trimmed = text.trim();
  if (!/^\d{1,2}$/.test(trimmed)) return null;
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

export const clampTimeNumericField = (
  field: TimeNumericField,
  raw: number,
  context: TimeFieldClampContext,
): number => {
  if (field === "hour") {
    if (context.use12Hour) return Math.min(12, Math.max(1, Math.round(raw)));
    return Math.min(23, Math.max(0, Math.round(raw)));
  }
  if (field === "minute") {
    const step = normalizeMinuteStep(context.minuteStep);
    return snapMinuteToStep(Math.min(59, Math.max(0, Math.round(raw))), step);
  }
  return Math.min(59, Math.max(0, Math.round(raw)));
};

export const formatTimeNumericLabel = (value: number): string =>
  value < 10 ? `0${String(value)}` : String(value);
