import { findMatchingPresetIndex, shouldShowRangePresetsPanel } from "../range/rangePresets";
import { renderRangePresetsPanel } from "../render/rangePresetsPanel";
import { mergeLocale, shouldShowTimeOn } from "../utils";
import type { CalendarDomElements } from "../dom/types";
import type { CalendarState } from "./ctx";

export type LayoutHelpersDeps = {
  s: CalendarState;
  dom: CalendarDomElements;
  mode: () => string;
  isCompactRangeLayout: () => boolean;
  applyRangePreset: (index: number) => void;
};

export type LayoutHelpers = {
  layoutCompactRangePanes: () => void;
  layoutRangeHeaders: () => void;
  syncRangeActionLabels: () => void;
  updateResetVisibility: () => void;
  syncRangePresetsPanel: () => void;
};

export function createLayoutHelpers({
  s,
  dom,
  mode,
  isCompactRangeLayout,
  applyRangePreset,
}: LayoutHelpersDeps): LayoutHelpers {
  function layoutCompactRangePanes(): void {
    const compact = isCompactRangeLayout();
    if (compact) {
      if (!dom.paneLeft.contains(dom.timeWrapRangeEnd)) {
        dom.paneLeft.append(dom.timeWrapRangeEnd);
      }
      return;
    }
    if (mode() === "range" && !dom.paneRight.contains(dom.timeWrapRangeEnd)) {
      dom.paneRight.append(dom.timeWrapRangeEnd);
    }
  }

  function layoutRangeHeaders(): void {
    const isRange = mode() === "range";
    const compact = isCompactRangeLayout();
    if (isRange && !compact) {
      if (dom.btnNext.parentElement !== dom.headerRight) {
        dom.headerRight.append(dom.btnNext);
      }
      dom.header.classList.add("cal__header--range-start");
      dom.headerRight.classList.add("cal__header--range-end");
      return;
    }
    if (dom.btnNext.parentElement !== dom.header) {
      dom.header.insertBefore(dom.btnNext, dom.btnReset);
    }
    dom.header.classList.remove("cal__header--range-start");
    dom.headerRight.classList.remove("cal__header--range-end");
  }

  function syncRangeActionLabels(): void {
    const locale = mergeLocale(s.options.locale);
    dom.btnCancelRange.textContent = locale.rangeCancel ?? "Cancel";
    dom.btnApplyRange.textContent = locale.rangeApply ?? "Apply";
  }

  function updateResetVisibility(): void {
    const visible = s.options.showResetButton ?? false;
    dom.btnReset.hidden = !visible;
    if (visible) {
      const label = s.options.resetInputLabel ?? "Reset";
      dom.btnReset.setAttribute("aria-label", label);
      dom.btnReset.title = label;
    }
  }

  function syncRangePresetsPanel(): void {
    const config = s.options.rangePresets;
    const visible = shouldShowRangePresetsPanel(mode() === "range", config?.presets);
    dom.rangePresets.hidden = !visible;
    dom.root.classList.toggle("cal--range-presets", visible);
    dom.root.classList.toggle("cal--range-presets-right", visible && config?.position === "right");
    if (!visible || !config) {
      dom.rangePresets.replaceChildren();
      return;
    }
    const activeIndex = findMatchingPresetIndex(
      config.presets,
      s.rangeStart,
      s.rangeEnd,
      shouldShowTimeOn(s.options),
    );
    renderRangePresetsPanel(dom.rangePresets, config, activeIndex, applyRangePreset);
  }

  return {
    layoutCompactRangePanes,
    layoutRangeHeaders,
    syncRangeActionLabels,
    updateResetVisibility,
    syncRangePresetsPanel,
  };
}
