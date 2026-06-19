import { describe, expect, it, vi } from "vitest";
import { createCustomSelect } from "@/calendar/dom/customSelect";

describe("createCustomSelect editable time fields", () => {
  it("commits clamped typed minute values", () => {
    const select = createCustomSelect("Minute", "time", { numericField: "minute" });
    select.setOptions([
      { value: "0", label: "00" },
      { value: "5", label: "05" },
      { value: "10", label: "10" },
    ]);
    select.setClampContext?.({ use12Hour: false, minuteStep: 5 });
    select.value = "5";

    const onChange = vi.fn();
    select.addEventListener("change", onChange);

    const input = select.root.querySelector<HTMLInputElement>(".cal__list-select__input");
    expect(input).not.toBeNull();

    input?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    expect(input?.readOnly).toBe(false);
    expect(select.root.classList.contains("cal__list-select--editing")).toBe(true);

    if (!input) return;
    input.value = "12";
    input.dispatchEvent(new FocusEvent("blur"));

    expect(select.value).toBe("10");
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(input.readOnly).toBe(true);
    expect(select.root.classList.contains("cal__list-select--editing")).toBe(false);
  });

  it("opens the dropdown from the chevron while editable", () => {
    const select = createCustomSelect("Hour", "time", { numericField: "hour" });
    select.setOptions([
      { value: "0", label: "00" },
      { value: "1", label: "01" },
    ]);
    select.setClampContext?.({ use12Hour: false, minuteStep: 5 });

    const chevron = select.root.querySelector<HTMLButtonElement>(".cal__list-select__chevron-btn");
    chevron?.click();

    const list = select.root.querySelector<HTMLUListElement>(".cal__list-select__list");
    expect(list?.hidden).toBe(false);
  });

  it("disables direct input when setEditable(false)", () => {
    const select = createCustomSelect("Second", "time", { numericField: "second" });
    select.setOptions([{ value: "0", label: "00" }]);
    select.setEditable?.(false);

    const input = select.root.querySelector<HTMLInputElement>(".cal__list-select__input");
    input?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));

    const list = select.root.querySelector<HTMLUListElement>(".cal__list-select__list");
    expect(list?.hidden).toBe(false);
    expect(input?.readOnly).toBe(true);
  });
});
