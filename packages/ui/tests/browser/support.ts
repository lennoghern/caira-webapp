import { createRequire } from "node:module";
import { expect, type Locator, type Page } from "@playwright/test";
import type { Rgba } from "../../src/test/color";

export type Globals = Record<string, string>;

export function storyUrl(id: string, globals: Globals = {}): string {
  const query = new URLSearchParams({ id });
  const formatted = Object.entries(globals)
    .map(([key, value]) => `${key}:${value}`)
    .join(";");
  if (formatted) query.set("globals", formatted);
  return `?${query}`;
}

export async function openStory(page: Page, id: string, globals: Globals = {}): Promise<void> {
  await page.goto(storyUrl(id, globals));
  await expect(page.locator(`[data-story="${id}"]`)).toBeAttached();
  // Fonts and the first frame settle before anything is measured.
  await page.evaluate(() => document.fonts.ready.then(() => new Promise(requestAnimationFrame)));
}

/** Every story id the harness knows, read from its index page. */
export async function listStoryIds(page: Page): Promise<string[]> {
  await page.goto("./");
  const hrefs = await page.locator('a[href*="id="]').evaluateAll((links) => links.map((link) => link.getAttribute("href") ?? ""));
  return [...new Set(hrefs.map((href) => new URLSearchParams(href.replace(/^\?/, "")).get("id") ?? "").filter(Boolean))];
}

/**
 * Average color the browser painted in a small square inside an element.
 * `at` is a fraction of the element's box. Pixels are read from a screenshot,
 * the only way to see the result of a backdrop filter, and decoded in the page.
 */
export async function samplePixels(
  page: Page,
  target: Locator,
  at: { x: number; y: number } = { x: 0.5, y: 0.5 },
  size = 6,
): Promise<Rgba> {
  const box = await target.boundingBox();
  if (!box) throw new Error("Element to sample is not visible");
  const clip = {
    x: Math.round(box.x + box.width * at.x - size / 2),
    y: Math.round(box.y + box.height * at.y - size / 2),
    width: size,
    height: size,
  };
  const png = await page.screenshot({ clip, animations: "disabled" });
  return page.evaluate(async (base64) => {
    const image = new Image();
    image.src = `data:image/png;base64,${base64}`;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext("2d", { colorSpace: "srgb" })!;
    context.drawImage(image, 0, 0);
    const { data } = context.getImageData(0, 0, image.width, image.height);
    const sum = [0, 0, 0];
    for (let index = 0; index < data.length; index += 4) {
      sum[0]! += data[index]!;
      sum[1]! += data[index + 1]!;
      sum[2]! += data[index + 2]!;
    }
    const pixels = data.length / 4;
    return { r: sum[0]! / pixels / 255, g: sum[1]! / pixels / 255, b: sum[2]! / pixels / 255, a: 1 };
  }, png.toString("base64"));
}

export interface AxeSummary {
  violations: { id: string; impact: string | null; help: string; nodes: { target: string; summary: string }[] }[];
  incomplete: { id: string; nodes: number }[];
  passes: number;
}

// axe-core is not a direct dependency (only what ARCHITECTURE.md section 11 lists
// is installed). It is resolved through @storybook/addon-a11y, which depends on it.
const requireFromHere = createRequire(import.meta.url);
const requireFromAddon = createRequire(requireFromHere.resolve("@storybook/addon-a11y/package.json"));
export const AXE_SOURCE_PATH = requireFromAddon.resolve("axe-core/axe.min.js");
export const AXE_VERSION = (requireFromAddon("axe-core/package.json") as { version: string }).version;

/**
 * Rules about a whole page. A story is a fragment with no <main> and no <h1>,
 * so these would fail on every story for reasons that say nothing about the
 * component. They belong to the app's pages.
 */
const PAGE_LEVEL_RULES = ["region", "landmark-one-main", "page-has-heading-one"];

/**
 * Subtrees whose background is produced by `backdrop-filter`. axe composites
 * the translucent tint over whatever CSS color lies behind and ignores the
 * filter, so its contrast verdict there is about a surface that is never painted.
 * Contrast on these surfaces is checked from real pixels in glass-pixels.spec.ts.
 */
const FILTERED_SURFACES = ["[data-glass]", "[data-material]"];

/**
 * Runs axe-core in the page against WCAG 2.2 A and AA plus best practices.
 * Two passes: every rule but color contrast on the whole document, then color
 * contrast on everything that is not a filtered surface.
 */
export async function runAxe(
  page: Page,
  { contrast: checkContrast = true }: { contrast?: boolean } = {},
): Promise<AxeSummary & { textOnFilteredSurfaces: number }> {
  await page.addScriptTag({ path: AXE_SOURCE_PATH });
  return page.evaluate(
    async ({ pageLevelRules, filteredSurfaces, checkContrast }) => {
      interface AxeNode {
        target: unknown[];
        failureSummary?: string;
      }
      interface AxeRule {
        id: string;
        impact?: string | null;
        help: string;
        nodes: AxeNode[];
      }
      interface AxeRunResult {
        violations: AxeRule[];
        incomplete: AxeRule[];
        passes: AxeRule[];
      }
      const axe = (window as unknown as { axe: { run: (context: object, options: object) => Promise<AxeRunResult> } }).axe;
      const tags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];
      const off = (rules: string[]) => Object.fromEntries(rules.map((rule) => [rule, { enabled: false }]));

      const structure = await axe.run(document, {
        runOnly: { type: "tag", values: tags },
        rules: off([...pageLevelRules, "color-contrast"]),
      });
      const contrast: AxeRunResult = checkContrast
        ? await axe.run(
            { include: ["html"], exclude: filteredSurfaces },
            { runOnly: { type: "rule", values: ["color-contrast"] } },
          )
        : { violations: [], incomplete: [], passes: [] };

      const summarize = (rules: AxeRule[]) =>
        rules.map((rule) => ({
          id: rule.id,
          impact: rule.impact ?? null,
          help: rule.help,
          nodes: rule.nodes.map((node) => ({ target: String(node.target), summary: node.failureSummary ?? "" })),
        }));
      const textNodes = (root: Element) => {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        let count = 0;
        while (walker.nextNode()) if (walker.currentNode.textContent?.trim()) count += 1;
        return count;
      };
      const surfaces = [...document.querySelectorAll(filteredSurfaces.join(","))].filter(
        (element) => element.parentElement?.closest(filteredSurfaces.join(",")) == null,
      );

      return {
        violations: [...summarize(structure.violations), ...summarize(contrast.violations)],
        incomplete: [...structure.incomplete, ...contrast.incomplete].map((rule) => ({ id: rule.id, nodes: rule.nodes.length })),
        passes: structure.passes.length + contrast.passes.length,
        textOnFilteredSurfaces: surfaces.reduce((sum, surface) => sum + textNodes(surface), 0),
      };
    },
    { pageLevelRules: PAGE_LEVEL_RULES, filteredSurfaces: FILTERED_SURFACES, checkContrast },
  );
}
