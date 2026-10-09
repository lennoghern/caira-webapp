import type { ComponentProps } from "react";
import { cn } from "../utils/cn";

export interface GlassGroupProps extends ComponentProps<"div"> {
  /** Gap between the surfaces in the group, in CSS px. Default 8. */
  spacing?: number;
}

/**
 * Lays out glass surfaces that belong together, such as the controls of one bar.
 *
 * Server-safe: markup and class names only.
 *
 * HIG: https://developer.apple.com/design/human-interface-guidelines/materials
 * Apple API: SwiftUI `GlassEffectContainer`, UIKit `UIGlassContainerEffect`,
 * AppKit `NSGlassEffectContainerView`.
 *
 * Deviations, both on record in DECISIONS.md D-032:
 *  - On Apple platforms `spacing` is the distance at which neighboring shapes
 *    start to blend into one. Here it is only the gap between them; shapes never fuse.
 *  - Apple's container also morphs one shape into another by shared identity
 *    (`glassEffectID(_:in:)`). There is no counterpart yet. A single surface that
 *    grows and shrinks is covered by `GlassSurface expanded` with `GlassReveal`.
 */
export function GlassGroup({ spacing = 8, className, style, ...props }: GlassGroupProps) {
  return (
    <div
      {...props}
      data-glass-group=""
      className={cn("flex items-center", className)}
      style={{ gap: spacing, ...style }}
    />
  );
}
