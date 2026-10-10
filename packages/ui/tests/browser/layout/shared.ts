import { expect, type Locator, type Page } from "@playwright/test";
import { listStoryIds, openStory } from "../support";

/** Opens every story of one component and fails on any console error, warning or page error. */
export async function expectStoriesRenderClean(page: Page, prefix: string, expected: readonly string[], ready: string): Promise<void> {
  const ids = (await listStoryIds(page)).filter((id) => id.startsWith(prefix));
  expect(ids).toEqual(expect.arrayContaining(expected.map((name) => `${prefix}${name}`)));
  const messages: string[] = [];
  page.on("pageerror", (error) => messages.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") messages.push(message.text());
  });
  for (const id of ids) {
    await openStory(page, id);
    await expect(page.locator(ready).first()).toBeVisible();
  }
  expect(messages).toEqual([]);
}

/** One computed style property of an element. */
export const computed = (target: Locator, property: string): Promise<string> =>
  target.evaluate((element, name) => getComputedStyle(element).getPropertyValue(name), property);

/**
 * A CSS value as the element itself would resolve it, in the form computed
 * style reports. Used to compare a painted color with a token without writing
 * the token's value into the test.
 */
export const resolved = (target: Locator, property: "background-color" | "color" | "border-top-left-radius", value: string): Promise<string> =>
  target.evaluate(
    (element, [name, cssValue]) => {
      const probe = document.createElement("span");
      probe.style.setProperty(name!, cssValue!);
      element.append(probe);
      const result = getComputedStyle(probe).getPropertyValue(name!);
      probe.remove();
      return result;
    },
    [property, value],
  );

export const rect = async (target: Locator) => {
  const box = await target.boundingBox();
  if (!box) throw new Error("Element is not visible");
  return { ...box, right: box.x + box.width, bottom: box.y + box.height };
};

export const TRANSPARENT = "rgba(0, 0, 0, 0)";

/** The element that has focus, described by its role and name-carrying attributes. */
export const focused = (page: Page): Promise<string> =>
  page.evaluate(() => {
    const element = document.activeElement;
    if (!element) return "nothing";
    return `${element.getAttribute("role") ?? element.tagName.toLowerCase()}:${element.getAttribute("aria-label") ?? element.getAttribute("data-key") ?? element.textContent?.trim() ?? ""}`;
  });
