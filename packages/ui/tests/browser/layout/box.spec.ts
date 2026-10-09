import { expect, test, type Locator, type Page } from "@playwright/test";
import { contrastRatio } from "../../../src/test/color";
import { listStoryIds, openStory, samplePixels, type Globals } from "../support";

/**
 * `Box` in a real engine: the things jsdom cannot see.
 *
 * What this proves: where the title sits at each density, which element draws
 * the frame, the background a nested box takes, mirroring in right-to-left, and
 * that forced colors leaves a visible edge.
 * What it does not prove: contrast of text on the box. The box backgrounds are
 * opaque, so axe measures that in stories-axe.spec.ts, and contrast.test.ts
 * computes it from the tokens.
 */

const TRANSPARENT = "rgba(0, 0, 0, 0)";

interface Part {
  top: number;
  bottom: number;
  left: number;
  right: number;
  background: string;
  borderStyle: string;
  borderWidth: string;
  radius: string;
  paddingTop: number;
  paddingLeft: number;
  paddingRight: number;
}

interface Measured {
  root: Part;
  content: Part;
  title: (Part & { textLeft: number; textRight: number }) | null;
  /** The tokens as this box resolves them, in the form computed style reports. */
  tokens: { secondary: string; tertiary: string; radius: string };
}

function measure(box: Locator): Promise<Measured> {
  return box.evaluate((root) => {
    const part = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right,
        background: style.backgroundColor,
        borderStyle: style.borderTopStyle,
        borderWidth: style.borderTopWidth,
        radius: style.borderTopLeftRadius,
        paddingTop: Number.parseFloat(style.paddingTop),
        paddingLeft: Number.parseFloat(style.paddingLeft),
        paddingRight: Number.parseFloat(style.paddingRight),
      };
    };
    const resolve = (property: "backgroundColor" | "borderTopLeftRadius", value: string) => {
      const probe = document.createElement("div");
      probe.style[property] = value;
      root.append(probe);
      const computed = getComputedStyle(probe)[property];
      probe.remove();
      return computed;
    };
    const titleElement = document.getElementById(root.getAttribute("aria-labelledby") ?? "");
    let title = null;
    if (titleElement) {
      const range = document.createRange();
      range.selectNodeContents(titleElement);
      const text = range.getBoundingClientRect();
      title = { ...part(titleElement), textLeft: text.left, textRight: text.right };
    }
    return {
      root: part(root),
      content: part(root.querySelector(":scope > [data-box-content]")!),
      title,
      tokens: {
        secondary: resolve("backgroundColor", "var(--background-secondary)"),
        tertiary: resolve("backgroundColor", "var(--background-tertiary)"),
        radius: resolve("borderTopLeftRadius", "var(--radius-box)"),
      },
    };
  });
}

const group = (page: Page, name: string) => page.getByRole("group", { name, exact: true });

test("every Box story renders without a console message", async ({ page }) => {
  const ids = (await listStoryIds(page)).filter((id) => id.startsWith("layout-box--"));
  expect(ids).toEqual(
    expect.arrayContaining([
      "layout-box--playground",
      "layout-box--title-and-content",
      "layout-box--nested",
      "layout-box--platforms",
      "layout-box--theme-states",
    ]),
  );
  const messages: string[] = [];
  page.on("pageerror", (error) => messages.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") messages.push(message.text());
  });
  for (const id of ids) {
    await openStory(page, id);
    await expect(page.locator("[data-box]").first()).toBeVisible();
  }
  expect(messages).toEqual([]);
});

for (const appearance of ["light", "dark"] as const) {
  test(`macOS density, ${appearance}: the title sits above the frame, which is drawn around the content`, async ({ page }) => {
    await openStory(page, "layout-box--playground", { appearance });
    const { root, content, title, tokens } = await measure(group(page, "Playback"));

    expect(title).not.toBeNull();
    expect(title!.bottom).toBeLessThanOrEqual(content.top);
    expect(title!.top).toBeGreaterThanOrEqual(root.top);

    expect(content.background).toBe(tokens.secondary);
    expect(content.borderStyle).toBe("solid");
    expect(content.borderWidth).toBe("1px");
    expect(content.radius).toBe(tokens.radius);
    expect(content.paddingTop).toBeGreaterThan(0);

    expect(root.background).toBe(TRANSPARENT);
    expect(root.borderWidth).toBe("0px");
    expect(root.paddingTop).toBe(0);
  });

  test(`iOS density, ${appearance}: the whole box is the frame and the title sits inside it`, async ({ page }) => {
    await openStory(page, "layout-box--playground", { appearance, platform: "ios" });
    const { root, content, title, tokens } = await measure(group(page, "Playback"));

    expect(root.background).toBe(tokens.secondary);
    expect(root.borderStyle).toBe("solid");
    expect(root.borderWidth).toBe("1px");
    expect(root.radius).toBe(tokens.radius);
    expect(root.paddingTop).toBeGreaterThan(0);

    expect(title).not.toBeNull();
    // Inside the frame: below its top edge by the padding, and above the content.
    expect(title!.top).toBeGreaterThanOrEqual(root.top + root.paddingTop);
    expect(title!.bottom).toBeLessThanOrEqual(content.top);

    expect(content.background).toBe(TRANSPARENT);
    expect(content.borderWidth).toBe("0px");
    expect(content.paddingTop).toBe(0);
  });
}

const NESTED: readonly (readonly [string, Globals, "content" | "root"])[] = [
  ["macOS density, light", { appearance: "light" }, "content"],
  ["macOS density, dark", { appearance: "dark" }, "content"],
  ["iOS density, light", { appearance: "light", platform: "ios" }, "root"],
  ["iOS density, dark", { appearance: "dark", platform: "ios" }, "root"],
];

for (const [label, globals, frame] of NESTED) {
  test(`a box inside a box takes the tertiary background: ${label}`, async ({ page }) => {
    await openStory(page, "layout-box--nested", globals);
    const outer = await measure(group(page, "Sound"));
    const inner = await measure(group(page, "Alerts"));

    expect(outer.tokens.secondary).not.toBe(outer.tokens.tertiary);
    expect(outer[frame].background).toBe(outer.tokens.secondary);
    expect(inner[frame].background).toBe(inner.tokens.tertiary);
    // The inner frame lies within the outer one.
    expect(inner[frame].top).toBeGreaterThan(outer[frame].top);
    expect(inner[frame].bottom).toBeLessThan(outer[frame].bottom);
  });
}

test("the density of a subtree wins over the page's (one level)", async ({ page }) => {
  await openStory(page, "layout-box--platforms", { appearance: "light" });
  const inherited = await measure(group(page, "Page density"));
  const ios = await measure(group(page, "iOS density"));
  expect(inherited.root.background).toBe(TRANSPARENT);
  expect(ios.root.background).toBe(ios.tokens.secondary);
});

test("right to left mirrors the title", async ({ page }) => {
  await openStory(page, "layout-box--playground", { appearance: "light" });
  const ltr = (await measure(group(page, "Playback"))).title!;
  expect(ltr.paddingLeft).toBeGreaterThan(0);
  expect(ltr.paddingRight).toBe(0);
  expect(ltr.textLeft).toBeCloseTo(ltr.left + ltr.paddingLeft, 0);

  await openStory(page, "layout-box--playground", { appearance: "light", direction: "rtl" });
  const rtl = (await measure(group(page, "Playback"))).title!;
  expect(rtl.paddingRight).toBe(ltr.paddingLeft);
  expect(rtl.paddingLeft).toBe(0);
  expect(rtl.textRight).toBeCloseTo(rtl.right - rtl.paddingRight, 0);
});

for (const [label, globals, frame] of [
  ["macOS density", { appearance: "light" }, "content"],
  ["iOS density", { appearance: "light", platform: "ios" }, "root"],
] as const) {
  test(`forced colors leaves a visible edge: ${label}`, async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await openStory(page, "layout-box--playground", globals);
    const box = group(page, "Playback");
    const target = frame === "root" ? box : box.locator(":scope > [data-box-content]");
    const { height } = (await target.boundingBox())!;

    // One pixel on the top border, and one in the padding just inside it, clear of any text.
    const edge = await samplePixels(page, target, { x: 0.5, y: 0.5 / height }, 1);
    const inside = await samplePixels(page, target, { x: 0.5, y: 5.5 / height }, 1);
    // WCAG 2.2 1.4.11: a boundary needed to perceive a component has 3:1 against what is next to it.
    expect(contrastRatio(edge, inside)).toBeGreaterThanOrEqual(3);
  });
}
