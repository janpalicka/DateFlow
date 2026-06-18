import { ICON_SELECT_CHECK, ICON_SELECT_CHEVRON } from "../icons";

export interface CustomSelectOption {
  value: string;
  label: string;
}

export interface CustomSelectControl {
  readonly root: HTMLDivElement;
  get value(): string;
  set value(next: string);
  setOptions(options: readonly CustomSelectOption[]): void;
  addEventListener(type: "change", listener: () => void): void;
  close(): void;
}

export type CustomSelectVariant = "month" | "time";

let openCustomSelect: (() => void) | null = null;

export const createCustomSelect = (
  ariaLabel: string,
  variant: CustomSelectVariant = "time",
): CustomSelectControl => {
  const root = document.createElement("div");
  root.className = `cal__list-select cal__list-select--${variant}`;

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "cal__list-select__trigger";
  trigger.setAttribute("aria-label", ariaLabel);
  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.setAttribute("aria-expanded", "false");

  const label = document.createElement("span");
  label.className = "cal__list-select__label";

  const chevron = document.createElement("span");
  chevron.className = "cal__list-select__chevron";
  chevron.innerHTML = ICON_SELECT_CHEVRON;

  trigger.append(label, chevron);

  const list = document.createElement("ul");
  list.className = "cal__list-select__list";
  list.setAttribute("role", "listbox");
  list.setAttribute("aria-label", ariaLabel);
  list.hidden = true;

  root.append(trigger, list);

  let options: CustomSelectOption[] = [];
  let selectedValue = "";
  const changeListeners: Array<() => void> = [];
  let docPointerListener: ((event: PointerEvent) => void) | null = null;

  const removeDocPointerListener = (): void => {
    if (!docPointerListener) return;
    document.removeEventListener("pointerdown", docPointerListener);
    docPointerListener = null;
  };

  const syncTriggerLabel = (): void => {
    const current = options.find((option) => option.value === selectedValue);
    label.textContent = current?.label ?? "";
  };

  const close = (): void => {
    list.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    root.classList.remove("cal__list-select--open");
    removeDocPointerListener();
    if (openCustomSelect === close) openCustomSelect = null;
  };

  const renderList = (): void => {
    list.replaceChildren();
    options.forEach((option) => {
      const item = document.createElement("li");
      item.className = "cal__list-select__option";
      item.setAttribute("role", "option");
      const isSelected = option.value === selectedValue;
      item.setAttribute("aria-selected", isSelected ? "true" : "false");
      if (isSelected) item.classList.add("cal__list-select__option--selected");

      const optionLabel = document.createElement("span");
      optionLabel.className = "cal__list-select__option-label";
      optionLabel.textContent = option.label;

      item.append(optionLabel);
      if (isSelected) {
        const check = document.createElement("span");
        check.className = "cal__list-select__check";
        check.innerHTML = ICON_SELECT_CHECK;
        item.append(check);
      }
      item.addEventListener("click", (event) => {
        event.stopPropagation();
        if (selectedValue === option.value) {
          close();
          return;
        }
        selectedValue = option.value;
        syncTriggerLabel();
        renderList();
        close();
        changeListeners.forEach((listener) => listener());
      });
      list.append(item);
    });
  };

  const open = (): void => {
    openCustomSelect?.();
    openCustomSelect = close;
    list.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    root.classList.add("cal__list-select--open");
    const selectedItem = list.querySelector(".cal__list-select__option--selected");
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
      return selectedValue;
    },
    set value(next) {
      if (!options.some((option) => option.value === next)) return;
      selectedValue = next;
      syncTriggerLabel();
      renderList();
    },
    setOptions(nextOptions) {
      const previous = selectedValue;
      options = [...nextOptions];
      if (!options.some((option) => option.value === selectedValue)) {
        selectedValue = options[0]?.value ?? "";
      } else {
        selectedValue = previous;
      }
      syncTriggerLabel();
      renderList();
    },
    addEventListener(type, listener) {
      if (type === "change") changeListeners.push(listener);
    },
    close,
  };
};

export const createMonthSelect = (ariaLabel: string): CustomSelectControl =>
  createCustomSelect(ariaLabel, "month");
