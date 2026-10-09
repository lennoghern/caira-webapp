import { expect, test } from "@playwright/test";
import {
  BLACK,
  WHITE,
  filterBrightness,
  filterContrast,
  gray,
  inkContrast,
  over,
  withAlpha,
  type Rgba,
} from "../../src/test/color";
import { resolveTokens, type TokenSet } from "../../src/test/css-tokens";
import { paintedSamples } from "./painted";
import { openStory, samplePixels } from "./support";

/**
 * Reads what the browser really painted for glass and materials and compares it
 * with the contrast model (src/styles/contrast.test.ts).
 *
 * What this proves, for the engine it runs in: (1) the model predicts the
 * painted surface color, so the floors computed from the tokens are real, and
 * (2) every label level keeps its WCAG ratio on the painted surface, over a
 * pure black and a pure white backdrop, at rest and in the hovered and pressed
 * states of an interactive surface.
 * What it does not prove: anything about an engine it did not run in, or about
 * backdrops with detail (the model argues those lie between black and white).
 */

const FIXTURE = "tests-fixtures--surface-pixels";
const APPEARANCES = ["light", "dark"] as const;
const BACKDROPS = { black: BLACK, white: WHITE } as const;
const MATERIALS = ["material-ultrathin", "material-thin", "material-regular", "material-thick"];
const GLASS = ["glass-0", "glass-0.5", "glass-1"];
const STATES = ["rest", "hovered", "pressed"] as const;
// Below the sheen gradient (which ends at 55% of the height) and above the bottom edge line.
const SAMPLE_AT = { x: 0.5, y: 0.8 };
/**
 * How far a painted surface may sit from the model, in 8-bit levels. This is a
 * check on the model, not a contrast threshold: the ratios below are always
 * computed from the painted color itself.
 *
 * 4 covers the rounding of an 8-bit filter chain. Firefox gets 6: it paints dark
 * glass at the clear end (a 6 px blur) 3 to 4 levels lighter than the model over
 * a white backdrop (55, 68 and 73 where the model and Chromium have 52, 64 and
 * 70; measured 2026-10-09). A Chromium recording read the same way matches its
 * own screenshots, so that is the engine and not the video. Recorded as D-036.
 */
const TOLERANCE = 4 / 255;
const TOLERANCE_BY_ENGINE: Record<string, number> = { firefox: 6 / 255 };

/** WCAG 2.2 floors, the same as in contrast.test.ts. */
const FLOORS = { label: 4.5, secondary: 4.5, tertiary: 3 } as const;
/**
 * Asked for by the owner when the default recipe changed on 2026-10-09: on a
 * surface at rest the secondary label has at least 5:1. It is an extra
 * requirement on top of the floors, not a replacement for any of them.
 */
const SECONDARY_AT_REST = 5;

/**
 * The tightest surface in the library, accepted by the owner on 2026-10-09 with
 * the recipe left as chosen: light glass at the clear end, pressed, over pure
 * black. Its secondary label is 0.01 to 0.06 above the 4.5:1 floor, depending on
 * the engine and on whether a GPU draws the page:
 *
 *   painted level (of 255)   ratio   where
 *   142.00                   4.51    Firefox, headless
 *   142.47                   4.53    Chromium, headless (software rendering)
 *   143.00                   4.56    Chromium, Chrome and Edge with a GPU; Firefox with a window
 *   141.65                   4.50    the floor
 *
 * Each reading repeated exactly over three runs, so the test is not flaky. It
 * is brittle across setups: one 8-bit level lower fails it, and that would be a
 * real, hairline shortfall on that setup, not noise. The floor stays where it is.
 * The headroom is printed with every run so a drift shows before it fails.
 * Recorded as D-035 in DECISIONS.md.
 */
const TIGHTEST_SURFACE = "light/black/glass-1-pressed";

/** The darkest gray surface, 0 to 1, on which `ink` still reaches `floor`. For dark ink on a lighter surface. */
function lowestSurfaceFor(ink: Rgba, floor: number): number {
  let low = 0.2;
  let high = 1;
  for (let step = 0; step < 40; step += 1) {
    const middle = (low + high) / 2;
    if (inkContrast(ink, gray(middle)) >= floor) high = middle;
    else low = middle;
  }
  return high;
}

function predict(tokens: TokenSet, surface: string, state: (typeof STATES)[number], backdrop: Rgba): Rgba {
  const [kind, detail] = surface.split("-") as [string, string];
  if (kind === "material") {
    const filtered = filterBrightness(
      filterContrast(backdrop, tokens.number("--material-contrast")),
      tokens.number("--material-brightness"),
    );
    return over(withAlpha(tokens.color("--material-tint-color"), tokens.number(`--material-${detail}-alpha`)), filtered);
  }
  const clarity = Number(detail);
  const tinted = tokens.number("--glass-alpha-tinted");
  const alpha = Math.min(
    tokens.number("--glass-alpha-max"),
    Math.max(tokens.number("--glass-alpha-min"), tinted + (tokens.number("--glass-alpha-clear") - tinted) * clarity),
  );
  const filtered = filterBrightness(
    filterContrast(backdrop, tokens.number("--glass-contrast")),
    tokens.number("--glass-brightness"),
  );
  const base = over(withAlpha(tokens.color("--glass-tint-color"), alpha), filtered);
  if (state === "rest") return base;
  return over(tokens.color(state === "hovered" ? "--glass-hover-overlay" : "--glass-pressed-overlay"), base);
}

const to255 = (color: Rgba) => [color.r, color.g, color.b].map((channel) => Math.round(channel * 255)).join(",");
const distance = (a: Rgba, b: Rgba) => Math.max(Math.abs(a.r - b.r), Math.abs(a.g - b.g), Math.abs(a.b - b.b));

interface Reading {
  name: string;
  appearance: (typeof APPEARANCES)[number];
  state: (typeof STATES)[number];
  label: number;
  secondary: number;
  tertiary: number;
}

for (const refraction of ["off", "on"] as const) {
  test(`painted surfaces match the model and keep the contrast floor (refraction ${refraction})`, async ({ page, browser, baseURL }, testInfo) => {
    test.setTimeout(120_000);
    const engine = testInfo.project.name;
    const painted = await paintedSamples(page, browser, engine, baseURL!, FIXTURE, { refraction }, SAMPLE_AT);
    const report: string[] = [];
    const readings: Reading[] = [];
    let worstDistance = 0;

    for (const appearance of APPEARANCES) {
      const tokens = resolveTokens({ dark: appearance === "dark", contrast: false });
      for (const [backdropName, backdrop] of Object.entries(BACKDROPS)) {
        const samples = [
          ...MATERIALS.map((surface) => ({ surface, state: "rest" as const, sample: surface })),
          ...STATES.flatMap((state) =>
            GLASS.map((surface) => ({ surface, state, sample: state === "rest" ? surface : `${surface}-${state}` })),
          ),
        ];
        for (const { surface, state, sample } of samples) {
          const name = `${appearance}/${backdropName}/${sample}`;
          const color = painted.get(name);
          if (!color) throw new Error(`No sample named ${name}`);
          const predicted = predict(tokens, surface, state, backdrop);
          const off = distance(color, predicted);
          worstDistance = Math.max(worstDistance, off);
          const reading: Reading = {
            name,
            appearance,
            state,
            label: inkContrast(tokens.color("--label"), color),
            secondary: inkContrast(tokens.color("--label-secondary"), color),
            tertiary: inkContrast(tokens.color("--label-tertiary"), color),
          };
          readings.push(reading);
          report.push(
            `${name.padEnd(36)} painted ${to255(color).padEnd(12)} model ${to255(predicted).padEnd(12)} ` +
              `label ${reading.label.toFixed(2)} secondary ${reading.secondary.toFixed(2)} tertiary ${reading.tertiary.toFixed(2)}`,
          );
          expect
            .soft(off, `${name}: painted ${to255(color)}, model ${to255(predicted)}`)
            .toBeLessThanOrEqual(TOLERANCE_BY_ENGINE[engine] ?? TOLERANCE);
          expect.soft(reading.label, `${name}: label`).toBeGreaterThanOrEqual(FLOORS.label);
          expect.soft(reading.secondary, `${name}: secondary label`).toBeGreaterThanOrEqual(FLOORS.secondary);
          expect.soft(reading.tertiary, `${name}: tertiary label`).toBeGreaterThanOrEqual(FLOORS.tertiary);
          if (state === "rest") {
            expect.soft(reading.secondary, `${name}: secondary label at rest`).toBeGreaterThanOrEqual(SECONDARY_AT_REST);
          }
        }
      }
    }

    // The margins, lowest first, for each appearance and state.
    const lowest = (appearance: string, state: string, level: "label" | "secondary" | "tertiary") => {
      const found = readings.filter((r) => r.appearance === appearance && r.state === state).sort((a, b) => a[level] - b[level])[0]!;
      return `${found[level].toFixed(2)} (${found.name.split("/").slice(1).join(" / ")})`;
    };
    // Secondary label on glass at rest, by clarity setting: "over black / over white".
    const atRest = (appearance: string, clarity: string) =>
      ["black", "white"]
        .map((backdrop) => readings.find((r) => r.name === `${appearance}/${backdrop}/glass-${clarity}`)!.secondary.toFixed(2))
        .join(" / ");
    const tightest = painted.get(TIGHTEST_SURFACE)!;
    const floorLevel = lowestSurfaceFor(
      resolveTokens({ dark: false, contrast: false }).color("--label-secondary"),
      FLOORS.secondary,
    );
    const summary = [
      `${engine} | refraction ${refraction} | ${readings.length} surfaces | largest difference from the model: ${(worstDistance * 255).toFixed(1)} of 255`,
      `${engine} | tightest surface (${TIGHTEST_SURFACE}): painted ${(tightest.r * 255).toFixed(2)} of 255, ` +
        `the ${FLOORS.secondary}:1 floor is at ${(floorLevel * 255).toFixed(2)}, headroom ${((tightest.r - floorLevel) * 255).toFixed(2)} levels`,
      ...APPEARANCES.map(
        (appearance) =>
          `${engine} | ${appearance.padEnd(5)} glass at rest, secondary over black / white | tinted ${atRest(appearance, "0")} | ` +
          `default ${atRest(appearance, "0.5")} | clear ${atRest(appearance, "1")}`,
      ),
      ...APPEARANCES.flatMap((appearance) =>
        STATES.map(
          (state) =>
            `${engine} | ${appearance.padEnd(5)} ${state.padEnd(7)} | lowest secondary ${lowest(appearance, state, "secondary")} | ` +
            `lowest label ${lowest(appearance, state, "label")} | lowest tertiary ${lowest(appearance, state, "tertiary")}`,
        ),
      ),
    ].join("\n");
    console.log(summary);
    await testInfo.attach("surface-pixels.txt", { body: `${summary}\n${report.join("\n")}`, contentType: "text/plain" });
  });
}

test("increased contrast raises the floor to 7:1 on painted surfaces", async ({ page, browser, baseURL }, testInfo) => {
  test.setTimeout(120_000);
  const painted = await paintedSamples(
    page,
    browser,
    testInfo.project.name,
    baseURL!,
    FIXTURE,
    { contrast: "more", refraction: "off" },
    SAMPLE_AT,
  );
  for (const appearance of APPEARANCES) {
    const tokens = resolveTokens({ dark: appearance === "dark", contrast: true });
    for (const backdrop of ["black", "white"]) {
      for (const surface of [...MATERIALS, ...GLASS]) {
        const name = `${appearance}/${backdrop}/${surface}`;
        const color = painted.get(name)!;
        expect.soft(inkContrast(tokens.color("--label"), color), `${name}: label`).toBeGreaterThanOrEqual(7);
        expect.soft(inkContrast(tokens.color("--label-secondary"), color), `${name}: secondary`).toBeGreaterThanOrEqual(7);
        expect.soft(inkContrast(tokens.color("--label-tertiary"), color), `${name}: tertiary`).toBeGreaterThanOrEqual(4.5);
      }
    }
  }
});

test("reduced transparency paints the opaque surface token exactly", async ({ page }) => {
  // Opaque surfaces have no backdrop filter, so a screenshot is reliable in every engine.
  await openStory(page, FIXTURE, { transparency: "reduced" });
  for (const appearance of APPEARANCES) {
    const solid = resolveTokens({ dark: appearance === "dark", contrast: false }).color("--surface-solid");
    for (const backdrop of ["black", "white"]) {
      for (const surface of ["material-thin", "glass-0.5"]) {
        const target = page.locator(`[data-sample="${appearance}/${backdrop}/${surface}"]`);
        const painted = await samplePixels(page, target, SAMPLE_AT);
        expect(to255(painted), `${appearance}/${backdrop}/${surface}`).toBe(to255(solid));
        expect(await target.evaluate((element) => getComputedStyle(element).backdropFilter)).toBe("none");
      }
    }
  }
});

test("forced colors drops the blur and gives every surface a real edge", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await openStory(page, FIXTURE);
  for (const surface of ["material-thin", "glass-0.5"]) {
    const styles = await page.locator(`[data-sample="light/white/${surface}"]`).evaluate((element) => {
      const computed = getComputedStyle(element);
      return {
        backdropFilter: computed.backdropFilter,
        boxShadow: computed.boxShadow,
        outlineStyle: computed.outlineStyle,
        outlineWidth: computed.outlineWidth,
      };
    });
    expect(styles.backdropFilter, surface).toBe("none");
    expect(styles.boxShadow, surface).toBe("none");
    expect(styles.outlineStyle, surface).toBe("solid");
    expect(styles.outlineWidth, surface).toBe("1px");
  }
});
