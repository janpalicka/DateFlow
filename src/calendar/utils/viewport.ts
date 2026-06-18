export const COMPACT_RANGE_MEDIA_QUERY = "(max-width: 899px)";

export const matchesCompactRangeLayout = (): boolean => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia(COMPACT_RANGE_MEDIA_QUERY).matches;
};
