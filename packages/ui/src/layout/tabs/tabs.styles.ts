import { tv } from "../../foundations/utils/tv";

/**
 * Class names for the parts of a tab view. Server-safe (the components are not).
 *
 * VERIFIED (HIG Tab views): the tabbed control sits on the top edge of the
 * content area; the view gives "a strong visual indication of enclosure", so the
 * pane is framed; tab labels are short nouns in title-style capitalization.
 * INFERRED: every metric and color. The control is a row of segments on a gray
 * track and the selected one takes the accent fill, the library's emphasized
 * selection (selection.css), which is also what keeps the selected state from
 * resting on a faint difference of grays. The frame of the pane reuses the box
 * radius and the secondary background. The macOS 27 "tabs" picker style is not
 * drawn: Apple's text does not describe it (COMPONENT-MAP.md rows 14 and 45).
 */
export const tabs = tv({
  slots: {
    root: "flex min-w-0 gap-2 text-body text-label orientation-horizontal:flex-col orientation-vertical:flex-row",
    list: [
      "isolate flex shrink-0 gap-0.5 rounded-control bg-fill-tertiary p-0.5",
      "orientation-horizontal:max-w-full orientation-horizontal:self-center",
      "orientation-vertical:flex-col orientation-vertical:self-start",
      "forced-colors:border forced-colors:border-[CanvasText]",
    ],
    tab: [
      "focus-ring relative flex min-h-(--control-height-small) min-w-0 cursor-default items-center justify-center gap-1.5",
      // The ring is drawn inside the tab: outside, the on-accent ring of a selected tab would sit on the gray track.
      "rounded-[calc(var(--radius-control)-0.125rem)] px-3 text-body text-label -outline-offset-2",
      // The text color changes at once. React Aria marks the selected tab after the first paint, so a
      // color transition here ran on every mount: 150 ms of label-colored text on the accent fill.
      "hover:not-selected:row-hovered pressed:not-selected:row-pressed",
      // The ring of a tab is the label color on the gray track and the on-accent color on the highlight:
      // the accent would have under 3:1 on either (src/layout/contrast.test.ts).
      "[--focus-ring:var(--label)] selected:font-semibold selected:text-on-accent selected:[--focus-ring:var(--on-accent)]",
      "disabled:content-disabled",
      "forced-colors:selected:text-[HighlightText] forced-colors:selected:[--focus-ring:HighlightText]",
    ],
    // Slides from the tab that was selected to the one that is; under reduced motion it jumps.
    indicator: [
      "absolute inset-0 -z-10 rounded-[inherit] bg-accent-fill",
      "transition-[translate,width,height] duration-base ease-standard motion-reduce:transition-none",
      "forced-colors:bg-[Highlight]",
    ],
    // The label and, under it, an unseen semibold copy: the tab is as wide as its selected form, so
    // selecting it moves nothing.
    label: "grid min-w-0 justify-items-center",
    labelText: "col-start-1 row-start-1 truncate",
    labelGhost: "invisible col-start-1 row-start-1 truncate font-semibold",
    panels: "min-w-0 flex-1",
    panel: [
      "focus-ring min-w-0 flex-1 rounded-box border border-separator bg-background-secondary p-4 text-body text-label",
      "in-data-box-content:bg-background-tertiary",
    ],
  },
});
