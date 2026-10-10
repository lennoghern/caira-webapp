import { tv } from "../../foundations/utils/tv";

/**
 * Class names for a one-column outline view. Server-safe (the components are
 * not). The several-column form is `Table` with a tree column and takes its
 * classes from table.styles.ts; the two share the indent step and the triangle.
 *
 * VERIFIED (HIG Outline views, Disclosure controls): parent rows carry a
 * disclosure triangle that points inward from the leading edge when closed and
 * down when open; the hierarchy shows in the first column.
 * INFERRED: every number and color. Rows take the control height of the
 * density; one level indents by 1rem; the highlight is the library's emphasized
 * selection (selection.css).
 */
export const outlineView = tv({
  slots: {
    root: "flex min-w-0 flex-col overflow-auto text-body text-label outline-none",
    item: [
      "group/row focus-ring relative flex min-h-(--control-height) min-w-0 cursor-default items-center px-2 py-0.5",
      "text-body text-label -outline-offset-2",
      "hover:not-selected:not-focus-visible:row-hovered pressed:not-selected:not-focus-visible:row-pressed selected:selection-emphasized",
      "disabled:content-disabled",
    ],
    // One step of indent per level under the first, as padding on the leading side.
    content: "flex min-w-0 flex-1 items-center gap-1.5 ps-[calc((var(--tree-item-level)-1)*1rem)]",
    chevron: [
      "focus-ring inline-flex size-5 shrink-0 cursor-default items-center justify-center rounded-field text-label-secondary",
      "hover:text-label",
    ],
    chevronGlyph: [
      "transition-[rotate] duration-fast ease-standard",
      "group-data-expanded/row:rotate-90 rtl:group-data-expanded/row:-rotate-90",
    ],
    // Keeps leaf rows aligned with the rows that have a triangle.
    chevronSpacer: "size-5 shrink-0",
    icon: "inline-flex shrink-0 items-center text-label-secondary",
    title: "min-w-0 flex-1 truncate",
    empty: "px-3 py-6 text-center text-label-secondary",
  },
});
