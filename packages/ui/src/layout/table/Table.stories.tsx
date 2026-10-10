import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import type { SortDescriptor } from "react-aria-components";
import { Backdrop, Section, ThemeMatrix } from "../../test/story-kit";
import { Cell, Column, ResizableTableContainer, Row, Table, TableBody, TableHeader } from "./Table";

const meta = {
  title: "Layout/Table",
  component: Table,
  args: { striped: false, selectionMode: "multiple" },
  argTypes: {
    striped: { control: "boolean" },
    selectionMode: { control: "inline-radio", options: ["none", "single", "multiple"] },
  },
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

interface FileRow {
  id: string;
  name: string;
  kind: string;
  size: number;
}

const FILES: FileRow[] = [
  { id: "report", name: "Report", kind: "Document", size: 24 },
  { id: "budget", name: "Budget", kind: "Spreadsheet", size: 310 },
  { id: "photo", name: "Photo", kind: "Image", size: 2048 },
  { id: "notes", name: "Notes", kind: "Document", size: 3 },
];

const formatSize = (size: number) => (size >= 1024 ? `${(size / 1024).toFixed(0)} MB` : `${size} KB`);

function Files({ resizable = false, ...props }: React.ComponentProps<typeof Table> & { resizable?: boolean }) {
  const [sort, setSort] = useState<SortDescriptor>({ column: "name", direction: "ascending" });
  const rows = [...FILES].sort((a, b) => {
    const order = sort.column === "size" ? a.size - b.size : a.name.localeCompare(b.name);
    return sort.direction === "descending" ? -order : order;
  });
  return (
    <Table aria-label="Files" sortDescriptor={sort} onSortChange={setSort} {...props}>
      <TableHeader>
        <Column id="name" isRowHeader allowsSorting allowsResizing={resizable} minWidth={100}>
          Name
        </Column>
        <Column id="kind" allowsResizing={resizable} minWidth={100}>
          Kind
        </Column>
        <Column id="size" allowsSorting>
          Size
        </Column>
      </TableHeader>
      <TableBody items={rows}>
        {(file) => (
          <Row id={file.id}>
            <Cell>{file.name}</Cell>
            <Cell>{file.kind}</Cell>
            <Cell>{formatSize(file.size)}</Cell>
          </Row>
        )}
      </TableBody>
    </Table>
  );
}

export const Playground: Story = {
  render: (args) => (
    <Backdrop kind="plain" className="p-10">
      <Files {...args} defaultSelectedKeys={["budget"]} className="max-w-xl" />
    </Backdrop>
  ),
};

export const SortingAndStripes: Story = {
  name: "Sorting, stripes and selection",
  render: () => (
    <Section
      title="Sorting, stripes and selection"
      note="Press a heading to sort by it, and again to reverse the order; the mark shows the direction. Alternating row colors help the eye follow a row in a wide table (HIG Lists and tables, macOS). Selected rows are highlighted. The second table is empty."
    >
      <Backdrop kind="plain" className="grid items-start gap-8 p-6 lg:grid-cols-2">
        <Files striped selectionMode="multiple" defaultSelectedKeys={["photo"]} data-testid="striped" />
        <Table aria-label="Search results" data-testid="empty">
          <TableHeader>
            <Column isRowHeader>Name</Column>
            <Column>Kind</Column>
          </TableHeader>
          <TableBody renderEmptyState={() => "No results"}>{[]}</TableBody>
        </Table>
      </Backdrop>
    </Section>
  ),
};

export const ResizableColumns: Story = {
  name: "Resizable columns",
  render: () => (
    <Section
      title="Resizable columns"
      note="Drag the line at the trailing edge of a heading (HIG: let people resize columns). Known gap: there is no keyboard way to start resizing until the library has menus."
    >
      <Backdrop kind="plain" className="p-6">
        <ResizableTableContainer className="max-w-xl" data-testid="resizable">
          <Files resizable />
        </ResizableTableContainer>
      </Backdrop>
    </Section>
  ),
};

export const ThemeStates: Story = {
  name: "Theme matrix",
  render: () => (
    <ThemeMatrix backdrop="plain" cellClassName="items-start">
      {() => (
        <Table
          aria-label="Files"
          striped
          selectionMode="single"
          defaultSelectedKeys={["budget"]}
          disabledKeys={["photo"]}
          sortDescriptor={{ column: "name", direction: "ascending" }}
          className="w-full"
        >
          <TableHeader>
            <Column id="name" isRowHeader allowsSorting>
              Name
            </Column>
            <Column id="size">Size</Column>
          </TableHeader>
          <TableBody>
            <Row id="report">
              <Cell>Report</Cell>
              <Cell>24 KB</Cell>
            </Row>
            <Row id="budget">
              <Cell>Budget</Cell>
              <Cell>310 KB</Cell>
            </Row>
            <Row id="photo">
              <Cell>Photo</Cell>
              <Cell>2 MB</Cell>
            </Row>
          </TableBody>
        </Table>
      )}
    </ThemeMatrix>
  ),
};
