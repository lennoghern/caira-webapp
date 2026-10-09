import type { ComponentProps } from "react";
import { cn } from "../utils/cn";

export interface GlassRevealProps extends ComponentProps<"div"> {
  /** Whether the content is shown. Use the same value as the surface's `expanded`. */
  expanded: boolean;
  /**
   * `block` (default) animates the height only. `both` also animates the width,
   * which needs the content to have a definite width (a `w-*` class in
   * `className`): the surface then widens to it instead of jumping.
   */
  axis?: "block" | "both";
}

/**
 * The part of an expandable `GlassSurface` that appears and disappears. The
 * surface around it grows as a real element, frame by frame, so the glass keeps
 * its blur and tint during the change.
 *
 * Server-safe: markup and class names only; the animation is CSS.
 *
 * `className` and `style` go on the content, which may have padding and a width.
 * Every other prop (including `id`, for `aria-controls`) goes on the outer element.
 *
 * Accessibility: while collapsed the content is `visibility: hidden`, so it is
 * out of the tab order and not read. This component adds no button and no ARIA
 * state: put `aria-expanded` and `aria-controls` on whatever toggles it (APG
 * Disclosure pattern, https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/), and
 * keep that control outside the reveal so focus is never hidden with it.
 * With reduced motion the size changes at once and only the fade remains.
 *
 * HIG: https://developer.apple.com/design/human-interface-guidelines/materials
 * Apple API: the nearest counterpart is a single view changing size inside a
 * SwiftUI `GlassEffectContainer`. Deviation: Apple also morphs between two
 * different views with `glassEffectID(_:in:)`; this does not.
 *
 * @example
 * <GlassSurface expanded={open}>
 *   <button aria-expanded={open} aria-controls="details" onClick={toggle}>Now playing</button>
 *   <GlassReveal id="details" expanded={open} className="pt-2">Track 3 of 12</GlassReveal>
 * </GlassSurface>
 */
export function GlassReveal({ expanded, axis = "block", className, style, children, ...props }: GlassRevealProps) {
  return (
    <div {...props} data-glass-reveal="" data-expanded={expanded} data-axis={axis} className="glass-reveal">
      {/* Clips, and must stay free of padding: padding could not shrink to nothing. */}
      <div>
        <div className={cn(className)} style={style}>
          {children}
        </div>
      </div>
    </div>
  );
}
