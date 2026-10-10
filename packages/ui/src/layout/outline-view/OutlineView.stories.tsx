import type { Meta, StoryObj } from "@storybook/react-vite";
import { Icon } from "../../foundations/icon/Icon";
import { Backdrop, Section, ThemeMatrix } from "../../test/story-kit";
import { Cell, Column, Row, Table, TableBody, TableHeader } from "../table/Table";
import { OutlineItem, OutlineView } from "./OutlineView";

const meta = {
  title: "Layout/OutlineView",
  component: OutlineView,
  args: { selectionMode: "single" },
  argTypes: {
    selectionMode: { control: "inline-radio", options: ["none", "single", "multiple"] },
  },
} satisfies Meta<typeof OutlineView>;

export default meta;
type Story = StoryObj<typeof meta>;

function Files(props: React.ComponentProps<typeof OutlineView>) {
  return (
    <OutlineView aria-label="Files" {...props}>
      <OutlineItem id="documents" title="Documents" icon={<Icon name="info" />}>
        <OutlineItem id="report" title="Report" />
        <OutlineItem id="archive" title="Archive" icon={<Icon name="info" />}>
          <OutlineItem id="old" title="Old notes" />
          <OutlineItem id="older" title="Notes with a long name that does not fit in the width of the outline" />
        </OutlineItem>
      </OutlineItem>
      <OutlineItem id="pictures" title="Pictures" icon={<Icon name="info" />}>
        <OutlineItem id="holiday" title="Holiday" />
      </OutlineItem>
      <OutlineItem id="readme" title="Read me" />
    </OutlineView>
  );
}

export const Playground: Story = {
  render: (args) => (
    <Backdrop kind="plain" className="p-10">
      <Files {...args} defaultExpandedKeys={["documents"]} className="max-w-xs" />
    </Backdrop>
  ),
};

export const OneColumn: Story = {
  name: "One column",
  render: () => (
    <Section
      title="One column"
      note="Parent rows open with a disclosure triangle, which points inward from the leading edge when closed and down when open. Each level indents by one step. Right opens a row and Left closes it, or moves to the parent."
    >
      <Backdrop kind="plain" className="grid items-start gap-8 p-6 sm:grid-cols-2">
        <Files defaultExpandedKeys={["documents", "archive"]} selectionMode="single" defaultSelectedKeys={["report"]} className="max-w-xs" data-testid="expanded" />
        <Files aria-label="Files, collapsed" disabledKeys={["readme"]} className="max-w-xs" data-testid="collapsed" />
      </Backdrop>
    </Section>
  ),
};

export const SeveralColumns: Story = {
  name: "Several columns",
  render: () => (
    <Section
      title="Several columns"
      note="A table with a tree column: the hierarchy shows in the first column only, and the others hold attributes of each row (HIG Outline views). Always give a several-column outline its headings."
    >
      <Backdrop kind="plain" className="p-6">
        <Table aria-label="Files" treeColumn="name" defaultExpandedKeys={["documents"]} selectionMode="single" striped className="max-w-xl" data-testid="treegrid">
          <TableHeader>
            <Column id="name" isRowHeader>
              Name
            </Column>
            <Column id="kind">Kind</Column>
            <Column id="size">Size</Column>
          </TableHeader>
          <TableBody>
            <Row id="documents">
              <Cell>Documents</Cell>
              <Cell>Folder</Cell>
              <Cell>2 items</Cell>
              <Row id="report">
                <Cell>Report</Cell>
                <Cell>Document</Cell>
                <Cell>24 KB</Cell>
              </Row>
              <Row id="archive">
                <Cell>Archive</Cell>
                <Cell>Folder</Cell>
                <Cell>1 item</Cell>
                <Row id="old">
                  <Cell>Old notes</Cell>
                  <Cell>Document</Cell>
                  <Cell>1 KB</Cell>
                </Row>
              </Row>
            </Row>
            <Row id="pictures">
              <Cell>Pictures</Cell>
              <Cell>Folder</Cell>
              <Cell>No items</Cell>
            </Row>
          </TableBody>
        </Table>
      </Backdrop>
    </Section>
  ),
};

export const ThemeStates: Story = {
  name: "Theme matrix",
  render: () => (
    <ThemeMatrix backdrop="plain" cellClassName="items-start">
      {() => (
        <OutlineView aria-label="Files" defaultExpandedKeys={["documents"]} selectionMode="single" defaultSelectedKeys={["report"]} disabledKeys={["pictures"]} className="w-full">
          <OutlineItem id="documents" title="Documents">
            <OutlineItem id="report" title="Report" />
            <OutlineItem id="notes" title="Notes" />
          </OutlineItem>
          <OutlineItem id="pictures" title="Pictures" />
        </OutlineView>
      )}
    </ThemeMatrix>
  ),
};
