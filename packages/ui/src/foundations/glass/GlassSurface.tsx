import type { HTMLAttributes, Ref } from "react";
import type { ResolvedAppearance } from "../theme/types";
import { cn } from "../utils/cn";
import type { StyleWithVars } from "../utils/types";
import { glassSurface } from "./glass.styles";

/** Elements a glass surface may render as. Pick the one that matches the landmark, if any. */
export type GlassSurfaceElement = "div" | "span" | "section" | "nav" | "header" | "footer" | "aside";

export interface GlassSurfaceProps extends HTMLAttributes<HTMLElement> {
  /** Element to render. Default `div`. */
  as?: GlassSurfaceElement;
  /**
   * `regular` blurs and evens out what is behind it, and keeps text legible
   * (the contrast floor is tested). `clear` is highly translucent, for surfaces
   * floating over photos or video only: it carries no contrast guarantee.
   */
  variant?: "regular" | "clear";
  /**
   * Rough scale of the surface. Larger surfaces are more opaque (HIG Color):
   * `small` for controls, `medium` for bars and popovers, `large` for sidebars,
   * sheets and windows.
   */
  size?: "small" | "medium" | "large";
  /**
   * `concentric` takes its radius from the nearest container that publishes
   * `--concentric-radius` and `--concentric-padding` (see `concentricContainerStyle`).
   * Ignored when `expanded` is set: an expandable surface animates its own radius.
   */
  shape?: "rounded" | "capsule" | "circle" | "concentric" | "none";
  /**
   * Colors the glass, for the one primary action in a view. `accent` uses the
   * app accent; any other string is used as a CSS color, and then you own the
   * label contrast (set `--glass-on-tint` if white does not work).
   */
  tint?: "accent" | (string & {});
  /**
   * Adds the dark dimming layer Apple pairs with clear glass over bright media
   * (35%, HIG Materials).
   */
  dim?: boolean;
  /** Responds to hover, press and keyboard focus. Styling only: it adds no behavior and no role. */
  interactive?: boolean;
  /** With `interactive`: the surface shrinks while pressed and springs back (macOS 27). Controls only. */
  bounce?: boolean;
  /**
   * Pins the surface to one appearance whatever the page uses, for glass that
   * sits on content known to be dark or light. Apple's glass adapts to what is
   * behind it by itself; the web cannot sample the backdrop, so this is manual.
   */
  appearance?: ResolvedAppearance;
  /**
   * Makes the surface one that grows and shrinks. Pass the current state; put the
   * part that appears in a `GlassReveal` with the same value. The surface then
   * animates its corner radius between a capsule (collapsed) and the radius of
   * its `size` (expanded), and its padding if that changes too. The size change
   * itself comes from the `GlassReveal` inside it.
   */
  expanded?: boolean;
  ref?: Ref<HTMLElement>;
}

/**
 * The Liquid Glass material: a translucent surface for controls and navigation
 * that float above content. Everything glass in this library is built on it.
 *
 * Server-safe: it renders markup and class names only. Hover, press, focus and
 * the expand and collapse animation all come from CSS.
 *
 * Use it sparingly and never in the content layer (use `Material` there), and
 * do not put glass on glass: a nested surface automatically drops to a plain tint.
 *
 * HIG: https://developer.apple.com/design/human-interface-guidelines/materials
 * Apple API: SwiftUI `glassEffect(_:in:)` and `Glass` (`regular`, `clear`,
 * `tint(_:)`, `interactive(_:)`), UIKit `UIGlassEffect`, AppKit `NSGlassEffectView`.
 *
 * Web interpretation, not a port. Deviations: the glass does not adapt to the
 * content behind it; edge refraction renders in Chromium only; and one surface
 * can grow or shrink, but two different surfaces do not morph into each other
 * (`glassEffectID(_:in:)` has no counterpart yet, DECISIONS.md D-032).
 *
 * @example
 * <GlassSurface as="nav" shape="capsule" className="px-3 py-2" aria-label="Sections">…</GlassSurface>
 */
export function GlassSurface({
  as: Element = "div",
  variant = "regular",
  size = "medium",
  shape = "rounded",
  tint,
  dim = false,
  interactive = false,
  bounce = false,
  appearance,
  expanded,
  className,
  style,
  ref,
  ...props
}: GlassSurfaceProps) {
  const surfaceStyle: StyleWithVars = { ...style };
  if (tint !== undefined) surfaceStyle["--glass-tint"] = tint === "accent" ? "var(--accent-fill)" : tint;
  const expandable = expanded !== undefined;

  return (
    <Element
      {...props}
      // The props type is the common denominator of the allowed elements.
      ref={ref as Ref<HTMLDivElement>}
      data-glass={variant}
      data-appearance={appearance}
      data-expanded={expandable ? expanded : undefined}
      className={cn(
        glassSurface({
          variant,
          size,
          shape: expandable ? "none" : shape,
          expandable,
          tinted: tint !== undefined,
          dim,
          interactive,
          bounce: interactive && bounce,
        }),
        className,
      )}
      style={surfaceStyle}
    />
  );
}
