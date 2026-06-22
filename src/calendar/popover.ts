import { autoUpdate, computePosition, flip, offset, shift } from "@floating-ui/dom";

export interface CalendarPopover {
  open(): void;
  /**
   * Close the panel. When `restoreFocus` is true and focus is currently inside
   * the panel, focus is returned to the anchor input so keyboard focus is never
   * lost when the calendar disappears.
   */
  close(restoreFocus?: boolean): void;
  destroy(): void;
}

export function attachCalendarPopover(
  input: HTMLInputElement,
  panel: HTMLElement,
  {
    floating,
    onClose,
  }: {
    floating: boolean;
    onClose?: () => void;
  },
): CalendarPopover {
  input.setAttribute("aria-expanded", "false");
  input.setAttribute("aria-haspopup", "dialog");
  if (floating) {
    panel.classList.add("cal-anchor--floating");
  }

  let cleanupAutoUpdate: (() => void) | null = null;
  // Guards against the anchor's focus handler re-opening the panel when we
  // programmatically return focus to the input after a close.
  let suppressOpen = false;

  const updatePosition = (): void => {
    if (!floating) return;
    void computePosition(input, panel, {
      strategy: "fixed",
      placement: "bottom-start",
      middleware: [offset(8), flip(), shift({ padding: 8 })],
    }).then(({ x, y }) => {
      panel.style.left = `${Math.round(x)}px`;
      panel.style.top = `${Math.round(y)}px`;
    });
  };

  const close = (restoreFocus = false): void => {
    if (panel.hidden) return;
    const hadFocusInside =
      panel.contains(document.activeElement) || document.activeElement === panel;
    panel.hidden = true;
    cleanupAutoUpdate?.();
    cleanupAutoUpdate = null;
    input.setAttribute("aria-expanded", "false");
    onClose?.();
    if (restoreFocus && hadFocusInside) {
      suppressOpen = true;
      input.focus();
      setTimeout(() => {
        suppressOpen = false;
      }, 0);
    }
  };

  const open = (): void => {
    if (suppressOpen) return;
    if (!panel.hidden) return;
    panel.hidden = false;
    input.setAttribute("aria-expanded", "true");
    if (floating) {
      cleanupAutoUpdate = autoUpdate(input, panel, updatePosition);
      updatePosition();
    }
  };

  const onInputFocus = (): void => open();
  const onInputClick = (): void => open();
  const onInputKeydown = (e: KeyboardEvent): void => {
    if (e.key === "Escape") close();
  };
  const onDocumentPointerDown = (e: PointerEvent): void => {
    if (panel.hidden) return;
    const target = e.target;
    if (!(target instanceof Node)) return;
    if (panel.contains(target) || input.contains(target)) return;
    if (target instanceof Element && target.closest(".cal__list-select__list--floating")) return;
    close();
  };

  input.addEventListener("focus", onInputFocus);
  input.addEventListener("click", onInputClick);
  input.addEventListener("keydown", onInputKeydown);
  document.addEventListener("pointerdown", onDocumentPointerDown);

  const destroy = (): void => {
    close();
    input.removeEventListener("focus", onInputFocus);
    input.removeEventListener("click", onInputClick);
    input.removeEventListener("keydown", onInputKeydown);
    document.removeEventListener("pointerdown", onDocumentPointerDown);
  };

  return { open, close, destroy };
}
