import type { HTMLAttributes, Ref } from "react";
import { cn } from "../utils/cn";
import { tv } from "../utils/tv";

export const material = tv({
  base: "material",
  variants: {
    thickness: {
      ultraThin: "material-ultrathin",
      thin: "material-thin",
      regular: "material-regular",
      thick: "material-thick",
    },
  },
  defaultVariants: { thickness: "regular" },
});

export type MaterialThickness = "ultraThin" | "thin" | "regular" | "thick";
export type MaterialElement = "div" | "section" | "article" | "aside" | "header" | "footer" | "main";

export interface MaterialProps extends HTMLAttributes<HTMLElement> {
  /** Element to render. Default `div`. */
  as?: MaterialElement;
  /**
   * How much of the backdrop shows through. Thicker is more opaque and gives
   * fine text more contrast; thinner keeps more of the context visible.
   * Choose by purpose, not by the color it happens to produce.
   */
  thickness?: MaterialThickness;
  ref?: Ref<HTMLElement>;
}

/**
 * A standard material: a blurred, translucent background for the content layer
 * (app backgrounds, grouped areas, cards). For controls and navigation floating
 * above content use `GlassSurface` instead.
 *
 * Server-safe: markup and class names only.
 *
 * HIG: https://developer.apple.com/design/human-interface-guidelines/materials
 * Apple API: SwiftUI `Material` (`ultraThin`, `thin`, `regular`, `thick`),
 * UIKit `UIBlurEffect`, AppKit `NSVisualEffectView`.
 *
 * Text on a material uses the label tokens (`text-label`, `text-label-secondary`),
 * the web stand-in for vibrancy. Primary and secondary labels reach 4.5:1 on
 * every thickness; see `src/styles/contrast.test.ts`.
 */
export function Material({ as: Element = "div", thickness = "regular", className, ref, ...props }: MaterialProps) {
  return (
    <Element
      {...props}
      // The props type is the common denominator of the allowed elements.
      ref={ref as Ref<HTMLDivElement>}
      data-material={thickness}
      className={cn(material({ thickness }), className)}
    />
  );
}
