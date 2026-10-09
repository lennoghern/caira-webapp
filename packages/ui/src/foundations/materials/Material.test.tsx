import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { axe } from "../../test/axe";
import { Material, material } from "./Material";

describe("Material", () => {
  it("renders the regular thickness by default", () => {
    render(<Material data-testid="material">Content</Material>);
    const element = screen.getByTestId("material");
    expect(element.tagName).toBe("DIV");
    expect(element).toHaveAttribute("data-material", "regular");
    expect(element).toHaveClass("material", "material-regular");
  });

  it.each([
    ["ultraThin", "material-ultrathin"],
    ["thin", "material-thin"],
    ["regular", "material-regular"],
    ["thick", "material-thick"],
  ] as const)("maps %s to %s", (thickness, className) => {
    render(<Material data-testid="material" thickness={thickness} />);
    const element = screen.getByTestId("material");
    expect(element).toHaveClass("material", className);
    expect(element).toHaveAttribute("data-material", thickness);
  });

  it("renders the element asked for, merges classes and passes attributes through", () => {
    render(
      <Material as="aside" aria-label="Inspector" className="p-4 material-thick">
        Details
      </Material>,
    );
    const aside = screen.getByRole("complementary", { name: "Inspector" });
    expect(aside).toHaveClass("p-4", "material-thick");
    expect(aside).not.toHaveClass("material-regular");
  });

  it("takes ref as a plain prop (React 19)", () => {
    const ref = createRef<HTMLElement>();
    render(<Material ref={ref} as="section" />);
    expect(ref.current?.tagName).toBe("SECTION");
  });

  it("is not glass: nested-glass detection must not see it", () => {
    render(<Material data-testid="material" />);
    expect(screen.getByTestId("material")).not.toHaveAttribute("data-glass");
  });

  it("exposes its classes for other elements", () => {
    expect(material({ thickness: "thin" })).toBe("material material-thin");
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <Material as="section" aria-label="Summary">
        <h2>Summary</h2>
        <p className="text-label-secondary">Secondary text on a material.</p>
      </Material>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
