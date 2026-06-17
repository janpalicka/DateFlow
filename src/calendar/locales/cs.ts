import type { CalendarLocale } from "../types/types";

export const cs: CalendarLocale = {
  weekdays: {
    shorthand: ["ne", "po", "út", "st", "čt", "pá", "so"],
    longhand: ["neděle", "pondělí", "úterý", "středa", "čtvrtek", "pátek", "sobota"],
  },
  months: {
    shorthand: ["led", "úno", "bře", "dub", "kvě", "čvn", "čvc", "srp", "zář", "říj", "lis", "pro"],
    longhand: [
      "leden",
      "únor",
      "březen",
      "duben",
      "květen",
      "červen",
      "červenec",
      "srpen",
      "září",
      "říjen",
      "listopad",
      "prosinec",
    ],
  },
  localeTag: "cs",
  rangeDurationOne: "1 den",
  rangeDurationOther: "{n} dní",
  inputPlaceholder: "Vyberte datum",
  rangeInputPlaceholder: "Vyberte rozsah dat",
  rangeCancel: "Zrušit",
  rangeApply: "Použít",
};
