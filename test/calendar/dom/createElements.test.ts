import { describe, expect, it } from "vitest";
import { createCalendarDom } from "@/calendar/dom/createElements";

describe("createCalendarDom", () => {
  it("creates the full calendar DOM tree", () => {
    const dom = createCalendarDom();
    expect(dom.container.className).toBe("cal-anchor");
    expect(dom.container.hidden).toBe(true);
    expect(dom.root.querySelector(".cal__panes")).not.toBeNull();
    expect(dom.grid.getAttribute("role")).toBe("grid");
    expect(dom.timeSingle.hour.root.querySelector("button")?.getAttribute("aria-label")).toBe(
      "Hour",
    );
    expect(dom.timeRangeStart.hour.root.querySelector("button")?.getAttribute("aria-label")).toBe(
      "Start hour",
    );
    expect(dom.timeRangeEnd.hour.root.querySelector("button")?.getAttribute("aria-label")).toBe(
      "End hour",
    );
    expect(dom.btnApplyRange.textContent).toBe("Apply");
    expect(dom.btnCancelRange.textContent).toBe("Cancel");
    const rootChildren = [...dom.root.children];
    expect(rootChildren.map((el) => el.className)).toEqual(["cal__body"]);
    expect(dom.main.contains(dom.rangeActions)).toBe(true);
    expect(dom.rangePresets.getAttribute("aria-label")).toBe("Range presets");
  });
});
