import { autoUpdate, computePosition, flip, offset, shift, size } from "@floating-ui/dom";

const MAX_LIST_HEIGHT_PX = 232;

const CAL_THEME_VARS = [
  "--cal-bg",
  "--cal-surface",
  "--cal-text",
  "--cal-muted",
  "--cal-input-placeholder",
  "--cal-border",
  "--cal-header-select-border",
  "--cal-accent",
  "--cal-accent-contrast",
  "--cal-radius",
  "--cal-shadow",
  "--cal-day-size",
  "--cal-font",
] as const;

export interface FloatingListHandle {
  start(): void;
  stop(): void;
}

const findThemeElement = (reference: HTMLElement): Element | null =>
  reference.closest(".cal-anchor, .cal");

const syncThemeVars = (floating: HTMLElement, reference: HTMLElement): void => {
  const themeEl = findThemeElement(reference);
  if (!themeEl) return;

  const styles = getComputedStyle(themeEl);
  for (const name of CAL_THEME_VARS) {
    const value = styles.getPropertyValue(name);
    if (value) floating.style.setProperty(name, value);
  }
};

const clearThemeVars = (floating: HTMLElement): void => {
  for (const name of CAL_THEME_VARS) {
    floating.style.removeProperty(name);
  }
};

const syncListVariantClasses = (floating: HTMLElement, root: HTMLElement): void => {
  floating.classList.toggle(
    "cal__list-select__list--meridiem",
    root.classList.contains("cal__list-select--meridiem"),
  );
};

export function attachFloatingList(
  reference: HTMLElement,
  floating: HTMLElement,
  root: HTMLElement,
): FloatingListHandle {
  let cleanupAutoUpdate: (() => void) | null = null;

  const updatePosition = (): void => {
    void computePosition(reference, floating, {
      strategy: "fixed",
      placement: "bottom-start",
      middleware: [
        offset(6),
        flip({ padding: 8 }),
        shift({ padding: 8 }),
        size({
          padding: 8,
          apply({ availableHeight, rects, elements }) {
            Object.assign(elements.floating.style, {
              width: `${Math.round(rects.reference.width)}px`,
              maxHeight: `${Math.min(Math.max(availableHeight, 0), MAX_LIST_HEIGHT_PX)}px`,
            });
          },
        }),
      ],
    }).then(({ x, y }) => {
      floating.style.left = `${Math.round(x)}px`;
      floating.style.top = `${Math.round(y)}px`;
    });
  };

  const start = (): void => {
    syncThemeVars(floating, reference);
    syncListVariantClasses(floating, root);
    floating.classList.add("cal__list-select__list--floating");
    document.body.append(floating);
    cleanupAutoUpdate?.();
    cleanupAutoUpdate = autoUpdate(reference, floating, updatePosition);
    updatePosition();
  };

  const stop = (): void => {
    cleanupAutoUpdate?.();
    cleanupAutoUpdate = null;
    floating.classList.remove("cal__list-select__list--floating");
    floating.style.left = "";
    floating.style.top = "";
    floating.style.width = "";
    floating.style.maxHeight = "";
    clearThemeVars(floating);
    root.append(floating);
  };

  return { start, stop };
}
