import { tv } from "../../foundations/utils/tv";

/**
 * Class names for a table and its parts. Server-safe (the components are not).
 *
 * VERIFIED (HIG Lists and tables, Outline views): column headings are nouns in
 * title-style capitalization; clicking a heading sorts and clicking it again
 * reverses the order; columns can be resized; alternating row colors help in
 * wide tables; a hierarchy shows in the first column only, with disclosure
 * triangles.
 * INFERRED: every number and color. Rows take the control height of the
 * density; the heading style, the hairlines, the stripe (the quaternary fill),
 * the indent of a level (1rem) and the highlight (selection.css) are ours.
 */
export const table = tv({
  slots: {
    container: "relative min-w-0 overflow-auto",
    root: "w-full border-separate border-spacing-0 text-body text-label outline-none",
    header: "",
    column: [
      "group/column focus-ring relative h-(--control-height) border-b border-separator px-3 text-start align-middle",
      "cursor-default text-subheadline font-semibold whitespace-nowrap text-label-secondary -outline-offset-2",
      "hover:text-label",
    ],
    columnContent: "flex min-w-0 items-center gap-1",
    columnLabel: "min-w-0 flex-1 truncate",
    // Shown for the sorted column only; it turns to point down when the order is descending.
    sortIndicator: [
      "invisible shrink-0 transition-[rotate] duration-fast ease-standard",
      "group-data-sort-direction/column:visible group-data-[sort-direction=descending]/column:rotate-180",
    ],
    resizer: [
      // Above the next heading, which would otherwise cover the half of the handle that lies over it.
      "focus-ring absolute inset-y-1 end-0 z-10 w-px translate-x-1/2 cursor-col-resize touch-none bg-separator rtl:-translate-x-1/2",
      "before:absolute before:inset-y-0 before:-inset-x-1.5 before:content-['']",
      "resizing:bg-accent focus-visible:bg-accent forced-colors:bg-[CanvasText]",
    ],
    body: "",
    row: [
      "group/row focus-ring relative cursor-default -outline-offset-2",
      "hover:not-selected:not-focus-visible:row-hovered pressed:not-selected:not-focus-visible:row-pressed selected:selection-emphasized",
      "disabled:content-disabled",
      "in-data-striped:not-selected:even:bg-fill-quaternary",
    ],
    cell: [
      "focus-ring h-(--control-height) border-b border-separator px-3 align-middle -outline-offset-2",
      "group-last/row:border-b-0",
    ],
    // One step of indent per level under the first, as padding on the leading side, so the hierarchy
    // shows in this column only.
    cellContent: "flex min-w-0 items-center gap-1.5 ps-[calc((var(--table-row-level)-1)*1rem)]",
    cellLabel: "min-w-0 flex-1 truncate",
    chevron: [
      "group/chevron focus-ring inline-flex size-5 shrink-0 cursor-default items-center justify-center rounded-field text-label-secondary",
      "hover:text-label",
    ],
    chevronGlyph: [
      "transition-[rotate] duration-fast ease-standard",
      "group-data-expanded/row:rotate-90 rtl:group-data-expanded/row:-rotate-90",
    ],
    // Keeps leaf rows aligned with the rows that have a triangle.
    chevronSpacer: "size-5 shrink-0",
    empty: "px-3 py-6 text-center text-label-secondary",
  },
});
