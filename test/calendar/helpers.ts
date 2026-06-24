import { format, startOfDay } from "date-fns";

export const iso = (d: Date): string => format(startOfDay(d), "yyyy-MM-dd");

export const createInput = (id?: string): HTMLInputElement => {
  const input = document.createElement("input");
  input.type = "text";
  if (id) {
    input.id = id.replace(/^#/, "");
  }
  document.body.append(input);
  return input;
};

export const findDayButton = (root: ParentNode, date: Date): HTMLButtonElement => {
  const ds = iso(date);
  const btn = root.querySelector(`button.cal__day[data-date="${ds}"]`);
  if (!(btn instanceof HTMLButtonElement)) {
    throw new Error(`No day button for ${ds}`);
  }
  return btn;
};

export const clickDay = (root: ParentNode, date: Date): void => {
  findDayButton(root, date).click();
};

export const setRangeTime = (
  root: ParentNode,
  which: "start" | "end",
  hour: number,
  minute: number,
): void => {
  const row = root.querySelector(
    which === "start" ? ".cal__time--range-start" : ".cal__time--range-end",
  );
  if (!row) throw new Error(`Missing ${which} time row`);

  const setField = (labelRe: RegExp, value: number): void => {
    const input = [...row.querySelectorAll("input")].find((el) =>
      labelRe.test(el.getAttribute("aria-label") ?? ""),
    );
    if (!(input instanceof HTMLInputElement)) {
      throw new Error(`Missing time input matching ${labelRe}`);
    }
    input.focus();
    input.value = String(value).padStart(2, "0");
    input.blur();
  };

  setField(/hour/i, hour);
  setField(/minute/i, minute);
};
