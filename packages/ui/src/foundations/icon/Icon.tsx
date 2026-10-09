import type { Ref, SVGProps } from "react";
import { cn } from "../utils/cn";
import { iconRegistry, type IconName, type IconRegistry } from "./registry";

export interface IconProps<Name extends string = IconName> extends Omit<SVGProps<SVGSVGElement>, "ref" | "name"> {
  /** Semantic name from the registry. */
  name: Name;
  /** Width and height. A number is CSS px. Default `1.25em`, so the icon follows the text size. */
  size?: number | string;
  /**
   * Accessible name. With it the icon is exposed as an image; without it the icon
   * is hidden from assistive technology, which is right when text sits next to it.
   * An icon-only control should be named on the control, not here.
   */
  label?: string;
  ref?: Ref<SVGSVGElement>;
}

/**
 * Builds an `Icon` component bound to a registry. Use it to give an app its own
 * icon set or extra names:
 *
 *   const AppIcon = createIcon({ ...iconRegistry, inbox: { glyph: Inbox } });
 */
export function createIcon<Name extends string>(registry: IconRegistry<Name>) {
  function Icon({ name, size = "1.25em", label, strokeWidth = 1.75, className, ref, ...props }: IconProps<Name>) {
    const { glyph: Glyph, mirrorInRtl } = registry[name];
    const accessibility = label
      ? ({ role: "img", "aria-label": label } as const)
      : ({ "aria-hidden": true, focusable: false } as const);
    return (
      <Glyph
        {...props}
        {...accessibility}
        ref={ref}
        size={size}
        strokeWidth={strokeWidth}
        data-icon={name}
        className={cn("shrink-0", mirrorInRtl && "rtl:-scale-x-100", className)}
      />
    );
  }
  return Icon;
}

/**
 * An icon from the library's registry, drawn with the current text color.
 *
 * Can be rendered from a Server Component (no directive, no hooks). Note that
 * the Lucide glyph it renders is itself a Client Component in lucide-react 1.x,
 * so its code does reach the browser.
 *
 * HIG: https://developer.apple.com/design/human-interface-guidelines/icons
 * Apple API: SwiftUI `Image(systemName:)`, UIKit `UIImage(systemName:)`,
 * AppKit `NSImage(systemSymbolName:accessibilityDescription:)`.
 * Deviation: the glyphs are Lucide's, not SF Symbols, which may not be used here.
 *
 * @example
 * <Icon name="chevron-forward" />
 * <Icon name="warning" label="Warning" className="text-system-orange" />
 */
export const Icon = createIcon(iconRegistry);
