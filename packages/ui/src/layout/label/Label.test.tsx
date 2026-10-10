import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { Icon } from "../../foundations/icon/Icon";
import { axe } from "../../test/axe";
import { Label } from "./Label";

/**
 * Structure, naming and class names, in jsdom. What these cannot see (the
 * colors of the three levels, the sizes of the text styles at each density,
 * where the text is cut, right-to-left) is read from a real browser in
 * tests/browser/layout/label.spec.ts.
 */
describe("Label", () => {
  describe("structure", () => {
    it("renders its text in a span, in the body style and the primary color by default", () => {
      render(<Label data-testid="label">Wi-Fi</Label>);
      const element = screen.getByTestId("label");
      expect(element.tagName).toBe("SPAN");
      expect(element).toHaveTextContent("Wi-Fi");
      expect(element).toHaveClass("text-body", "text-label");
      // Only the title: no icon wrapper without an icon.
      expect(element.children).toHaveLength(1);
      expect(element.firstElementChild).toHaveAttribute("data-label-title");
    });

    it("draws the icon before the title", () => {
      render(
        <Label data-testid="label" icon={<Icon name="info" />}>
          About
        </Label>,
      );
      const [icon, title] = [...screen.getByTestId("label").children];
      expect(icon).toHaveAttribute("data-label-icon");
      expect(icon?.querySelector("svg")).not.toBeNull();
      expect(title).toHaveTextContent("About");
    });

    it.each([undefined, null, false])("renders no icon wrapper for icon=%j", (icon) => {
      render(
        <Label data-testid="label" icon={icon}>
          About
        </Label>,
      );
      expect(screen.getByTestId("label").querySelector("[data-label-icon]")).toBeNull();
    });

    it.each(["span", "div", "p", "label"] as const)("renders as <%s>", (as) => {
      render(
        <Label as={as} data-testid="label">
          Text
        </Label>,
      );
      expect(screen.getByTestId("label").tagName).toBe(as.toUpperCase());
    });

    it("passes attributes through and takes ref as a plain prop (React 19)", () => {
      const ref = createRef<HTMLElement>();
      render(
        <Label ref={ref} id="status" lang="en" data-kind="status">
          Connected
        </Label>,
      );
      expect(ref.current).toHaveAttribute("id", "status");
      expect(ref.current).toHaveAttribute("data-kind", "status");
      expect(ref.current).toHaveAttribute("data-label");
    });
  });

  describe("label styles", () => {
    it("leaves the icon out with title-only", () => {
      render(
        <Label data-testid="label" labelStyle="title-only" icon={<Icon name="info" />}>
          About
        </Label>,
      );
      const element = screen.getByTestId("label");
      expect(element.querySelector("svg")).toBeNull();
      expect(element).toHaveTextContent("About");
    });

    it("keeps the text for assistive technology with icon-only", () => {
      render(
        <Label data-testid="label" labelStyle="icon-only" icon={<Icon name="info" />}>
          About
        </Label>,
      );
      const title = screen.getByText("About");
      // Hidden from sight, not from the accessibility tree.
      expect(title).toHaveClass("sr-only");
      expect(title).not.toHaveAttribute("aria-hidden");
      expect(title).not.toHaveAttribute("hidden");
      expect(screen.getByTestId("label").querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("variants", () => {
    it.each([
      ["primary", "text-label"],
      ["secondary", "text-label-secondary"],
      ["tertiary", "text-label-tertiary"],
    ] as const)("level=%s colors the text with %s", (level, className) => {
      render(
        <Label data-testid="label" level={level}>
          Text
        </Label>,
      );
      expect(screen.getByTestId("label")).toHaveClass(className);
    });

    it.each(["large-title", "title1", "title2", "title3", "headline", "body", "callout", "subheadline", "footnote", "caption1", "caption2"] as const)(
      "textStyle=%s sets the matching text style and keeps the color",
      (textStyle) => {
        render(
          <Label data-testid="label" textStyle={textStyle} level="secondary">
            Text
          </Label>,
        );
        expect(screen.getByTestId("label")).toHaveClass(`text-${textStyle}`, "text-label-secondary");
      },
    );

    it.each([
      [1, "truncate"],
      [2, "line-clamp-2"],
      [3, "line-clamp-3"],
    ] as const)("lineLimit=%i cuts the title, not the icon", (lineLimit, className) => {
      render(
        <Label data-testid="label" lineLimit={lineLimit} icon={<Icon name="info" />}>
          A long piece of text
        </Label>,
      );
      const [icon, title] = [...screen.getByTestId("label").children];
      expect(title).toHaveClass(className);
      expect(icon).not.toHaveClass(className);
    });

    it("turns selection on, off, or leaves it to the container", () => {
      render(
        <>
          <Label data-testid="on" selectable>
            192.168.1.24
          </Label>
          <Label data-testid="off" selectable={false}>
            Edit
          </Label>
          <Label data-testid="unset">Plain</Label>
        </>,
      );
      expect(screen.getByTestId("on")).toHaveClass("select-text");
      expect(screen.getByTestId("off")).toHaveClass("select-none");
      expect(screen.getByTestId("unset")).not.toHaveClass("select-text");
      expect(screen.getByTestId("unset")).not.toHaveClass("select-none");
    });

    it("merges className on the label and classNames on its parts, the caller winning", () => {
      render(
        <Label
          data-testid="label"
          icon={<Icon name="info" />}
          className="text-title3 max-w-40"
          classNames={{ icon: "text-accent-text", title: "font-semibold" }}
        >
          About
        </Label>,
      );
      const element = screen.getByTestId("label");
      const [icon, title] = [...element.children];
      expect(element).toHaveClass("text-title3", "max-w-40", "text-label");
      expect(element).not.toHaveClass("text-body", "max-w-full");
      expect(icon).toHaveClass("text-accent-text", "shrink-0");
      expect(title).toHaveClass("font-semibold", "min-w-0");
    });
  });

  describe("naming a control", () => {
    it("names the control it points to when rendered as a label", () => {
      render(
        <>
          <Label as="label" htmlFor="name" icon={<Icon name="info" />}>
            Computer name
          </Label>
          <input id="name" />
        </>,
      );
      // The icon is decoration: it adds nothing to the name.
      expect(screen.getByRole("textbox", { name: "Computer name" })).toBeInTheDocument();
    });

    it("does not put a `for` attribute on an element that is not a label", () => {
      render(
        <Label data-testid="label" htmlFor="name">
          Computer name
        </Label>,
      );
      expect(screen.getByTestId("label")).not.toHaveAttribute("for");
    });
  });

  describe("keyboard", () => {
    it("is not a tab stop", async () => {
      const user = userEvent.setup();
      render(
        <>
          <button>Before</button>
          <Label data-testid="label" icon={<Icon name="info" />} selectable>
            Status
          </Label>
          <button>After</button>
        </>,
      );
      await user.tab();
      await user.tab();
      expect(document.activeElement).toHaveTextContent("After");
      expect(screen.getByTestId("label")).not.toHaveAttribute("tabindex");
    });
  });

  describe("accessibility (axe, structure only: jsdom computes no colors)", () => {
    it("has no violations as text, with an icon, and icon-only", async () => {
      const { container } = render(
        <>
          <Label>Plain</Label>
          <Label icon={<Icon name="warning" />} level="secondary">
            Low disk space
          </Label>
          <Label labelStyle="icon-only" icon={<Icon name="info" />}>
            About
          </Label>
        </>,
      );
      expect(await axe(container)).toHaveNoViolations();
    });

    it("has no violations as the label of a control", async () => {
      const { container } = render(
        <>
          <Label as="label" htmlFor="name">
            Computer name
          </Label>
          <input id="name" />
        </>,
      );
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
