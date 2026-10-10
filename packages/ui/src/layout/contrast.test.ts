import { describe, expect, it } from "vitest";
import { contrastRatio, inkContrast, over, type Rgba } from "../test/color";
import { COLOR_STATES, resolveTokens } from "../test/css-tokens";

/**
 * The contrast of what the Layout components paint on top of the opaque
 * backgrounds: the grays under a hovered, pressed or striped row, the track of
 * a tab view, and the highlight of a selected row. Computed from the tokens
 * that ship, with the floors of src/styles/contrast.test.ts, unchanged: 4.5:1
 * for primary and secondary labels and 3:1 for tertiary; 7:1 and 4.5:1 under
 * increased contrast.
 *
 * What this proves: the WCAG 2.2 ratio of each label level on each of those
 * surfaces. These surfaces are plain translucent colors over opaque ones, with
 * no backdrop filter, so the arithmetic is the whole story and axe measures the
 * same thing in a real browser (stories-axe.spec.ts).
 * What it does not prove: anything about a custom accent color.
 */

const AA_TEXT = 4.5;
const AA_LARGE_OR_NON_TEXT = 3;
const AAA_TEXT = 7;

// Where a row can sit: the page, a box or an inset list, and a box inside a box.
const BACKGROUNDS = ["--background", "--background-secondary", "--background-tertiary"] as const;

// selection.css and the *.styles.ts files of this category.
const ROW_FILLS = [
  ["a hovered row or a stripe", "--fill-quaternary"],
  ["a pressed row or the track of a tab view", "--fill-tertiary"],
] as const;

// The disclosure button draws its glyph and its label in the primary label color only.
const BUTTON_FILLS = [
  ["a disclosure button at rest", "--fill-tertiary"],
  ["a hovered disclosure button", "--fill-secondary"],
  ["a pressed disclosure button", "--fill"],
] as const;

describe.each(COLOR_STATES)("layout surfaces: $label", (state) => {
  const tokens = resolveTokens(state);
  const textFloor = state.contrast ? AAA_TEXT : AA_TEXT;
  const tertiaryFloor = state.contrast ? AA_TEXT : AA_LARGE_OR_NON_TEXT;
  const labels = [
    ["--label", textFloor],
    ["--label-secondary", textFloor],
    ["--label-tertiary", tertiaryFloor],
  ] as const;

  it.each(ROW_FILLS)("labels on %s, over every background", (_name, fill) => {
    for (const background of BACKGROUNDS) {
      const surface = over(tokens.color(fill), tokens.color(background));
      for (const [label, floor] of labels) {
        expect(inkContrast(tokens.color(label), surface), `${label} on ${fill} over ${background}`).toBeGreaterThanOrEqual(floor);
      }
    }
  });

  it("text on the selection highlight, whatever label level it was", () => {
    // selection.css re-declares the three label tokens as the on-accent color inside a selected row.
    expect(contrastRatio(tokens.color("--on-accent"), tokens.color("--accent-fill"))).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it.each(BUTTON_FILLS)("the primary label on %s, over every background", (_name, fill) => {
    for (const background of BACKGROUNDS) {
      const surface = over(tokens.color(fill), tokens.color(background));
      expect(inkContrast(tokens.color("--label"), surface), `--label on ${fill} over ${background}`).toBeGreaterThanOrEqual(textFloor);
    }
  });

  it("the checkmark of an option list, on a row at rest and hovered", () => {
    for (const background of BACKGROUNDS) {
      const rest = tokens.color(background);
      const hovered = over(tokens.color("--fill-quaternary"), rest);
      for (const surface of [rest, hovered]) {
        expect(inkContrast(tokens.color("--accent-text"), surface), `checkmark over ${background}`).toBeGreaterThanOrEqual(AA_LARGE_OR_NON_TEXT);
      }
    }
  });

  it("the focus ring of a tab: the label color on the track, the on-accent color on the highlight", () => {
    for (const background of BACKGROUNDS) {
      const track = over(tokens.color("--fill-tertiary"), tokens.color(background));
      expect(inkContrast(tokens.color("--label"), track), `ring on the track over ${background}`).toBeGreaterThanOrEqual(AA_LARGE_OR_NON_TEXT);
    }
    expect(contrastRatio(tokens.color("--on-accent"), tokens.color("--accent-fill"))).toBeGreaterThanOrEqual(AA_LARGE_OR_NON_TEXT);
  });
});

/**
 * Why a row with keyboard focus takes no hover or pressed fill (the `not-focus-visible` in the
 * row classes): the accent focus ring, which contrast.test.ts holds to 3:1 on the bare
 * backgrounds, falls under it on those grays. Pinned so the reason stays visible.
 */
describe("the accent focus ring on a hovered row", () => {
  it("is under 3:1 in these cases, so a focused row is never drawn hovered", () => {
    const under = COLOR_STATES.flatMap((state) => {
      const tokens = resolveTokens(state);
      return BACKGROUNDS.map((background) => {
        const hovered = over(tokens.color("--fill-quaternary"), tokens.color(background));
        return [`${state.label}: ${background}`, inkContrast(tokens.color("--focus-ring"), hovered)] as const;
      });
    })
      .filter(([, ratio]) => ratio < AA_LARGE_OR_NON_TEXT)
      .map(([name, ratio]) => `${name} = ${ratio.toFixed(2)}`);
    expect(under).toMatchInlineSnapshot(`
      [
        "light: --background-secondary = 2.89",
        "dark: --background-tertiary = 2.95",
      ]
    `);
  });
});

/**
 * Is the highlight alone enough to tell a selected row from the ones around it?
 * WCAG 2.2 1.4.11 asks 3:1 between a state indicator and what is next to it.
 * The answer is no in general, and this pins exactly where, so the claim in
 * selection.css stays true: the highlight is not the only cue, a selected row
 * is also set in semibold.
 */
describe("the selection highlight against the surface around it", () => {
  const ratios = COLOR_STATES.flatMap((state) => {
    const tokens = resolveTokens(state);
    const fill = tokens.color("--accent-fill");
    const track = (background: Rgba) => over(tokens.color("--fill-tertiary"), background);
    return [
      ...BACKGROUNDS.map((background) => [`${state.label}: row on ${background}`, contrastRatio(fill, tokens.color(background))] as const),
      [`${state.label}: tab on its track over --background`, contrastRatio(fill, track(tokens.color("--background")))] as const,
    ];
  });

  it("reaches 3:1 in light appearance on every surface", () => {
    for (const [name, ratio] of ratios.filter(([name]) => !/dark/.test(name))) {
      expect(ratio, name).toBeGreaterThanOrEqual(AA_LARGE_OR_NON_TEXT);
    }
  });

  it("does not reach 3:1 in dark appearance on these surfaces, which is why the highlight is not the only cue", () => {
    const under = ratios.filter(([, ratio]) => ratio < AA_LARGE_OR_NON_TEXT).map(([name, ratio]) => `${name} = ${ratio.toFixed(2)}`);
    expect(under).toMatchInlineSnapshot(`
      [
        "dark: row on --background-secondary = 2.61",
        "dark: row on --background-tertiary = 2.12",
        "dark: tab on its track over --background = 2.39",
        "dark, increased contrast: row on --background = 2.37",
        "dark, increased contrast: row on --background-secondary = 1.75",
        "dark, increased contrast: row on --background-tertiary = 1.36",
        "dark, increased contrast: tab on its track over --background = 1.59",
      ]
    `);
  });
});
