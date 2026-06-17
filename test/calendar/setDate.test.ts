import { describe, expect, it } from "vitest";
import { coerceSetDateEntry } from "@/calendar/setDate";

describe("coerceSetDateEntry", () => {
  const ref = new Date(2026, 5, 15);

  it("returns null for nullish and empty values", () => {
    expect(coerceSetDateEntry(null, "yyyy-MM-dd", ref)).toBeNull();
    expect(coerceSetDateEntry(undefined, "yyyy-MM-dd", ref)).toBeNull();
    expect(coerceSetDateEntry("  ", "yyyy-MM-dd", ref)).toBeNull();
  });

  it("clones valid Date instances", () => {
    const d = new Date(2026, 5, 10);
    const result = coerceSetDateEntry(d, "yyyy-MM-dd", ref);
    expect(result).toEqual(d);
    expect(result).not.toBe(d);
  });

  it("returns null for invalid Date instances", () => {
    expect(coerceSetDateEntry(new Date("invalid"), "yyyy-MM-dd", ref)).toBeNull();
  });

  it("parses strings with the given format", () => {
    const result = coerceSetDateEntry("2026-06-10", "yyyy-MM-dd", ref);
    expect(result?.getFullYear()).toBe(2026);
    expect(result?.getMonth()).toBe(5);
    expect(result?.getDate()).toBe(10);
  });

  it("returns null for unparseable strings", () => {
    expect(coerceSetDateEntry("not-a-date", "yyyy-MM-dd", ref)).toBeNull();
  });
});
