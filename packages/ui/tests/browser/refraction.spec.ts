import { expect, test, type Locator, type Page } from "@playwright/test";
import { openStory } from "./support";

/**
 * Rendering tier 2: does this engine apply an SVG filter given to
 * `backdrop-filter`, and does the provider's detection agree with what is painted?
 *
 * The fixture is one glass surface over hard black and white stripes. With the
 * displacement filter applied, the stripes bend along the rim; the middle of the
 * surface is untouched.
 */

const FIXTURE = "tests-fixtures--refraction";
const CHROMIUM_PROJECTS = ["chromium", "chrome", "msedge"];

/** Share of pixels that differ visibly between two screenshots of the same region of an element. */
async function differingShare(page: Page, before: Buffer, after: Buffer): Promise<number> {
  return page.evaluate(
    async ([first, second]) => {
      const load = async (base64: string) => {
        const image = new Image();
        image.src = `data:image/png;base64,${base64}`;
        await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext("2d")!;
        context.drawImage(image, 0, 0);
        return context.getImageData(0, 0, image.width, image.height).data;
      };
      const [a, b] = await Promise.all([load(first!), load(second!)]);
      let different = 0;
      for (let index = 0; index < a.length; index += 4) {
        const delta = Math.abs(a[index]! - b[index]!) + Math.abs(a[index + 1]! - b[index + 1]!) + Math.abs(a[index + 2]! - b[index + 2]!);
        if (delta > 48) different += 1;
      }
      return different / (a.length / 4);
    },
    [before.toString("base64"), after.toString("base64")],
  );
}

async function capture(page: Page, surface: Locator, region: "rim" | "middle"): Promise<Buffer> {
  const box = (await surface.boundingBox())!;
  const clip =
    region === "rim"
      ? { x: box.x, y: box.y + 40, width: 28, height: box.height - 80 }
      : { x: box.x + box.width / 2 - 40, y: box.y + box.height / 2 - 30, width: 80, height: 60 };
  return page.screenshot({ clip, animations: "disabled" });
}

test("the provider turns refraction on only in Chromium with a GPU", async ({ page }, testInfo) => {
  await openStory(page, FIXTURE, { refraction: "auto" });
  const facts = await page.evaluate(() => {
    const gl = document.createElement("canvas").getContext("webgl");
    const info = gl?.getExtension("WEBGL_debug_renderer_info");
    return {
      parses: CSS.supports("backdrop-filter", 'url("#a")'),
      userAgentData: "userAgentData" in navigator,
      renderer: gl && info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "none",
      attribute: document.documentElement.getAttribute("data-glass-refraction"),
    };
  });
  console.log(
    `${testInfo.project.name} | backdrop-filter: url() parses: ${facts.parses} | userAgentData: ${facts.userAgentData} | ` +
      `renderer: ${facts.renderer} | attribute: ${facts.attribute}`,
  );
  // Headless Chromium draws with SwiftShader, where the provider keeps the tier off.
  const software = /swiftshader|llvmpipe|software|basic render|^none$/i.test(facts.renderer);
  const expected = CHROMIUM_PROJECTS.includes(testInfo.project.name) && !software ? "on" : null;
  expect(facts.attribute).toBe(expected);
});

test("refraction can be forced on in Chromium only", async ({ page }, testInfo) => {
  // Outside Chromium, forcing it would remove the whole backdrop filter: measured
  // in Firefox 157, where the painted surface then falls to 1.3:1 against its label.
  await openStory(page, FIXTURE, { refraction: "on" });
  if (CHROMIUM_PROJECTS.includes(testInfo.project.name)) {
    await expect(page.locator("html")).toHaveAttribute("data-glass-refraction", "on");
  } else {
    await expect(page.locator("html")).not.toHaveAttribute("data-glass-refraction");
  }
  await openStory(page, FIXTURE, { refraction: "off" });
  await expect(page.locator("html")).not.toHaveAttribute("data-glass-refraction");
});

test("a recipe can bring its own refraction filter, and it is the one applied", async ({ page }, testInfo) => {
  test.skip(!CHROMIUM_PROJECTS.includes(testInfo.project.name), "Refraction only renders in Chromium");
  const STORY = "foundations-glass-recipes--comparison";
  const cell = (recipe: string) => page.locator(`[data-appearance="light"] [data-row="stripes-0.5"][data-recipe="${recipe}"]`);
  const filterOf = (recipe: string) =>
    cell(recipe)
      .locator("[data-glass]")
      .first()
      .evaluate((element) => getComputedStyle(element).backdropFilter);

  await openStory(page, STORY, { refraction: "off" });
  const flat = await cell("refraction-check").screenshot({ animations: "disabled" });
  expect(await filterOf("refraction-check")).not.toContain("url(");

  await openStory(page, STORY, { refraction: "on" });
  // The shipped recipe points at the shared filter, the diagnostic one at its own.
  expect(await filterOf("current")).toContain("#caira-glass-refraction");
  expect(await filterOf("refraction-check")).toContain("#glass-recipe-refraction-check");
  await expect(page.locator("filter#glass-recipe-refraction-check feDisplacementMap")).toHaveAttribute("scale", "220");

  const bent = await cell("refraction-check").screenshot({ animations: "disabled" });
  const changed = await differingShare(page, flat, bent);
  console.log(`${testInfo.project.name} | exaggerated recipe: ${(changed * 100).toFixed(1)}% of the cell changed with refraction on`);
  expect(changed).toBeGreaterThan(0.03);
});

test("what the engine paints with the SVG filter in backdrop-filter", async ({ page }, testInfo) => {
  // Playwright's Firefox screenshots leave out every backdrop-filter effect
  // (see painted.ts), so a screenshot comparison says nothing there.
  test.skip(testInfo.project.name === "firefox", "Screenshots cannot show backdrop-filter in Playwright's Firefox");
  await openStory(page, FIXTURE, { refraction: "off" });
  const surface = page.locator('[data-sample="refraction"]');
  const rimOff = await capture(page, surface, "rim");
  const middleOff = await capture(page, surface, "middle");

  // Force the tier on, whatever the detection said, to see what this engine does with it.
  await page.evaluate(() => document.documentElement.setAttribute("data-glass-refraction", "on"));
  await page.evaluate(() => new Promise(requestAnimationFrame));
  const rimChange = await differingShare(page, rimOff, await capture(page, surface, "rim"));
  const middleChange = await differingShare(page, middleOff, await capture(page, surface, "middle"));

  console.log(
    `${testInfo.project.name} | forced on: ${(rimChange * 100).toFixed(1)}% of rim pixels changed, ` +
      `${(middleChange * 100).toFixed(1)}% of middle pixels changed`,
  );

  if (CHROMIUM_PROJECTS.includes(testInfo.project.name)) {
    // The rim bends, the middle does not: the filter is applied and it is local to the edge.
    expect(rimChange).toBeGreaterThan(0.05);
    expect(middleChange).toBeLessThan(0.01);
  } else {
    // Recorded, not asserted: an engine may ignore the url() or drop the whole
    // declaration. Either way detection keeps the tier off there (previous test).
    test.info().annotations.push({ type: "measurement", description: `rim ${rimChange}, middle ${middleChange}` });
  }
});
