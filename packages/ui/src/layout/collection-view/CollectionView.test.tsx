import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import type { Key } from "react-aria-components";
import { describe, expect, it, vi } from "vitest";
import { axe } from "../../test/axe";
import { CollectionItem, CollectionView } from "./CollectionView";

/**
 * Behavior, roles and keyboard, in jsdom, against the APG Grid pattern. jsdom
 * has no layout, and in a grid React Aria finds the item above, below or beside
 * another from where each one is drawn, so moving with the four arrows in a
 * grid is asserted in a real browser, in
 * tests/browser/layout/collection-view.spec.ts, together with the columns, the
 * scrolling row, the highlight, right-to-left and forced colors.
 */

function Photos(props: Partial<React.ComponentProps<typeof CollectionView>>) {
  return (
    <CollectionView aria-label="Photos" {...props}>
      <CollectionItem id="beach" textValue="Beach">
        <span aria-hidden="true" data-picture="" /> Beach
      </CollectionItem>
      <CollectionItem id="forest" textValue="Forest">
        <span aria-hidden="true" data-picture="" /> Forest
      </CollectionItem>
      <CollectionItem id="city" textValue="City">
        <span aria-hidden="true" data-picture="" /> City
      </CollectionItem>
    </CollectionView>
  );
}

const item = (name: string) => screen.getByRole("row", { name });

describe("CollectionView", () => {
  describe("roles (APG Grid)", () => {
    it("is a labelled grid of rows with one cell each, laid out as a grid by default", () => {
      render(<Photos />);
      const grid = screen.getByRole("grid", { name: "Photos" });
      expect(grid).toHaveAttribute("data-layout", "grid");
      expect(grid).toHaveAttribute("data-collection-layout", "grid");
      const rows = within(grid).getAllByRole("row");
      expect(rows.map((element) => element.getAttribute("aria-label"))).toEqual(["Beach", "Forest", "City"]);
      for (const element of rows) expect(within(element).getAllByRole("gridcell")).toHaveLength(1);
    });

    it("becomes a horizontal row when asked", () => {
      render(<Photos layout="row" />);
      const grid = screen.getByRole("grid");
      expect(grid).toHaveAttribute("data-collection-layout", "row");
      // Still a grid to React Aria: one line of it, so Left and Right move along the row.
      expect(grid).toHaveAttribute("data-layout", "grid");
      expect(grid).toHaveClass("flex", "overflow-x-auto");
      expect(item("Beach")).toHaveClass("shrink-0");
    });

    it.each([
      ["small", "[--collection-item-size:6rem]"],
      ["medium", "[--collection-item-size:9rem]"],
      ["large", "[--collection-item-size:12rem]"],
    ] as const)("sets the size of an item for itemSize=%s", (itemSize, className) => {
      render(<Photos itemSize={itemSize} />);
      expect(screen.getByRole("grid")).toHaveClass(className);
    });

    it("shows what the caller gives when there are no items", () => {
      render(<CollectionView aria-label="Photos" renderEmptyState={() => "No photos"} />);
      expect(screen.getByRole("grid")).toHaveAttribute("data-empty", "true");
      expect(screen.getByText("No photos")).toBeInTheDocument();
    });
  });

  describe("keyboard", () => {
    it("is one tab stop; Home, End and typing move between items", async () => {
      const user = userEvent.setup();
      render(
        <>
          <Photos />
          <button>After</button>
        </>,
      );
      await user.tab();
      expect(item("Beach")).toHaveFocus();
      await user.keyboard("{End}");
      expect(item("City")).toHaveFocus();
      await user.keyboard("{Home}");
      expect(item("Beach")).toHaveFocus();
      await user.keyboard("f");
      expect(item("Forest")).toHaveFocus();
      await user.tab();
      expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
    });

    it("moves along a row with Left and Right", async () => {
      const user = userEvent.setup();
      render(<Photos layout="row" />);
      await user.tab();
      await user.keyboard("{ArrowRight}");
      expect(item("Forest")).toHaveFocus();
      await user.keyboard("{ArrowRight}");
      expect(item("City")).toHaveFocus();
      await user.keyboard("{ArrowLeft}");
      expect(item("Forest")).toHaveFocus();
    });

    it("selects with Space and performs the item action with Enter", async () => {
      const user = userEvent.setup();
      const onAction = vi.fn();
      render(<Photos selectionMode="multiple" onAction={onAction} />);
      await user.tab();
      await user.keyboard("{Enter}");
      expect(onAction).toHaveBeenCalledWith("beach");
      await user.keyboard(" ");
      expect(item("Beach")).toHaveAttribute("aria-selected", "true");
    });
  });

  describe("pointer", () => {
    it("selects items on click and reports the keys", async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();
      render(<Photos selectionMode="multiple" onSelectionChange={onSelectionChange} disabledKeys={["city"]} />);
      await user.click(item("Beach"));
      await user.click(item("Forest"));
      expect([...(onSelectionChange.mock.lastCall![0] as Set<Key>)]).toEqual(["beach", "forest"]);
      expect(item("Beach")).toHaveClass("selected:selection-emphasized");
      await user.click(item("City"));
      // A disabled item cannot be selected, and says nothing about selection.
      expect(item("City")).not.toHaveAttribute("aria-selected");
      expect(item("City")).toHaveAttribute("aria-disabled", "true");
    });
  });

  describe("parts", () => {
    it("passes ref and className to each part, the caller's classes winning", () => {
      const root = createRef<HTMLDivElement>();
      const first = createRef<HTMLDivElement>();
      render(
        <CollectionView ref={root} aria-label="Photos" className="gap-4 p-2">
          <CollectionItem ref={first} id="a" textValue="Beach" className="p-0">
            Beach
          </CollectionItem>
        </CollectionView>,
      );
      expect(root.current).toBe(screen.getByRole("grid"));
      expect(root.current).toHaveClass("gap-4", "p-2", "grid");
      expect(root.current).not.toHaveClass("gap-2");
      expect(first.current).toBe(item("Beach"));
      expect(first.current).toHaveClass("p-0", "rounded-box");
      expect(first.current).not.toHaveClass("p-2");
    });
  });

  describe("accessibility (axe, structure only: jsdom computes no colors)", () => {
    it("has no violations as a grid, as a row, with selection and empty", async () => {
      const { container } = render(
        <>
          <Photos />
          <Photos aria-label="Recent photos" layout="row" selectionMode="multiple" defaultSelectedKeys={["forest"]} disabledKeys={["city"]} />
          <CollectionView aria-label="Albums" renderEmptyState={() => "No albums"} />
        </>,
      );
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
