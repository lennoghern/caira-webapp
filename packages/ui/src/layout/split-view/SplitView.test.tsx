import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "../../test/axe";
import { SplitView, SplitViewPane } from "./SplitView";

/**
 * Behavior, roles and keyboard, in jsdom, against the APG Window Splitter
 * pattern. jsdom has no layout, so sizes are read from the value the divider
 * reports and from the pane's flex basis. What these cannot see (that the panes
 * really take those sizes, a drag with a real pointer, right-to-left, the
 * divider's colors, forced colors) is read from a real browser in
 * tests/browser/layout/split-view.spec.ts.
 */

type PaneProps = Partial<React.ComponentProps<typeof SplitViewPane>>;

function Mail({ pane, ...props }: Partial<React.ComponentProps<typeof SplitView>> & { pane?: PaneProps }) {
  return (
    <SplitView {...props}>
      <SplitViewPane aria-label="Mailboxes" divider="end" data-testid="sidebar" {...pane}>
        <button>Inbox</button>
      </SplitViewPane>
      <SplitViewPane data-testid="content">
        <button>Message</button>
      </SplitViewPane>
    </SplitView>
  );
}

const divider = (name = "Mailboxes") => screen.getByRole("separator", { name });
const sizeOf = (testId: string) => screen.getByTestId(testId).style.flexBasis;

describe("SplitView", () => {
  describe("roles and relationships (APG Window Splitter)", () => {
    it("draws a focusable separator that controls its pane, carries its name and reports its size", () => {
      render(<Mail />);
      const pane = screen.getByRole("group", { name: "Mailboxes" });
      const separator = divider();
      expect(separator).toHaveAttribute("aria-controls", pane.id);
      expect(separator).toHaveAttribute("tabindex", "0");
      // Panes side by side are divided by a vertical line.
      expect(separator).toHaveAttribute("aria-orientation", "vertical");
      expect(separator).toHaveAttribute("aria-valuenow", "240");
      expect(separator).toHaveAttribute("aria-valuemin", "120");
      expect(separator).toHaveAttribute("aria-valuemax", "480");
      expect(sizeOf("sidebar")).toBe("240px");
    });

    it("gives the flexible pane no divider, no size and no role", () => {
      render(<Mail />);
      const content = screen.getByTestId("content");
      expect(content).not.toHaveAttribute("role");
      expect(content.style.flexBasis).toBe("");
      expect(screen.getAllByRole("separator")).toHaveLength(1);
    });

    it("puts the divider on the edge asked for, in document order", () => {
      render(
        <SplitView data-testid="root">
          <SplitViewPane data-testid="content">Content</SplitViewPane>
          <SplitViewPane aria-label="Inspector" divider="start" data-testid="inspector">
            Inspector
          </SplitViewPane>
        </SplitView>,
      );
      const children = [...screen.getByTestId("root").children];
      expect(children.map((element) => element.getAttribute("role") ?? element.getAttribute("data-testid"))).toEqual([
        "content",
        "separator",
        "group",
      ]);
    });

    it("says horizontal for the divider of stacked panes", () => {
      render(<Mail orientation="vertical" data-testid="root" />);
      expect(screen.getByTestId("root")).toHaveAttribute("data-orientation", "vertical");
      expect(divider()).toHaveAttribute("aria-orientation", "horizontal");
    });

    it("clamps the starting size to the limits", () => {
      render(<Mail pane={{ defaultSize: 900, minSize: 100, maxSize: 300 }} />);
      expect(divider()).toHaveAttribute("aria-valuenow", "300");
    });
  });

  describe("keyboard", () => {
    it("moves the divider with Left and Right by the step, and stops at the limits", async () => {
      const user = userEvent.setup();
      const onSizeChange = vi.fn();
      render(<Mail pane={{ onSizeChange, minSize: 200, maxSize: 280 }} />);
      await user.tab();
      await user.tab();
      expect(divider()).toHaveFocus();
      await user.keyboard("{ArrowRight}");
      expect(divider()).toHaveAttribute("aria-valuenow", "256");
      expect(sizeOf("sidebar")).toBe("256px");
      expect(onSizeChange).toHaveBeenLastCalledWith(256);
      await user.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}");
      expect(divider()).toHaveAttribute("aria-valuenow", "280");
      await user.keyboard("{ArrowLeft}");
      expect(divider()).toHaveAttribute("aria-valuenow", "264");
      expect(divider()).toHaveFocus();
    });

    it("goes to the smallest and largest size with Home and End", async () => {
      const user = userEvent.setup();
      render(<Mail />);
      divider().focus();
      await user.keyboard("{Home}");
      expect(divider()).toHaveAttribute("aria-valuenow", "120");
      await user.keyboard("{End}");
      expect(divider()).toHaveAttribute("aria-valuenow", "480");
    });

    it("uses Up and Down for stacked panes, and ignores the other pair", async () => {
      const user = userEvent.setup();
      render(<Mail orientation="vertical" />);
      divider().focus();
      await user.keyboard("{ArrowDown}");
      expect(divider()).toHaveAttribute("aria-valuenow", "256");
      await user.keyboard("{ArrowUp}{ArrowUp}");
      expect(divider()).toHaveAttribute("aria-valuenow", "224");
      await user.keyboard("{ArrowRight}{ArrowLeft}{ArrowLeft}");
      expect(divider()).toHaveAttribute("aria-valuenow", "224");
    });

    it("grows a pane whose divider is on its start edge when the divider moves toward the start", async () => {
      const user = userEvent.setup();
      render(
        <SplitView>
          <SplitViewPane>Content</SplitViewPane>
          <SplitViewPane aria-label="Inspector" divider="start">
            Inspector
          </SplitViewPane>
        </SplitView>,
      );
      divider("Inspector").focus();
      await user.keyboard("{ArrowLeft}");
      expect(divider("Inspector")).toHaveAttribute("aria-valuenow", "256");
    });

    it("collapses a collapsible pane with Enter and restores the size it had", async () => {
      const user = userEvent.setup();
      const onCollapsedChange = vi.fn();
      render(<Mail pane={{ collapsible: true, onCollapsedChange }} />);
      divider().focus();
      await user.keyboard("{ArrowRight}{Enter}");
      expect(onCollapsedChange).toHaveBeenLastCalledWith(true);
      const pane = screen.getByTestId("sidebar");
      expect(pane).toHaveAttribute("hidden");
      expect(pane).toHaveAttribute("data-collapsed");
      // 0 is the collapsed position, and the smallest value the divider can report.
      expect(divider()).toHaveAttribute("aria-valuenow", "0");
      expect(divider()).toHaveAttribute("aria-valuemin", "0");
      expect(divider()).toHaveFocus();

      await user.keyboard("{Enter}");
      expect(onCollapsedChange).toHaveBeenLastCalledWith(false);
      expect(pane).not.toHaveAttribute("hidden");
      expect(divider()).toHaveAttribute("aria-valuenow", "256");
    });

    it("does nothing on Enter when the pane cannot be collapsed", async () => {
      const user = userEvent.setup();
      render(<Mail />);
      divider().focus();
      await user.keyboard("{Enter}");
      expect(screen.getByTestId("sidebar")).not.toHaveAttribute("hidden");
      expect(divider()).toHaveAttribute("aria-valuenow", "240");
    });

    it("takes the content of a collapsed pane out of the tab order", async () => {
      const user = userEvent.setup();
      render(<Mail pane={{ collapsible: true, defaultCollapsed: true }} />);
      await user.tab();
      expect(divider()).toHaveFocus();
      await user.tab();
      expect(screen.getByRole("button", { name: "Message" })).toHaveFocus();
    });
  });

  describe("pointer", () => {
    const drag = (from: number, to: number, pointerId = 1) => {
      fireEvent.pointerDown(divider(), { button: 0, pointerId, clientX: from, clientY: from });
      fireEvent.pointerMove(divider(), { pointerId, clientX: to, clientY: to });
    };
    const release = (pointerId = 1) => fireEvent.pointerUp(divider(), { pointerId });

    it("follows the pointer while it is down, and stops when it is released", () => {
      render(<Mail />);
      drag(240, 300);
      expect(divider()).toHaveAttribute("aria-valuenow", "300");
      expect(divider()).toHaveAttribute("data-dragging");
      expect(divider()).toHaveFocus();
      release();
      expect(divider()).not.toHaveAttribute("data-dragging");
      fireEvent.pointerMove(divider(), { pointerId: 1, clientX: 400 });
      expect(divider()).toHaveAttribute("aria-valuenow", "300");
    });

    it("stops at the limits and ignores another button and another pointer", () => {
      render(<Mail />);
      drag(240, 2000);
      expect(divider()).toHaveAttribute("aria-valuenow", "480");
      fireEvent.pointerMove(divider(), { pointerId: 2, clientX: 0 });
      expect(divider()).toHaveAttribute("aria-valuenow", "480");
      release();
      fireEvent.pointerDown(divider(), { button: 2, pointerId: 3, clientX: 480 });
      fireEvent.pointerMove(divider(), { pointerId: 3, clientX: 300 });
      expect(divider()).toHaveAttribute("aria-valuenow", "480");
    });

    it("collapses a collapsible pane dragged past half its minimum, and brings it back on the way out", () => {
      render(<Mail pane={{ collapsible: true }} />);
      // 240 wide, minimum 120: under 60 it is hidden.
      drag(240, 50);
      expect(screen.getByTestId("sidebar")).toHaveAttribute("hidden");
      fireEvent.pointerMove(divider(), { pointerId: 1, clientX: 80 });
      expect(screen.getByTestId("sidebar")).not.toHaveAttribute("hidden");
      expect(divider()).toHaveAttribute("aria-valuenow", "120");
      release();
    });

    it("keeps a pane that is not collapsible at its minimum", () => {
      render(<Mail />);
      drag(240, 0);
      expect(screen.getByTestId("sidebar")).not.toHaveAttribute("hidden");
      expect(divider()).toHaveAttribute("aria-valuenow", "120");
      release();
    });

    it("returns to the default size on a double click, with no dragging", async () => {
      const user = userEvent.setup();
      render(<Mail pane={{ defaultSize: 200 }} />);
      divider().focus();
      await user.keyboard("{End}");
      expect(divider()).toHaveAttribute("aria-valuenow", "480");
      await user.dblClick(divider());
      expect(divider()).toHaveAttribute("aria-valuenow", "200");
    });
  });

  describe("controlled", () => {
    it("follows size and reports what the divider asks for", async () => {
      const user = userEvent.setup();
      const onSizeChange = vi.fn();
      const { rerender } = render(<Mail pane={{ size: 300, onSizeChange }} />);
      divider().focus();
      await user.keyboard("{ArrowRight}");
      expect(onSizeChange).toHaveBeenCalledWith(316);
      // Not accepted by the caller: nothing moves.
      expect(divider()).toHaveAttribute("aria-valuenow", "300");
      rerender(<Mail pane={{ size: 316, onSizeChange }} />);
      expect(sizeOf("sidebar")).toBe("316px");
    });

    it("follows collapsed, so a button elsewhere can hide and show the pane", async () => {
      const user = userEvent.setup();
      function WithButton() {
        const [collapsed, setCollapsed] = useState(false);
        return (
          <>
            <button onClick={() => setCollapsed((value) => !value)}>Toggle sidebar</button>
            <Mail pane={{ collapsible: true, collapsed, onCollapsedChange: setCollapsed }} />
          </>
        );
      }
      render(<WithButton />);
      await user.click(screen.getByRole("button", { name: "Toggle sidebar" }));
      expect(screen.getByTestId("sidebar")).toHaveAttribute("hidden");
      divider().focus();
      await user.keyboard("{Enter}");
      expect(screen.getByTestId("sidebar")).not.toHaveAttribute("hidden");
    });
  });

  describe("parts", () => {
    it("passes ref, className, style and attributes to the split view and to each pane", () => {
      const root = createRef<HTMLDivElement>();
      const pane = createRef<HTMLDivElement>();
      render(
        <SplitView ref={root} className="h-96 text-callout" id="mail">
          <SplitViewPane ref={pane} aria-label="Mailboxes" divider="end" className="bg-background-secondary" style={{ color: "red" }} id="sidebar">
            Sidebar
          </SplitViewPane>
          <SplitViewPane>Content</SplitViewPane>
        </SplitView>,
      );
      expect(root.current).toHaveAttribute("id", "mail");
      expect(root.current).toHaveClass("h-96", "text-callout", "flex");
      expect(root.current).not.toHaveClass("text-body");
      expect(pane.current).toHaveAttribute("id", "sidebar");
      expect(pane.current).toHaveClass("bg-background-secondary", "shrink-0");
      expect(pane.current!.style.color).toBe("red");
      expect(pane.current!.style.flexBasis).toBe("240px");
      expect(divider()).toHaveAttribute("aria-controls", "sidebar");
    });

    it("draws a grip in the thick divider only", () => {
      const { unmount } = render(<Mail dividerStyle="thick" />);
      expect(divider().children).toHaveLength(1);
      unmount();
      render(<Mail />);
      expect(divider().children).toHaveLength(0);
    });
  });

  describe("accessibility (axe, structure only: jsdom computes no colors)", () => {
    it("has no violations with dividers on either edge, stacked, and collapsed", async () => {
      const { container } = render(
        <>
          <SplitView>
            <SplitViewPane aria-label="Mailboxes" divider="end" collapsible>
              Sidebar
            </SplitViewPane>
            <SplitViewPane>Content</SplitViewPane>
            <SplitViewPane aria-label="Inspector" divider="start">
              Inspector
            </SplitViewPane>
          </SplitView>
          <SplitView orientation="vertical" dividerStyle="thick">
            <SplitViewPane aria-label="Notes" divider="end" collapsible defaultCollapsed>
              Notes
            </SplitViewPane>
            <SplitViewPane>Canvas</SplitViewPane>
          </SplitView>
        </>,
      );
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
