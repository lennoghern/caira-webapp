import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { axe } from "../../test/axe";
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "./Tabs";

/*
 * jsdom has no Web Animations API. React Aria's selection indicator calls
 * `getAnimations()` when the selection moves, to cancel transitions it starts
 * itself; with nothing animating, an empty list is the true answer. Every
 * browser of the baseline has the method. The slide of the indicator is checked
 * in the browser spec.
 */
const hadGetAnimations = "getAnimations" in Element.prototype;
beforeAll(() => {
  if (!hadGetAnimations) Element.prototype.getAnimations = () => [];
});
afterAll(() => {
  if (!hadGetAnimations) delete (Element.prototype as Partial<Element>).getAnimations;
});

/**
 * Behavior, roles and keyboard, in jsdom, against the APG Tabs pattern. What
 * these cannot see (where the control sits, the selected fill and its contrast,
 * the focus ring, right-to-left, forced colors) is read from a real browser in
 * tests/browser/layout/tabs.spec.ts.
 */

function Settings(props: Partial<React.ComponentProps<typeof Tabs>>) {
  return (
    <Tabs {...props}>
      <TabList aria-label="Display settings">
        <Tab id="display">Display</Tab>
        <Tab id="color">Color</Tab>
        <Tab id="night">Night Shift</Tab>
      </TabList>
      <TabPanel id="display">Display content</TabPanel>
      <TabPanel id="color">
        <button>Calibrate</button>
      </TabPanel>
      <TabPanel id="night">Night Shift content</TabPanel>
    </Tabs>
  );
}

const tab = (name: string) => screen.getByRole("tab", { name });

describe("Tabs", () => {
  describe("roles and relationships (APG Tabs)", () => {
    it("is a labelled tablist whose selected tab controls a panel named after it", () => {
      render(<Settings />);
      expect(screen.getByRole("tablist", { name: "Display settings" })).toHaveAttribute("aria-orientation", "horizontal");
      expect(screen.getAllByRole("tab").map((element) => element.querySelector("span > span:not([aria-hidden])")?.textContent)).toEqual([
        "Display",
        "Color",
        "Night Shift",
      ]);
      expect(tab("Display")).toHaveAttribute("aria-selected", "true");
      expect(tab("Color")).toHaveAttribute("aria-selected", "false");

      const panel = screen.getByRole("tabpanel", { name: "Display" });
      expect(panel).toHaveTextContent("Display content");
      expect(tab("Display")).toHaveAttribute("aria-controls", panel.id);
      // Only the selected pane is rendered.
      expect(screen.getAllByRole("tabpanel")).toHaveLength(1);
    });

    it("draws the selection indicator in the selected tab only", () => {
      render(<Settings defaultSelectedKey="color" />);
      // The indicator and the label in the selected tab; the label alone in the others.
      expect(tab("Color").children).toHaveLength(2);
      expect(tab("Display").children).toHaveLength(1);
      // The unseen semibold copy that keeps the width steady is not part of the name.
      expect(tab("Display").querySelector("[aria-hidden]")).toHaveTextContent("Display");
      expect(tab("Display")).toHaveAccessibleName("Display");
    });
  });

  describe("pointer", () => {
    it("selects the tab that is clicked and shows its pane", async () => {
      const user = userEvent.setup();
      render(<Settings />);
      await user.click(tab("Night Shift"));
      expect(tab("Night Shift")).toHaveAttribute("aria-selected", "true");
      expect(screen.getByRole("tabpanel", { name: "Night Shift" })).toHaveTextContent("Night Shift content");
    });

    it("does not select a disabled tab", async () => {
      const user = userEvent.setup();
      render(<Settings disabledKeys={["color"]} />);
      expect(tab("Color")).toHaveAttribute("aria-disabled", "true");
      await user.click(tab("Color"));
      expect(tab("Display")).toHaveAttribute("aria-selected", "true");
    });
  });

  describe("keyboard", () => {
    it("moves with Left and Right, wrapping, and selects as it goes", async () => {
      const user = userEvent.setup();
      render(<Settings />);
      await user.tab();
      expect(tab("Display")).toHaveFocus();
      await user.keyboard("{ArrowRight}");
      expect(tab("Color")).toHaveFocus();
      expect(tab("Color")).toHaveAttribute("aria-selected", "true");
      await user.keyboard("{ArrowRight}{ArrowRight}");
      expect(tab("Display")).toHaveFocus();
      await user.keyboard("{ArrowLeft}");
      expect(tab("Night Shift")).toHaveFocus();
      expect(tab("Night Shift")).toHaveAttribute("aria-selected", "true");
    });

    it("goes to the first and last tab with Home and End", async () => {
      const user = userEvent.setup();
      render(<Settings defaultSelectedKey="color" />);
      await user.tab();
      await user.keyboard("{End}");
      expect(tab("Night Shift")).toHaveFocus();
      await user.keyboard("{Home}");
      expect(tab("Display")).toHaveFocus();
    });

    it("skips a disabled tab", async () => {
      const user = userEvent.setup();
      render(<Settings disabledKeys={["color"]} />);
      await user.tab();
      await user.keyboard("{ArrowRight}");
      expect(tab("Night Shift")).toHaveFocus();
    });

    it("uses Up and Down when vertical", async () => {
      const user = userEvent.setup();
      render(<Settings orientation="vertical" />);
      expect(screen.getByRole("tablist")).toHaveAttribute("aria-orientation", "vertical");
      await user.tab();
      await user.keyboard("{ArrowDown}");
      expect(tab("Color")).toHaveFocus();
      await user.keyboard("{ArrowUp}");
      expect(tab("Display")).toHaveFocus();
    });

    it("with manual activation, arrows only move focus and Enter or Space selects", async () => {
      const user = userEvent.setup();
      render(<Settings keyboardActivation="manual" />);
      await user.tab();
      await user.keyboard("{ArrowRight}");
      expect(tab("Color")).toHaveFocus();
      expect(tab("Display")).toHaveAttribute("aria-selected", "true");
      await user.keyboard("{Enter}");
      expect(tab("Color")).toHaveAttribute("aria-selected", "true");
      await user.keyboard("{ArrowRight} ");
      expect(tab("Night Shift")).toHaveAttribute("aria-selected", "true");
    });

    it("is one tab stop, and Tab goes on into the pane", async () => {
      const user = userEvent.setup();
      render(<Settings />);
      await user.tab();
      expect(tab("Display")).toHaveFocus();
      // A pane with nothing focusable inside is a tab stop itself.
      await user.tab();
      expect(screen.getByRole("tabpanel", { name: "Display" })).toHaveFocus();

      await user.click(tab("Color"));
      await user.tab();
      expect(screen.getByRole("button", { name: "Calibrate" })).toHaveFocus();
    });
  });

  describe("controlled and uncontrolled", () => {
    it("starts from defaultSelectedKey and reports changes", async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();
      render(<Settings defaultSelectedKey="color" onSelectionChange={onSelectionChange} />);
      expect(tab("Color")).toHaveAttribute("aria-selected", "true");
      await user.click(tab("Display"));
      expect(onSelectionChange).toHaveBeenLastCalledWith("display");
    });

    it("follows selectedKey", async () => {
      const user = userEvent.setup();
      function Controlled() {
        const [key, setKey] = useState<string | number>("night");
        return (
          <>
            <output>{key}</output>
            <Settings selectedKey={key} onSelectionChange={setKey} />
          </>
        );
      }
      render(<Controlled />);
      expect(tab("Night Shift")).toHaveAttribute("aria-selected", "true");
      await user.click(tab("Color"));
      expect(screen.getByRole("status")).toHaveTextContent("color");
      expect(tab("Color")).toHaveAttribute("aria-selected", "true");
    });

    it("stays on the selected tab when the change is not accepted", async () => {
      const user = userEvent.setup();
      render(<Settings selectedKey="display" onSelectionChange={() => {}} />);
      await user.click(tab("Color"));
      expect(tab("Display")).toHaveAttribute("aria-selected", "true");
    });
  });

  describe("parts", () => {
    it("passes ref and className to each part, the caller's classes winning", () => {
      const root = createRef<HTMLDivElement>();
      const list = createRef<HTMLDivElement>();
      const first = createRef<HTMLDivElement>();
      const panels = createRef<HTMLDivElement>();
      const panel = createRef<HTMLDivElement>();
      render(
        <Tabs ref={root} className="max-w-md gap-4">
          <TabList ref={list} aria-label="Sections" className="self-start">
            <Tab ref={first} id="a" className="px-5">
              One
            </Tab>
            <Tab id="b">Two</Tab>
          </TabList>
          <TabPanels ref={panels} className="mt-1">
            <TabPanel ref={panel} id="a" className="p-0">
              First
            </TabPanel>
            <TabPanel id="b">Second</TabPanel>
          </TabPanels>
        </Tabs>,
      );
      expect(root.current).toHaveClass("max-w-md", "gap-4", "flex");
      expect(root.current).not.toHaveClass("gap-2");
      expect(root.current).toHaveAttribute("data-orientation", "horizontal");
      expect(list.current).toBe(screen.getByRole("tablist"));
      expect(list.current).toHaveClass("self-start");
      expect(first.current).toBe(tab("One"));
      expect(first.current).toHaveClass("px-5");
      expect(first.current).not.toHaveClass("px-3");
      expect(panels.current).toHaveClass("mt-1", "min-w-0");
      expect(panel.current).toBe(screen.getByRole("tabpanel"));
      expect(panel.current).toHaveClass("p-0", "rounded-box");
      expect(panel.current).not.toHaveClass("p-4");
    });
  });

  describe("accessibility (axe, structure only: jsdom computes no colors)", () => {
    it("has no violations horizontal, vertical and with a disabled tab", async () => {
      const { container } = render(
        <>
          <Settings />
          <Tabs orientation="vertical" disabledKeys={["b"]}>
            <TabList aria-label="Sections">
              <Tab id="a">One</Tab>
              <Tab id="b">Two</Tab>
            </TabList>
            <TabPanel id="a">First</TabPanel>
            <TabPanel id="b">Second</TabPanel>
          </Tabs>
        </>,
      );
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
