import { tv, type VariantProps } from "../../foundations/utils/tv";

/**
 * Class names for a label: an optional icon followed by a title. Server-safe.
 * Rows of lists, outline views and column views lay their content out with the
 * same recipe, so the icon gap and the truncation rule live in one place.
 *
 * VERIFIED (HIG Labels): the label colors express relative importance (label,
 * secondary, tertiary, quaternary); a label takes the system text styles.
 * INFERRED: the gap between icon and title, and which text style is the default
 * (body). The quaternary color is not offered: it carries no contrast guarantee
 * in this library (tokens.css), so it never colors text.
 */
export const label = tv({
  slots: {
    root: "inline-flex max-w-full min-w-0 items-center gap-1.5 align-middle",
    // The icon follows the text size (1.25em) and never shrinks before the title does.
    icon: "inline-flex shrink-0 items-center",
    title: "min-w-0",
  },
  variants: {
    level: {
      primary: { root: "text-label" },
      secondary: { root: "text-label-secondary" },
      tertiary: { root: "text-label-tertiary" },
    },
    textStyle: {
      "large-title": { root: "text-large-title" },
      title1: { root: "text-title1" },
      title2: { root: "text-title2" },
      title3: { root: "text-title3" },
      headline: { root: "text-headline" },
      body: { root: "text-body" },
      callout: { root: "text-callout" },
      subheadline: { root: "text-subheadline" },
      footnote: { root: "text-footnote" },
      caption1: { root: "text-caption1" },
      caption2: { root: "text-caption2" },
    },
    lineLimit: {
      1: { title: "truncate" },
      2: { title: "line-clamp-2" },
      3: { title: "line-clamp-3" },
    },
    // Named keys, not booleans: tailwind-variants reads an unset boolean variant as `false`,
    // and unset has to mean "follow the container".
    selection: {
      on: { root: "select-text" },
      off: { root: "select-none" },
    },
    labelStyle: {
      "title-and-icon": {},
      "title-only": {},
      // The title stays in the accessibility tree: it is the icon's name.
      "icon-only": { title: "sr-only" },
    },
  },
  defaultVariants: {
    level: "primary",
    textStyle: "body",
    labelStyle: "title-and-icon",
  },
});

export type LabelVariants = VariantProps<typeof label>;
