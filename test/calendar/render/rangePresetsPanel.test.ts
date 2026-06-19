import { describe, expect, it, vi } from "vitest";
import { renderRangePresetsPanel } from "@/calendar/render/rangePresetsPanel";

describe("renderRangePresetsPanel", () => {
  it("renders preset buttons and marks the active preset", () => {
    const nav = document.createElement("nav");
    const onSelect = vi.fn();
    renderRangePresetsPanel(
      nav,
      {
        presets: [
          { caption: "Today", start: new Date(2026, 5, 17), end: new Date(2026, 5, 17) },
          { caption: "Next 7 Days", start: new Date(2026, 5, 17), end: new Date(2026, 5, 23) },
        ],
      },
      1,
      onSelect,
    );

    const buttons = nav.querySelectorAll(".cal__range-preset");
    expect(buttons).toHaveLength(2);
    expect(buttons[1]?.classList.contains("cal__range-preset--active")).toBe(true);

    (buttons[0] as HTMLButtonElement).click();
    expect(onSelect).toHaveBeenCalledWith(0);
  });
});
