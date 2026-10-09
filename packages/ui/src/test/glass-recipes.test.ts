import { describe, expect, it } from "vitest";
import { parseColor } from "./color";
import { readStyleFile, resolveTokens } from "./css-tokens";
import {
  CLEAR_CLARITY,
  DEFAULT_CLARITY,
  EDGE_ON_DEFAULT,
  FLOORS,
  GLASS_RECIPES,
  LABELS,
  STATE_OVERLAYS,
  recipeStyle,
  recipeVerdict,
  type GlassRecipe,
  type RecipeAppearance,
} from "./glass-recipes";

/**
 * The comparison story is only useful if it is honest: its first column must
 * be what really ships, and what it says about contrast must be computed with
 * the floors the shipped tokens are held to. These tests pin both, and they pin
 * where each candidate passes and fails so the answer cannot drift unnoticed.
 */

const APPEARANCES: readonly RecipeAppearance[] = ["light", "dark"];
const SLIDER = [0, 0.25, 0.5, 0.75, 1];
const recipe = (id: string): GlassRecipe => {
  const found = GLASS_RECIPES.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`No recipe "${id}"`);
  return found;
};
const tokensFor = (appearance: RecipeAppearance) => resolveTokens({ dark: appearance === "dark", contrast: false });
const to255 = (color: { r: number; g: number; b: number }) => [color.r, color.g, color.b].map((c) => Math.round(c * 255));

describe("the fixed parts mirror the stylesheets", () => {
  it("uses the floors the shipped tokens are held to, unchanged", () => {
    // WCAG 2.2: 4.5:1 for text (1.4.3), 3:1 for large text and non-text parts (1.4.11).
    // These are the numbers in src/styles/contrast.test.ts. Do not lower them here.
    expect(FLOORS).toEqual({ label: 4.5, secondary: 4.5, tertiary: 3 });
  });

  it.each(APPEARANCES)("%s: label colors and state overlays are the shipped ones", (appearance) => {
    const tokens = tokensFor(appearance);
    expect(LABELS[appearance].label).toEqual(tokens.color("--label"));
    expect(LABELS[appearance].secondary).toEqual(tokens.color("--label-secondary"));
    expect(LABELS[appearance].tertiary).toEqual(tokens.color("--label-tertiary"));
    expect(STATE_OVERLAYS[appearance]).toEqual([
      tokens.color("--glass-hover-overlay"),
      tokens.color("--glass-pressed-overlay"),
    ]);
  });

  it.each(APPEARANCES)("%s: the 'current' recipe is exactly the shipped glass tokens", (appearance) => {
    const tokens = tokensFor(appearance);
    const tone = recipe("current")[appearance];
    expect([...tone.tint]).toEqual(to255(tokens.color("--glass-tint-color")));
    expect(tone.alphaTinted).toBe(tokens.number("--glass-alpha-tinted"));
    expect(tone.alphaClear).toBe(tokens.number("--glass-alpha-clear"));
    expect(tone.alphaMin).toBe(tokens.number("--glass-alpha-min"));
    expect(tone.alphaMax).toBe(tokens.number("--glass-alpha-max"));
    expect(tone.blurTinted).toBe(tokens.number("--glass-blur-tinted"));
    expect(tone.blurClear).toBe(tokens.number("--glass-blur-clear"));
    expect(tone.saturate).toBe(tokens.number("--glass-saturate"));
    expect(tone.contrast).toBe(tokens.number("--glass-contrast"));
    expect(tone.brightness).toBe(tokens.number("--glass-brightness"));
    expect(tone.sheen).toBe(parseColor(tokens.value("--glass-sheen")).a);
    // And it uses none of the optional knobs, because the shipped tokens set none.
    expect(tone.clarityEase ?? 0).toBe(0);
    expect(tone.edge).toBeUndefined();
    expect(tone.contrastClear ?? tone.contrast).toBe(tone.contrast);
    expect(recipe("current").refraction).toBeUndefined();
  });

  it("only sets custom properties that glass.css reads", () => {
    const css = readStyleFile("glass.css");
    for (const candidate of GLASS_RECIPES) {
      for (const appearance of APPEARANCES) {
        for (const property of Object.keys(recipeStyle(candidate, appearance, 0.5))) {
          expect(css, `${candidate.id} sets ${property}`).toContain(`var(${property}`);
        }
      }
    }
  });
});

describe("where each recipe keeps the contrast floors", () => {
  const PASS = { black: true, white: true };
  /** Over which backdrops every label level keeps its floor. `false` is a documented failure. */
  const EXPECTED: Record<string, Record<"default" | "clear", Record<RecipeAppearance, { black: boolean; white: boolean }>>> = {
    "previous-default": { default: { light: PASS, dark: PASS }, clear: { light: PASS, dark: PASS } },
    // Recipe 2, the default since 2026-10-09.
    current: { default: { light: PASS, dark: PASS }, clear: { light: PASS, dark: PASS } },
    // The clear end is nearly bare glass: dark text over dark content, or light over light, is lost.
    "clear-end": {
      default: { light: PASS, dark: PASS },
      clear: { light: { black: false, white: true }, dark: { black: true, white: false } },
    },
    // A diagnostic with almost no veil at any setting.
    "refraction-check": {
      default: { light: { black: false, white: true }, dark: { black: true, white: false } },
      clear: { light: { black: false, white: true }, dark: { black: true, white: false } },
    },
    "asymmetric-edge": { default: { light: PASS, dark: PASS }, clear: { light: PASS, dark: PASS } },
  };

  it("has an expectation for every recipe", () => {
    expect(Object.keys(EXPECTED).sort()).toEqual(GLASS_RECIPES.map((candidate) => candidate.id).sort());
  });

  describe.each(GLASS_RECIPES.map((candidate) => [candidate.id, candidate] as const))("%s", (id, candidate) => {
    it.each([
      ["default", DEFAULT_CLARITY],
      ["clear", CLEAR_CLARITY],
    ] as const)("at the %s setting", (setting, clarity) => {
      for (const appearance of APPEARANCES) {
        const verdict = recipeVerdict(candidate, appearance, clarity);
        const expected = EXPECTED[id]![setting][appearance];
        expect(verdict.black.failing.length === 0, `${appearance}, over black: ${JSON.stringify(verdict.black.ratios)}`).toBe(
          expected.black,
        );
        expect(verdict.white.failing.length === 0, `${appearance}, over white: ${JSON.stringify(verdict.white.ratios)}`).toBe(
          expected.white,
        );
      }
    });
  });

  it("every recipe but the diagnostic keeps the guarantee at the default setting", () => {
    // The rule for a new default: AA at the default setting. The clear end may give it up.
    for (const candidate of GLASS_RECIPES.filter((item) => item.id !== "refraction-check")) {
      for (const appearance of APPEARANCES) {
        const verdict = recipeVerdict(candidate, appearance, DEFAULT_CLARITY);
        expect([...verdict.black.failing, ...verdict.white.failing], `${candidate.id}, ${appearance}`).toEqual([]);
      }
    }
  });

  it("the shipped recipe keeps it along the whole slider", () => {
    for (const appearance of APPEARANCES) {
      for (const clarity of SLIDER) {
        const verdict = recipeVerdict(recipe("current"), appearance, clarity);
        expect([...verdict.black.failing, ...verdict.white.failing], `${appearance}, clarity ${clarity}`).toEqual([]);
      }
    }
  });
});

describe("the shipped recipe and the owner's 5:1 for the secondary label", () => {
  // Asked for on 2026-10-09 when recipe 2 became the default. It sits on top of
  // the WCAG floors above; it replaces none of them.
  const WANTED = 5;
  const lowestSecondary = (appearance: RecipeAppearance, clarity: number, states: "all" | "rest") => {
    const verdict = recipeVerdict(recipe("current"), appearance, clarity, states);
    return Math.min(verdict.black.ratios.secondary, verdict.white.ratios.secondary);
  };

  it("holds on a surface at rest along the whole slider", () => {
    for (const appearance of APPEARANCES) {
      for (const clarity of SLIDER) {
        expect(lowestSecondary(appearance, clarity, "rest"), `${appearance}, clarity ${clarity}`).toBeGreaterThanOrEqual(WANTED);
      }
    }
  });

  it("holds in the hovered and pressed states too at the default setting", () => {
    for (const appearance of APPEARANCES) {
      expect(lowestSecondary(appearance, DEFAULT_CLARITY, "all"), appearance).toBeGreaterThanOrEqual(WANTED);
    }
  });

  it("does not hold while a light surface at the clear end is hovered or pressed, and this says by how much", () => {
    // The one place the shipped glass is under 5:1, pinned so it cannot move
    // unnoticed: light appearance, clear end, over a black backdrop, while an
    // interactive surface is hovered or pressed. It is still above the 4.5:1 floor.
    const light = lowestSecondary("light", CLEAR_CLARITY, "all");
    expect(light).toBeLessThan(WANTED);
    expect(light).toBeGreaterThanOrEqual(FLOORS.secondary);
    expect(light).toBeCloseTo(4.58, 1);
    // Dark appearance stays above 5:1 in every state, everywhere on the slider.
    for (const clarity of SLIDER) {
      expect(lowestSecondary("dark", clarity, "all"), `dark, clarity ${clarity}`).toBeGreaterThanOrEqual(WANTED);
    }
  });
});

describe("the asymmetric edge on the default (a trial, not the default)", () => {
  it("changes nothing but the edge and the refraction filter", () => {
    for (const appearance of APPEARANCES) {
      const { edge, ...fill } = EDGE_ON_DEFAULT[appearance];
      expect(fill).toEqual(recipe("current")[appearance]);
      expect(edge).toBe(recipe("asymmetric-edge")[appearance].edge);
      const style = recipeStyle(EDGE_ON_DEFAULT, appearance, DEFAULT_CLARITY);
      expect(style["--glass-edge"]).toBe(edge);
      expect(style["--glass-refraction-filter"]).toBe('url("#glass-recipe-edge-on-default")');
    }
    expect(EDGE_ON_DEFAULT.refraction).toEqual(recipe("asymmetric-edge").refraction);
  });

  it("keeps the floors in the body of the surface, like the default it sits on", () => {
    for (const appearance of APPEARANCES) {
      for (const clarity of SLIDER) {
        expect(recipeVerdict(EDGE_ON_DEFAULT, appearance, clarity)).toEqual(recipeVerdict(recipe("current"), appearance, clarity));
      }
    }
    // The band the glow and shadow reach is outside the model, and says so.
    expect(EDGE_ON_DEFAULT.notModelled).toMatch(/10 px/);
  });
});
