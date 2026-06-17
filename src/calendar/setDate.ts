import { isValid, parse } from "date-fns";

export const coerceSetDateEntry = (
  entry: Date | string | null | undefined,
  formatStr: string,
  ref: Date,
): Date | null => {
  if (entry == null) return null;
  if (entry instanceof Date) {
    return isValid(entry) ? new Date(entry.getTime()) : null;
  }
  const trimmed = entry.trim();
  if (!trimmed) return null;
  try {
    const d = parse(trimmed, formatStr, ref);
    return isValid(d) ? d : null;
  } catch {
    return null;
  }
};
