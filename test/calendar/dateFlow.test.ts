import { afterEach, describe, expect, it } from "vitest";
import { createInput } from "./helpers";
import { dateFlow } from "@/calendar/dateFlow";

describe("dateFlow", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it("creates a picker from an input element", () => {
    const input = createInput();
    const picker = dateFlow(input, { inline: true, popover: false });
    expect(picker.getInputElement()).toBe(input);
    expect(picker.getCalendarElement().querySelector(".cal")).not.toBeNull();
    picker.destroy();
  });

  it("creates a picker from an id selector", () => {
    const input = createInput("by-id");
    const picker = dateFlow("#by-id", { inline: true, popover: false });
    expect(picker.getInputElement()).toBe(input);
    picker.destroy();
  });

  it("creates multiple pickers from a class selector", () => {
    const a = createInput();
    const b = createInput();
    a.className = "batch";
    b.className = "batch";
    const pickers = dateFlow(".batch", { inline: true, popover: false });
    expect(pickers).toHaveLength(2);
    pickers.forEach((picker) => picker.destroy());
  });
});
