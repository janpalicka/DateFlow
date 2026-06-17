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
