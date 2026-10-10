import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import type { Key } from "react-aria-components";
import { describe, expect, it, vi } from "vitest";
import { Icon } from "../../foundations/icon/Icon";
import { axe } from "../../test/axe";
import { Cell, Column, Row, Table, TableBody, TableHeader } from "../table/Table";
import { OutlineItem, OutlineView } from "./OutlineView";

/**
 * Behavior, roles and keyboard, in jsdom, against the APG Treegrid pattern, for
 * both forms of an outline view: one column (`OutlineView`) and several
 * (`Table` with `treeColumn`).
 *
 * The second half answers the question COMPONENT-MAP.md left open for row 12:
 * whether the tree-column `Table` of React Aria 1.22.0 covers expanding and
 * collapsing by keyboard as the Treegrid pattern requires. It does, with one
 * difference, asserted below so it cannot change unnoticed (DECISIONS.md D-045).
 *
 * What these cannot see (the indent of each level, the direction of the
 * triangle, the highlight, right-to-left, forced colors) is read from a real
 * browser in tests/browser/layout/outline-view.spec.ts.
 */

function Files(props: Partial<React.ComponentProps<typeof OutlineView>>) {
  return (
    <OutlineView aria-label="Files" {...props}>
      <OutlineItem id="documents" title="Documents">
        <OutlineItem id="report" title="Report" />
        <OutlineItem id="archive" title="Archive">
          <OutlineItem id="old" title="Old notes" />
        </OutlineItem>
      </OutlineItem>
      <OutlineItem id="pictures" title="Pictures" />
    </OutlineView>
  );
}

const row = (name: string) => screen.getByRole("row", { name });
const names = () => screen.getAllByRole("row").map((element) => element.getAttribute("aria-label") ?? element.textContent);

describe("OutlineView (one column)", () => {
  describe("roles (APG Treegrid)", () => {
    it("is a labelled treegrid whose rows say their level, their place and whether they are open", () => {
      render(<Files defaultExpandedKeys={["documents"]} />);
      expect(screen.getByRole("treegrid", { name: "Files" })).toBeInTheDocument();
      expect(names()).toEqual(["Documents", "Report", "Archive", "Pictures"]);

      expect(row("Documents")).toHaveAttribute("aria-level", "1");
      expect(row("Documents")).toHaveAttribute("aria-expanded", "true");
      expect(row("Documents")).toHaveAttribute("aria-posinset", "1");
      expect(row("Documents")).toHaveAttribute("aria-setsize", "2");

      expect(row("Archive")).toHaveAttribute("aria-level", "2");
      expect(row("Archive")).toHaveAttribute("aria-expanded", "false");
      expect(row("Archive")).toHaveAttribute("aria-posinset", "2");
      // A row with no children says nothing about expansion.
      expect(row("Report")).not.toHaveAttribute("aria-expanded");
      expect(row("Pictures")).not.toHaveAttribute("aria-expanded");
    });

    it("gives parent rows a named triangle that is not a tab stop, and leaf rows none", () => {
      render(<Files />);
      const triangle = within(row("Documents")).getByRole("button");
      // Named by what it does and by its row.
      expect(triangle).toHaveAccessibleName("Expand Documents");
      expect(triangle).toHaveAttribute("tabindex", "-1");
      expect(within(row("Pictures")).queryByRole("button")).not.toBeInTheDocument();
    });

    it("names a row from textValue when its title is not plain text, and hides the icon", () => {
      render(
        <OutlineView aria-label="Files">
          <OutlineItem
            id="a"
            textValue="Quarterly report"
            icon={<Icon name="info" />}
            title={
              <>
                Quarterly <em>report</em>
              </>
            }
          />
        </OutlineView>,
      );
      const element = row("Quarterly report");
      expect(element.querySelector('[data-icon="info"]')).toHaveAttribute("aria-hidden", "true");
    });

    it("shows what the caller gives when there are no rows", () => {
      render(<OutlineView aria-label="Results" renderEmptyState={() => "No results"} />);
      expect(screen.getByText("No results")).toBeInTheDocument();
    });
  });

  describe("keyboard", () => {
    it("opens a closed row with Right and closes an open one with Left, focus staying on the row", async () => {
      const user = userEvent.setup();
      render(<Files />);
      await user.tab();
      expect(row("Documents")).toHaveFocus();
      await user.keyboard("{ArrowRight}");
      expect(row("Documents")).toHaveAttribute("aria-expanded", "true");
      expect(row("Documents")).toHaveFocus();
      expect(names()).toEqual(["Documents", "Report", "Archive", "Pictures"]);
      await user.keyboard("{ArrowLeft}");
      expect(row("Documents")).toHaveAttribute("aria-expanded", "false");
      expect(names()).toEqual(["Documents", "Pictures"]);
    });

    it("moves to the parent with Left from a row that is closed or has no children", async () => {
      const user = userEvent.setup();
      render(<Files defaultExpandedKeys={["documents"]} />);
      await user.tab();
      await user.keyboard("{ArrowDown}");
      expect(row("Report")).toHaveFocus();
      await user.keyboard("{ArrowLeft}");
      expect(row("Documents")).toHaveFocus();
      await user.keyboard("{ArrowDown}{ArrowDown}");
      expect(row("Archive")).toHaveFocus();
      await user.keyboard("{ArrowLeft}");
      expect(row("Documents")).toHaveFocus();
      expect(row("Documents")).toHaveAttribute("aria-expanded", "true");
    });

    it("stays on an open row with Right (React Aria 1.22.0; the APG Tree View would go to the first child)", async () => {
      const user = userEvent.setup();
      render(<Files defaultExpandedKeys={["documents"]} />);
      await user.tab();
      await user.keyboard("{ArrowRight}");
      expect(row("Documents")).toHaveFocus();
    });

    it("moves between visible rows with Up, Down, Home and End, and by typing", async () => {
      const user = userEvent.setup();
      render(
        <>
          <Files defaultExpandedKeys={["documents"]} />
          <button>After</button>
        </>,
      );
      await user.tab();
      await user.keyboard("{ArrowDown}{ArrowDown}");
      expect(row("Archive")).toHaveFocus();
      await user.keyboard("{ArrowUp}");
      expect(row("Report")).toHaveFocus();
      await user.keyboard("{End}");
      expect(row("Pictures")).toHaveFocus();
      await user.keyboard("{Home}");
      expect(row("Documents")).toHaveFocus();
      await user.keyboard("p");
      expect(row("Pictures")).toHaveFocus();
      // One tab stop: the triangles are not in the tab order.
      await user.tab();
      expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
    });

    it("selects with Space, and performs the row action with Enter", async () => {
      const user = userEvent.setup();
      const onAction = vi.fn();
      render(<Files selectionMode="single" onAction={onAction} />);
      await user.tab();
      await user.keyboard("{Enter}");
      expect(onAction).toHaveBeenCalledWith("documents");
      await user.keyboard("{ArrowDown} ");
      expect(row("Pictures")).toHaveAttribute("aria-selected", "true");
    });
  });

  describe("pointer", () => {
    it("opens and closes a row from its triangle without selecting it", async () => {
      const user = userEvent.setup();
      render(<Files selectionMode="single" />);
      await user.click(within(row("Documents")).getByRole("button"));
      expect(row("Documents")).toHaveAttribute("aria-expanded", "true");
      expect(row("Documents")).toHaveAttribute("aria-selected", "false");
      expect(within(row("Documents")).getByRole("button")).toHaveAccessibleName("Collapse Documents");
      await user.click(within(row("Documents")).getByRole("button"));
      expect(row("Documents")).toHaveAttribute("aria-expanded", "false");
    });

    it("selects the row that is clicked", async () => {
      const user = userEvent.setup();
      render(<Files selectionMode="single" />);
      await user.click(row("Pictures"));
      expect(row("Pictures")).toHaveAttribute("aria-selected", "true");
    });
  });

  describe("controlled expansion", () => {
    it("follows expandedKeys, so an app can keep the state between visits", async () => {
      const user = userEvent.setup();
      function Controlled() {
        const [keys, setKeys] = useState<Set<Key>>(new Set(["documents"]));
        return (
          <>
            <output>{[...keys].join(",")}</output>
            <Files expandedKeys={keys} onExpandedChange={setKeys} />
          </>
        );
      }
      render(<Controlled />);
      expect(row("Documents")).toHaveAttribute("aria-expanded", "true");
      await user.click(within(row("Archive")).getByRole("button"));
      expect(screen.getByRole("status")).toHaveTextContent("documents,archive");
      expect(row("Old notes")).toHaveAttribute("aria-level", "3");
    });
  });

  describe("parts", () => {
    it("passes ref and className to each part, the caller's classes winning", () => {
      const root = createRef<HTMLDivElement>();
      const item = createRef<HTMLDivElement>();
      render(
        <OutlineView ref={root} aria-label="Files" className="max-h-64 text-callout">
          <OutlineItem ref={item} id="a" title="Documents" className="px-4" />
        </OutlineView>,
      );
      expect(root.current).toBe(screen.getByRole("treegrid"));
      expect(root.current).toHaveClass("max-h-64", "text-callout");
      expect(root.current).not.toHaveClass("text-body");
      expect(item.current).toBe(row("Documents"));
      expect(item.current).toHaveClass("px-4");
      expect(item.current).not.toHaveClass("px-2");
    });
  });
});

describe("Table with treeColumn (several columns)", () => {
  function FileTable(props: Partial<React.ComponentProps<typeof Table>>) {
    return (
      <Table aria-label="Files" treeColumn="name" {...props}>
        <TableHeader>
          <Column id="name" isRowHeader>
            Name
          </Column>
          <Column id="size">Size</Column>
        </TableHeader>
        <TableBody>
          <Row id="documents">
            <Cell>Documents</Cell>
            <Cell>3 items</Cell>
            <Row id="report">
              <Cell>Report</Cell>
              <Cell>24 KB</Cell>
            </Row>
            <Row id="archive">
              <Cell>Archive</Cell>
              <Cell>1 item</Cell>
              <Row id="old">
                <Cell>Old notes</Cell>
                <Cell>1 KB</Cell>
              </Row>
            </Row>
          </Row>
          <Row id="pictures">
            <Cell>Pictures</Cell>
            <Cell>No items</Cell>
          </Row>
        </TableBody>
      </Table>
    );
  }
  const dataRows = () => screen.getAllByRole("row").slice(1);
  // A row is named by its row header cell, and the triangle sits in that cell, so the name of a
  // parent row begins with the name of its triangle. Matched by its ending here; pinned below.
  const row = (name: string) => screen.getByRole("row", { name: new RegExp(`${name}$`) });

  describe("roles (APG Treegrid)", () => {
    it("names a parent row with its triangle's name in front (React Aria 1.22.0)", () => {
      render(<FileTable />);
      expect(row("Documents")).toHaveAccessibleName("Expand Documents");
      expect(row("Pictures")).toHaveAccessibleName("Pictures");
    });

    it("is a treegrid with headings, and rows that say their level, their place and whether they are open", () => {
      render(<FileTable defaultExpandedKeys={["documents"]} />);
      expect(screen.getByRole("treegrid", { name: "Files" })).toBeInTheDocument();
      expect(screen.getAllByRole("columnheader").map((element) => element.textContent)).toEqual(["Name", "Size"]);
      expect(dataRows().map((element) => element.getAttribute("aria-level"))).toEqual(["1", "2", "2", "1"]);

      expect(row("Documents")).toHaveAttribute("aria-expanded", "true");
      expect(row("Documents")).toHaveAttribute("aria-posinset", "1");
      expect(row("Documents")).toHaveAttribute("aria-setsize", "2");
      expect(row("Archive")).toHaveAttribute("aria-expanded", "false");
      // Rows without children must not carry aria-expanded (APG Treegrid).
      expect(row("Report")).not.toHaveAttribute("aria-expanded");
      expect(row("Pictures")).not.toHaveAttribute("aria-expanded");
    });

    it("shows the hierarchy in the tree column only: indent and triangle sit in its cell", () => {
      render(<FileTable />);
      const [name, size] = [within(row("Documents")).getByRole("rowheader"), within(row("Documents")).getByRole("gridcell")];
      expect(name).toHaveAttribute("data-tree-column");
      expect(within(name).getByRole("button")).toHaveAccessibleName(/^Expand/);
      expect(within(name).getByRole("button")).toHaveAttribute("tabindex", "-1");
      expect(size).not.toHaveAttribute("data-tree-column");
      expect(within(size).queryByRole("button")).not.toBeInTheDocument();
      expect(within(row("Pictures")).queryByRole("button")).not.toBeInTheDocument();
    });
  });

  describe("keyboard, as the Treegrid pattern asks", () => {
    it("Right on a collapsed row expands it and keeps focus on the row", async () => {
      const user = userEvent.setup();
      render(<FileTable />);
      await user.tab();
      expect(row("Documents")).toHaveFocus();
      await user.keyboard("{ArrowRight}");
      expect(row("Documents")).toHaveAttribute("aria-expanded", "true");
      expect(row("Documents")).toHaveFocus();
      expect(dataRows()).toHaveLength(4);
    });

    it("Right on an expanded row moves to its first cell, then along the cells", async () => {
      const user = userEvent.setup();
      render(<FileTable defaultExpandedKeys={["documents"]} />);
      await user.tab();
      await user.keyboard("{ArrowRight}");
      expect(within(row("Documents")).getByRole("rowheader")).toHaveFocus();
      await user.keyboard("{ArrowRight}");
      expect(within(row("Documents")).getByRole("gridcell")).toHaveFocus();
    });

    it("Left from the first cell returns to the row, and Left on an expanded row collapses it", async () => {
      const user = userEvent.setup();
      render(<FileTable defaultExpandedKeys={["documents"]} />);
      await user.tab();
      await user.keyboard("{ArrowRight}");
      expect(within(row("Documents")).getByRole("rowheader")).toHaveFocus();
      await user.keyboard("{ArrowLeft}");
      expect(row("Documents")).toHaveFocus();
      await user.keyboard("{ArrowLeft}");
      expect(row("Documents")).toHaveAttribute("aria-expanded", "false");
      expect(row("Documents")).toHaveFocus();
      expect(dataRows()).toHaveLength(2);
    });

    it("Up and Down move between the visible rows, into and out of the children", async () => {
      const user = userEvent.setup();
      render(<FileTable defaultExpandedKeys={["documents", "archive"]} />);
      await user.tab();
      await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}");
      expect(row("Old notes")).toHaveFocus();
      expect(row("Old notes")).toHaveAttribute("aria-level", "3");
      await user.keyboard("{ArrowDown}");
      expect(row("Pictures")).toHaveFocus();
    });

    // The one difference found. The pattern says focus does not move here.
    it("differs from the pattern in one case: Left on a collapsed row wraps to its last cell", async () => {
      const user = userEvent.setup();
      render(<FileTable />);
      await user.tab();
      await user.keyboard("{ArrowLeft}");
      expect(row("Documents")).toHaveAttribute("aria-expanded", "false");
      expect(within(row("Documents")).getByRole("gridcell")).toHaveFocus();
    });
  });

  describe("pointer and controlled expansion", () => {
    it("expands from the triangle and reports the keys", async () => {
      const user = userEvent.setup();
      const onExpandedChange = vi.fn();
      render(<FileTable onExpandedChange={onExpandedChange} />);
      await user.click(within(row("Documents")).getByRole("button"));
      expect([...(onExpandedChange.mock.lastCall![0] as Set<Key>)]).toEqual(["documents"]);
      expect(row("Report")).toBeInTheDocument();
    });

    it("follows expandedKeys", () => {
      const { rerender } = render(<FileTable expandedKeys={["documents"]} />);
      expect(dataRows()).toHaveLength(4);
      rerender(<FileTable expandedKeys={[]} />);
      expect(dataRows()).toHaveLength(2);
    });
  });
});

describe("accessibility (axe, structure only: jsdom computes no colors)", () => {
  it("has no violations in either form, collapsed and expanded, with selection", async () => {
    const { container } = render(
      <>
        <Files />
        <Files aria-label="Open files" defaultExpandedKeys={["documents", "archive"]} selectionMode="multiple" defaultSelectedKeys={["report"]} />
        <Table aria-label="File table" treeColumn="name" defaultExpandedKeys={["documents"]} selectionMode="single">
          <TableHeader>
            <Column id="name" isRowHeader>
              Name
            </Column>
            <Column id="size">Size</Column>
          </TableHeader>
          <TableBody>
            <Row id="documents">
              <Cell>Documents</Cell>
              <Cell>1 item</Cell>
              <Row id="report">
                <Cell>Report</Cell>
                <Cell>24 KB</Cell>
              </Row>
            </Row>
          </TableBody>
        </Table>
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
