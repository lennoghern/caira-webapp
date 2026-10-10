import { tv } from "../../foundations/utils/tv";

/**
 * Class names for a lockup. Server-safe (the component is not).
 *
 * VERIFIED (HIG Lockups): a lockup is a content view with a header above and a
 * footer below, which "expand and contract together as the lockup gets focus";
 * cards, caption buttons, monograms (a circular picture, or initials when there
 * is none, with a name) and posters (title and subtitle hidden until focus).
 * INFERRED: everything else. tvOS focus becomes hover and keyboard focus here,
 * and its growth a scale of 5% that reduced motion turns off. The frame of a
 * card, the radii, the text styles and the strip of thin material behind a
 * poster's caption are ours. The tilt of a caption button under a swipe has no
 * counterpart on the web and is not drawn.
 */
export const lockup = tv({
  slots: {
    root: [
      "group/lockup focus-ring relative inline-flex min-w-0 cursor-default flex-col text-start text-body text-label no-underline",
      "transition-[scale] duration-fast ease-standard",
      "hover:scale-105 focus-visible:scale-105 pressed:scale-100",
      "motion-reduce:hover:scale-100 motion-reduce:focus-visible:scale-100",
      "disabled:content-disabled",
    ],
    header: "block min-w-0 text-subheadline text-label-secondary",
    content: "relative block min-w-0 overflow-clip",
    footer: "block min-w-0",
    title: "block truncate text-body",
    subtitle: "block truncate text-callout text-label-secondary",
    initials: "flex size-full items-center justify-center text-title1 font-semibold text-label-secondary select-none",
  },
  variants: {
    variant: {
      card: {
        root: "gap-2 rounded-box border border-separator bg-background-secondary p-3 in-data-box-content:bg-background-tertiary",
        content: "rounded-field",
      },
      caption: {
        root: "gap-1.5 rounded-box",
        content: "rounded-box bg-fill-tertiary",
        footer: "px-0.5",
      },
      monogram: {
        root: "items-center gap-1.5 rounded-box text-center",
        content: "aspect-square w-full rounded-full bg-fill-secondary",
        footer: "w-full text-center",
      },
      poster: {
        root: "rounded-box",
        content: "rounded-box bg-fill-tertiary",
        // Over the bottom of the image, on a material so the labels keep their contrast.
        footer: [
          "absolute inset-x-0 bottom-0 rounded-b-box px-2 py-1.5 opacity-0 transition-opacity duration-fade",
          "group-hover/lockup:opacity-100 group-focus-visible/lockup:opacity-100",
          // Where nothing can hover, the caption cannot wait for it.
          "[@media(hover:none)]:opacity-100",
        ],
      },
    },
  },
  defaultVariants: { variant: "caption" },
});
