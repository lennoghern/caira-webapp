import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { axe } from "../../test/axe";
import { LiquidGlassScope } from "./LiquidGlassScope";
import { ThemeScript } from "./ThemeScript";

describe("LiquidGlassScope", () => {
  it("carries an explicit appearance and restates the text color", () => {
    render(
      <LiquidGlassScope appearance="dark" data-testid="scope">
        Night
      </LiquidGlassScope>,
    );
    const scope = screen.getByTestId("scope");
    expect(scope).toHaveAttribute("data-appearance", "dark");
    expect(scope).toHaveClass("text-label");
    // Nothing else is forced unless asked for.
    for (const name of ["data-contrast", "data-transparency", "data-motion", "data-platform"]) {
      expect(scope).not.toHaveAttribute(name);
    }
    expect(scope.style.getPropertyValue("--glass-clarity")).toBe("");
  });

  it("can force every other theme dimension for its subtree", () => {
    render(
      <LiquidGlassScope
        appearance="light"
        contrast="more"
        transparency="reduced"
        motion="reduced"
        platform="ios"
        clarity={3}
        accent="rgb(255 45 85)"
        data-testid="scope"
        className="p-4 text-label-secondary"
        style={{ inlineSize: 10 }}
      />,
    );
    const scope = screen.getByTestId("scope");
    expect(scope).toHaveAttribute("data-appearance", "light");
    expect(scope).toHaveAttribute("data-contrast", "more");
    expect(scope).toHaveAttribute("data-transparency", "reduced");
    expect(scope).toHaveAttribute("data-motion", "reduced");
    expect(scope).toHaveAttribute("data-platform", "ios");
    expect(scope.style.getPropertyValue("--glass-clarity")).toBe("1");
    expect(scope.style.getPropertyValue("--accent-custom")).toBe("rgb(255 45 85)");
    expect(scope.style.inlineSize).toBe("10px");
    // A caller's color wins over the default.
    expect(scope).toHaveClass("p-4", "text-label-secondary");
    expect(scope).not.toHaveClass("text-label");
  });

  it("takes ref as a plain prop (React 19)", () => {
    const ref = createRef<HTMLDivElement>();
    render(<LiquidGlassScope appearance="dark" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <LiquidGlassScope appearance="dark">
        <p>Text in a dark island</p>
      </LiquidGlassScope>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("ThemeScript", () => {
  it("renders one inline script that sets the theme attributes", () => {
    const { container } = render(<ThemeScript storageKey="k" nonce="abc" />);
    const script = container.querySelector("script");
    expect(script).not.toBeNull();
    expect(script).toHaveAttribute("nonce", "abc");
    expect(script?.textContent).toContain('"k"');
    expect(script?.textContent).toContain("data-appearance");
    // In the browser React must not try to run it again.
    expect(script).toHaveAttribute("type", "text/plain");
  });
});
