import type { CalendarLocale } from "../types/types";

export const de: CalendarLocale = {
  weekdays: {
    shorthand: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
    longhand: ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
  },
  months: {
    shorthand: ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"],
    longhand: [
      "Januar",
      "Februar",
      "März",
      "April",
      "Mai",
      "Juni",
      "Juli",
      "August",
      "September",
      "Oktober",
      "November",
      "Dezember",
    ],
  },
  firstDayOfWeek: 1,
  rangeDurationOne: "1 Tag",
  rangeDurationOther: "{n} Tage",
  inputPlaceholder: "Datum wählen",
  rangeInputPlaceholder: "Datumsbereich wählen",
};
