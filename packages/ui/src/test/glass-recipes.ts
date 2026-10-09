import { BLACK, WHITE, filterBrightness, filterContrast, inkContrast, over, rgb, type Rgba } from "./color";
import type { GlassFilterDefsProps } from "../foundations/glass/GlassFilterDefs";
import type { StyleWithVars } from "../foundations/utils/types";

/**
 * Candidate recipes for regular glass, for the "Glass recipes" comparison story.
 * None of them is the default: `current` mirrors the shipped tokens (a test
 * checks that), and the others are proposals to be chosen by eye.
 *
 * A recipe is only numbers for knobs `glass.css` already has, so what the story
 * shows is exactly what adopting the recipe would ship. Everything is INFERRED;
 * Apple publishes no value for any of this.
 *
 * Pure TypeScript with no file access, so the story (in the browser) and the
 * test (in Node) compute the same contrast verdicts from it.
 */

export type RecipeAppearance = "light" | "dark";

export interface RecipeTone {
  /** Color of the veil, 0 to 255 per channel. */
  tint: readonly [number, number, number];
  /** Veil opacity at the tinted end of the slider and at the clear end, and the limits around both. */
  alphaTinted: number;
  alphaClear: number;
  alphaMin: number;
  alphaMax: number;
  /** Backdrop blur in CSS px at each end. */
  blurTinted: number;
  blurClear: number;
  /** Backdrop filter steps at the tinted end. */
  saturate: number;
  contrast: number;
  brightness: number;
  /** The same steps at the clear end. Omitted: constant across the slider, as shipped. */
  saturateClear?: number;
  contrastClear?: number;
  brightnessClear?: number;
  /** 0 = the slider is linear (shipped). 1 = quadratic: the middle sits nearer the tinted end. */
  clarityEase?: number;
  /** Opacity of the white sheen at the top of the surface. */
  sheen: number;
  /** Replacement for the whole edge treatment, as a list of inset shadows. Omitted: the shipped edge. */
  edge?: string;
}

export interface GlassRecipe {
  id: string;
  name: string;
  summary: string;
  light: RecipeTone;
  dark: RecipeTone;
  /** Parameters for this recipe's own refraction filter. Omitted: the shared, shipped filter. */
  refraction?: Required<Pick<GlassFilterDefsProps, "displacement" | "rim" | "highlight" | "lightAzimuth">>;
  /** Parts of the look the contrast model below does not include. */
  notModelled?: string;
}

/* ---- Fixed parts, mirrored from the stylesheets (glass-recipes.test.ts checks them) ---- */

/** WCAG 2.2 floors. The same numbers `contrast.test.ts` asserts for the shipped tokens. */
export const FLOORS = { label: 4.5, secondary: 4.5, tertiary: 3 } as const;

export const LABELS: Record<RecipeAppearance, Record<keyof typeof FLOORS, Rgba>> = {
  light: { label: rgb(0, 0, 0, 0.88), secondary: rgb(0, 0, 0, 0.72), tertiary: rgb(0, 0, 0, 0.56) },
  dark: { label: rgb(255, 255, 255, 0.92), secondary: rgb(255, 255, 255, 0.76), tertiary: rgb(255, 255, 255, 0.55) },
};

/** Hover and pressed overlays of an interactive surface. */
export const STATE_OVERLAYS: Record<RecipeAppearance, readonly Rgba[]> = {
  light: [rgb(0, 0, 0, 0.05), rgb(0, 0, 0, 0.1)],
  dark: [rgb(255, 255, 255, 0.06), rgb(255, 255, 255, 0.09)],
};

/** Where the clarity slider sits by default, and its clear end. */
export const DEFAULT_CLARITY = 0.5;
export const CLEAR_CLARITY = 1;

/* ---- The recipes ---------------------------------------------------------------------- */

const ASYMMETRIC_EDGE: Record<RecipeAppearance, string> = {
  // Top to bottom of the list: a crisp bright line and a soft glow under the top
  // edge, a thin dark line and a soft shadow above the bottom edge, a faint ring.
  light: [
    "inset 0 1.5px 0.5px 0 rgb(255 255 255 / 0.95)",
    "inset 0 10px 12px -8px rgb(255 255 255 / 0.55)",
    "inset 0 -1px 0.5px 0 rgb(0 0 0 / 0.16)",
    "inset 0 -10px 14px -9px rgb(0 0 0 / 0.2)",
    "inset 0 0 0 1px rgb(255 255 255 / 0.22)",
  ].join(", "),
  dark: [
    "inset 0 1.5px 0.5px 0 rgb(255 255 255 / 0.5)",
    "inset 0 10px 12px -8px rgb(255 255 255 / 0.14)",
    "inset 0 -1px 0.5px 0 rgb(0 0 0 / 0.5)",
    "inset 0 -10px 14px -9px rgb(0 0 0 / 0.45)",
    "inset 0 0 0 1px rgb(255 255 255 / 0.1)",
  ].join(", "),
};

const CURRENT_LIGHT: RecipeTone = {
  tint: [255, 255, 255],
  alphaTinted: 0.85,
  alphaClear: 0.3,
  alphaMin: 0.3,
  alphaMax: 0.96,
  blurTinted: 40,
  blurClear: 10,
  saturate: 1.8,
  contrast: 0.4,
  brightness: 1.6,
  sheen: 0.2,
};

const CURRENT_DARK: RecipeTone = {
  tint: [36, 36, 38],
  alphaTinted: 0.85,
  alphaClear: 0.15,
  alphaMin: 0.15,
  alphaMax: 0.96,
  blurTinted: 40,
  blurClear: 10,
  saturate: 1.6,
  contrast: 0.45,
  brightness: 0.36,
  sheen: 0.05,
};

const LESS_VEIL_LIGHT: RecipeTone = {
  tint: [255, 255, 255],
  alphaTinted: 0.5,
  alphaClear: 0.06,
  alphaMin: 0.06,
  alphaMax: 0.96,
  blurTinted: 26,
  blurClear: 6,
  saturate: 2.6,
  contrast: 0.35,
  brightness: 1.85,
  sheen: 0.12,
};

const LESS_VEIL_DARK: RecipeTone = {
  tint: [22, 22, 24],
  alphaTinted: 0.5,
  alphaClear: 0.06,
  alphaMin: 0.06,
  alphaMax: 0.96,
  blurTinted: 26,
  blurClear: 6,
  saturate: 2.4,
  contrast: 0.4,
  brightness: 0.3,
  sheen: 0.04,
};

export const GLASS_RECIPES: readonly GlassRecipe[] = [
  {
    id: "current",
    name: "1. Current default",
    summary: "What ships today: a strong white or dark veil over a blurred, range-compressed backdrop.",
    light: CURRENT_LIGHT,
    dark: CURRENT_DARK,
  },
  {
    id: "less-veil",
    name: "2. Less veil, more saturation",
    summary:
      "The lift that keeps text legible moves from the veil into brightness and contrast, and saturation is raised before it. Color from behind survives; blur is lighter.",
    light: LESS_VEIL_LIGHT,
    dark: LESS_VEIL_DARK,
  },
  {
    id: "clear-end",
    name: "3. Near-transparent clear end",
    summary:
      "Today's look at the default setting, but the filter steps fade out along the slider, on a curve, so the clear end is almost bare glass.",
    light: {
      ...CURRENT_LIGHT,
      alphaClear: 0.02,
      alphaMin: 0.02,
      blurClear: 1.5,
      saturateClear: 1.15,
      contrastClear: 1,
      brightnessClear: 1,
      clarityEase: 1,
    },
    dark: {
      ...CURRENT_DARK,
      alphaClear: 0.02,
      alphaMin: 0.02,
      blurClear: 1.5,
      saturateClear: 1.15,
      contrastClear: 1,
      brightnessClear: 1,
      clarityEase: 1,
    },
  },
  {
    id: "refraction-check",
    name: "4. Exaggerated refraction",
    summary:
      "A diagnostic, not a candidate: almost no veil or blur and a wide, strong rim, to show whether the refraction filter is applied in this browser at all.",
    light: {
      tint: [255, 255, 255],
      alphaTinted: 0.3,
      alphaClear: 0.05,
      alphaMin: 0.05,
      alphaMax: 0.96,
      blurTinted: 6,
      blurClear: 0.5,
      saturate: 1.5,
      contrast: 0.8,
      brightness: 1.15,
      sheen: 0.1,
    },
    dark: {
      tint: [30, 30, 32],
      alphaTinted: 0.3,
      alphaClear: 0.05,
      alphaMin: 0.05,
      alphaMax: 0.96,
      blurTinted: 6,
      blurClear: 0.5,
      saturate: 1.5,
      contrast: 0.8,
      brightness: 0.8,
      sheen: 0.04,
    },
    refraction: { displacement: 220, rim: 16, highlight: 1.2, lightAzimuth: 235 },
  },
  {
    id: "asymmetric-edge",
    name: "5. Asymmetric edge",
    summary:
      "Today's fill with a different rim: a bright reflection along the top, a soft shadow along the bottom, and the refraction light moved to straight above.",
    light: { ...CURRENT_LIGHT, edge: ASYMMETRIC_EDGE.light },
    dark: { ...CURRENT_DARK, edge: ASYMMETRIC_EDGE.dark },
    refraction: { displacement: 60, rim: 8, highlight: 0.9, lightAzimuth: 270 },
    notModelled: "The glow and shadow reach about 10 px in from the top and bottom edges. The verdict is for the body of the surface.",
  },
  {
    id: "combined",
    name: "6. Combined",
    summary:
      "Recipes 2, 3 and 5 together, with a moderate rim: less veil, more color, a clear end that is nearly bare, and the asymmetric edge.",
    light: {
      ...LESS_VEIL_LIGHT,
      alphaClear: 0.02,
      alphaMin: 0.02,
      blurClear: 1.5,
      saturateClear: 1.3,
      contrastClear: 1,
      brightnessClear: 1,
      clarityEase: 1,
      edge: ASYMMETRIC_EDGE.light,
    },
    dark: {
      ...LESS_VEIL_DARK,
      alphaClear: 0.02,
      alphaMin: 0.02,
      blurClear: 1.5,
      saturateClear: 1.3,
      contrastClear: 1,
      brightnessClear: 1,
      clarityEase: 1,
      edge: ASYMMETRIC_EDGE.dark,
    },
    refraction: { displacement: 90, rim: 10, highlight: 0.9, lightAzimuth: 270 },
    notModelled: "The glow and shadow reach about 10 px in from the top and bottom edges. The verdict is for the body of the surface.",
  },
];

/* ---- From a recipe to CSS ------------------------------------------------------------- */

export const recipeFilterId = (recipe: GlassRecipe) => `glass-recipe-${recipe.id}`;

/** The custom properties that put a recipe into effect for everything inside the element carrying them. */
export function recipeStyle(recipe: GlassRecipe, appearance: RecipeAppearance, clarity: number): StyleWithVars {
  const tone = recipe[appearance];
  const style: StyleWithVars = {
    "--glass-clarity": clarity,
    "--glass-tint-color": `rgb(${tone.tint.join(" ")})`,
    "--glass-alpha-tinted": tone.alphaTinted,
    "--glass-alpha-clear": tone.alphaClear,
    "--glass-alpha-min": tone.alphaMin,
    "--glass-alpha-max": tone.alphaMax,
    "--glass-blur-tinted": `${tone.blurTinted}px`,
    "--glass-blur-clear": `${tone.blurClear}px`,
    "--glass-saturate": tone.saturate,
    "--glass-contrast": tone.contrast,
    "--glass-brightness": tone.brightness,
    "--glass-sheen": `rgb(255 255 255 / ${tone.sheen})`,
  };
  if (tone.saturateClear !== undefined) style["--glass-saturate-clear"] = tone.saturateClear;
  if (tone.contrastClear !== undefined) style["--glass-contrast-clear"] = tone.contrastClear;
  if (tone.brightnessClear !== undefined) style["--glass-brightness-clear"] = tone.brightnessClear;
  if (tone.clarityEase !== undefined) style["--glass-clarity-ease"] = tone.clarityEase;
  if (tone.edge !== undefined) style["--glass-edge"] = tone.edge;
  if (recipe.refraction) style["--glass-refraction-filter"] = `url("#${recipeFilterId(recipe)}")`;
  return style;
}

/* ---- The contrast model, same math as contrast.test.ts ---------------------------------- */

export interface ResolvedGlass {
  alpha: number;
  blur: number;
  saturate: number;
  contrast: number;
  brightness: number;
}

/** What `glass-regular` computes for a clarity value and a size bias (0 for small surfaces, the worst case). */
export function resolveGlass(tone: RecipeTone, clarity: number, sizeBias = 0): ResolvedGlass {
  const c = Math.min(1, Math.max(0, clarity));
  const t = c + (c * c - c) * (tone.clarityEase ?? 0);
  const along = (from: number, to: number | undefined) => from + ((to ?? from) - from) * t;
  return {
    alpha: Math.min(tone.alphaMax, Math.max(tone.alphaMin, along(tone.alphaTinted, tone.alphaClear) + sizeBias)),
    blur: along(tone.blurTinted, tone.blurClear),
    saturate: along(tone.saturate, tone.saturateClear),
    contrast: along(tone.contrast, tone.contrastClear),
    brightness: along(tone.brightness, tone.brightnessClear),
  };
}

/** Every way the paint stack of a small surface can sit over a flat backdrop: with and without sheen and state overlay. */
export function recipeSurfaces(tone: RecipeTone, appearance: RecipeAppearance, clarity: number, backdrop: Rgba): Rgba[] {
  const glass = resolveGlass(tone, clarity);
  const filtered = filterBrightness(filterContrast(backdrop, glass.contrast), glass.brightness);
  const base = over(rgb(tone.tint[0], tone.tint[1], tone.tint[2], glass.alpha), filtered);
  const surfaces: Rgba[] = [];
  for (const sheen of [null, rgb(255, 255, 255, tone.sheen)]) {
    for (const overlay of [null, ...STATE_OVERLAYS[appearance]]) {
      let surface = sheen ? over(sheen, base) : base;
      if (overlay) surface = over(overlay, surface);
      surfaces.push(surface);
    }
  }
  return surfaces;
}

export interface BackdropVerdict {
  /** Lowest ratio of each label level over this backdrop, across sheen and interaction states. */
  ratios: Record<keyof typeof FLOORS, number>;
  /** Label levels below their floor. Empty means the backdrop passes. */
  failing: (keyof typeof FLOORS)[];
}

export interface RecipeVerdict {
  black: BackdropVerdict;
  white: BackdropVerdict;
}

/**
 * Whether the label levels keep their floors on a recipe, over the two extreme
 * backdrops. Any other backdrop lands between them (see contrast.test.ts).
 */
export function recipeVerdict(recipe: GlassRecipe, appearance: RecipeAppearance, clarity: number): RecipeVerdict {
  const judge = (backdrop: Rgba): BackdropVerdict => {
    const surfaces = recipeSurfaces(recipe[appearance], appearance, clarity, backdrop);
    const levels = Object.keys(FLOORS) as (keyof typeof FLOORS)[];
    const ratios = Object.fromEntries(
      levels.map((level) => [level, Math.min(...surfaces.map((surface) => inkContrast(LABELS[appearance][level], surface)))]),
    ) as Record<keyof typeof FLOORS, number>;
    return { ratios, failing: levels.filter((level) => ratios[level] < FLOORS[level]) };
  };
  return { black: judge(BLACK), white: judge(WHITE) };
}

/** One line for a person: "pass", or which levels fall short and by how much. */
export function describeVerdict(verdict: BackdropVerdict): string {
  if (verdict.failing.length === 0) return `pass (secondary ${verdict.ratios.secondary.toFixed(1)}:1)`;
  return `fails: ${verdict.failing.map((level) => `${level} ${verdict.ratios[level].toFixed(1)}:1`).join(", ")}`;
}
