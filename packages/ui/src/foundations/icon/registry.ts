import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleAlert,
  Ellipsis,
  Info,
  Minus,
  PanelLeft,
  Plus,
  Search,
  Share,
  TriangleAlert,
  X,
} from "lucide-react";
import type { ComponentType, Ref, SVGProps } from "react";

/** Props an icon glyph must accept. Lucide components do; so does any SVG component with a `size`. */
export type IconGlyphProps = Omit<SVGProps<SVGSVGElement>, "ref"> & {
  size?: number | string;
  ref?: Ref<SVGSVGElement>;
};

export interface IconDefinition {
  glyph: ComponentType<IconGlyphProps>;
  /**
   * Flip horizontally in right-to-left layouts. For icons that point along the
   * reading direction (forward, back), not for ones with a fixed meaning.
   * HIG: https://developer.apple.com/design/human-interface-guidelines/right-to-left
   */
  mirrorInRtl?: boolean;
}

export type IconRegistry<Name extends string = string> = Readonly<Record<Name, IconDefinition>>;

/**
 * The icons this library's own components use, by semantic name. Components
 * never import an icon set directly, so the set can be swapped here, in one file.
 *
 * Glyphs come from Lucide (ISC license). No SF Symbols and no look-alikes are
 * used anywhere (DECISIONS D-011, D-016). The names describe purpose, not shape,
 * and grow with each component batch.
 */
export const iconRegistry = {
  "chevron-forward": { glyph: ChevronRight, mirrorInRtl: true },
  "chevron-backward": { glyph: ChevronLeft, mirrorInRtl: true },
  "chevron-up": { glyph: ChevronUp },
  "chevron-down": { glyph: ChevronDown },
  close: { glyph: X },
  search: { glyph: Search },
  checkmark: { glyph: Check },
  add: { glyph: Plus },
  remove: { glyph: Minus },
  more: { glyph: Ellipsis },
  info: { glyph: Info },
  warning: { glyph: TriangleAlert },
  error: { glyph: CircleAlert },
  sidebar: { glyph: PanelLeft, mirrorInRtl: true },
  share: { glyph: Share },
} as const satisfies IconRegistry;

export type IconName = keyof typeof iconRegistry;
