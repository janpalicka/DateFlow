import type { CalendarPickerAnchor } from "./types";

export const resolveCalendarInputs = (anchor: CalendarPickerAnchor): HTMLInputElement[] => {
  if (anchor instanceof HTMLInputElement) return [anchor];
  if (typeof anchor !== "string") {
    throw new TypeError("dateFlow expects an HTMLInputElement or a CSS selector string");
  }

  const selector = anchor.trim();
  if (!selector.startsWith("#") && !selector.startsWith(".")) {
    throw new TypeError("dateFlow selector must start with # (id) or . (class)");
  }

  if (selector.startsWith("#")) {
    const el = document.querySelector(selector);
    if (!(el instanceof HTMLInputElement)) {
      throw new TypeError(`dateFlow: no input element matches ${selector}`);
    }
    return [el];
  }

  const inputs = [...document.querySelectorAll(selector)].filter(
    (node): node is HTMLInputElement => node instanceof HTMLInputElement,
  );
  if (inputs.length === 0) {
    throw new TypeError(`dateFlow: no input elements match ${selector}`);
  }
  return inputs;
};
