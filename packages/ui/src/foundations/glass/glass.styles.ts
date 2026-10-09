import { tv, type VariantProps } from "../utils/tv";

/**
 * Class names for a glass surface. Server-safe.
 *
 * `GlassSurface` uses this, and so can any control that draws glass on its own
 * element (a React Aria `Button`, for instance). In that case also put
 * `data-glass` on the element: nested surfaces look for it to avoid glass on glass.
 *
 * The utilities are defined in `src/styles/glass.css`.
 */
export const glassSurface = tv({
  base: "glass-surface",
  variants: {
    variant: {
      regular: "glass-regular",
      clear: "glass-clear",
    },
    size: {
      small: "glass-small",
      medium: "glass-medium",
      large: "glass-large",
    },
    shape: {
      rounded: "glass-shape-rounded",
      capsule: "glass-shape-capsule",
      circle: "glass-shape-circle",
      concentric: "rounded-concentric",
      none: "",
    },
    /** Grows and shrinks as a real element; see `GlassReveal`. */
    expandable: { true: "glass-expandable" },
    tinted: { true: "glass-tinted" },
    dim: { true: "glass-dim" },
    interactive: { true: "glass-interactive" },
    bounce: { true: "glass-bounce" },
  },
  defaultVariants: {
    variant: "regular",
    size: "medium",
    shape: "rounded",
  },
});

export type GlassSurfaceVariants = VariantProps<typeof glassSurface>;
