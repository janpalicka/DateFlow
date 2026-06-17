import { afterEach, describe, expect, it } from "vitest";
import { resolveCalendarInputs } from "./resolveInputs";
import { createInput } from "./test/helpers";

describe("resolveCalendarInputs", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it("returns a single-element array for HTMLInputElement anchors", () => {
    const input = createInput();
    expect(resolveCalendarInputs(input)).toEqual([input]);
  });

  it("resolves #id selectors to input elements", () => {
    const input = createInput("picker");
    expect(resolveCalendarInputs("#picker")).toEqual([input]);
  });

  it("resolves .class selectors to all matching inputs", () => {
    const a = createInput();
    const b = createInput();
    a.className = "multi";
    b.className = "multi";
    expect(resolveCalendarInputs(".multi")).toEqual([a, b]);
  });

  it("throws for invalid anchor types", () => {
    expect(() => resolveCalendarInputs(42 as never)).toThrow(
      "dateFlow expects an HTMLInputElement or a CSS selector string",
    );
  });

  it("throws for selectors without # or . prefix", () => {
    expect(() => resolveCalendarInputs("input" as "#x")).toThrow(
      "dateFlow selector must start with # (id) or . (class)",
    );
  });

  it("throws when # selector matches no input", () => {
    expect(() => resolveCalendarInputs("#missing")).toThrow("no input element matches");
  });

  it("throws when . selector matches no inputs", () => {
    expect(() => resolveCalendarInputs(".missing")).toThrow("no input elements match");
  });

  it("throws when # selector matches a non-input element", () => {
    const div = document.createElement("div");
    div.id = "not-input";
    document.body.append(div);
    expect(() => resolveCalendarInputs("#not-input")).toThrow("no input element matches");
  });
});
