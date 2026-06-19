import type { RangePreset, RangePresetsConfig } from "../types";

export const renderRangePresetsPanel = (
  nav: HTMLElement,
  config: RangePresetsConfig,
  activeIndex: number | null,
  onSelect: (index: number) => void,
): void => {
  nav.replaceChildren();
  config.presets.forEach((preset: RangePreset, index: number) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "cal__range-preset";
    if (index === activeIndex) {
      button.classList.add("cal__range-preset--active");
    }
    button.textContent = preset.caption;
    button.addEventListener("click", () => {
      onSelect(index);
    });
    nav.append(button);
  });
};
