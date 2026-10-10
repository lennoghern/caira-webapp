"use client";

import { useRef, useState, type HTMLAttributes, type KeyboardEvent, type PointerEvent } from "react";

export interface ResizeHandleOptions {
  /** Current size of the pane this handle controls, along the axis, in CSS px. */
  size: number;
  /** The smallest and largest size, reported as `aria-valuemin` and `aria-valuemax`. */
  minSize: number;
  maxSize: number;
  /**
   * `inline`: the panes sit side by side and the handle moves along the inline
   * axis. `block`: they are stacked and it moves along the block axis.
   */
  axis: "inline" | "block";
  /** The edge of the pane the handle sits on. On `start`, moving toward the start grows the pane. */
  edge: "start" | "end";
  /** How far one arrow key press moves the handle, in CSS px. */
  step: number;
  /**
   * Called with the size the pointer or the keyboard asks for. It is not
   * clamped: the caller decides what a size under the minimum means.
   */
  onResize: (size: number) => void;
  /** Enter: collapse the pane, or restore it (APG Window Splitter). */
  onToggle?: () => void;
  /** Double click: back to the default size. A way to resize with one pointer and no dragging. */
  onReset?: () => void;
}

export interface ResizeHandle {
  /** Spread on the handle element. Add `aria-controls` and a name next to it. */
  handleProps: HTMLAttributes<HTMLDivElement> & { "data-dragging"?: "" };
  isDragging: boolean;
}

/**
 * The behavior of a focusable separator between two panes, shared by
 * `SplitView` and the columns of `ColumnView`.
 *
 * STANDARD: the APG Window Splitter pattern,
 * https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/ : `role="separator"`
 * with `aria-valuenow`, `aria-valuemin` and `aria-valuemax`; the arrow keys
 * along the axis move it, Home and End go to the smallest and largest size,
 * Enter collapses or restores. The pattern's optional F6 (cycle through the
 * panes) is left to the application. The pointer part uses pointer capture, so
 * a drag keeps going outside the handle and works for mouse, pen and touch.
 */
export function useResizeHandle({
  size,
  minSize,
  maxSize,
  axis,
  edge,
  step,
  onResize,
  onToggle,
  onReset,
}: ResizeHandleOptions): ResizeHandle {
  const [isDragging, setDragging] = useState(false);
  const drag = useRef<{ pointerId: number; origin: number; size: number; sign: number } | null>(null);

  // +1 when moving toward the right (or the bottom) grows the pane, -1 when it shrinks it.
  const signFor = (element: Element) => {
    const towardEnd = edge === "end" ? 1 : -1;
    if (axis === "block") return towardEnd;
    return getComputedStyle(element).direction === "rtl" ? -towardEnd : towardEnd;
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.focus();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    drag.current = {
      pointerId: event.pointerId,
      origin: axis === "inline" ? event.clientX : event.clientY,
      size,
      sign: signFor(event.currentTarget),
    };
    setDragging(true);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const position = axis === "inline" ? event.clientX : event.clientY;
    onResize(current.size + (position - current.origin) * current.sign);
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (drag.current?.pointerId !== event.pointerId) return;
    drag.current = null;
    setDragging(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const sign = signFor(event.currentTarget);
    const [backward, forward] = axis === "inline" ? ["ArrowLeft", "ArrowRight"] : ["ArrowUp", "ArrowDown"];
    if (event.key === forward) onResize(size + step * sign);
    else if (event.key === backward) onResize(size - step * sign);
    else if (event.key === "Home") onResize(minSize);
    else if (event.key === "End") onResize(maxSize);
    else if (event.key === "Enter" && onToggle) onToggle();
    else return;
    event.preventDefault();
  };

  return {
    isDragging,
    handleProps: {
      role: "separator",
      tabIndex: 0,
      // The line between two panes that sit side by side is vertical.
      "aria-orientation": axis === "inline" ? "vertical" : "horizontal",
      "aria-valuenow": Math.round(size),
      "aria-valuemin": Math.round(minSize),
      "aria-valuemax": Math.round(maxSize),
      "data-dragging": isDragging ? "" : undefined,
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
      onLostPointerCapture: endDrag,
      onKeyDown,
      onDoubleClick: onReset,
    },
  };
}
