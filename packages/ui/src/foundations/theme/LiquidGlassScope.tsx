import type { ComponentProps } from "react";
import { cn } from "../utils/cn";
import type { StyleWithVars } from "../utils/types";
import { themeDomState } from "./dom";
import { clampClarity } from "./preferences";
import type { Platform, ResolvedAppearance } from "./types";

export interface LiquidGlassScopeProps extends ComponentProps<"div"> {
  /**
   * Required. A scope re-declares every color token for its subtree, and it can
   * only do that for an explicit appearance.
   */
  appearance: ResolvedAppearance;
  /** Glass clarity for this subtree, 0 (fully tinted) to 1 (ultra clear). Inherits when omitted. */
  clarity?: number;
  /** Forces the increased-contrast tokens in this subtree. */
  contrast?: "more";
  /** Forces solid surfaces (rendering tier 0) in this subtree. */
  transparency?: "reduced";
  /** Collapses moving transitions in this subtree. */
  motion?: "reduced";
  platform?: Platform;
  /** Any CSS color. Inherits when omitted. */
  accent?: string;
}

/**
 * Themes a subtree differently from the page: a dark island in a light page, a
 * denser region, a preview of another setting. It carries the same attributes
 * LiquidGlassProvider writes on `<html>`. Server-safe.
 *
 * Apple reference: SwiftUI `preferredColorScheme(_:)` and
 * `environment(\.colorScheme, _)` applied to a view subtree.
 *
 * It does not paint a background. Add one (`bg-background`, a material) if the
 * subtree needs it.
 */
export function LiquidGlassScope({
  appearance,
  clarity,
  contrast,
  transparency,
  motion,
  platform,
  accent,
  className,
  style,
  ...props
}: LiquidGlassScopeProps) {
  const { attributes } = themeDomState({
    appearance,
    clarity: 0,
    contrast: contrast ?? "system",
    transparency: transparency ?? "system",
    motion: motion ?? "system",
    platform: platform ?? "macos",
    accent: null,
  });
  const scopeStyle: StyleWithVars = { ...style };
  if (clarity !== undefined) scopeStyle["--glass-clarity"] = clampClarity(clarity);
  if (accent !== undefined) scopeStyle["--accent-custom"] = accent;

  return (
    <div
      {...props}
      data-appearance={attributes["data-appearance"] ?? undefined}
      data-contrast={attributes["data-contrast"] ?? undefined}
      data-transparency={attributes["data-transparency"] ?? undefined}
      data-motion={attributes["data-motion"] ?? undefined}
      data-platform={platform}
      // Text color is inherited as a computed value, so it must be restated here.
      className={cn("text-label", className)}
      style={scopeStyle}
    />
  );
}
