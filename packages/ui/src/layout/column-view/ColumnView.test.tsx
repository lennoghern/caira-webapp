import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import type { Key } from "react-aria-components";
import { describe, expect, it, vi } from "vitest";
import { axe } from "../../test/axe";
import { ColumnView, type ColumnViewProps } from "./ColumnView";

/**
 * Behavior, roles and keyboard, in jsdom. The structure asserted here is the
 * answer to the question COMPONENT-MAP.md left open for row 7, tree semantics
 * or a row of listboxes: one listbox per column inside a named group
 * (DECISIONS.md D-044). The column parts follow the APG Listbox pattern and the
 * dividers the APG Window Splitter pattern.
 *
 * What these cannot see (that columns sit side by side and scroll into view,
 * their widths, the accessibility tree a browser builds from this markup,
 * right-to-left, forced colors) is read from a real browser in
 * tests/browser/layout/column-view.spec.ts. What nothing here can tell: how a
 * screen reader speaks it.
 */

interface FileNode {
  id: string;
  name: string;
  children?: FileNode[];
}

const FILES: FileNode[] = [
  {
    id: "documents",
    name: "Documents",
    children: [
      { id: "report", name: "Report" },
      { id: "archive", name: "Archive", children: [{ id: "old", name: "Old notes" }] },
      { id: "empty", name: "Empty folder", children: [] },
    ],
  },
  { id: "pictures", name: "Pictures", children: [{ id: "holiday", name: "Holiday" }] },
  { id: "readme", name: "Read me" },
];

function Files(props: Partial<ColumnViewProps<FileNode>>) {
  return (
    <ColumnView
      aria-label="Files"
      items={FILES}
      getChildren={(item) => item.children}
      getTextValue={(item) => item.name}
      {...props}
    />
  );
}

const columnNames = () => screen.getAllByRole("listbox").map((element) => element.getAttribute("aria-label"));
const column = (name: string) => screen.getByRole("listbox", { name });
const option = (name: string) => screen.getByRole("option", { name });
// The visible label of a row. Its text content also holds the hidden description of a parent item.
const labelOf = (element: HTMLElement) => element.querySelector('[slot="label"]')?.textContent;
const optionsOf = (name: string) => within(column(name)).getAllByRole("option").map(labelOf);

describe("ColumnView", () => {
  describe("roles (a group of listboxes)", () => {
    it("is a named group whose first column lists the root level and takes the name of the view", () => {
      render(<Files />);
      const group = screen.getByRole("group", { name: "Files" });
      expect(within(group).getAllByRole("listbox")).toHaveLength(1);
      expect(columnNames()).toEqual(["Files"]);
      expect(screen.getAllByRole("option").map(labelOf)).toEqual(["Documents", "Pictures", "Read me"]);
      expect(column("Files")).not.toHaveAttribute("aria-multiselectable");
    });

    it("names each later column after the item it belongs to, so the names read as the path", () => {
      render(<Files defaultPath={["documents", "archive"]} />);
      expect(columnNames()).toEqual(["Files", "Documents", "Archive"]);
      expect(optionsOf("Documents")).toEqual(["Report", "Archive", "Empty folder"]);
      expect(optionsOf("Archive")).toEqual(["Old notes"]);
      expect(option("Documents")).toHaveAttribute("aria-selected", "true");
      expect(option("Archive")).toHaveAttribute("aria-selected", "true");
      expect(option("Report")).toHaveAttribute("aria-selected", "false");
    });

    it("tells assistive technology which items have nested items, through a description", () => {
      render(<Files parentItemDescription="Contiene elementos" />);
      expect(option("Documents")).toHaveAccessibleDescription("Contiene elementos");
      expect(option("Read me")).not.toHaveAttribute("aria-describedby");
      // The mark people see is decoration.
      expect(option("Documents").querySelector('[data-icon="chevron-forward"]')).toHaveAttribute("aria-hidden", "true");
      expect(option("Read me").querySelector("svg")).toBeNull();
    });

    it("says an option is not expandable in ARIA terms: no aria-expanded, no aria-level", () => {
      render(<Files defaultPath={["documents"]} />);
      for (const element of screen.getAllByRole("option")) {
        expect(element).not.toHaveAttribute("aria-expanded");
        expect(element).not.toHaveAttribute("aria-level");
      }
    });

    it("shows a column for a parent with no items, and says it is empty", () => {
      render(<Files defaultPath={["documents", "empty"]} />);
      expect(columnNames()).toEqual(["Files", "Documents", "Empty folder"]);
      expect(within(column("Empty folder")).getByText("No items")).toBeInTheDocument();
    });

    it("shows information about a selected item with no nested items, where its children would be", () => {
      render(<Files defaultPath={["readme"]} renderPreview={(item) => <p>{item.name}, 2 KB</p>} />);
      expect(columnNames()).toEqual(["Files"]);
      // The preview group, besides the view's own group.
      expect(within(screen.getByRole("group", { name: "Read me" })).getByText("Read me, 2 KB")).toBeInTheDocument();
    });

    it("ignores the part of a path that does not exist", () => {
      render(<Files defaultPath={["documents", "nothing", "old"]} />);
      expect(columnNames()).toEqual(["Files", "Documents"]);
    });
  });

  describe("pointer", () => {
    it("opens the children of a parent in the next column and replaces it when another is chosen", async () => {
      const user = userEvent.setup();
      const onPathChange = vi.fn();
      render(<Files onPathChange={onPathChange} />);
      await user.click(option("Documents"));
      expect(onPathChange).toHaveBeenLastCalledWith(["documents"]);
      expect(columnNames()).toEqual(["Files", "Documents"]);
      await user.click(option("Archive"));
      expect(columnNames()).toEqual(["Files", "Documents", "Archive"]);
      await user.click(option("Pictures"));
      expect(onPathChange).toHaveBeenLastCalledWith(["pictures"]);
      expect(columnNames()).toEqual(["Files", "Pictures"]);
    });

    it("adds no column for an item that cannot have children", async () => {
      const user = userEvent.setup();
      render(<Files />);
      await user.click(option("Read me"));
      expect(option("Read me")).toHaveAttribute("aria-selected", "true");
      expect(columnNames()).toEqual(["Files"]);
    });
  });

  describe("keyboard", () => {
    it("selects as Up and Down move, so the next column follows", async () => {
      const user = userEvent.setup();
      render(<Files />);
      await user.tab();
      expect(option("Documents")).toHaveFocus();
      await user.keyboard("{ArrowDown}");
      expect(option("Pictures")).toHaveFocus();
      expect(option("Pictures")).toHaveAttribute("aria-selected", "true");
      expect(columnNames()).toEqual(["Files", "Pictures"]);
      await user.keyboard("{ArrowUp}");
      expect(columnNames()).toEqual(["Files", "Documents"]);
      await user.keyboard("{End}");
      expect(option("Read me")).toHaveFocus();
      expect(columnNames()).toEqual(["Files"]);
    });

    it("moves into the next column with Right, selecting its first item, and back with Left", async () => {
      const user = userEvent.setup();
      const onPathChange = vi.fn();
      render(<Files onPathChange={onPathChange} />);
      await user.tab();
      await user.keyboard("{ArrowUp}{ArrowDown}{ArrowUp}");
      expect(option("Documents")).toHaveAttribute("aria-selected", "true");

      await user.keyboard("{ArrowRight}");
      expect(option("Report")).toHaveFocus();
      expect(onPathChange).toHaveBeenLastCalledWith(["documents", "report"]);

      await user.keyboard("{ArrowDown}{ArrowRight}");
      expect(option("Old notes")).toHaveFocus();
      expect(columnNames()).toEqual(["Files", "Documents", "Archive"]);

      await user.keyboard("{ArrowLeft}");
      expect(option("Archive")).toHaveFocus();
      // Back at the parent: its column stays, with nothing selected in it.
      expect(onPathChange).toHaveBeenLastCalledWith(["documents", "archive"]);
      expect(option("Old notes")).toHaveAttribute("aria-selected", "false");

      await user.keyboard("{ArrowLeft}");
      expect(option("Documents")).toHaveFocus();
      expect(onPathChange).toHaveBeenLastCalledWith(["documents"]);
    });

    it("does nothing with Right on an item without a column of children, or with Left in the first column", async () => {
      const user = userEvent.setup();
      const onPathChange = vi.fn();
      render(<Files defaultPath={["readme"]} onPathChange={onPathChange} />);
      await user.tab();
      expect(option("Read me")).toHaveFocus();
      await user.keyboard("{ArrowRight}{ArrowLeft}");
      expect(option("Read me")).toHaveFocus();
      expect(onPathChange).not.toHaveBeenCalled();
    });

    it("returns to the item already selected in the next column, without changing the path", async () => {
      const user = userEvent.setup();
      const onPathChange = vi.fn();
      render(<Files defaultPath={["documents", "archive"]} onPathChange={onPathChange} />);
      await user.tab();
      expect(option("Documents")).toHaveFocus();
      await user.keyboard("{ArrowRight}");
      expect(option("Archive")).toHaveFocus();
      expect(onPathChange).not.toHaveBeenCalled();
      // Focus then stays with the arrow keys in that column. (A focus request left over from the
      // move used to pull it back to "Archive" on the next render; found in a real browser.)
      await user.keyboard("{ArrowUp}");
      expect(option("Report")).toHaveFocus();
      expect(onPathChange).toHaveBeenLastCalledWith(["documents", "report"]);
    });

    it("makes each column a tab stop, and moves by typing within a column", async () => {
      const user = userEvent.setup();
      render(<Files defaultPath={["documents"]} />);
      await user.tab();
      expect(option("Documents")).toHaveFocus();
      // The divider of the first column, then the second column.
      await user.tab();
      expect(screen.getByRole("separator", { name: "Files" })).toHaveFocus();
      await user.tab();
      expect(option("Report")).toHaveFocus();
      await user.keyboard("e");
      expect(option("Empty folder")).toHaveFocus();
    });
  });

  describe("controlled path", () => {
    it("follows path and reports what is asked for", async () => {
      const user = userEvent.setup();
      function Controlled() {
        const [path, setPath] = useState<Key[]>(["pictures"]);
        return (
          <>
            <output>{path.join("/")}</output>
            <Files path={path} onPathChange={setPath} />
          </>
        );
      }
      render(<Controlled />);
      expect(columnNames()).toEqual(["Files", "Pictures"]);
      await user.click(option("Holiday"));
      expect(screen.getByRole("status")).toHaveTextContent("pictures/holiday");
    });

    it("does not move while the caller keeps the path", async () => {
      const user = userEvent.setup();
      render(<Files path={["pictures"]} onPathChange={() => {}} />);
      await user.click(option("Documents"));
      expect(columnNames()).toEqual(["Files", "Pictures"]);
    });
  });

  describe("resizing columns (APG Window Splitter)", () => {
    it("draws one named separator per column, controlling it and reporting its width", () => {
      render(<Files defaultPath={["documents"]} columnWidth={180} minColumnWidth={100} maxColumnWidth={300} />);
      const separators = screen.getAllByRole("separator");
      expect(separators.map((element) => element.getAttribute("aria-label"))).toEqual(["Files", "Documents"]);
      const first = separators[0]!;
      expect(first).toHaveAttribute("aria-controls", column("Files").id);
      expect(first).toHaveAttribute("aria-orientation", "vertical");
      expect(first).toHaveAttribute("aria-valuenow", "180");
      expect(first).toHaveAttribute("aria-valuemin", "100");
      expect(first).toHaveAttribute("aria-valuemax", "300");
      expect(first.parentElement).toHaveStyle({ width: "180px" });
    });

    it("resizes one column from the keyboard, within the limits, and resets on a double click", async () => {
      const user = userEvent.setup();
      render(<Files defaultPath={["documents"]} />);
      const [first, second] = screen.getAllByRole("separator") as [HTMLElement, HTMLElement];
      first.focus();
      await user.keyboard("{ArrowRight}{ArrowRight}");
      expect(first).toHaveAttribute("aria-valuenow", "232");
      expect(first.parentElement).toHaveStyle({ width: "232px" });
      expect(second).toHaveAttribute("aria-valuenow", "200");
      await user.keyboard("{Home}");
      expect(first).toHaveAttribute("aria-valuenow", "120");
      await user.keyboard("{End}");
      expect(first).toHaveAttribute("aria-valuenow", "480");
      await user.dblClick(first);
      expect(first).toHaveAttribute("aria-valuenow", "200");
    });
  });

  describe("content and passing through", () => {
    it("draws rows with the function given, keeping the text value as the name", () => {
      render(<Files>{(item) => <em>{item.name.toUpperCase()}</em>}</Files>);
      expect(screen.getByRole("option", { name: "DOCUMENTS" })).toBeInTheDocument();
    });

    it("reads keys with getKey when items have no id", async () => {
      const user = userEvent.setup();
      const onPathChange = vi.fn();
      interface Place {
        code: string;
        name: string;
        regions?: Place[];
      }
      const places: Place[] = [{ code: "es", name: "Spain", regions: [{ code: "es-m", name: "Madrid" }] }];
      render(
        <ColumnView
          aria-label="Places"
          items={places}
          getKey={(item) => item.code}
          getChildren={(item) => item.regions}
          getTextValue={(item) => item.name}
          onPathChange={onPathChange}
        />,
      );
      await user.click(option("Spain"));
      expect(onPathChange).toHaveBeenLastCalledWith(["es"]);
      expect(option("Madrid")).toBeInTheDocument();
    });

    it("passes ref, className and attributes to the view, and takes aria-labelledby", () => {
      const ref = createRef<HTMLDivElement>();
      render(
        <>
          <h2 id="heading">Project files</h2>
          <Files ref={ref} aria-label={undefined} aria-labelledby="heading" className="h-64 text-callout" id="browser" />
        </>,
      );
      expect(ref.current).toBe(screen.getByRole("group", { name: "Project files" }));
      expect(ref.current).toHaveAttribute("id", "browser");
      expect(ref.current).toHaveClass("h-64", "text-callout", "flex");
      expect(ref.current).not.toHaveClass("text-body");
      expect(screen.getByRole("listbox", { name: "Project files" })).toBeInTheDocument();
      expect(screen.getByRole("separator", { name: "Project files" })).toBeInTheDocument();
    });
  });

  describe("accessibility (axe, structure only: jsdom computes no colors)", () => {
    it("has no violations with one column, several, an empty one and a preview", async () => {
      const { container } = render(
        <>
          <Files />
          <Files aria-label="Open files" defaultPath={["documents", "empty"]} />
          <Files aria-label="Previewed files" defaultPath={["documents", "report"]} renderPreview={(item) => <p>{item.name}</p>} />
        </>,
      );
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
