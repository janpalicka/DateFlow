import { describe, expect, it, vi } from "vitest";
import { createInputController } from "./createInputController";
import type { CalendarMode } from "../types";

const createDeps = () => {
  let selected: Date | null = new Date(2026, 5, 15);
  let rangeStart: Date | null = null;
  let rangeEnd: Date | null = null;
  let viewYear = 2026;
  let viewMonth = 5;
  let mode: CalendarMode = "single";
  let allowInput = true;

  const deps = {
    getOptions: () => ({ allowInput, mode, rangeOutputSeparator: " — " as const }),
    getMode: () => mode,
    getSelected: () => selected,
    setSelected: (d: Date | null) => {
      selected = d;
    },
    getRangeStart: () => rangeStart,
    setRangeStart: (d: Date | null) => {
      rangeStart = d;
    },
    getRangeEnd: () => rangeEnd,
    setRangeEnd: (d: Date | null) => {
      rangeEnd = d;
    },
    getViewYear: () => viewYear,
    setViewYear: (y: number) => {
      viewYear = y;
    },
    getViewMonth: () => viewMonth,
    setViewMonth: (m: number) => {
      viewMonth = m;
    },
    clearRangeHover: vi.fn(),
    syncCommittedRange: vi.fn(),
    emitSingle: vi.fn(),
    emitRange: vi.fn(),
    render: vi.fn(),
    setMode: (next: CalendarMode) => {
      mode = next;
    },
    setAllowInput: (next: boolean) => {
      allowInput = next;
    },
  };

  return { deps };
};

describe("createInputController", () => {
  it("syncs input value from selected date", () => {
    const input = document.createElement("input");
    const { deps } = createDeps();
    const controller = createInputController(input, deps);
    controller.syncInputFromState();
    expect(input.value).toBe("2026-06-15");
    expect(input.placeholder).toBe("Select date");
  });

  it("sets readOnly when allowInput is false", () => {
    const input = document.createElement("input");
    const { deps } = createDeps();
    deps.setAllowInput(false);
    const controller = createInputController(input, deps);
    controller.applyInputMode();
    expect(input.readOnly).toBe(true);
  });

  it("commits valid typed single date", () => {
    const input = document.createElement("input");
    const { deps } = createDeps();
    const controller = createInputController(input, deps);
    input.value = "2026-06-20";
    expect(controller.commitTypedInput()).toBe(true);
    expect(deps.getSelected()?.getDate()).toBe(20);
    expect(deps.emitSingle).toHaveBeenCalled();
    expect(deps.render).toHaveBeenCalled();
  });

  it("rejects invalid typed input and restores display", () => {
    const input = document.createElement("input");
    const { deps } = createDeps();
    const controller = createInputController(input, deps);
    controller.syncInputFromState();
    input.value = "bad-date";
    expect(controller.commitTypedInput()).toBe(false);
    expect(input.value).toBe("2026-06-15");
  });

  it("clears selection when input is emptied", () => {
    const input = document.createElement("input");
    const { deps } = createDeps();
    const controller = createInputController(input, deps);
    input.value = "";
    expect(controller.commitTypedInput()).toBe(true);
    expect(deps.getSelected()).toBeNull();
    expect(deps.emitSingle).toHaveBeenCalled();
  });

  it("commits typed range input", () => {
    const input = document.createElement("input");
    const { deps } = createDeps();
    deps.setMode("range");
    const controller = createInputController(input, deps);
    input.value = "2026-06-10 — 2026-06-12";
    expect(controller.commitTypedInput()).toBe(true);
    expect(deps.getRangeStart()?.getDate()).toBe(10);
    expect(deps.getRangeEnd()?.getDate()).toBe(12);
    expect(deps.emitRange).toHaveBeenCalled();
  });

  it("commits on blur", () => {
    const input = document.createElement("input");
    const { deps } = createDeps();
    const controller = createInputController(input, deps);
    input.value = "2026-06-18";
    controller.onInputBlur();
    expect(deps.getSelected()?.getDate()).toBe(18);
  });
});
