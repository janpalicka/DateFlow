import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { dateFlow } from "@/calendar/dateFlow";
import { clickDay, createInput, findDayButton } from "./helpers";

vi.mock("@/calendar/popover", () => ({
  attachCalendarPopover: vi.fn((_input, panel) => ({
    open: () => {
      panel.hidden = false;
    },
    close: () => {
      panel.hidden = true;
    },
    destroy: vi.fn(),
  })),
}));

describe("buildCalendarPicker integration", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 17, 12, 0, 0));
  });

  afterEach(() => {
    document.body.replaceChildren();
    vi.useRealTimers();
  });

  it("selects a single date and emits onChange", () => {
    const input = createInput();
    const onChange = vi.fn();
    const picker = dateFlow(input, {
      inline: true,
      popover: false,
      hideOnSingleSelect: false,
      onChange,
    });
    const root = picker.getCalendarElement();

    clickDay(root, new Date(2026, 5, 20));
    expect(picker.getValue()?.getDate()).toBe(20);
    expect(onChange).toHaveBeenCalled();
    expect(input.value).toBe("2026-06-20");
    picker.destroy();
  });

  it("hides the picker when Reset is clicked", () => {
    const input = createInput();
    const picker = dateFlow(input, {
      inline: false,
      popover: true,
      showResetButton: true,
      value: new Date(2026, 5, 15),
    });
    const root = picker.getCalendarElement();
    root.hidden = true;
    picker.open();
    expect(root.hidden).toBe(false);

    const reset = root.querySelector(".cal__reset") as HTMLButtonElement;
    reset.click();

    expect(picker.getValue()).toBeNull();
    expect(root.hidden).toBe(true);
    picker.destroy();
  });

  it("supports setValue and clear", () => {
    const input = createInput();
    const picker = dateFlow(input, { inline: true, popover: false });
    picker.setValue(new Date(2026, 5, 8));
    expect(picker.getValue()?.getDate()).toBe(8);
    picker.clear();
    expect(picker.getValue()).toBeNull();
    picker.destroy();
  });

  it("supports setDate with string input", () => {
    const input = createInput();
    const onChange = vi.fn();
    const picker = dateFlow(input, { inline: true, popover: false, onChange });
    picker.setDate(["2026-06-11"]);
    expect(picker.getValue()?.getDate()).toBe(11);
    expect(onChange).toHaveBeenCalled();
    picker.destroy();
  });

  it("defers single-date commits until Apply when showTime is enabled", () => {
    const input = createInput();
    const onChange = vi.fn();
    const picker = dateFlow(input, {
      inline: true,
      popover: false,
      showTime: true,
      hideOnSingleSelect: false,
      onChange,
    });
    const root = picker.getCalendarElement();

    clickDay(root, new Date(2026, 5, 20));
    expect(onChange).not.toHaveBeenCalled();
    expect(input.value).toBe("");

    const apply = root.querySelector(".cal__action-btn--primary") as HTMLButtonElement;
    apply.click();

    expect(picker.getValue()?.getDate()).toBe(20);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(input.value).toContain("2026-06-20");
    picker.destroy();
  });

  it("restores the committed range when Cancel is clicked", () => {
    const input = createInput();
    const onRangeChange = vi.fn();
    const picker = dateFlow(input, {
      mode: "range",
      inline: true,
      popover: false,
      hideOnSingleSelect: false,
      range: { start: new Date(2026, 3, 5), end: new Date(2026, 3, 18) },
      onRangeChange,
    });
    const root = picker.getCalendarElement();

    clickDay(root, new Date(2026, 3, 1));
    clickDay(root, new Date(2026, 3, 25));

    const cancel = root.querySelector(".cal__action-btn--ghost") as HTMLButtonElement;
    cancel.click();

    const range = picker.getRange();
    expect(range.start?.getDate()).toBe(5);
    expect(range.end?.getDate()).toBe(18);
    expect(onRangeChange).not.toHaveBeenCalled();
    expect(input.value).toBe("2026-04-05 — 2026-04-18");
    expect(root.hidden).toBe(true);
    picker.destroy();
  });

  it("selects a date range and applies on Apply", () => {
    const input = createInput();
    const onRangeChange = vi.fn();
    const picker = dateFlow(input, {
      mode: "range",
      inline: true,
      popover: false,
      onRangeChange,
    });
    const root = picker.getCalendarElement();

    clickDay(root, new Date(2026, 5, 10));
    clickDay(root, new Date(2026, 5, 14));
    const apply = root.querySelector(".cal__action-btn--primary") as HTMLButtonElement;
    apply.click();

    const range = picker.getRange();
    expect(range.start?.getDate()).toBe(10);
    expect(range.end?.getDate()).toBe(14);
    expect(onRangeChange).toHaveBeenCalled();
    picker.destroy();
  });

  it("applies a range preset without committing until Apply", () => {
    const input = createInput();
    const onRangeChange = vi.fn();
    const picker = dateFlow(input, {
      mode: "range",
      inline: true,
      popover: false,
      onRangeChange,
      rangePresets: {
        presets: [
          {
            caption: "Next 7 Days",
            start: new Date(2026, 5, 17),
            end: new Date(2026, 5, 23),
          },
        ],
      },
    });
    const root = picker.getCalendarElement();
    const preset = root.querySelector(".cal__range-preset") as HTMLButtonElement;
    preset.click();

    expect(onRangeChange).not.toHaveBeenCalled();
    expect(picker.selectedDates).toEqual({
      start: new Date(2026, 5, 17),
      end: new Date(2026, 5, 23),
    });
    expect(root.querySelector(".cal__range-preset--active")?.textContent).toBe("Next 7 Days");

    const apply = root.querySelector(".cal__action-btn--primary") as HTMLButtonElement;
    apply.click();
    expect(picker.getRange().start?.getDate()).toBe(17);
    expect(picker.getRange().end?.getDate()).toBe(23);
    expect(onRangeChange).toHaveBeenCalledTimes(1);
    picker.destroy();
  });

  it("hides range presets on mobile viewports", () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: !query.includes("min-width: 900px"),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });

    const input = createInput();
    const picker = dateFlow(input, {
      mode: "range",
      inline: true,
      popover: false,
      rangePresets: {
        presets: [
          {
            caption: "Today",
            start: new Date(2026, 5, 17),
            end: new Date(2026, 5, 17),
          },
        ],
      },
    });
    const presetsNav = picker
      .getCalendarElement()
      .querySelector(".cal__range-presets") as HTMLElement;
    expect(presetsNav.hidden).toBe(true);
    picker.destroy();
  });

  it("uses a single calendar for compact range selection", () => {
    const matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("max-width"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: matchMedia,
    });

    const input = createInput();
    const picker = dateFlow(input, {
      mode: "range",
      inline: true,
      popover: false,
    });
    const root = picker.getCalendarElement();
    const cal = root.querySelector(".cal") as HTMLElement;

    expect(cal.classList.contains("cal--range-compact")).toBe(true);
    const rightPane = root.querySelector(".cal__pane:nth-child(2)") as HTMLElement;
    expect(rightPane.hidden).toBe(true);
    expect(root.querySelectorAll("button.cal__day")).toHaveLength(30);

    clickDay(root, new Date(2026, 5, 8));
    clickDay(root, new Date(2026, 5, 12));
    const apply = root.querySelector(".cal__action-btn--primary") as HTMLButtonElement;
    apply.click();

    const range = picker.getRange();
    expect(range.start?.getDate()).toBe(8);
    expect(range.end?.getDate()).toBe(12);
    picker.destroy();
  });

  it("supports setRange and getRange", () => {
    const input = createInput();
    const picker = dateFlow(input, { mode: "range", inline: true, popover: false });
    picker.setRange({
      start: new Date(2026, 5, 3),
      end: new Date(2026, 5, 7),
    });
    const range = picker.getRange();
    expect(range.start?.getDate()).toBe(3);
    expect(range.end?.getDate()).toBe(7);
    picker.destroy();
  });

  it("changes month with changeMonth", () => {
    const input = createInput();
    const picker = dateFlow(input, {
      value: new Date(2026, 5, 15),
      inline: true,
      popover: false,
    });
    picker.changeMonth(1);
    expect(picker.currentYear).toEqual({ currentYear: 2026 });
    const root = picker.getCalendarElement();
    expect(root.querySelector('button.cal__day[data-date="2026-07-01"]')).not.toBeNull();
    picker.destroy();
  });

  it("updates options at runtime", () => {
    const input = createInput();
    const picker = dateFlow(input, { inline: true, popover: false });
    picker.setOptions({ theme: "dark", className: "custom" });
    const cal = picker.getCalendarElement().querySelector(".cal") as HTMLElement;
    expect(cal.dataset.calTheme).toBe("dark");
    expect(cal.classList.contains("custom")).toBe(true);
    picker.destroy();
  });

  it("opens and closes the panel", () => {
    const input = createInput();
    document.body.append(input);
    const picker = dateFlow(input, { inline: false, popover: true });
    const panel = picker.getCalendarElement();
    panel.hidden = true;
    picker.open();
    expect(panel.hidden).toBe(false);
    picker.close();
    expect(panel.hidden).toBe(true);
    picker.destroy();
  });

  it("respects minDate when selecting", () => {
    const input = createInput();
    const picker = dateFlow(input, {
      inline: true,
      popover: false,
      minDate: new Date(2026, 5, 15),
    });
    const root = picker.getCalendarElement();
    const early = root.querySelector(
      'button.cal__day[data-date="2026-06-10"]',
    ) as HTMLButtonElement;
    expect(early.disabled).toBe(true);
    clickDay(root, new Date(2026, 5, 20));
    expect(picker.getValue()?.getDate()).toBe(20);
    picker.destroy();
  });

  it("exposes selectedDates and currentYear getters", () => {
    const input = createInput();
    const picker = dateFlow(input, {
      value: new Date(2026, 5, 15),
      inline: true,
      popover: false,
    });
    expect(picker.selectedDates).toEqual({ selectedDate: new Date(2026, 5, 15, 0, 0, 0, 0) });
    expect(picker.currentYear).toEqual({ currentYear: 2026 });
    picker.destroy();
  });

  it("commits typed input when allowInput is enabled", () => {
    const input = createInput();
    document.body.append(input);
    const onChange = vi.fn();
    const picker = dateFlow(input, {
      inline: true,
      popover: false,
      allowInput: true,
      onChange,
    });
    input.value = "2026-06-22";
    input.dispatchEvent(new FocusEvent("blur"));
    expect(picker.getValue()?.getDate()).toBe(22);
    picker.destroy();
  });

  it("removes DOM on destroy", () => {
    const input = createInput();
    const picker = dateFlow(input, { inline: true, popover: false });
    const panel = picker.getCalendarElement();
    expect(panel.isConnected).toBe(true);
    picker.destroy();
    expect(panel.isConnected).toBe(false);
  });

  it("previews a hovered range without rebuilding the grid", () => {
    const input = createInput();
    const picker = dateFlow(input, { inline: true, popover: false, mode: "range" });
    const root = picker.getCalendarElement();

    clickDay(root, new Date(2026, 5, 10)); // start the range
    const day12 = findDayButton(root, new Date(2026, 5, 12));
    day12.dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));

    // The same DOM node is reused (decorated in place, not torn down)…
    expect(findDayButton(root, new Date(2026, 5, 12))).toBe(day12);
    // …and it reflects the hovered preview end.
    expect(day12.classList.contains("cal__day--range-preview-end")).toBe(true);
    picker.destroy();
  });

  it("clear() in range mode fires onRangeChange and syncs getRange()", () => {
    const input = createInput();
    const onRangeChange = vi.fn();
    const picker = dateFlow(input, {
      mode: "range",
      inline: true,
      popover: false,
      onRangeChange,
      range: { start: new Date(2026, 5, 3), end: new Date(2026, 5, 7) },
    });
    onRangeChange.mockClear();
    picker.clear();
    expect(onRangeChange).toHaveBeenCalledOnce();
    expect(onRangeChange.mock.calls[0][0]).toEqual({ start: null, end: null });
    expect(picker.getRange()).toEqual({ start: null, end: null });
    picker.destroy();
  });

  it("destroy() removes mousemove and mouseleave listeners from grid elements", () => {
    const input = createInput();
    const picker = dateFlow(input, { inline: true, popover: false, mode: "range" });
    const root = picker.getCalendarElement();
    const [gridLeft, gridRight] = Array.from(root.querySelectorAll(".cal__grid")) as HTMLElement[];
    const spyLeft = vi.spyOn(gridLeft, "removeEventListener");
    const spyRight = vi.spyOn(gridRight, "removeEventListener");
    picker.destroy();
    const leftTypes = spyLeft.mock.calls.map((c) => c[0]);
    const rightTypes = spyRight.mock.calls.map((c) => c[0]);
    expect(leftTypes).toContain("mousemove");
    expect(leftTypes).toContain("mouseleave");
    expect(rightTypes).toContain("mousemove");
    expect(rightTypes).toContain("mouseleave");
  });

  describe("keyboard navigation", () => {
    const grid = (root: HTMLElement): HTMLElement =>
      root.querySelector(".cal__grid") as HTMLElement;
    const press = (root: HTMLElement, key: string, init: KeyboardEventInit = {}): void => {
      grid(root).dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, ...init }));
    };
    const tabbable = (root: HTMLElement): HTMLButtonElement =>
      grid(root).querySelector('button.cal__day[tabindex="0"]') as HTMLButtonElement;

    it("seeds the roving tabindex on the selected day", () => {
      const input = createInput();
      const picker = dateFlow(input, {
        inline: true,
        popover: false,
        value: new Date(2026, 5, 15),
      });
      expect(tabbable(picker.getCalendarElement()).dataset.date).toBe("2026-06-15");
      picker.destroy();
    });

    it("moves the active day with arrow keys", () => {
      const input = createInput();
      const picker = dateFlow(input, {
        inline: true,
        popover: false,
        value: new Date(2026, 5, 15),
      });
      const root = picker.getCalendarElement();
      press(root, "ArrowRight");
      expect(tabbable(root).dataset.date).toBe("2026-06-16");
      press(root, "ArrowDown");
      expect(tabbable(root).dataset.date).toBe("2026-06-23");
      picker.destroy();
    });

    it("advances the visible month when navigating past month end", () => {
      const input = createInput();
      const picker = dateFlow(input, {
        inline: true,
        popover: false,
        value: new Date(2026, 5, 30),
      });
      const root = picker.getCalendarElement();
      expect(picker.currentYear).toEqual({ currentYear: 2026 });
      press(root, "ArrowRight"); // 30 Jun -> 1 Jul
      const active = tabbable(root);
      expect(active.dataset.date).toBe("2026-07-01");
      // The July grid is now rendered and the active day is reachable in it.
      expect(grid(root).getAttribute("aria-label")).toBe("July 2026");
      picker.destroy();
    });

    it("does not navigate beyond minDate/maxDate", () => {
      const input = createInput();
      const picker = dateFlow(input, {
        inline: true,
        popover: false,
        value: new Date(2026, 5, 1),
        minDate: new Date(2026, 5, 1),
      });
      const root = picker.getCalendarElement();
      press(root, "ArrowLeft"); // would move to 31 May, blocked by minDate
      expect(tabbable(root).dataset.date).toBe("2026-06-01");
      picker.destroy();
    });
  });
});
