import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { axe } from "../../test/axe";
import { Icon, createIcon } from "./Icon";
import { iconRegistry, type IconGlyphProps, type IconName } from "./registry";

describe("Icon", () => {
  it("is decorative by default: hidden from assistive technology and not focusable", () => {
    const { container } = render(<Icon name="search" />);
    const svg = container.querySelector("svg")!;
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("focusable", "false");
    expect(svg).not.toHaveAttribute("role");
    expect(svg).toHaveAttribute("data-icon", "search");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("becomes an image with a name when given a label", () => {
    render(<Icon name="warning" label="Warning" />);
    const image = screen.getByRole("img", { name: "Warning" });
    expect(image).not.toHaveAttribute("aria-hidden");
  });

  it("follows the text size by default and accepts an explicit size", () => {
    const { container, rerender } = render(<Icon name="close" />);
    const svg = () => container.querySelector("svg")!;
    expect(svg()).toHaveAttribute("width", "1.25em");
    expect(svg()).toHaveAttribute("height", "1.25em");
    // Drawn with the current text color.
    expect(svg()).toHaveAttribute("stroke", "currentColor");

    rerender(<Icon name="close" size={20} strokeWidth={2.5} className="text-system-red" />);
    expect(svg()).toHaveAttribute("width", "20");
    expect(svg()).toHaveAttribute("stroke-width", "2.5");
    expect(svg()).toHaveClass("shrink-0", "text-system-red");
  });

  it("mirrors direction-sensitive icons in right-to-left layouts, and only those", () => {
    const { container } = render(
      <>
        <Icon name="chevron-forward" />
        <Icon name="chevron-backward" />
        <Icon name="sidebar" />
        <Icon name="search" />
        <Icon name="checkmark" />
      </>,
    );
    const mirrored = [...container.querySelectorAll("svg")].map((svg) => [
      svg.getAttribute("data-icon"),
      svg.classList.contains("rtl:-scale-x-100"),
    ]);
    expect(mirrored).toEqual([
      ["chevron-forward", true],
      ["chevron-backward", true],
      ["sidebar", true],
      ["search", false],
      ["checkmark", false],
    ]);
  });

  it("renders every registered name", () => {
    const names = Object.keys(iconRegistry) as IconName[];
    const { container } = render(
      <>
        {names.map((name) => (
          <Icon key={name} name={name} />
        ))}
      </>,
    );
    expect(container.querySelectorAll("svg")).toHaveLength(names.length);
  });

  it("takes ref as a plain prop (React 19)", () => {
    const ref = createRef<SVGSVGElement>();
    render(<Icon name="add" ref={ref} />);
    expect(ref.current).toBeInstanceOf(SVGSVGElement);
  });

  it("has no axe violations, decorative next to text and labelled on its own", async () => {
    const { container } = render(
      <>
        <button type="button">
          <Icon name="add" /> New folder
        </button>
        <Icon name="error" label="Error" />
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("createIcon", () => {
  function Square({ size, ...props }: IconGlyphProps) {
    return (
      <svg {...props} width={size} height={size} viewBox="0 0 24 24">
        <rect width="24" height="24" />
      </svg>
    );
  }

  it("binds an Icon to another registry, with its own names", () => {
    const AppIcon = createIcon({ ...iconRegistry, inbox: { glyph: Square, mirrorInRtl: true } });
    const { container } = render(
      <>
        <AppIcon name="inbox" label="Inbox" size={12} />
        <AppIcon name="search" />
      </>,
    );
    const inbox = screen.getByRole("img", { name: "Inbox" });
    expect(inbox).toHaveAttribute("width", "12");
    expect(inbox).toHaveClass("rtl:-scale-x-100");
    expect(inbox.querySelector("rect")).not.toBeNull();
    expect(container.querySelectorAll("svg")).toHaveLength(2);
  });
});
