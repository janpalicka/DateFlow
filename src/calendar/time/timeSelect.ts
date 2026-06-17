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

export const fillSecond = (selectS: HTMLSelectElement): void => {
  selectS.replaceChildren();
  for (let s = 0; s < 60; s += 1) {
    const o = document.createElement("option");
    o.value = String(s);
    o.textContent = s < 10 ? `0${String(s)}` : String(s);
    selectS.append(o);
  }
};

export const fillHourMinute = (
  selectH: HTMLSelectElement,
  selectM: HTMLSelectElement,
  selectMeridiem: HTMLSelectElement,
  use12HourTime: boolean,
  minuteStep: number,
): void => {
  selectH.replaceChildren();
  selectM.replaceChildren();
  selectMeridiem.replaceChildren();
  const hourFrom = use12HourTime ? 1 : 0;
  const hourTo = use12HourTime ? 12 : 23;
  for (let h = hourFrom; h <= hourTo; h += 1) {
    const o = document.createElement("option");
    o.value = String(h);
    o.textContent = h < 10 ? `0${String(h)}` : String(h);
    selectH.append(o);
  }
  for (let m = 0; m < 60; m += minuteStep) {
    const o = document.createElement("option");
    o.value = String(m);
    o.textContent = m < 10 ? `0${String(m)}` : String(m);
    selectM.append(o);
  }
  for (const value of ["AM", "PM"]) {
    const o = document.createElement("option");
    o.value = value;
    o.textContent = value;
    selectMeridiem.append(o);
  }
};

export const setHM = (
  selectH: HTMLSelectElement,
  selectM: HTMLSelectElement,
  selectMeridiem: HTMLSelectElement,
  selectS: HTMLSelectElement | null,
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
  selectH: HTMLSelectElement,
  selectM: HTMLSelectElement,
  selectMeridiem: HTMLSelectElement,
  selectS: HTMLSelectElement | null,
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
  hour: HTMLSelectElement;
  sep: HTMLSpanElement;
  minute: HTMLSelectElement;
  sepSecond: HTMLSpanElement;
  second: HTMLSelectElement;
  meridiem: HTMLSelectElement;
}

export const createTimeRow = (
  rowClass: string,
  labels: { hour: string; minute: string; second: string; meridiem: string },
): TimeRowElements => {
  const row = document.createElement("div");
  row.className = rowClass;

  const label = document.createElement("span");
  label.className = "cal__time-label";

  const hour = document.createElement("select");
  hour.className = "cal__select cal__select--hour";
  hour.setAttribute("aria-label", labels.hour);

  const sep = document.createElement("span");
  sep.className = "cal__time-sep";
  sep.textContent = ":";

  const minute = document.createElement("select");
  minute.className = "cal__select cal__select--minute";
  minute.setAttribute("aria-label", labels.minute);

  const sepSecond = document.createElement("span");
  sepSecond.className = "cal__time-sep cal__time-sep--second";
  sepSecond.textContent = ":";

  const second = document.createElement("select");
  second.className = "cal__select cal__select--second";
  second.setAttribute("aria-label", labels.second);

  const meridiem = document.createElement("select");
  meridiem.className = "cal__select cal__select--meridiem";
  meridiem.setAttribute("aria-label", labels.meridiem);

  row.append(label, hour, sep, minute, sepSecond, second, meridiem);

  return { row, label, hour, sep, minute, sepSecond, second, meridiem };
};
