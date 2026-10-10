import { tv } from "../../foundations/utils/tv";

/**
 * Class names for a list and its rows. Server-safe (the components are not).
 *
 * VERIFIED (HIG Lists and tables; "Adopting Liquid Glass"): a row that leads
 * somewhere stays highlighted while selected; an option row shows a checkmark;
 * the grouped style separates groups with headers and extra space; section
 * headers are title case; a disclosure indicator marks a row that drills in.
 * INFERRED: every number and color. Apple publishes no row height: rows take the
 * control height of the density (28 and 44 px, the HIG hit regions). The
 * hairline between rows, the inset shape and its radius (the box radius), the
 * header style and the highlight (selection.css) are ours.
 */
export const list = tv({
  slots: {
    root: "flex min-w-0 flex-col text-body text-label outline-none",
    section: "flex min-w-0 flex-col",
    header: "px-3 pt-3 pb-1 text-subheadline font-semibold text-label-secondary",
    item: [
      "group/item focus-ring relative flex min-h-(--control-height) min-w-0 cursor-default items-center gap-2 px-3 py-1",
      "text-body text-label -outline-offset-2",
      "hover:not-selected:not-focus-visible:row-hovered pressed:not-selected:not-focus-visible:row-pressed",
      "disabled:content-disabled",
      // The hairline under a row is its own element's border, so a highlight covers it cleanly.
      "border-b border-separator last:border-b-0",
    ],
    content: "flex min-w-0 flex-1 items-center gap-2",
    // Trailing marks: the checkmark of an option list and the disclosure indicator.
    accessory: "flex shrink-0 items-center gap-1.5 text-label-secondary",
    checkmark: "text-accent-text opacity-0 group-data-selected/item:opacity-100",
    empty: "px-3 py-6 text-center text-label-secondary",
  },
  variants: {
    listStyle: {
      plain: {},
      inset: {
        root: "overflow-clip rounded-box border border-separator bg-background-secondary in-data-box-content:bg-background-tertiary",
      },
    },
    selectionStyle: {
      highlight: { item: "selected:selection-emphasized" },
      checkmark: {},
    },
  },
  defaultVariants: { listStyle: "plain", selectionStyle: "highlight" },
});
