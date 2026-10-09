import { expect, test } from "@playwright/test";
import { listStoryIds, openStory } from "./support";

test("the harness lists the stories and renders one", async ({ page }) => {
  const ids = await listStoryIds(page);
  expect(ids.length).toBeGreaterThan(10);
  expect(ids).toContain("foundations-glasssurface--variants");

  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await openStory(page, "foundations-glasssurface--variants");
  await expect(page.locator("[data-glass='regular']").first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("the toolbar globals reach the provider", async ({ page }) => {
  await openStory(page, "foundations-glasssurface--variants", {
    appearance: "dark",
    clarity: "1",
    contrast: "more",
    transparency: "reduced",
    motion: "reduced",
    platform: "ios",
    direction: "rtl",
  });
  const root = page.locator("html");
  await expect(root).toHaveAttribute("data-appearance", "dark");
  await expect(root).toHaveAttribute("data-contrast", "more");
  await expect(root).toHaveAttribute("data-transparency", "reduced");
  await expect(root).toHaveAttribute("data-motion", "reduced");
  await expect(root).toHaveAttribute("data-platform", "ios");
  await expect(root).toHaveAttribute("dir", "rtl");
  expect(await root.evaluate((element) => element.style.getPropertyValue("--glass-clarity"))).toBe("1");
});
