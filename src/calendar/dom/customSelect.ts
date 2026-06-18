import { ICON_SELECT_CHECK, ICON_SELECT_CHEVRON } from "../icons";
import {
  clampTimeNumericField,
  formatTimeNumericLabel,
  parseTimeNumericInput,
  type TimeFieldClampContext,
  type TimeNumericField,
} from "../time/numericField";

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

export const createCustomSelect = (
  ariaLabel: string,
  variant: CustomSelectVariant = "time",
  createOptions: CustomSelectCreateOptions = {},
): CustomSelectControl => {
  const { numericField } = createOptions;
  const root = document.createElement("div");
  root.className = `cal__list-select cal__list-select--${variant}`;

  const face = document.createElement("div");
  face.className = "cal__list-select__face";

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

  const input = numericField
    ? document.createElement("input")
    : null;
  if (input) {
    input.type = "text";
    input.inputMode = "numeric";
    input.className = "cal__list-select__input";
    input.setAttribute("aria-label", ariaLabel);
    input.spellcheck = false;
    input.hidden = true;
    input.maxLength = 2;
  }

  face.append(trigger, ...(input ? [input] : []));
  root.append(face);

  const list = document.createElement("ul");
  list.className = "cal__list-select__list";
  list.setAttribute("role", "listbox");
  list.setAttribute("aria-label", ariaLabel);
  list.hidden = true;
  root.append(list);

  let options: CustomSelectOption[] = [];
  let selectedValue = "";
  let editable = Boolean(numericField);
  let clampContext: TimeFieldClampContext = { use12Hour: false, minuteStep: 5 };
  let editing = false;
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

  const isEditing = (): boolean => editing;

  const exitEditMode = (): void => {
    if (!input || !editing) return;
    editing = false;
    input.hidden = true;
    root.classList.remove("cal__list-select--editing");
    root.style.width = "";
    root.style.maxWidth = "";
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

  const commitEdit = (): void => {
    if (!input || !numericField || !editing) return;
    const previous = selectedValue;
    const parsed = parseTimeNumericInput(input.value);
    if (parsed !== null) {
      const clamped = clampTimeNumericField(numericField, parsed, clampContext);
      selectedValue = pickOptionValueForClamped(clamped);
    }
    syncTriggerLabel();
    exitEditMode();
    if (selectedValue !== previous) {
      renderList();
      changeListeners.forEach((listener) => listener());
    }
  };

  const enterEditMode = (): void => {
    if (!input || !numericField || !editable) return;
    close();
    const lockedWidth = root.getBoundingClientRect().width;
    if (lockedWidth > 0) {
      root.style.width = `${lockedWidth}px`;
      root.style.maxWidth = `${lockedWidth}px`;
    }
    editing = true;
    input.value = formatTimeNumericLabel(Number.parseInt(selectedValue, 10));
    input.hidden = false;
    root.classList.add("cal__list-select--editing");
    input.focus();
    input.select();
  };

  const close = (): void => {
    if (editing) commitEdit();
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
    if (editing) commitEdit();
    openCustomSelect?.();
    openCustomSelect = close;
    list.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    root.classList.add("cal__list-select--open");
    const selectedItem = list.querySelector(".cal__list-select__option--selected");
    selectedItem?.scrollIntoView?.({ block: "nearest" });
    docPointerListener = (event: PointerEvent): void => {
      if (!root.contains(event.target as Node)) close();
    };
    document.addEventListener("pointerdown", docPointerListener);
  };

  chevron.addEventListener("click", (event) => {
    event.stopPropagation();
    if (list.hidden) open();
    else close();
  });

  trigger.addEventListener("click", () => {
    if (numericField && editable) {
      enterEditMode();
      return;
    }
    if (list.hidden) open();
    else close();
  });

  trigger.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });

  if (input) {
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        commitEdit();
        input.blur();
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        syncTriggerLabel();
        exitEditMode();
      }
    });
    input.addEventListener("blur", () => {
      commitEdit();
    });
  }

  const control: CustomSelectControl = {
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

  if (numericField) {
    control.setEditable = (enabled: boolean): void => {
      editable = enabled;
      if (!enabled && isEditing()) {
        syncTriggerLabel();
        exitEditMode();
      }
    };
    control.setClampContext = (context: TimeFieldClampContext): void => {
      clampContext = context;
    };
  }

  return control;
};

export const createMonthSelect = (ariaLabel: string): CustomSelectControl =>
  createCustomSelect(ariaLabel, "month");
