import { tv } from "../../foundations/utils/tv";

/**
 * Class names for a split view. Server-safe (the components are not).
 *
 * VERIFIED (HIG Split views, macOS): panes can be arranged vertically,
 * horizontally or both; people drag a divider to resize; prefer the thin
 * divider, one point wide, and a thicker one only where the thin one would be
 * hard to see.
 * INFERRED: every other number and color: the width of the thick divider (8 px),
 * its grip, the area around the thin divider that takes the pointer (6 px on
 * each side), and the accent color the divider takes while hovered, focused or
 * dragged.
 */
export const splitView = tv({
  slots: {
    root: "flex min-h-0 min-w-0 overflow-hidden text-body text-label",
    pane: "min-h-0 min-w-0 overflow-auto",
    divider: [
      "group/divider focus-ring relative z-10 shrink-0 touch-none bg-separator outline-offset-0",
      "transition-[background-color] duration-fast ease-standard",
      "hover:bg-accent focus-visible:bg-accent data-dragging:bg-accent",
      "forced-colors:bg-[CanvasText] forced-colors:hover:bg-[Highlight] forced-colors:data-dragging:bg-[Highlight]",
      // A wider area than the line takes the pointer.
      "before:absolute before:content-['']",
    ],
    // The mark that says the thick divider can be dragged.
    grip: "pointer-events-none absolute inset-0 m-auto rounded-full bg-label-tertiary forced-colors:bg-[CanvasText]",
  },
  variants: {
    orientation: {
      horizontal: {
        root: "flex-row",
        divider: "cursor-col-resize before:inset-y-0 before:-inset-x-1.5",
      },
      vertical: {
        root: "flex-col",
        divider: "cursor-row-resize before:inset-x-0 before:-inset-y-1.5",
      },
    },
    dividerStyle: {
      thin: {},
      thick: { divider: "bg-fill-secondary" },
    },
    sized: {
      true: { pane: "shrink-0 grow-0" },
      false: { pane: "flex-1" },
    },
  },
  compoundVariants: [
    { orientation: "horizontal", dividerStyle: "thin", class: { divider: "w-px" } },
    { orientation: "vertical", dividerStyle: "thin", class: { divider: "h-px" } },
    { orientation: "horizontal", dividerStyle: "thick", class: { divider: "w-2", grip: "h-6 w-0.5" } },
    { orientation: "vertical", dividerStyle: "thick", class: { divider: "h-2", grip: "h-0.5 w-6" } },
  ],
  defaultVariants: { orientation: "horizontal", dividerStyle: "thin", sized: false },
});
