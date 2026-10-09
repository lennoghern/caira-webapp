import { expect, test } from "@playwright/test";
import { AXE_VERSION, listStoryIds, openStory, runAxe, type Globals } from "./support";

/**
 * axe-core in a real browser over every story, across the theme matrix.
 *
 * What this proves: no axe violation of WCAG 2.2 A or AA (or of axe's best
 * practices) in the rendered stories, including color contrast of text on
 * opaque backgrounds.
 * What it does not prove:
 *  - Contrast of text on glass or on a material. axe ignores `backdrop-filter`,
 *    so those subtrees are left out of the contrast rule (see support.ts) and the
 *    number of text nodes left out is printed. contrast.test.ts (the model) and
 *    glass-pixels.spec.ts (real pixels) cover them instead.
 *  - Page-level rules (one main landmark, one h1, content in landmarks). A story
 *    is a fragment; those rules are for the app's pages.
 *  - Screen-reader output. Nothing automated here tests it.
 */

const THEMES: readonly (readonly [string, Globals])[] = [
  ["light", { appearance: "light" }],
  ["dark", { appearance: "dark" }],
  ["light, clear glass", { appearance: "light", clarity: "1" }],
  ["dark, clear glass", { appearance: "dark", clarity: "1" }],
  ["light, tinted glass", { appearance: "light", clarity: "0" }],
  ["dark, tinted glass", { appearance: "dark", clarity: "0" }],
  ["light, reduced transparency", { appearance: "light", transparency: "reduced" }],
  ["dark, reduced transparency", { appearance: "dark", transparency: "reduced" }],
  ["light, increased contrast", { appearance: "light", contrast: "more" }],
  ["dark, increased contrast", { appearance: "dark", contrast: "more" }],
  ["right to left, iOS density", { appearance: "light", direction: "rtl", platform: "ios" }],
];

// Measurement fixtures are bare surfaces, not UI.
const isFixture = (id: string) => id.startsWith("tests-");

async function checkAllStories(
  page: import("@playwright/test").Page,
  globals: Globals,
  label: string,
  options: { contrast?: boolean } = {},
) {
  const ids = (await listStoryIds(page)).filter((id) => !isFixture(id));
  expect(ids.length).toBeGreaterThan(10);
  const failures: string[] = [];
  let incompleteContrast = 0;
  let onFilteredSurfaces = 0;
  let passes = 0;
  for (const id of ids) {
    await openStory(page, id, globals);
    const result = await runAxe(page, options);
    passes += result.passes;
    onFilteredSurfaces += result.textOnFilteredSurfaces;
    incompleteContrast += result.incomplete.find((rule) => rule.id === "color-contrast")?.nodes ?? 0;
    for (const violation of result.violations) {
      for (const node of violation.nodes) {
        failures.push(`${id}: ${violation.id} (${violation.impact}) ${violation.help}\n    ${node.target}\n    ${node.summary.replace(/\n\s*/g, " ")}`);
      }
    }
  }
  console.log(
    `axe ${AXE_VERSION} | ${label} | ${ids.length} stories | ${passes} rule passes | ${failures.length} violations | ` +
      `${incompleteContrast} nodes where axe could not determine contrast | ` +
      `${onFilteredSurfaces} text nodes on glass or materials left to the pixel tests`,
  );
  expect(failures, failures.join("\n")).toEqual([]);
}

for (const [label, globals] of THEMES) {
  test(`no axe violations: ${label}`, async ({ page }) => {
    test.setTimeout(180_000);
    await checkAllStories(page, globals, label);
  });
}

test("no axe violations: forced colors", async ({ page }) => {
  test.setTimeout(180_000);
  await page.emulateMedia({ forcedColors: "active" });
  // Without the contrast rule. In forced colors the browser paints text and
  // backgrounds in the person's system palette at paint time, while axe reads a
  // mix of forced and authored values from computed style, so its ratios describe
  // colors that are not on screen. What the library must do in this mode (drop
  // blur, keep a visible edge) is asserted in glass-pixels.spec.ts.
  await checkAllStories(page, { appearance: "light" }, "forced colors (structure only)", { contrast: false });
});

test("no axe violations: system dark with reduced motion", async ({ page }) => {
  test.setTimeout(180_000);
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await checkAllStories(page, {}, "system dark, reduced motion");
});
