import type { TimeRowElements } from "../time";

export interface CalendarDomElements {
  container: HTMLDivElement;
  root: HTMLDivElement;
  paneLeft: HTMLDivElement;
  paneRight: HTMLDivElement;
  header: HTMLDivElement;
  headerRight: HTMLDivElement;
  btnPrev: HTMLButtonElement;
  btnNext: HTMLButtonElement;
  btnReset: HTMLButtonElement;
  monthSelect: HTMLSelectElement;
  monthSelectRight: HTMLSelectElement;
  yearInput: HTMLInputElement;
  yearInputRight: HTMLInputElement;
  weekdaysRow: HTMLDivElement;
  weekdaysRowRight: HTMLDivElement;
  grid: HTMLDivElement;
  gridRight: HTMLDivElement;
  timeWrap: HTMLDivElement;
  timeWrapRangeStart: HTMLDivElement;
  timeWrapRangeEnd: HTMLDivElement;
  rangeActions: HTMLDivElement;
  btnCancelRange: HTMLButtonElement;
  btnApplyRange: HTMLButtonElement;
  timeSingle: TimeRowElements;
  timeRangeStart: TimeRowElements;
  timeRangeEnd: TimeRowElements;
}
