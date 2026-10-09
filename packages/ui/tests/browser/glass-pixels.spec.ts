import { expect, test } from "@playwright/test";
import {
  BLACK,
  WHITE,
  filterBrightness,
  filterContrast,
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
 * pure black and a pure white backdrop.
 * What it does not prove: anything about an engine it did not run in, or about
 * backdrops with detail (the model argues those lie between black and white).
 */

const FIXTURE = "tests-fixtures--surface-pixels";
const APPEARANCES = ["light", "dark"] as const;
const BACKDROPS = { black: BLACK, white: WHITE } as const;
const SURFACES = ["material-ultrathin", "material-thin", "material-regular", "material-thick", "glass-0", "glass-0.5", "glass-1"];
// Below the sheen gradient (which ends at 55% of the height) and above the bottom edge line.
const SAMPLE_AT = { x: 0.5, y: 0.8 };
// 8-bit rounding in the filter chain, plus video compression where Firefox is read
// from a recording (see painted.ts). Measured deviations are in PROGRESS.md.
const TOLERANCE = 4 / 255;

function predict(tokens: TokenSet, surface: string, backdrop: Rgba): Rgba {
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
  return over(withAlpha(tokens.color("--glass-tint-color"), alpha), filtered);
}

const to255 = (color: Rgba) => [color.r, color.g, color.b].map((channel) => Math.round(channel * 255)).join(",");
const distance = (a: Rgba, b: Rgba) => Math.max(Math.abs(a.r - b.r), Math.abs(a.g - b.g), Math.abs(a.b - b.b));

for (const refraction of ["off", "on"] as const) {
  test(`painted surfaces match the model and keep the contrast floor (refraction ${refraction})`, async ({ page, browser, baseURL }, testInfo) => {
    test.setTimeout(120_000);
    const engine = testInfo.project.name;
    const painted = await paintedSamples(page, browser, engine, baseURL!, FIXTURE, { refraction }, SAMPLE_AT);
    const report: string[] = [];
    let worstDistance = 0;

    for (const appearance of APPEARANCES) {
      const tokens = resolveTokens({ dark: appearance === "dark", contrast: false });
      for (const [backdropName, backdrop] of Object.entries(BACKDROPS)) {
        for (const surface of SURFACES) {
          const name = `${appearance}/${backdropName}/${surface}`;
          const color = painted.get(name);
          if (!color) throw new Error(`No sample named ${name}`);
          const predicted = predict(tokens, surface, backdrop);
          const off = distance(color, predicted);
          worstDistance = Math.max(worstDistance, off);
          const ratios = {
            label: inkContrast(tokens.color("--label"), color),
            secondary: inkContrast(tokens.color("--label-secondary"), color),
            tertiary: inkContrast(tokens.color("--label-tertiary"), color),
          };
          report.push(
            `${name.padEnd(34)} painted ${to255(color).padEnd(12)} model ${to255(predicted).padEnd(12)} ` +
              `label ${ratios.label.toFixed(2)} secondary ${ratios.secondary.toFixed(2)} tertiary ${ratios.tertiary.toFixed(2)}`,
          );
          expect.soft(off, `${name}: painted ${to255(color)}, model ${to255(predicted)}`).toBeLessThanOrEqual(TOLERANCE);
          expect.soft(ratios.label, `${name}: label`).toBeGreaterThanOrEqual(4.5);
          expect.soft(ratios.secondary, `${name}: secondary label`).toBeGreaterThanOrEqual(4.5);
          expect.soft(ratios.tertiary, `${name}: tertiary label`).toBeGreaterThanOrEqual(3);
        }
      }
    }

    const worstRatio = (key: "label" | "secondary" | "tertiary") =>
      Math.min(...report.map((line) => Number(new RegExp(`${key} ([\\d.]+)`).exec(line)?.[1])));
    const summary =
      `${engine} | refraction ${refraction} | ${report.length} surfaces | ` +
      `largest difference from the model: ${(worstDistance * 255).toFixed(1)} of 255 | ` +
      `lowest ratios: label ${worstRatio("label")}, secondary ${worstRatio("secondary")}, tertiary ${worstRatio("tertiary")}`;
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
      for (const surface of SURFACES) {
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
