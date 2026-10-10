import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "../../test/axe";
import { Disclosure, DisclosureGroup, DisclosurePanel, DisclosureTrigger } from "./Disclosure";

/**
 * Behavior, roles and keyboard, in jsdom, against the APG Disclosure and
 * Accordion patterns. What these cannot see (the direction the glyph points,
 * the height changing over time, right-to-left, forced colors) is read from a
 * real browser in tests/browser/layout/disclosure.spec.ts.
 */

function Options(props: Partial<React.ComponentProps<typeof Disclosure>>) {
  return (
    <Disclosure {...props}>
      <DisclosureTrigger>Advanced options</DisclosureTrigger>
      <DisclosurePanel>
        <button>Inside</button>
      </DisclosurePanel>
    </Disclosure>
  );
}

const trigger = (name = "Advanced options") => screen.getByRole("button", { name });
/** The panel is hidden from the accessibility tree while collapsed, so it is found through the trigger. */
const panelOf = (button: HTMLElement) => document.getElementById(button.getAttribute("aria-controls") ?? "")!;

describe("Disclosure", () => {
  describe("roles and relationships (APG Disclosure)", () => {
    it("is a button that says it is collapsed and points to the content it controls", () => {
      render(<Options />);
      const button = trigger();
      expect(button).toHaveAttribute("aria-expanded", "false");
      const panel = panelOf(button);
      expect(panel).toHaveAttribute("role", "group");
      expect(panel).toHaveAttribute("aria-labelledby", button.id);
      // Collapsed content is hidden from everyone, and stays findable by the browser's find-in-page.
      expect(panel).toHaveAttribute("hidden", "until-found");
      expect(panel).toHaveAttribute("aria-hidden", "true");
    });

    it("shows the content when expanded and names it from the trigger", () => {
      render(<Options defaultExpanded />);
      expect(trigger()).toHaveAttribute("aria-expanded", "true");
      const panel = screen.getByRole("group", { name: "Advanced options" });
      expect(panel).not.toHaveAttribute("hidden");
      expect(within(panel).getByRole("button", { name: "Inside" })).toBeInTheDocument();
    });

    it("has no heading around the trigger by default, and one when a level is given", () => {
      const { unmount } = render(<Options />);
      expect(screen.queryByRole("heading")).not.toBeInTheDocument();
      unmount();
      render(
        <Disclosure>
          <DisclosureTrigger headingLevel={2}>Advanced options</DisclosureTrigger>
          <DisclosurePanel>Content</DisclosurePanel>
        </Disclosure>,
      );
      expect(within(screen.getByRole("heading", { level: 2 })).getByRole("button")).toBe(trigger());
    });

    it("takes its name from aria-label in the button form, which may have no visible label", () => {
      render(
        <Disclosure variant="button">
          <DisclosureTrigger aria-label="Show more locations" />
          <DisclosurePanel>Content</DisclosurePanel>
        </Disclosure>,
      );
      const button = trigger("Show more locations");
      expect(button).toHaveAttribute("aria-expanded", "false");
      // Only the glyph inside: no empty label element.
      expect(button.children).toHaveLength(1);
      expect(button.closest("[data-variant]")).toHaveAttribute("data-variant", "button");
    });
  });

  describe("pointer and keyboard", () => {
    it("toggles on click", async () => {
      const user = userEvent.setup();
      render(<Options />);
      await user.click(trigger());
      expect(trigger()).toHaveAttribute("aria-expanded", "true");
      await user.click(trigger());
      expect(trigger()).toHaveAttribute("aria-expanded", "false");
    });

    it.each([
      ["Enter", "{Enter}"],
      ["Space", " "],
    ])("toggles with %s and keeps focus on the trigger", async (_name, key) => {
      const user = userEvent.setup();
      render(<Options />);
      await user.tab();
      expect(trigger()).toHaveFocus();
      await user.keyboard(key);
      expect(trigger()).toHaveAttribute("aria-expanded", "true");
      expect(trigger()).toHaveFocus();
      await user.keyboard(key);
      expect(trigger()).toHaveAttribute("aria-expanded", "false");
      expect(trigger()).toHaveFocus();
    });

    // That Tab skips the content while it is collapsed is asserted in the browser spec: it rests on
    // `hidden="until-found"`, which jsdom does not implement (it leaves the content focusable).
    it("lets Tab into the content once it is shown", async () => {
      const user = userEvent.setup();
      render(<Options />);
      await user.click(trigger());
      await user.tab();
      expect(screen.getByRole("button", { name: "Inside" })).toHaveFocus();
    });

    it("does nothing while disabled", async () => {
      const user = userEvent.setup();
      const onExpandedChange = vi.fn();
      render(<Options isDisabled onExpandedChange={onExpandedChange} />);
      expect(trigger()).toBeDisabled();
      await user.click(trigger());
      expect(onExpandedChange).not.toHaveBeenCalled();
      expect(trigger()).toHaveAttribute("aria-expanded", "false");
    });
  });

  describe("controlled and uncontrolled", () => {
    it("starts from defaultExpanded and reports changes", async () => {
      const user = userEvent.setup();
      const onExpandedChange = vi.fn();
      render(<Options defaultExpanded onExpandedChange={onExpandedChange} />);
      await user.click(trigger());
      expect(onExpandedChange).toHaveBeenLastCalledWith(false);
      expect(trigger()).toHaveAttribute("aria-expanded", "false");
    });

    it("follows isExpanded and does not change by itself", async () => {
      const user = userEvent.setup();
      const onExpandedChange = vi.fn();
      const { rerender } = render(<Options isExpanded={false} onExpandedChange={onExpandedChange} />);
      await user.click(trigger());
      expect(onExpandedChange).toHaveBeenCalledWith(true);
      expect(trigger()).toHaveAttribute("aria-expanded", "false");
      rerender(<Options isExpanded onExpandedChange={onExpandedChange} />);
      expect(trigger()).toHaveAttribute("aria-expanded", "true");
    });
  });

  describe("parts", () => {
    it("passes ref and className to each part, the caller's classes winning", () => {
      const root = createRef<HTMLDivElement>();
      const button = createRef<HTMLButtonElement>();
      const panel = createRef<HTMLDivElement>();
      render(
        <Disclosure ref={root} defaultExpanded className="max-w-sm text-callout">
          <DisclosureTrigger ref={button} className="rounded-none">
            Advanced options
          </DisclosureTrigger>
          <DisclosurePanel ref={panel} className="grid gap-2 pb-0">
            Content
          </DisclosurePanel>
        </Disclosure>,
      );
      expect(root.current).toHaveClass("max-w-sm", "text-callout", "flex");
      expect(root.current).not.toHaveClass("text-body");
      expect(root.current).toHaveAttribute("data-expanded", "true");
      expect(button.current).toBe(trigger());
      expect(button.current).toHaveClass("rounded-none");
      expect(button.current).not.toHaveClass("rounded-control");
      // The panel ref is the element the trigger controls; classes go to the element around the children.
      expect(panel.current).toBe(panelOf(trigger()));
      const content = panel.current!.firstElementChild;
      expect(content).toHaveClass("grid", "gap-2", "pb-0");
      expect(content).not.toHaveClass("pb-2");
      expect(content).toHaveTextContent("Content");
    });
  });
});

describe("DisclosureGroup (APG Accordion)", () => {
  function Settings(props: Partial<React.ComponentProps<typeof DisclosureGroup>>) {
    return (
      <DisclosureGroup {...props}>
        <Disclosure id="general">
          <DisclosureTrigger>General</DisclosureTrigger>
          <DisclosurePanel>General content</DisclosurePanel>
        </Disclosure>
        <Disclosure id="sharing">
          <DisclosureTrigger>Sharing</DisclosureTrigger>
          <DisclosurePanel>Sharing content</DisclosurePanel>
        </Disclosure>
        <Disclosure id="advanced">
          <DisclosureTrigger headingLevel={4}>Advanced</DisclosureTrigger>
          <DisclosurePanel>Advanced content</DisclosurePanel>
        </Disclosure>
      </DisclosureGroup>
    );
  }

  it("puts each trigger in a heading, level 3 unless told otherwise", () => {
    render(<Settings />);
    expect(screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent)).toEqual(["General", "Sharing"]);
    expect(screen.getByRole("heading", { level: 4 })).toHaveTextContent("Advanced");
  });

  it("keeps one disclosure open at a time by default", async () => {
    const user = userEvent.setup();
    render(<Settings defaultExpandedKeys={["general"]} />);
    await user.click(trigger("Sharing"));
    expect(trigger("General")).toHaveAttribute("aria-expanded", "false");
    expect(trigger("Sharing")).toHaveAttribute("aria-expanded", "true");
  });

  it("lets several stay open with allowsMultipleExpanded", async () => {
    const user = userEvent.setup();
    render(<Settings allowsMultipleExpanded defaultExpandedKeys={["general"]} />);
    await user.click(trigger("Sharing"));
    expect(trigger("General")).toHaveAttribute("aria-expanded", "true");
    expect(trigger("Sharing")).toHaveAttribute("aria-expanded", "true");
  });

  it("can be controlled through expandedKeys", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [keys, setKeys] = useState<Set<string | number>>(new Set(["sharing"]));
      return (
        <>
          <output>{[...keys].join(",")}</output>
          <Settings expandedKeys={keys} onExpandedChange={setKeys} />
        </>
      );
    }
    render(<Controlled />);
    expect(trigger("Sharing")).toHaveAttribute("aria-expanded", "true");
    await user.click(trigger("Advanced"));
    expect(screen.getByRole("status")).toHaveTextContent("advanced");
    expect(trigger("Sharing")).toHaveAttribute("aria-expanded", "false");
  });

  it("moves between triggers with Tab and disables them all with isDisabled", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Settings />);
    await user.tab();
    expect(trigger("General")).toHaveFocus();
    await user.tab();
    expect(trigger("Sharing")).toHaveFocus();
    unmount();
    render(<Settings isDisabled />);
    for (const name of ["General", "Sharing", "Advanced"]) expect(trigger(name)).toBeDisabled();
  });
});

describe("accessibility (axe, structure only: jsdom computes no colors)", () => {
  it("has no violations collapsed, expanded, as a button and disabled", async () => {
    const { container } = render(
      <>
        <Options />
        <Disclosure defaultExpanded>
          <DisclosureTrigger>Shown</DisclosureTrigger>
          <DisclosurePanel>
            <label>
              <input type="checkbox" /> Keep a copy
            </label>
          </DisclosurePanel>
        </Disclosure>
        <Disclosure variant="button">
          <DisclosureTrigger aria-label="Show more locations" />
          <DisclosurePanel>Locations</DisclosurePanel>
        </Disclosure>
        <Disclosure isDisabled>
          <DisclosureTrigger>Unavailable</DisclosureTrigger>
          <DisclosurePanel>Content</DisclosurePanel>
        </Disclosure>
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no violations as a group", async () => {
    const { container } = render(
      <DisclosureGroup defaultExpandedKeys={["a"]}>
        <Disclosure id="a">
          <DisclosureTrigger>General</DisclosureTrigger>
          <DisclosurePanel>General content</DisclosurePanel>
        </Disclosure>
        <Disclosure id="b">
          <DisclosureTrigger>Sharing</DisclosureTrigger>
          <DisclosurePanel>Sharing content</DisclosurePanel>
        </Disclosure>
      </DisclosureGroup>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
