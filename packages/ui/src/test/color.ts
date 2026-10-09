/**
 * Color math for the token contrast tests. Channels and alpha are 0..1.
 *
 * STANDARD: relative luminance and contrast ratio from WCAG 2.2; source-over
 * compositing; `color-mix()` from CSS Color 5; `contrast()` and `brightness()`
 * from Filter Effects 1. Browsers composite and run these filter functions on
 * gamma-encoded sRGB values, so nothing here converts to linear light except
 * the luminance formula, which WCAG defines that way.
 */
export interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

export const WHITE: Rgba = { r: 1, g: 1, b: 1, a: 1 };
export const BLACK: Rgba = { r: 0, g: 0, b: 0, a: 1 };
export const TRANSPARENT: Rgba = { r: 0, g: 0, b: 0, a: 0 };

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export function rgb(r: number, g: number, b: number, a = 1): Rgba {
  return { r: r / 255, g: g / 255, b: b / 255, a };
}

export function gray(level: number): Rgba {
  return { r: level, g: level, b: level, a: 1 };
}

/** `top` painted over an opaque `bottom`. */
export function over(top: Rgba, bottom: Rgba): Rgba {
  return {
    r: top.r * top.a + bottom.r * (1 - top.a),
    g: top.g * top.a + bottom.g * (1 - top.a),
    b: top.b * top.a + bottom.b * (1 - top.a),
    a: 1,
  };
}

export function withAlpha(color: Rgba, alpha: number): Rgba {
  return { ...color, a: alpha };
}

/** CSS `color-mix(in srgb, a p%, b)`, with premultiplied alpha as the spec requires. */
export function colorMix(a: Rgba, share: number, b: Rgba): Rgba {
  const rest = 1 - share;
  const alpha = a.a * share + b.a * rest;
  if (alpha === 0) return TRANSPARENT;
  return {
    r: (a.r * a.a * share + b.r * b.a * rest) / alpha,
    g: (a.g * a.a * share + b.g * b.a * rest) / alpha,
    b: (a.b * a.a * share + b.b * b.a * rest) / alpha,
    a: alpha,
  };
}

function mapChannels(color: Rgba, fn: (channel: number) => number): Rgba {
  return { r: clamp01(fn(color.r)), g: clamp01(fn(color.g)), b: clamp01(fn(color.b)), a: color.a };
}

/** CSS `contrast(amount)`. */
export function filterContrast(color: Rgba, amount: number): Rgba {
  return mapChannels(color, (channel) => (channel - 0.5) * amount + 0.5);
}

/** CSS `brightness(amount)`. */
export function filterBrightness(color: Rgba, amount: number): Rgba {
  return mapChannels(color, (channel) => channel * amount);
}

export function relativeLuminance(color: Rgba): number {
  const linear = (channel: number) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear(color.r) + 0.7152 * linear(color.g) + 0.0722 * linear(color.b);
}

/** WCAG contrast ratio between two opaque colors. */
export function contrastRatio(a: Rgba, b: Rgba): number {
  const [lighter, darker] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x) as [number, number];
  return (lighter + 0.05) / (darker + 0.05);
}

/** Contrast of a possibly translucent `ink` drawn on an opaque `surface`. */
export function inkContrast(ink: Rgba, surface: Rgba): number {
  return contrastRatio(over(ink, surface), surface);
}

/**
 * Parses the color forms the stylesheets use: `rgb(R G B)`, `rgb(R G B / A)`,
 * `black`, `white`, `transparent`. Anything else is an error, on purpose: a
 * token written in a form the tests cannot read must not pass silently.
 */
export function parseColor(input: string): Rgba {
  const text = input.trim();
  if (text === "transparent") return TRANSPARENT;
  if (text === "black") return BLACK;
  if (text === "white") return WHITE;
  const match = /^rgb\(\s*(\d+)\s+(\d+)\s+(\d+)(?:\s*\/\s*([\d.]+))?\s*\)$/.exec(text);
  if (!match) throw new Error(`Unsupported color syntax: "${input}"`);
  return rgb(Number(match[1]), Number(match[2]), Number(match[3]), match[4] === undefined ? 1 : Number(match[4]));
}
