import { afterEach, describe, expect, it, vi } from "vitest";
import { attachCalendarPopover } from "@/calendar/popover";

vi.mock("@floating-ui/dom", () => ({
  autoUpdate: vi.fn(() => vi.fn()),
  computePosition: vi.fn(() => Promise.resolve({ x: 10, y: 20 })),
  flip: vi.fn(() => ({})),
  offset: vi.fn(() => ({})),
  shift: vi.fn(() => ({})),
}));

describe("attachCalendarPopover", () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.clearAllMocks();
  });

  it("opens and closes the panel", () => {
    const input = document.createElement("input");
    const panel = document.createElement("div");
    panel.hidden = true;
    document.body.append(input, panel);

    const onClose = vi.fn();
    const popover = attachCalendarPopover(input, panel, { floating: false, onClose });

    expect(input.getAttribute("aria-expanded")).toBe("false");
    popover.open();
    expect(panel.hidden).toBe(false);
    expect(input.getAttribute("aria-expanded")).toBe("true");
    popover.close();
    expect(panel.hidden).toBe(true);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("closes on outside pointer down", () => {
    const input = document.createElement("input");
    const panel = document.createElement("div");
    panel.hidden = true;
    const outside = document.createElement("button");
    document.body.append(input, panel, outside);

    const popover = attachCalendarPopover(input, panel, { floating: false });
    popover.open();
    outside.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    expect(panel.hidden).toBe(true);
    popover.destroy();
  });

  it("closes on Escape key", () => {
    const input = document.createElement("input");
    const panel = document.createElement("div");
    panel.hidden = true;
    document.body.append(input, panel);

    const popover = attachCalendarPopover(input, panel, { floating: false });
    popover.open();
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(panel.hidden).toBe(true);
    popover.destroy();
  });

  it("positions floating panels with floating-ui", async () => {
    const { computePosition } = await import("@floating-ui/dom");
    const input = document.createElement("input");
    const panel = document.createElement("div");
    panel.hidden = true;
    document.body.append(input, panel);

    const popover = attachCalendarPopover(input, panel, { floating: true });
    popover.open();
    await Promise.resolve();
    expect(computePosition).toHaveBeenCalled();
    expect(panel.classList.contains("cal-anchor--floating")).toBe(true);
    popover.destroy();
  });
});
