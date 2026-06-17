import { describe, expect, it } from "vitest";
import { ICON_NEXT_MONTH, ICON_PREV_MONTH, ICON_RESET } from "./icons";

describe("icons", () => {
  it("exports SVG markup for navigation and reset", () => {
    expect(ICON_PREV_MONTH).toContain("<svg");
    expect(ICON_NEXT_MONTH).toContain("<svg");
    expect(ICON_RESET).toContain("<svg");
    expect(ICON_PREV_MONTH).toContain("polyline");
    expect(ICON_RESET).toContain("path");
  });
});
