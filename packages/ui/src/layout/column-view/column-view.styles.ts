import { tv } from "../../foundations/utils/tv";

/**
 * Class names for a column view. Server-safe (the component is not).
 *
 * VERIFIED (HIG Column views): each column is one level of the hierarchy; a
 * parent item is marked with a triangle icon; selecting a parent shows its
 * children in the next column; people can resize columns; information about an
 * item with no children can be shown where its children would be.
 * INFERRED: every number and color. Rows take the control height of the
 * density; a column starts 200 px wide; the line between columns and the
 * highlight are the library's (split-view.styles.ts, selection.css). Every
 * selected item on the path keeps the emphasized highlight: Apple dims the
 * ones in columns that do not have focus, and no token here says how.
 */
export const columnView = tv({
  slots: {
    root: "flex min-h-0 min-w-0 overflow-x-auto overflow-y-hidden text-body text-label",
    column: "flex min-h-0 shrink-0",
    list: "flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto py-1 outline-none",
    item: [
      "group/item focus-ring relative mx-1 flex min-h-(--control-height) min-w-0 shrink-0 cursor-default items-center gap-1.5",
      "rounded-field px-2 text-body text-label -outline-offset-2",
      "hover:not-selected:not-focus-visible:row-hovered pressed:not-selected:not-focus-visible:row-pressed selected:selection-emphasized",
      "disabled:content-disabled",
    ],
    label: "min-w-0 flex-1 truncate",
    // The mark of an item that has nested items.
    indicator: "shrink-0 text-label-secondary",
    divider: [
      "focus-ring relative z-10 w-px shrink-0 cursor-col-resize touch-none bg-separator outline-offset-0",
      "transition-[background-color] duration-fast ease-standard",
      "hover:bg-accent focus-visible:bg-accent data-dragging:bg-accent",
      "forced-colors:bg-[CanvasText] forced-colors:hover:bg-[Highlight] forced-colors:data-dragging:bg-[Highlight]",
      "before:absolute before:inset-y-0 before:-inset-x-1.5 before:content-['']",
    ],
    preview: "min-h-0 min-w-48 flex-1 overflow-auto p-4",
    empty: "px-3 py-6 text-center text-label-secondary",
  },
});
