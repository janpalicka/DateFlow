import { createCustomSelect, type CustomSelectControl } from "../dom/customSelect";

export const normalizeMinuteStep = (step?: number): number => {
  if (step === undefined) return 5;
  if (!Number.isFinite(step) || step < 1) return 5;
  return Math.min(60, Math.max(1, Math.floor(step)));
};

export const snapMinuteToStep = (minute: number, step: number): number => {
  const max = 60 - (60 % step || step);
  const snapped = Math.round(minute / step) * step;
  return Math.min(max, Math.max(0, snapped));
};

const formatTimeOption = (value: number): string =>
  value < 10 ? `0${String(value)}` : String(value);

export const fillSecond = (selectS: CustomSelectControl): void => {
  selectS.setOptions(
    Array.from({ length: 60 }, (_, second) => ({
      value: String(second),
      label: formatTimeOption(second),
    })),
  );
};

export const fillHourMinute = (
  selectH: CustomSelectControl,
  selectM: CustomSelectControl,
  selectMeridiem: CustomSelectControl,
  use12HourTime: boolean,
  minuteStep: number,
): void => {
  const hourFrom = use12HourTime ? 1 : 0;
  const hourTo = use12HourTime ? 12 : 23;
  selectH.setOptions(
    Array.from({ length: hourTo - hourFrom + 1 }, (_, index) => {
      const hour = hourFrom + index;
      return {
        value: String(hour),
        label: formatTimeOption(hour),
      };
    }),
  );
  selectM.setOptions(
    Array.from({ length: Math.ceil(60 / minuteStep) }, (_, index) => {
      const minute = index * minuteStep;
      return {
        value: String(minute),
        label: formatTimeOption(minute),
      };
    }),
  );
  selectMeridiem.setOptions([
    { value: "AM", label: "AM" },
    { value: "PM", label: "PM" },
  ]);
};

export const setHM = (
  selectH: CustomSelectControl,
  selectM: CustomSelectControl,
  selectMeridiem: CustomSelectControl,
  selectS: CustomSelectControl | null,
  d: Date,
  use12HourTime: boolean,
  minuteStep: number,
): void => {
  const h = d.getHours();
  if (use12HourTime) {
    const isPm = h >= 12;
    const h12 = h % 12 === 0 ? 12 : h % 12;
    selectH.value = String(h12);
    selectMeridiem.value = isPm ? "PM" : "AM";
  } else {
    selectH.value = String(h);
    selectMeridiem.value = h >= 12 ? "PM" : "AM";
  }
  selectM.value = String(snapMinuteToStep(d.getMinutes(), minuteStep));
  if (selectS) selectS.value = String(d.getSeconds());
};

export const applyHM = (
  base: Date,
  selectH: CustomSelectControl,
  selectM: CustomSelectControl,
  selectMeridiem: CustomSelectControl,
  selectS: CustomSelectControl | null,
  use12HourTime: boolean,
): Date => {
  const rawHour = Number.parseInt(selectH.value, 10);
  const min = Number.parseInt(selectM.value, 10);
  const sec = selectS ? Number.parseInt(selectS.value, 10) : 0;
  const h = use12HourTime ? (rawHour % 12) + (selectMeridiem.value === "PM" ? 12 : 0) : rawHour;
  return new Date(base.getFullYear(), base.getMonth(), base.getDate(), h, min, sec, 0);
};

export interface TimeRowElements {
  row: HTMLDivElement;
  label: HTMLSpanElement;
  hour: CustomSelectControl;
  sep: HTMLSpanElement;
  minute: CustomSelectControl;
  sepSecond: HTMLSpanElement;
  second: CustomSelectControl;
  meridiem: CustomSelectControl;
}

export const createTimeRow = (
  rowClass: string,
  labels: { hour: string; minute: string; second: string; meridiem: string },
): TimeRowElements => {
  const row = document.createElement("div");
  row.className = rowClass;

  const label = document.createElement("span");
  label.className = "cal__time-label";

  const hour = createCustomSelect(labels.hour, "time");
  const sep = document.createElement("span");
  sep.className = "cal__time-sep";
  sep.textContent = ":";

  const minute = createCustomSelect(labels.minute, "time");
  const sepSecond = document.createElement("span");
  sepSecond.className = "cal__time-sep cal__time-sep--second";
  sepSecond.textContent = ":";

  const second = createCustomSelect(labels.second, "time");
  const meridiem = createCustomSelect(labels.meridiem, "time");
  meridiem.root.classList.add("cal__list-select--meridiem");

  row.append(label, hour.root, sep, minute.root, sepSecond, second.root, meridiem.root);

  return { row, label, hour, sep, minute, sepSecond, second, meridiem };
};
