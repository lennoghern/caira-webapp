import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "../../test/axe";
import { Lockup } from "./Lockup";

/**
 * Structure, naming and keyboard, in jsdom, against the APG Link and Button
 * patterns. What these cannot see (the shape of each type, the growth on hover
 * and focus and its absence under reduced motion, the poster caption appearing,
 * right-to-left, forced colors) is read from a real browser in
 * tests/browser/layout/lockup.spec.ts.
 */

// A stand-in for a decorative image: what matters to these tests is that it adds nothing to the name.
const picture = <span aria-hidden="true" data-picture="" />;

describe("Lockup", () => {
  describe("one interactive unit", () => {
    it("is a button by default, named by its header, title and subtitle", () => {
      render(
        <Lockup header="New" title="The Long Road" subtitle="2024">
          {picture}
        </Lockup>,
      );
      const button = screen.getByRole("button", { name: "New The Long Road 2024" });
      expect(button).toHaveAttribute("data-lockup", "caption");
      // Nothing inside is a control of its own.
      expect(button.querySelector("a, button, [tabindex]")).toBeNull();
    });

    it("is a link when it has an href", () => {
      render(
        <Lockup href="/films/1" title="The Long Road">
          {picture}
        </Lockup>,
      );
      const link = screen.getByRole("link", { name: "The Long Road" });
      expect(link).toHaveAttribute("href", "/films/1");
      expect(link.tagName).toBe("A");
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("takes the text alternative of its image into its name, and aria-label over all of it", () => {
      const { unmount } = render(
        <Lockup title="2024">
          <span role="img" aria-label="Poster of The Long Road" />
        </Lockup>,
      );
      expect(screen.getByRole("button", { name: "Poster of The Long Road 2024" })).toBeInTheDocument();
      unmount();
      render(
        <Lockup aria-label="Play The Long Road" title="The Long Road">
          {picture}
        </Lockup>,
      );
      expect(screen.getByRole("button", { name: "Play The Long Road" })).toBeInTheDocument();
    });
  });

  describe("the three views", () => {
    it("orders them header, content, footer, and leaves out the ones not given", () => {
      render(
        <Lockup data-testid="full" header="New" title="Title" subtitle="Subtitle">
          {picture}
        </Lockup>,
      );
      const order = (testId: string) => [...screen.getByTestId(testId).children].map((element) => Object.keys((element as HTMLElement).dataset)[0]);
      expect(order("full")).toEqual(["lockupHeader", "lockupContent", "lockupFooter"]);

      render(<Lockup data-testid="bare">{picture}</Lockup>);
      expect(order("bare")).toEqual(["lockupContent"]);
    });

    it.each(["card", "caption", "monogram", "poster"] as const)("marks the %s type on the lockup", (variant) => {
      render(
        <Lockup variant={variant} title="Title">
          {picture}
        </Lockup>,
      );
      expect(screen.getByRole("button")).toHaveAttribute("data-lockup", variant);
    });

    it("shows initials in a monogram without a picture, and keeps them out of the name", () => {
      render(<Lockup variant="monogram" title="Ada Lovelace" initials="AL" />);
      const button = screen.getByRole("button", { name: "Ada Lovelace" });
      const initials = screen.getByText("AL");
      expect(initials).toHaveAttribute("aria-hidden", "true");
      expect(button).toContainElement(initials);
    });

    it("prefers the picture to the initials", () => {
      render(
        <Lockup variant="monogram" title="Ada Lovelace" initials="AL">
          {picture}
        </Lockup>,
      );
      expect(screen.queryByText("AL")).not.toBeInTheDocument();
    });

    it("ignores initials outside a monogram", () => {
      render(<Lockup variant="caption" title="Title" initials="AL" />);
      expect(screen.queryByText("AL")).not.toBeInTheDocument();
    });

    it("puts a poster's caption over the content, on a material, and keeps it for assistive technology", () => {
      render(
        <Lockup variant="poster" title="The Long Road" subtitle="2024">
          {picture}
        </Lockup>,
      );
      const button = screen.getByRole("button", { name: "The Long Road 2024" });
      const footer = button.querySelector("[data-lockup-footer]")!;
      expect(footer.parentElement).toHaveAttribute("data-lockup-content");
      expect(footer).toHaveAttribute("data-material", "thin");
      expect(footer).toHaveClass("material", "material-thin", "opacity-0");
      // Hidden from sight until hover or focus; never from the accessibility tree.
      expect(footer).not.toHaveAttribute("aria-hidden");
      expect(footer).not.toHaveAttribute("hidden");
    });

    it("keeps the caption of the other types under the content, with no material", () => {
      render(
        <Lockup variant="card" title="Title">
          {picture}
        </Lockup>,
      );
      const footer = screen.getByRole("button").querySelector("[data-lockup-footer]")!;
      expect(footer.parentElement).toBe(screen.getByRole("button"));
      expect(footer).not.toHaveAttribute("data-material");
    });
  });

  describe("pointer and keyboard", () => {
    it("is pressed by click, Enter and Space", async () => {
      const user = userEvent.setup();
      const onPress = vi.fn();
      render(
        <Lockup title="Title" onPress={onPress}>
          {picture}
        </Lockup>,
      );
      await user.click(screen.getByRole("button"));
      expect(screen.getByRole("button")).toHaveFocus();
      await user.keyboard("{Enter}");
      await user.keyboard(" ");
      expect(onPress).toHaveBeenCalledTimes(3);
    });

    it("is one tab stop", async () => {
      const user = userEvent.setup();
      render(
        <>
          <Lockup title="First">{picture}</Lockup>
          <Lockup href="/second" title="Second">
            {picture}
          </Lockup>
        </>,
      );
      await user.tab();
      expect(screen.getByRole("button", { name: "First" })).toHaveFocus();
      await user.tab();
      expect(screen.getByRole("link", { name: "Second" })).toHaveFocus();
    });

    it("does nothing while disabled", async () => {
      const user = userEvent.setup();
      const onPress = vi.fn();
      render(
        <Lockup title="Title" isDisabled onPress={onPress}>
          {picture}
        </Lockup>,
      );
      expect(screen.getByRole("button")).toBeDisabled();
      await user.click(screen.getByRole("button"));
      expect(onPress).not.toHaveBeenCalled();
    });
  });

  describe("styling and passing through", () => {
    it("merges className on the lockup and classNames on its views, the caller winning", () => {
      render(
        <Lockup
          variant="card"
          header="New"
          title="Title"
          subtitle="Subtitle"
          className="w-40 gap-4"
          classNames={{ header: "text-footnote", content: "aspect-video", footer: "mt-1", title: "font-semibold", subtitle: "text-footnote" }}
        >
          {picture}
        </Lockup>,
      );
      const button = screen.getByRole("button");
      expect(button).toHaveClass("w-40", "gap-4", "rounded-box");
      expect(button).not.toHaveClass("gap-2");
      expect(button.querySelector("[data-lockup-header]")).toHaveClass("text-footnote");
      expect(button.querySelector("[data-lockup-header]")).not.toHaveClass("text-subheadline");
      expect(button.querySelector("[data-lockup-content]")).toHaveClass("aspect-video", "overflow-clip");
      expect(button.querySelector("[data-lockup-footer]")).toHaveClass("mt-1");
      expect(screen.getByText("Title")).toHaveClass("font-semibold", "truncate");
      expect(screen.getByText("Subtitle")).toHaveClass("text-footnote");
      expect(screen.getByText("Subtitle")).not.toHaveClass("text-callout");
    });

    it("takes ref as a plain prop on either element (React 19)", () => {
      const button = createRef<HTMLButtonElement>();
      const link = createRef<HTMLAnchorElement>();
      render(
        <>
          <Lockup ref={button} title="Button" />
          <Lockup ref={link} href="/x" title="Link" />
        </>,
      );
      expect(button.current?.tagName).toBe("BUTTON");
      expect(link.current?.tagName).toBe("A");
    });
  });

  describe("accessibility (axe, structure only: jsdom computes no colors)", () => {
    it("has no violations in the four types, as link and button, and disabled", async () => {
      const { container } = render(
        <>
          <Lockup variant="card" header="Review" title="A fine film" subtitle="4 of 5">
            {picture}
          </Lockup>
          <Lockup variant="caption" href="/a" title="Caption" subtitle="Subtitle">
            <span role="img" aria-label="A beach" />
          </Lockup>
          <Lockup variant="monogram" title="Ada Lovelace" initials="AL" />
          <Lockup variant="poster" title="Poster" subtitle="2024">
            {picture}
          </Lockup>
          <Lockup title="Unavailable" isDisabled>
            {picture}
          </Lockup>
        </>,
      );
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
