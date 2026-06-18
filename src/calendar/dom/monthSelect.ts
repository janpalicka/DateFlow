import { ICON_SELECT_CHECK, ICON_SELECT_CHEVRON } from "../icons";

export interface MonthSelectControl {
  readonly root: HTMLDivElement;
  get value(): string;
  set value(monthIndex: string);
  setMonths(labels: readonly string[]): void;
  addEventListener(type: "change", listener: () => void): void;
  close(): void;
}

let openMonthSelect: (() => void) | null = null;

export const createMonthSelect = (ariaLabel: string): MonthSelectControl => {
  const root = document.createElement("div");
  root.className = "cal__month-select";

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "cal__month-select__trigger";
  trigger.setAttribute("aria-label", ariaLabel);
  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.setAttribute("aria-expanded", "false");

  const label = document.createElement("span");
  label.className = "cal__month-select__label";

  const chevron = document.createElement("span");
  chevron.className = "cal__month-select__chevron";
  chevron.innerHTML = ICON_SELECT_CHEVRON;

  trigger.append(label, chevron);

  const list = document.createElement("ul");
  list.className = "cal__month-select__list";
  list.setAttribute("role", "listbox");
  list.setAttribute("aria-label", ariaLabel);
  list.hidden = true;

  root.append(trigger, list);

  let monthLabels: string[] = [];
  let selected = 0;
  const changeListeners: Array<() => void> = [];
  let docPointerListener: ((event: PointerEvent) => void) | null = null;

  const removeDocPointerListener = (): void => {
    if (!docPointerListener) return;
    document.removeEventListener("pointerdown", docPointerListener);
    docPointerListener = null;
  };

  const close = (): void => {
    list.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    root.classList.remove("cal__month-select--open");
    removeDocPointerListener();
    if (openMonthSelect === close) openMonthSelect = null;
  };

  const renderList = (): void => {
    list.replaceChildren();
    monthLabels.forEach((name, monthIndex) => {
      const item = document.createElement("li");
      item.className = "cal__month-select__option";
      item.setAttribute("role", "option");
      const isSelected = monthIndex === selected;
      item.setAttribute("aria-selected", isSelected ? "true" : "false");
      if (isSelected) item.classList.add("cal__month-select__option--selected");

      const optionLabel = document.createElement("span");
      optionLabel.className = "cal__month-select__option-label";
      optionLabel.textContent = name;

      item.append(optionLabel);
      if (isSelected) {
        const check = document.createElement("span");
        check.className = "cal__month-select__check";
        check.innerHTML = ICON_SELECT_CHECK;
        item.append(check);
      }
      item.addEventListener("click", (event) => {
        event.stopPropagation();
        if (selected === monthIndex) {
          close();
          return;
        }
        selected = monthIndex;
        label.textContent = name;
        renderList();
        close();
        changeListeners.forEach((listener) => listener());
      });
      list.append(item);
    });
  };

  const open = (): void => {
    openMonthSelect?.();
    openMonthSelect = close;
    list.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    root.classList.add("cal__month-select--open");
    const selectedItem = list.querySelector(".cal__month-select__option--selected");
    selectedItem?.scrollIntoView({ block: "nearest" });
    docPointerListener = (event: PointerEvent): void => {
      if (!root.contains(event.target as Node)) close();
    };
    document.addEventListener("pointerdown", docPointerListener);
  };

  trigger.addEventListener("click", () => {
    if (list.hidden) open();
    else close();
  });

  trigger.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });

  return {
    root,
    get value() {
      return String(selected);
    },
    set value(monthIndex) {
      const next = Number.parseInt(monthIndex, 10);
      if (!Number.isFinite(next) || next < 0 || next > 11) return;
      selected = next;
      label.textContent = monthLabels[selected] ?? monthIndex;
      renderList();
    },
    setMonths(labels) {
      monthLabels = [...labels];
      label.textContent = monthLabels[selected] ?? "";
      renderList();
    },
    addEventListener(type, listener) {
      if (type === "change") changeListeners.push(listener);
    },
    close,
  };
};
