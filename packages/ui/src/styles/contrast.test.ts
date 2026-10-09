import { describe, expect, it } from "vitest";
import {
  BLACK,
  WHITE,
  filterBrightness,
  filterContrast,
  gray,
  inkContrast,
  over,
  relativeLuminance,
  withAlpha,
  type Rgba,
} from "../test/color";
import { COLOR_STATES, resolveTokens, type TokenSet } from "../test/css-tokens";

/**
 * The contrast floor of every surface text may sit on, computed from the tokens
 * that ship (ARCHITECTURE.md section 8, "Contrast over glass").
 *
 * Text on a translucent surface has no fixed background, so the check is done on
 * the two extreme backdrops, pure black and pure white. Every step of the recipe
 * (contrast, brightness, source-over tint) is monotonic per channel, and
 * saturate() runs before them, so any other backdrop lands between those two.
 *
 * What this proves: the WCAG 2.2 ratio of each label level on each surface,
 * wherever `backdrop-filter` renders as specified.
 * What it does not prove: what a given browser actually paints. The Playwright
 * suite samples real pixels for that (tests/browser/glass-pixels.spec.ts).
 */

const AA_TEXT = 4.5;
const AA_LARGE_OR_NON_TEXT = 3;
const AAA_TEXT = 7;

const BACKDROPS: readonly (readonly [string, Rgba])[] = [
  ["black backdrop", BLACK],
  ["white backdrop", WHITE],
];

function compressed(backdrop: Rgba, tokens: TokenSet, prefix: "material" | "glass"): Rgba {
  return filterBrightness(
    filterContrast(backdrop, tokens.number(`--${prefix}-contrast`)),
    tokens.number(`--${prefix}-brightness`),
  );
}

function glassAlpha(tokens: TokenSet, clarity: number, sizeBias: number): number {
  const tinted = tokens.number("--glass-alpha-tinted");
  const clear = tokens.number("--glass-alpha-clear");
  const raw = tinted + (clear - tinted) * clarity + sizeBias;
  return Math.min(tokens.number("--glass-alpha-max"), Math.max(tokens.number("--glass-alpha-min"), raw));
}

/** Every way the glass paint stack can sit over one backdrop: with and without sheen and state overlay. */
function glassSurfaces(
  tokens: TokenSet,
  backdrop: Rgba,
  tint: Rgba,
  alpha: number,
  { dim = 0, tinted = false }: { dim?: number; tinted?: boolean } = {},
): Rgba[] {
  const base = over(withAlpha(tint, alpha), backdrop);
  // Tinted glass swaps in its own sheen and state overlays (glass.css, `glass-tinted`).
  const prefix = tinted ? "--glass-tinted" : "--glass";
  const sheens = [null, tokens.color(`${prefix}-sheen`)];
  const overlays = [null, tokens.color(`${prefix}-hover-overlay`), tokens.color(`${prefix}-pressed-overlay`)];
  const surfaces: Rgba[] = [];
  for (const sheen of sheens) {
    for (const overlay of overlays) {
      let surface = sheen ? over(sheen, base) : base;
      if (dim > 0) surface = over(withAlpha(BLACK, dim), surface);
      if (overlay) surface = over(overlay, surface);
      surfaces.push(surface);
    }
  }
  return surfaces;
}

const worst = (ink: Rgba, surfaces: Rgba[]) => Math.min(...surfaces.map((surface) => inkContrast(ink, surface)));

describe.each(COLOR_STATES)("contrast floor: $label", (state) => {
  const tokens = resolveTokens(state);
  const textFloor = state.contrast ? AAA_TEXT : AA_TEXT;
  const tertiaryFloor = state.contrast ? AA_TEXT : AA_LARGE_OR_NON_TEXT;
  const labels = [
    ["--label", textFloor],
    ["--label-secondary", textFloor],
    ["--label-tertiary", tertiaryFloor],
  ] as const;

  describe("opaque backgrounds", () => {
    it.each(["--background", "--background-secondary", "--background-tertiary", "--surface-solid"])(
      "labels on %s",
      (background) => {
        for (const [label, floor] of labels) {
          expect(inkContrast(tokens.color(label), tokens.color(background)), label).toBeGreaterThanOrEqual(floor);
        }
      },
    );

    it("accent text, the focus ring and filled accent controls", () => {
      for (const background of ["--background", "--background-secondary", "--background-tertiary", "--surface-solid"]) {
        const surface = tokens.color(background);
        expect(inkContrast(tokens.color("--accent-text"), surface), `accent text on ${background}`).toBeGreaterThanOrEqual(AA_TEXT);
        expect(inkContrast(tokens.color("--focus-ring"), surface), `focus ring on ${background}`).toBeGreaterThanOrEqual(
          AA_LARGE_OR_NON_TEXT,
        );
      }
      expect(inkContrast(tokens.color("--on-accent"), tokens.color("--accent-fill"))).toBeGreaterThanOrEqual(AA_TEXT);
    });
  });

  describe("standard materials", () => {
    it.each(["ultrathin", "thin", "regular", "thick"])("labels on the %s material", (thickness) => {
      const tint = withAlpha(tokens.color("--material-tint-color"), tokens.number(`--material-${thickness}-alpha`));
      for (const [name, backdrop] of BACKDROPS) {
        const surface = over(tint, compressed(backdrop, tokens, "material"));
        for (const [label, floor] of labels) {
          expect(inkContrast(tokens.color(label), surface), `${label} over a ${name}`).toBeGreaterThanOrEqual(floor);
        }
      }
    });
  });

  describe("regular glass", () => {
    const clarities = [0, 0.25, 0.5, 0.75, 1];
    const sizes = [
      ["small", 0],
      ["medium", 0.06],
      ["large", 0.16],
    ] as const;

    it.each(sizes)("labels on %s glass at every clarity, in every interaction state", (_size, bias) => {
      for (const clarity of clarities) {
        for (const [name, backdrop] of BACKDROPS) {
          const surfaces = glassSurfaces(
            tokens,
            compressed(backdrop, tokens, "glass"),
            tokens.color("--glass-tint-color"),
            glassAlpha(tokens, clarity, bias),
          );
          for (const [label, floor] of labels) {
            expect(worst(tokens.color(label), surfaces), `${label}, clarity ${clarity}, ${name}`).toBeGreaterThanOrEqual(
              floor,
            );
          }
        }
      }
    });

    it("the label on accent-tinted glass", () => {
      for (const [name, backdrop] of BACKDROPS) {
        const surfaces = glassSurfaces(
          tokens,
          compressed(backdrop, tokens, "glass"),
          tokens.color("--accent-fill"),
          tokens.number("--glass-tinted-alpha"),
          { tinted: true },
        );
        expect(worst(tokens.color("--on-accent"), surfaces), name).toBeGreaterThanOrEqual(AA_TEXT);
      }
    });
  });
});

describe("clear glass carries no general guarantee, and the tests say exactly how far it goes", () => {
  // Clear glass has no range compression; under Increase Contrast it renders as regular glass instead.
  const states = COLOR_STATES.filter((state) => !state.contrast);

  function clearSurface(tokens: TokenSet, backdrop: Rgba, dim: number): Rgba[] {
    return glassSurfaces(tokens, backdrop, tokens.color("--glass-tint-color"), tokens.number("--glass-clear-alpha"), { dim });
  }

  /** Brightest gray backdrop (as relative luminance) on which the clear label still reaches 4.5:1. */
  function brightestLegibleBackdrop(tokens: TokenSet, dim: number): number {
    let limit = 0;
    for (let level = 0; level <= 1.0001; level += 1 / 255) {
      if (worst(tokens.color("--glass-clear-label"), clearSurface(tokens, gray(level), dim)) < AA_TEXT) break;
      limit = relativeLuminance(gray(level));
    }
    return limit;
  }

  it.each(states)("$label: it fails on a white backdrop, with or without the dimming layer", (state) => {
    const tokens = resolveTokens(state);
    const label = tokens.color("--glass-clear-label");
    expect(worst(label, clearSurface(tokens, WHITE, 0))).toBeLessThan(AA_TEXT);
    expect(worst(label, clearSurface(tokens, WHITE, tokens.number("--glass-dim-alpha")))).toBeLessThan(AA_TEXT);
  });

  it.each(states)("$label: the dimming layer widens the range of media it is legible on", (state) => {
    const tokens = resolveTokens(state);
    const plain = brightestLegibleBackdrop(tokens, 0);
    const dimmed = brightestLegibleBackdrop(tokens, tokens.number("--glass-dim-alpha"));
    expect(dimmed).toBeGreaterThan(plain);
    // Measured on 2026-10-08: 0.07 / 0.32 (light) and 0.11 / 0.33 (dark), as relative
    // luminance. GlassSurface documents these limits; keep the two in step.
    expect(plain).toBeGreaterThanOrEqual(0.06);
    expect(dimmed).toBeGreaterThanOrEqual(0.3);
  });

  it("uses the dimming strength Apple recommends", () => {
    for (const state of COLOR_STATES) {
      // VERIFIED: HIG Materials, "a dark dimming layer of 35% opacity".
      expect(resolveTokens(state).number("--glass-dim-alpha")).toBe(0.35);
    }
  });
});
