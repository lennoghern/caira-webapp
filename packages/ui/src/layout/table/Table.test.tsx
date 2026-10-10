import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import type { Key, SortDescriptor } from "react-aria-components";
import { describe, expect, it, vi } from "vitest";
import { axe } from "../../test/axe";
import { Cell, Column, ResizableTableContainer, Row, Table, TableBody, TableHeader } from "./Table";

/**
 * Behavior, roles and keyboard, in jsdom, against the APG Grid and Treegrid
 * patterns. What these cannot see (row heights, the stripe, the highlight, the
 * direction of the sort indicator and of the triangle, resizing by drag,
 * right-to-left, forced colors) is read from a real browser in
 * tests/browser/layout/table.spec.ts.
 */

function Files(props: Partial<React.ComponentProps<typeof Table>>) {
  return (
    <Table aria-label="Files" {...props}>
      <TableHeader>
        <Column id="name" isRowHeader allowsSorting>
          Name
        </Column>
        <Column id="kind">Kind</Column>
        <Column id="size" allowsSorting>
          Size
        </Column>
      </TableHeader>
      <TableBody>
        <Row id="report">
          <Cell>Report</Cell>
          <Cell>Document</Cell>
          <Cell>24 KB</Cell>
        </Row>
        <Row id="budget">
          <Cell>Budget</Cell>
          <Cell>Spreadsheet</Cell>
          <Cell>310 KB</Cell>
        </Row>
        <Row id="photo">
          <Cell>Photo</Cell>
          <Cell>Image</Cell>
          <Cell>2 MB</Cell>
        </Row>
      </TableBody>
    </Table>
  );
}

const row = (name: string) => screen.getByRole("row", { name });

describe("Table", () => {
  describe("roles (APG Grid)", () => {
    it("is a labelled grid with column headers, a row header per row and cells", () => {
      render(<Files />);
      const grid = screen.getByRole("grid", { name: "Files" });
      expect(grid.tagName).toBe("TABLE");
      expect(within(grid).getAllByRole("columnheader").map((element) => element.textContent)).toEqual(["Name", "Kind", "Size"]);
      // A row is named by its row header.
      const report = row("Report");
      expect(within(report).getByRole("rowheader")).toHaveTextContent("Report");
      expect(within(report).getAllByRole("gridcell").map((element) => element.textContent)).toEqual(["Document", "24 KB"]);
    });

    it("shows what the caller gives when there are no rows", () => {
      render(
        <Table aria-label="Results">
          <TableHeader>
            <Column isRowHeader>Name</Column>
          </TableHeader>
          <TableBody renderEmptyState={() => "No results"}>{[]}</TableBody>
        </Table>,
      );
      expect(screen.getByText("No results")).toBeInTheDocument();
    });

    it("marks alternating rows only when asked", () => {
      const { unmount } = render(<Files striped />);
      expect(screen.getByRole("grid")).toHaveAttribute("data-striped");
      unmount();
      render(<Files />);
      expect(screen.getByRole("grid")).not.toHaveAttribute("data-striped");
    });
  });

  describe("sorting", () => {
    function Sorted() {
      const [sort, setSort] = useState<SortDescriptor>({ column: "name", direction: "ascending" });
      return <Files sortDescriptor={sort} onSortChange={setSort} />;
    }
    const heading = (name: string) => screen.getByRole("columnheader", { name });

    it("says which column is sorted and reverses the order on a second press", async () => {
      const user = userEvent.setup();
      render(<Sorted />);
      expect(heading("Name")).toHaveAttribute("aria-sort", "ascending");
      expect(heading("Size")).toHaveAttribute("aria-sort", "none");
      // A column that cannot be sorted says nothing about sorting.
      expect(heading("Kind")).not.toHaveAttribute("aria-sort");

      await user.click(heading("Name"));
      expect(heading("Name")).toHaveAttribute("aria-sort", "descending");
      await user.click(heading("Size"));
      expect(heading("Size")).toHaveAttribute("aria-sort", "ascending");
      expect(heading("Name")).toHaveAttribute("aria-sort", "none");
    });

    it("draws the direction in sortable headings only, as decoration", () => {
      render(<Sorted />);
      expect(heading("Name").querySelector('[data-icon="chevron-up"]')).toHaveAttribute("aria-hidden", "true");
      expect(heading("Size").querySelector('[data-icon="chevron-up"]')).not.toBeNull();
      expect(heading("Kind").querySelector("svg")).toBeNull();
    });

    it("sorts from the keyboard with Enter on a heading", async () => {
      const user = userEvent.setup();
      const onSortChange = vi.fn();
      render(<Files onSortChange={onSortChange} />);
      await user.tab();
      await user.keyboard("{ArrowUp}");
      expect(heading("Name")).toHaveFocus();
      await user.keyboard("{Enter}");
      expect(onSortChange).toHaveBeenCalledWith({ column: "name", direction: "ascending" });
    });
  });

  describe("keyboard", () => {
    it("is one tab stop and moves between rows and cells with the arrows", async () => {
      const user = userEvent.setup();
      render(
        <>
          <Files />
          <button>After</button>
        </>,
      );
      await user.tab();
      expect(row("Report")).toHaveFocus();
      await user.keyboard("{ArrowDown}");
      expect(row("Budget")).toHaveFocus();
      await user.keyboard("{ArrowRight}");
      expect(within(row("Budget")).getByRole("rowheader")).toHaveFocus();
      await user.keyboard("{ArrowRight}");
      expect(within(row("Budget")).getAllByRole("gridcell")[0]).toHaveFocus();
      await user.keyboard("{ArrowDown}");
      expect(within(row("Photo")).getAllByRole("gridcell")[0]).toHaveFocus();
      await user.tab();
      expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
    });

    it("selects rows with Space", async () => {
      const user = userEvent.setup();
      render(<Files selectionMode="multiple" />);
      await user.tab();
      await user.keyboard(" {ArrowDown} ");
      expect(row("Report")).toHaveAttribute("aria-selected", "true");
      expect(row("Budget")).toHaveAttribute("aria-selected", "true");
      expect(row("Photo")).toHaveAttribute("aria-selected", "false");
    });

    it("performs the row action with Enter while nothing is selected, and not while a selection is in progress", async () => {
      const user = userEvent.setup();
      const onRowAction = vi.fn();
      render(<Files selectionMode="multiple" onRowAction={onRowAction} />);
      await user.tab();
      await user.keyboard("{ArrowDown}{Enter}");
      expect(onRowAction).toHaveBeenCalledWith("budget");
      expect(row("Budget")).toHaveAttribute("aria-selected", "false");

      // React Aria's toggle behavior, observed here: once rows are selected, a press belongs to selection.
      onRowAction.mockClear();
      await user.keyboard(" {ArrowDown}{Enter}");
      expect(row("Budget")).toHaveAttribute("aria-selected", "true");
      expect(onRowAction).not.toHaveBeenCalled();
    });
  });

  describe("pointer", () => {
    it("selects the row that is clicked and reports it", async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();
      render(<Files selectionMode="single" onSelectionChange={onSelectionChange} />);
      await user.click(row("Photo"));
      expect(row("Photo")).toHaveAttribute("aria-selected", "true");
      expect([...(onSelectionChange.mock.lastCall![0] as Set<Key>)]).toEqual(["photo"]);
    });

    it("leaves a disabled row alone", async () => {
      const user = userEvent.setup();
      render(<Files selectionMode="single" disabledKeys={["budget"]} />);
      await user.click(row("Budget"));
      expect(row("Budget")).toHaveAttribute("aria-selected", "false");
      expect(row("Budget")).toHaveAttribute("aria-disabled", "true");
    });
  });

  describe("resizable columns", () => {
    it("puts a resizer, a labelled slider, in the headings that ask for one", () => {
      render(
        <ResizableTableContainer data-testid="container">
          <Table aria-label="Files">
            <TableHeader>
              <Column id="name" isRowHeader allowsResizing>
                Name
              </Column>
              <Column id="size">Size</Column>
            </TableHeader>
            <TableBody>
              <Row id="a">
                <Cell>Report</Cell>
                <Cell>24 KB</Cell>
              </Row>
            </TableBody>
          </Table>
        </ResizableTableContainer>,
      );
      expect(screen.getByTestId("container")).toHaveClass("overflow-auto");
      // React Aria draws the handle as a presentational element around a visually hidden slider.
      const sliders = screen.getAllByRole("slider");
      expect(sliders).toHaveLength(1);
      expect(sliders[0]).toHaveAccessibleName();
      const heading = screen.getAllByRole("columnheader")[0]!;
      expect(heading).toContainElement(sliders[0]!);
      // The label is the heading's first focusable child, so reaching the heading does not start a resize.
      expect(heading.querySelector("[tabindex]")).toHaveTextContent("Name");
      expect(screen.getAllByRole("columnheader")[1]!.querySelector("[tabindex]")).toBeNull();
    });
  });

  describe("parts", () => {
    it("passes ref and className to each part, the caller's classes winning", () => {
      const tableRef = createRef<HTMLTableElement | HTMLDivElement>();
      const columnRef = createRef<HTMLTableCellElement | HTMLDivElement>();
      const rowRef = createRef<HTMLTableRowElement | HTMLDivElement>();
      const cellRef = createRef<HTMLTableCellElement | HTMLDivElement>();
      render(
        <Table ref={tableRef} aria-label="Files" className="w-auto text-callout">
          <TableHeader>
            <Column ref={columnRef} isRowHeader className="px-5">
              Name
            </Column>
          </TableHeader>
          <TableBody>
            <Row ref={rowRef} id="a" className="cursor-pointer">
              <Cell ref={cellRef} className="px-5">
                Report
              </Cell>
            </Row>
          </TableBody>
        </Table>,
      );
      expect(tableRef.current).toBe(screen.getByRole("grid"));
      expect(tableRef.current).toHaveClass("w-auto", "text-callout");
      expect(tableRef.current).not.toHaveClass("w-full", "text-body");
      expect(columnRef.current).toBe(screen.getByRole("columnheader"));
      expect(columnRef.current).toHaveClass("px-5");
      expect(rowRef.current).toBe(row("Report"));
      expect(rowRef.current).toHaveClass("cursor-pointer");
      expect(rowRef.current).not.toHaveClass("cursor-default");
      expect(cellRef.current).toBe(screen.getByRole("rowheader"));
      expect(cellRef.current).not.toHaveClass("px-3");
    });
  });

  describe("accessibility (axe, structure only: jsdom computes no colors)", () => {
    it("has no violations plain, sorted with selection, and empty", async () => {
      const { container } = render(
        <>
          <Files />
          <Files
            aria-label="Sorted files"
            striped
            selectionMode="multiple"
            defaultSelectedKeys={["budget"]}
            sortDescriptor={{ column: "size", direction: "descending" }}
          />
          <Table aria-label="Results">
            <TableHeader>
              <Column isRowHeader>Name</Column>
            </TableHeader>
            <TableBody renderEmptyState={() => "No results"}>{[]}</TableBody>
          </Table>
        </>,
      );
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
