import { tv } from "../../foundations/utils/tv";

/**
 * Class names for the disclosure parts. Server-safe (the components are not).
 *
 * VERIFIED (HIG Disclosure controls): a disclosure triangle points inward from
 * the leading edge when its content is hidden and down when it is visible; a
 * disclosure button points down when its content is hidden and up when it is
 * visible; the view grows and shrinks to fit the content.
 * INFERRED: every metric and color here (the gap, the indent of the content
 * under the label, the fill of the button form, the hairline between the items
 * of a group) and the duration of the change, which is the library's base
 * motion token.
 */
export const disclosure = tv({
  slots: {
    root: "flex min-w-0 flex-col text-body text-label",
    heading: "m-0 flex text-body",
    // `group/trigger`: the glyph reads the button's own aria-expanded, so a disclosure
    // nested in an open one does not turn with its parent.
    trigger: [
      "group/trigger focus-ring inline-flex min-h-(--control-height) min-w-0 items-center gap-1.5 rounded-control",
      "cursor-default text-start text-body text-label",
      "disabled:text-label-tertiary",
    ],
    glyph: [
      "shrink-0 text-label-secondary transition-[rotate] duration-fast ease-standard",
      "group-data-pressed/trigger:text-label group-data-disabled/trigger:text-label-tertiary",
      "forced-colors:group-data-disabled/trigger:text-[GrayText]",
    ],
    label: "min-w-0",
    // The clip: its height follows the variable React Aria sets while the content appears.
    panel: "h-(--disclosure-panel-height) overflow-clip transition-[height] duration-base ease-standard",
    content: "min-w-0",
    group: "flex min-w-0 flex-col divide-y divide-separator",
  },
  variants: {
    variant: {
      triangle: {
        trigger: "w-full",
        // Forward (mirrored by the icon in right-to-left) to down: a quarter turn, the other way when mirrored.
        glyph: "group-aria-expanded/trigger:rotate-90 rtl:group-aria-expanded/trigger:-rotate-90",
        // Under the label: the glyph (1.25em) plus the gap.
        content: "ps-[calc(1.25em+0.375rem)] pt-1 pb-2",
      },
      button: {
        trigger: [
          "min-w-(--control-height) justify-center bg-fill-tertiary px-1.5",
          "hover:bg-fill-secondary pressed:bg-fill",
          "forced-colors:border forced-colors:border-[ButtonText]",
        ],
        // Down to up: half a turn.
        glyph: "text-label group-aria-expanded/trigger:rotate-180",
        content: "pt-2",
      },
    },
  },
  defaultVariants: { variant: "triangle" },
});
