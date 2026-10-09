/**
 * Tells tailwind-merge about the class names this library adds to Tailwind, so
 * `cn()` and `tv()` resolve conflicts correctly. Without it `text-body`
 * (a font size) and `text-label` (a color) would be treated as the same group
 * and one would be dropped.
 *
 * Keep the lists in step with `src/styles/*.css`; `cn.test.ts` reads the
 * stylesheets and fails when a token is missing here.
 */

/** Text styles, from the HIG Typography tables (see tokens.css). */
export const TEXT_STYLES = [
  "large-title",
  "title1",
  "title2",
  "title3",
  "headline",
  "body",
  "callout",
  "subheadline",
  "footnote",
  "caption1",
  "caption2",
] as const;

export const RADII = ["control", "field", "menu", "popover", "panel", "sheet", "window"] as const;

export const EASINGS = ["standard", "enter", "exit", "bounce"] as const;

export const DURATIONS = ["instant", "fast", "base", "slow", "morph", "fade"] as const;

export type LibraryClassGroupId = "glass-variant" | "glass-size" | "glass-shape" | "material-thickness";

export const twMergeConfig = {
  extend: {
    theme: {
      text: [...TEXT_STYLES],
      radius: [...RADII],
      ease: [...EASINGS],
    },
    classGroups: {
      duration: [{ duration: [...DURATIONS] }],
      rounded: ["rounded-concentric"],
      "glass-variant": ["glass-regular", "glass-clear"],
      "glass-size": ["glass-small", "glass-medium", "glass-large"],
      "glass-shape": ["glass-shape-rounded", "glass-shape-capsule", "glass-shape-circle"],
      "material-thickness": ["material-ultrathin", "material-thin", "material-regular", "material-thick"],
    },
    conflictingClassGroups: {
      "glass-shape": ["rounded"],
      rounded: ["glass-shape"],
    },
  },
} satisfies import("tailwind-merge").ConfigExtension<
  import("tailwind-merge").DefaultClassGroupIds | LibraryClassGroupId,
  import("tailwind-merge").DefaultThemeGroupIds
>;
