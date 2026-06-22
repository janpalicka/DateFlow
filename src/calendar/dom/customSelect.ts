import { ICON_SELECT_CHECK, ICON_SELECT_CHEVRON } from "../icons";
import {
  clampTimeNumericField,
  formatTimeNumericLabel,
  parseTimeNumericInput,
  type TimeFieldClampContext,
  type TimeNumericField,
} from "../time/numericField";
import { attachFloatingList } from "./floatingList";

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
  setEditable?(enabled: boolean): void;
  setClampContext?(context: TimeFieldClampContext): void;
}

export type CustomSelectVariant = "month" | "time";

export interface CustomSelectCreateOptions {
  numericField?: TimeNumericField;
}

let openCustomSelect: (() => void) | null = null;

const findOptionForTypedValue = (
  raw: string,
  options: readonly CustomSelectOption[],
): CustomSelectOption | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const textMatch = options.find(
    (option) =>
      option.label.toLowerCase() === trimmed.toLowerCase() ||
      option.value.toLowerCase() === trimmed.toLowerCase(),
  );
  if (textMatch) return textMatch;

  const parsed = Number.parseInt(trimmed, 10);
  if (Number.isNaN(parsed)) return null;

  const numericOptions = options
    .map((option) => ({ option, numeric: Number.parseInt(option.value, 10) }))
    .filter((entry) => !Number.isNaN(entry.numeric));

  const exact = numericOptions.find((entry) => entry.numeric === parsed);
  if (exact) return exact.option;

  if (numericOptions.length === 0) return null;

  let best = numericOptions[0];
  let bestDistance = Math.abs(best.numeric - parsed);
  for (const entry of numericOptions) {
    const distance = Math.abs(entry.numeric - parsed);
    if (distance < bestDistance) {
      best = entry;
      bestDistance = distance;
    }
  }
  return best.option;
};

const createList = (ariaLabel: string, variant: CustomSelectVariant): HTMLUListElement => {
  const list = document.createElement("ul");
  list.className = `cal__list-select__list cal__list-select__list--${variant}`;
  list.setAttribute("role", "listbox");
  list.setAttribute("aria-label", ariaLabel);
  list.hidden = true;
  return list;
};

const createMonthCustomSelect = (ariaLabel: string): CustomSelectControl => {
  const root = document.createElement("div");
  root.className = "cal__list-select cal__list-select--month";

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

  const list = createList(ariaLabel, "month");
  root.append(trigger, list);

  const floatingList = attachFloatingList(trigger, list, root);

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
    floatingList.stop();
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
    floatingList.start();
    const selectedItem = list.querySelector(".cal__list-select__option--selected");
    selectedItem?.scrollIntoView?.({ block: "nearest" });
    docPointerListener = (event: PointerEvent): void => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (root.contains(target) || list.contains(target)) return;
      close();
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

const createTimeCustomSelect = (
  ariaLabel: string,
  createOptions: CustomSelectCreateOptions = {},
): CustomSelectControl => {
  const { numericField } = createOptions;
  const root = document.createElement("div");
  root.className = "cal__list-select cal__list-select--time";

  const trigger = document.createElement("div");
  trigger.className = "cal__list-select__trigger";
  trigger.setAttribute("role", "group");

  const input = document.createElement("input");
  input.type = "text";
  input.className = "cal__list-select__input";
  input.setAttribute("aria-label", ariaLabel);
  input.inputMode = numericField ? "numeric" : "text";
  input.maxLength = 2;
  input.readOnly = true;
  input.spellcheck = false;
  input.autocomplete = "off";

  const chevronBtn = document.createElement("button");
  chevronBtn.type = "button";
  chevronBtn.className = "cal__list-select__chevron-btn";
  chevronBtn.setAttribute("aria-label", `${ariaLabel} options`);
  chevronBtn.setAttribute("aria-haspopup", "listbox");
  chevronBtn.setAttribute("aria-expanded", "false");
  chevronBtn.innerHTML = ICON_SELECT_CHEVRON;

  trigger.append(input, chevronBtn);

  const list = createList(ariaLabel, "time");
  root.append(trigger, list);

  const floatingList = attachFloatingList(trigger, list, root);

  let options: CustomSelectOption[] = [];
  let selectedValue = "";
  let editable = true;
  let clampContext: TimeFieldClampContext = { use12Hour: false, minuteStep: 5 };
  const changeListeners: Array<() => void> = [];
  let docPointerListener: ((event: PointerEvent) => void) | null = null;

  const removeDocPointerListener = (): void => {
    if (!docPointerListener) return;
    document.removeEventListener("pointerdown", docPointerListener);
    docPointerListener = null;
  };

  const syncInputDisplay = (): void => {
    const current = options.find((option) => option.value === selectedValue);
    input.value = current?.label ?? "";
  };

  const pickOptionValueForClamped = (clamped: number): string => {
    const exact = String(clamped);
    if (options.some((option) => option.value === exact)) return exact;
    let bestValue = selectedValue;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const option of options) {
      const numeric = Number.parseInt(option.value, 10);
      if (!Number.isFinite(numeric)) continue;
      const distance = Math.abs(numeric - clamped);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestValue = option.value;
      }
    }
    return bestValue;
  };

  const close = (): void => {
    floatingList.stop();
    list.hidden = true;
    chevronBtn.setAttribute("aria-expanded", "false");
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
        syncInputDisplay();
        renderList();
        close();
        changeListeners.forEach((listener) => listener());
      });
      list.append(item);
    });
  };

  const commitEdit = (): void => {
    if (input.readOnly) return;
    input.readOnly = true;
    root.classList.remove("cal__list-select--editing");

    const previous = selectedValue;
    if (numericField) {
      const parsed = parseTimeNumericInput(input.value);
      if (parsed !== null) {
        const clamped = clampTimeNumericField(numericField, parsed, clampContext);
        selectedValue = pickOptionValueForClamped(clamped);
      }
    } else {
      const matched = findOptionForTypedValue(input.value, options);
      if (matched) selectedValue = matched.value;
    }

    syncInputDisplay();
    renderList();
    if (selectedValue !== previous) {
      changeListeners.forEach((listener) => listener());
    }
  };

  const enterEditMode = (): void => {
    if (!editable || !input.readOnly) return;
    close();
    input.readOnly = false;
    if (numericField) {
      const parsed = Number.parseInt(selectedValue, 10);
      input.value = Number.isFinite(parsed) ? formatTimeNumericLabel(parsed) : input.value;
    }
    root.classList.add("cal__list-select--editing");
    input.focus();
    input.select();
  };

  const open = (): void => {
    if (!input.readOnly) commitEdit();
    openCustomSelect?.();
    openCustomSelect = close;
    list.hidden = false;
    chevronBtn.setAttribute("aria-expanded", "true");
    root.classList.add("cal__list-select--open");
    floatingList.start();
    const selectedItem = list.querySelector(".cal__list-select__option--selected");
    selectedItem?.scrollIntoView?.({ block: "nearest" });
    docPointerListener = (event: PointerEvent): void => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (root.contains(target) || list.contains(target)) return;
      close();
    };
    document.addEventListener("pointerdown", docPointerListener);
  };

  const openFromInput = (): void => {
    if (list.hidden) open();
    else close();
  };

  input.addEventListener("pointerdown", (event) => {
    if (!editable) {
      event.preventDefault();
      openFromInput();
      return;
    }
    if (!input.readOnly) return;
    event.preventDefault();
    enterEditMode();
  });

  input.addEventListener("focus", () => {
    if (!editable) return;
    if (input.readOnly) enterEditMode();
  });

  input.addEventListener("blur", commitEdit);

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      input.blur();
      return;
    }
    if (event.key === "Escape") {
      syncInputDisplay();
      input.readOnly = true;
      root.classList.remove("cal__list-select--editing");
      input.blur();
    }
  });

  chevronBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    if (!input.readOnly) commitEdit();
    openFromInput();
  });

  chevronBtn.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });

  const control: CustomSelectControl = {
    root,
    get value() {
      return selectedValue;
    },
    set value(next) {
      if (!options.some((option) => option.value === next)) return;
      selectedValue = next;
      syncInputDisplay();
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
      syncInputDisplay();
      renderList();
    },
    addEventListener(type, listener) {
      if (type === "change") changeListeners.push(listener);
    },
    close,
  };

  if (numericField) {
    control.setEditable = (enabled: boolean): void => {
      editable = enabled;
      if (!enabled && !input.readOnly) {
        syncInputDisplay();
        input.readOnly = true;
        root.classList.remove("cal__list-select--editing");
      }
    };
    control.setClampContext = (context: TimeFieldClampContext): void => {
      clampContext = context;
    };
  }

  return control;
};

export const createCustomSelect = (
  ariaLabel: string,
  variant: CustomSelectVariant = "time",
  createOptions: CustomSelectCreateOptions = {},
): CustomSelectControl =>
  variant === "month"
    ? createMonthCustomSelect(ariaLabel)
    : createTimeCustomSelect(ariaLabel, createOptions);

export const createMonthSelect = (ariaLabel: string): CustomSelectControl =>
  createCustomSelect(ariaLabel, "month");
