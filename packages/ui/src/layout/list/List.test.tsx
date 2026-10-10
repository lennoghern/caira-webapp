import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import type { Selection } from "react-aria-components";
import { describe, expect, it, vi } from "vitest";
import { axe } from "../../test/axe";
import { List, ListHeader, ListItem, ListSection } from "./List";

/**
 * Behavior, roles and keyboard, in jsdom, against the APG Grid pattern (a grid
 * of one column). What these cannot see (row heights at each density, the
 * highlight and its contrast, the hairlines, right-to-left, forced colors) is
 * read from a real browser in tests/browser/layout/list.spec.ts.
 */

function Mailboxes(props: Partial<React.ComponentProps<typeof List>>) {
  return (
    <List aria-label="Mailboxes" {...props}>
      <ListItem id="inbox">Inbox</ListItem>
      <ListItem id="drafts">Drafts</ListItem>
      <ListItem id="sent">Sent</ListItem>
      <ListItem id="trash">Trash</ListItem>
    </List>
  );
}

const row = (name: string) => screen.getByRole("row", { name });

describe("List", () => {
  describe("roles (APG Grid, one column)", () => {
    it("is a labelled grid of rows, each with one cell", () => {
      render(<Mailboxes />);
      const grid = screen.getByRole("grid", { name: "Mailboxes" });
      const rows = within(grid).getAllByRole("row");
      expect(rows.map((element) => element.textContent)).toEqual(["Inbox", "Drafts", "Sent", "Trash"]);
      for (const element of rows) expect(within(element).getAllByRole("gridcell")).toHaveLength(1);
    });

    it("marks selection on the rows and says when several may be selected", () => {
      render(<Mailboxes selectionMode="multiple" defaultSelectedKeys={["drafts"]} />);
      expect(screen.getByRole("grid")).toHaveAttribute("aria-multiselectable", "true");
      expect(row("Drafts")).toHaveAttribute("aria-selected", "true");
      expect(row("Inbox")).toHaveAttribute("aria-selected", "false");
    });

    it("groups rows under a header that names the group", () => {
      render(
        <List aria-label="Settings">
          <ListSection>
            <ListHeader>Network</ListHeader>
            <ListItem id="wifi">Wi-Fi</ListItem>
            <ListItem id="bluetooth">Bluetooth</ListItem>
          </ListSection>
          <ListSection>
            <ListHeader>Display</ListHeader>
            <ListItem id="brightness">Brightness</ListItem>
          </ListSection>
        </List>,
      );
      const network = screen.getByRole("rowgroup", { name: "Network" });
      expect(within(network).getAllByRole("row", { name: /Wi-Fi|Bluetooth/ })).toHaveLength(2);
      expect(within(screen.getByRole("rowgroup", { name: "Display" })).getByRole("row", { name: "Brightness" })).toBeInTheDocument();
    });

    it("shows what the caller gives when there are no rows", () => {
      render(<List aria-label="Results" renderEmptyState={() => "No results"} />);
      expect(screen.getByRole("grid", { name: "Results" })).toHaveAttribute("data-empty", "true");
      expect(screen.getByText("No results")).toBeInTheDocument();
    });
  });

  describe("keyboard", () => {
    it("is one tab stop and moves between rows with Up, Down, Home and End", async () => {
      const user = userEvent.setup();
      render(
        <>
          <Mailboxes />
          <button>After</button>
        </>,
      );
      await user.tab();
      expect(row("Inbox")).toHaveFocus();
      await user.keyboard("{ArrowDown}{ArrowDown}");
      expect(row("Sent")).toHaveFocus();
      await user.keyboard("{ArrowUp}");
      expect(row("Drafts")).toHaveFocus();
      await user.keyboard("{End}");
      expect(row("Trash")).toHaveFocus();
      await user.keyboard("{Home}");
      expect(row("Inbox")).toHaveFocus();
      await user.tab();
      expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
    });

    it("moves to the row that starts with what is typed", async () => {
      const user = userEvent.setup();
      render(<Mailboxes />);
      await user.tab();
      await user.keyboard("s");
      expect(row("Sent")).toHaveFocus();
    });

    it("selects with Space and replaces the selection in single mode", async () => {
      const user = userEvent.setup();
      render(<Mailboxes selectionMode="single" />);
      await user.tab();
      await user.keyboard(" ");
      expect(row("Inbox")).toHaveAttribute("aria-selected", "true");
      await user.keyboard("{ArrowDown} ");
      expect(row("Drafts")).toHaveAttribute("aria-selected", "true");
      expect(row("Inbox")).toHaveAttribute("aria-selected", "false");
    });

    it("performs the row's action with Enter", async () => {
      const user = userEvent.setup();
      const onAction = vi.fn();
      render(<Mailboxes onAction={onAction} />);
      await user.tab();
      await user.keyboard("{ArrowDown}{Enter}");
      expect(onAction).toHaveBeenCalledWith("drafts");
    });

    it("skips a disabled row", async () => {
      const user = userEvent.setup();
      render(<Mailboxes selectionMode="single" disabledKeys={["drafts"]} />);
      expect(row("Drafts")).toHaveAttribute("aria-disabled", "true");
      await user.tab();
      await user.keyboard("{ArrowDown}");
      expect(row("Sent")).toHaveFocus();
    });

    it("reaches a control inside a row with Right, and comes back with Left", async () => {
      const user = userEvent.setup();
      render(
        <List aria-label="Downloads">
          <ListItem id="a" textValue="Report">
            Report <button>Show in folder</button>
          </ListItem>
        </List>,
      );
      await user.tab();
      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("button", { name: "Show in folder" })).toHaveFocus();
      await user.keyboard("{ArrowLeft}");
      // The row is named by its text value, not by everything inside it.
      expect(row("Report")).toHaveFocus();
    });
  });

  describe("pointer", () => {
    it("toggles rows on click in multiple mode", async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();
      render(<Mailboxes selectionMode="multiple" onSelectionChange={onSelectionChange} />);
      await user.click(row("Inbox"));
      await user.click(row("Sent"));
      expect(row("Inbox")).toHaveAttribute("aria-selected", "true");
      expect(row("Sent")).toHaveAttribute("aria-selected", "true");
      expect([...(onSelectionChange.mock.lastCall![0] as Set<string>)]).toEqual(["inbox", "sent"]);
      await user.click(row("Inbox"));
      expect(row("Inbox")).toHaveAttribute("aria-selected", "false");
    });
  });

  describe("controlled selection", () => {
    it("follows selectedKeys", async () => {
      const user = userEvent.setup();
      function Controlled() {
        const [keys, setKeys] = useState<Selection>(new Set(["sent"]));
        return (
          <>
            <output>{keys === "all" ? "all" : [...keys].join(",")}</output>
            <Mailboxes selectionMode="single" selectedKeys={keys} onSelectionChange={setKeys} />
          </>
        );
      }
      render(<Controlled />);
      expect(row("Sent")).toHaveAttribute("aria-selected", "true");
      await user.click(row("Trash"));
      expect(screen.getByRole("status")).toHaveTextContent("trash");
      expect(row("Sent")).toHaveAttribute("aria-selected", "false");
    });
  });

  describe("styles of list and of selection", () => {
    it("highlights the selected row by default and draws no checkmark", () => {
      render(<Mailboxes selectionMode="single" defaultSelectedKeys={["inbox"]} />);
      expect(row("Inbox")).toHaveClass("selected:selection-emphasized");
      expect(row("Inbox").querySelector('[data-icon="checkmark"]')).toBeNull();
    });

    it("draws a checkmark in every row of an option list, shown only when selected, and no highlight", () => {
      render(<Mailboxes selectionMode="multiple" selectionStyle="checkmark" defaultSelectedKeys={["inbox"]} />);
      for (const name of ["Inbox", "Drafts"]) {
        const mark = row(name).querySelector('[data-icon="checkmark"]');
        // Decoration: the state itself is aria-selected on the row.
        expect(mark).toHaveAttribute("aria-hidden", "true");
        expect(mark).toHaveClass("opacity-0", "group-data-selected/item:opacity-100");
        expect(row(name)).not.toHaveClass("selected:selection-emphasized");
      }
      expect(row("Inbox")).toHaveAttribute("data-selected", "true");
      expect(row("Drafts")).not.toHaveAttribute("data-selected");
    });

    it("draws the disclosure indicator as a mark, not as a control", () => {
      render(
        <List aria-label="Settings">
          <ListItem id="general" disclosureIndicator>
            General
          </ListItem>
        </List>,
      );
      const mark = row("General").querySelector('[data-icon="chevron-forward"]');
      expect(mark).toHaveAttribute("aria-hidden", "true");
      expect(within(row("General")).queryByRole("button")).not.toBeInTheDocument();
    });

    it("frames the list with the inset style", () => {
      render(<Mailboxes listStyle="inset" />);
      const grid = screen.getByRole("grid");
      expect(grid).toHaveAttribute("data-list-style", "inset");
      expect(grid).toHaveClass("rounded-box", "bg-background-secondary");
    });
  });

  describe("parts", () => {
    it("passes ref and className to each part, the caller's classes winning", () => {
      const root = createRef<HTMLDivElement>();
      const item = createRef<HTMLDivElement>();
      const section = createRef<HTMLDivElement>();
      const header = createRef<HTMLDivElement>();
      render(
        <List ref={root} aria-label="Settings" className="max-w-xs text-callout">
          <ListSection ref={section} className="mt-2">
            <ListHeader ref={header} className="px-0">
              Network
            </ListHeader>
            <ListItem ref={item} id="wifi" className="px-5">
              Wi-Fi
            </ListItem>
          </ListSection>
        </List>,
      );
      expect(root.current).toBe(screen.getByRole("grid"));
      expect(root.current).toHaveClass("max-w-xs", "text-callout");
      expect(root.current).not.toHaveClass("text-body");
      expect(section.current).toHaveClass("mt-2", "flex");
      expect(header.current).toHaveTextContent("Network");
      expect(header.current).toHaveClass("px-0");
      expect(header.current).not.toHaveClass("px-3");
      expect(item.current).toBe(row("Wi-Fi"));
      expect(item.current).toHaveClass("px-5");
      expect(item.current).not.toHaveClass("px-3");
    });
  });

  describe("accessibility (axe, structure only: jsdom computes no colors)", () => {
    it("has no violations plain, with selection, with sections and empty", async () => {
      const { container } = render(
        <>
          <Mailboxes />
          <Mailboxes aria-label="Options" selectionMode="multiple" selectionStyle="checkmark" defaultSelectedKeys={["sent"]} />
          <List aria-label="Settings" listStyle="inset" selectionMode="single" disabledKeys={["bluetooth"]}>
            <ListSection>
              <ListHeader>Network</ListHeader>
              <ListItem id="wifi" disclosureIndicator>
                Wi-Fi
              </ListItem>
              <ListItem id="bluetooth">Bluetooth</ListItem>
            </ListSection>
          </List>
          <List aria-label="Results" renderEmptyState={() => "No results"} />
        </>,
      );
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
