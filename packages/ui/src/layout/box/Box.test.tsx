import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { axe } from "../../test/axe";
import { Box } from "./Box";

/**
 * Structure, naming and keyboard, in jsdom. What these cannot see (where the
 * title sits at each density, the backgrounds, right-to-left, forced colors) is
 * read from a real browser in tests/browser/layout/box.spec.ts.
 */
describe("Box", () => {
  describe("naming", () => {
    it("is a group named by its title", () => {
      render(<Box title="Playback">Content</Box>);
      const group = screen.getByRole("group", { name: "Playback" });
      const title = screen.getByText("Playback");
      expect(group).toHaveAttribute("aria-labelledby", title.id);
      expect(group).toContainElement(title);
    });

    it("takes any node as its title and names the group from its text", () => {
      render(
        <Box
          title={
            <>
              <svg aria-hidden="true" /> Sound <em>effects</em>
            </>
          }
        />,
      );
      expect(screen.getByRole("group", { name: "Sound effects" })).toBeInTheDocument();
    });

    it.each([undefined, null, false, ""])("renders no title element and no reference for title=%j", (title) => {
      render(<Box title={title} data-testid="box" />);
      const element = screen.getByTestId("box");
      expect(element).not.toHaveAttribute("aria-labelledby");
      // Only the content wrapper is left.
      expect(element.children).toHaveLength(1);
    });

    it("lets aria-label name the box instead of the visible title", () => {
      render(
        <Box title="Playback" aria-label="Playback settings">
          Content
        </Box>,
      );
      const group = screen.getByRole("group", { name: "Playback settings" });
      expect(group).not.toHaveAttribute("aria-labelledby");
      expect(within(group).getByText("Playback")).toBeInTheDocument();
    });

    it("keeps an aria-labelledby given by the caller", () => {
      render(
        <>
          <h2 id="heading">Sound</h2>
          <Box title="Playback" aria-labelledby="heading" />
        </>,
      );
      expect(screen.getByRole("group", { name: "Sound" })).toHaveAttribute("aria-labelledby", "heading");
    });

    it("gives each box its own title id", () => {
      render(
        <>
          <Box title="Playback" />
          <Box title="Downloads" />
        </>,
      );
      const ids = screen.getAllByRole("group").map((group) => group.getAttribute("aria-labelledby"));
      expect(new Set(ids).size).toBe(2);
      expect(screen.getByRole("group", { name: "Downloads" })).toBeInTheDocument();
    });

    it("becomes a landmark with role=region", () => {
      render(<Box role="region" title="Storage" />);
      expect(screen.getByRole("region", { name: "Storage" })).toBeInTheDocument();
      expect(screen.queryByRole("group")).not.toBeInTheDocument();
    });
  });

  describe("structure", () => {
    it("puts children in the content element, after the title", () => {
      render(
        <Box title="Playback" data-testid="box">
          <p>Body</p>
        </Box>,
      );
      const [title, content] = [...screen.getByTestId("box").children];
      expect(title).toHaveTextContent("Playback");
      expect(content).toHaveAttribute("data-box-content");
      expect(content).toContainElement(screen.getByText("Body"));
    });

    it("marks a nested box as inside another box's content", () => {
      render(
        <Box title="Sound">
          <Box title="Alerts">Inner</Box>
        </Box>,
      );
      const outer = screen.getByRole("group", { name: "Sound" });
      const inner = within(outer).getByRole("group", { name: "Alerts" });
      // The ancestor the nested-background variant looks for.
      expect(inner.parentElement).toHaveAttribute("data-box-content");
      expect(outer.closest("[data-box-content]")).toBeNull();
    });

    it("merges className on the box and classNames on its parts, the caller winning", () => {
      render(
        <Box
          title="Playback"
          data-testid="box"
          className="min-w-40 max-w-sm"
          classNames={{ title: "text-title3", content: "platform-macos:p-0" }}
        >
          Body
        </Box>,
      );
      const element = screen.getByTestId("box");
      const [title, content] = [...element.children];
      expect(element).toHaveClass("min-w-40", "max-w-sm", "flex");
      expect(element).not.toHaveClass("min-w-0");
      expect(title).toHaveClass("text-title3");
      expect(title).not.toHaveClass("text-headline");
      expect(content).toHaveClass("platform-macos:p-0");
      expect(content).not.toHaveClass("platform-macos:p-3");
    });

    it("replaces a frame class only when the override carries the same density variant", () => {
      render(
        <Box data-testid="box" className="platform-ios:p-0" classNames={{ content: "p-0" }}>
          Body
        </Box>,
      );
      const element = screen.getByTestId("box");
      const content = element.firstElementChild;
      expect(element).toHaveClass("platform-ios:p-0");
      expect(element).not.toHaveClass("platform-ios:p-4");
      // A bare class is a different rule: both stay, and the library's, declared later in the stylesheet, applies.
      expect(content).toHaveClass("p-0", "platform-macos:p-3");
    });

    it("passes attributes through and takes ref as a plain prop (React 19)", () => {
      const ref = createRef<HTMLDivElement>();
      render(<Box ref={ref} id="playback" data-section="audio" lang="en" />);
      expect(ref.current).toHaveAttribute("id", "playback");
      expect(ref.current).toHaveAttribute("data-section", "audio");
      expect(ref.current).toHaveAttribute("data-box");
      expect(ref.current?.tagName).toBe("DIV");
    });
  });

  describe("keyboard", () => {
    it("adds no tab stop and leaves the tab order of its contents alone", async () => {
      const user = userEvent.setup();
      render(
        <>
          <button>Before</button>
          <Box title="Playback" data-testid="box">
            <button>First</button>
            <Box title="Alerts">
              <button>Second</button>
            </Box>
          </Box>
          <button>After</button>
        </>,
      );
      const order: string[] = [];
      for (let step = 0; step < 4; step += 1) {
        await user.tab();
        order.push(document.activeElement?.textContent ?? "");
      }
      expect(order).toEqual(["Before", "First", "Second", "After"]);
      expect(screen.getByTestId("box")).not.toHaveAttribute("tabindex");
    });
  });

  describe("accessibility (axe, structure only: jsdom computes no colors)", () => {
    it("has no violations with a title and form controls", async () => {
      const { container } = render(
        <Box title="Playback">
          <label>
            <input type="checkbox" defaultChecked /> Crossfade between songs
          </label>
          <label>
            <input type="checkbox" /> Sound check
          </label>
        </Box>,
      );
      expect(await axe(container)).toHaveNoViolations();
    });

    it("has no violations without a title, as a region, and nested", async () => {
      const { container } = render(
        <>
          <Box>
            <p>Untitled</p>
          </Box>
          <Box role="region" title="Storage">
            <Box title="Downloads">
              <p>Nested</p>
            </Box>
          </Box>
          <Box role="region" aria-label="Network">
            <p>Named without a visible title</p>
          </Box>
        </>,
      );
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
