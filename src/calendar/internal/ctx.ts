import type { InputController } from "../input/createInputController";
import type { CalendarOptions } from "../types";

export type CalendarState = {
  options: CalendarOptions;
  selected: Date | null;
  rangeStart: Date | null;
  rangeEnd: Date | null;
  committedRangeStart: Date | null;
  committedRangeEnd: Date | null;
  committedSelected: Date | null;
  rangeHoverEnd: Date | null;
  viewYear: number;
  viewMonth: number;
  activeDate: Date;
  syncingYearInput: boolean;
  inputController: InputController;
};

export type CalendarCallbacks = {
  render: () => void;
  renderGridsOnly: () => void;
  emitSingle: () => void;
  emitRange: () => void;
  clearRangeHover: () => void;
  hidePanel: () => void;
};
