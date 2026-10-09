import { describe, expect, it } from "vitest";
import { parseCssDeclarations, readStyleFile } from "../../test/css-tokens";
import { cn } from "./cn";
import { DURATIONS, EASINGS, RADII, TEXT_STYLES } from "./tailwind-merge-config";
import { tv } from "./tv";

describe("cn", () => {
  it("joins class names and drops falsy values", () => {
    expect(cn("a", false, null, undefined, ["b", 0 && "c"], "d")).toBe("a b d");
  });

  it("keeps a text style next to a text color", () => {
    // Without the library configuration tailwind-merge sees two colors and drops the first.
    expect(cn("text-body", "text-label")).toBe("text-body text-label");
    expect(cn("text-label", "text-large-title")).toBe("text-label text-large-title");
  });

  it("resolves conflicts between library tokens, the last one winning", () => {
    expect(cn("text-body", "text-title1")).toBe("text-title1");
    expect(cn("text-label", "text-label-secondary")).toBe("text-label-secondary");
    expect(cn("rounded-control", "rounded-panel")).toBe("rounded-panel");
    expect(cn("rounded-lg", "rounded-concentric")).toBe("rounded-concentric");
    expect(cn("duration-fast", "duration-300")).toBe("duration-300");
    expect(cn("ease-standard", "ease-bounce")).toBe("ease-bounce");
  });

  it("resolves conflicts between glass and material utilities", () => {
    expect(cn("glass-regular", "glass-clear")).toBe("glass-clear");
    expect(cn("glass-small", "glass-large")).toBe("glass-large");
    expect(cn("glass-shape-rounded", "rounded-full")).toBe("rounded-full");
    expect(cn("material-thin", "material-thick")).toBe("material-thick");
    // Independent utilities are all kept.
    expect(cn("glass-surface", "glass-regular", "glass-interactive", "glass-dim")).toBe(
      "glass-surface glass-regular glass-interactive glass-dim",
    );
  });
});

describe("tv", () => {
  it("merges with the same configuration as cn", () => {
    const styles = tv({ base: "text-body text-label", variants: { large: { true: "text-title2" } } });
    expect(styles({ large: true })).toBe("text-label text-title2");
    expect(styles({ class: "text-accent-text" })).toBe("text-body text-accent-text");
  });
});

describe("the tailwind-merge lists match the stylesheets", () => {
  const themeNames = (prefix: string) =>
    parseCssDeclarations(readStyleFile("tokens.css"))
      .filter((declaration) => declaration.path[0]?.startsWith("@theme") && declaration.name.startsWith(prefix))
      .map((declaration) => declaration.name.slice(prefix.length))
      .filter((name) => !name.includes("--"));

  it("text styles", () => {
    expect(themeNames("--text-").sort()).toEqual([...TEXT_STYLES].sort());
  });

  it("radii", () => {
    expect(themeNames("--radius-").sort()).toEqual([...RADII].sort());
  });

  it("easings", () => {
    expect(themeNames("--ease-").sort()).toEqual([...EASINGS].sort());
  });

  it("durations", () => {
    const utilities = [...readStyleFile("motion.css").matchAll(/@utility duration-([\w-]+)/g)].map((match) => match[1]);
    expect(utilities.sort()).toEqual([...DURATIONS].sort());
  });
});
