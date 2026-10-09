import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { toHaveNoViolations } from "jest-axe";
import { afterEach, expect } from "vitest";

expect.extend(toHaveNoViolations);

afterEach(() => {
  // Files marked `@vitest-environment node` have no DOM to reset.
  if (typeof window === "undefined") return;
  cleanup();
  window.localStorage.clear();
  // LiquidGlassProvider writes theme state on <html>; never let it leak between tests.
  const root = document.documentElement;
  for (const name of root.getAttributeNames()) root.removeAttribute(name);
});
