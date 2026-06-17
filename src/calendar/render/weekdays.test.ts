import { describe, expect, it } from "vitest";
import { renderWeekdaysRow } from "../render/weekdays";

describe("renderWeekdaysRow", () => {
  it("renders seven weekday cells", () => {
    const row = document.createElement("div");
    renderWeekdaysRow(row, {});
    expect(row.querySelectorAll(".cal__weekday")).toHaveLength(7);
    expect(row.textContent).toContain("Sun");
  });

  it("starts week on Monday when locale says so", () => {
    const row = document.createElement("div");
    renderWeekdaysRow(row, { locale: { firstDayOfWeek: 1 } });
    const cells = [...row.querySelectorAll(".cal__weekday")].map((el) => el.textContent);
    expect(cells[0]).toBe("Mon");
    expect(cells[6]).toBe("Sun");
  });

  it("adds week number header when enabled", () => {
    const row = document.createElement("div");
    renderWeekdaysRow(row, { showWeekNumbers: true });
    expect(row.classList.contains("cal__weekdays--with-weeks")).toBe(true);
    expect(row.querySelector(".cal__weekday--weeknum")?.textContent).toBe("Wk");
    expect(row.querySelectorAll(".cal__weekday")).toHaveLength(8);
  });
});
