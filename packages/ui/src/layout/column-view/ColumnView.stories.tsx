import type { Meta, StoryObj } from "@storybook/react-vite";
import { Backdrop, Section, ThemeMatrix } from "../../test/story-kit";
import { ColumnView } from "./ColumnView";

interface FileNode {
  id: string;
  name: string;
  kind?: string;
  children?: FileNode[];
}

const FILES: FileNode[] = [
  {
    id: "documents",
    name: "Documents",
    children: [
      { id: "report", name: "Report", kind: "Document, 24 KB" },
      {
        id: "archive",
        name: "Archive",
        children: [
          { id: "old", name: "Old notes", kind: "Document, 1 KB" },
          { id: "older", name: "Notes with a long name that does not fit in the column", kind: "Document, 3 KB" },
        ],
      },
      { id: "empty", name: "Empty folder", children: [] },
    ],
  },
  { id: "pictures", name: "Pictures", children: [{ id: "holiday", name: "Holiday", kind: "Image, 2 MB" }] },
  { id: "readme", name: "Read me", kind: "Document, 2 KB" },
];

const meta = {
  title: "Layout/ColumnView",
  component: ColumnView<FileNode>,
  args: {
    "aria-label": "Files",
    items: FILES,
    getChildren: (item: FileNode) => item.children,
    getTextValue: (item: FileNode) => item.name,
    columnWidth: 200,
  },
  argTypes: {
    columnWidth: { control: { type: "range", min: 120, max: 320, step: 20 } },
  },
} satisfies Meta<typeof ColumnView<FileNode>>;

export default meta;
type Story = StoryObj<typeof meta>;

const FRAME = "h-64 rounded-box border border-separator bg-background";

function Preview({ file }: { file: FileNode }) {
  return (
    <div className="grid gap-1">
      <p className="text-headline">{file.name}</p>
      <p className="text-label-secondary">{file.kind}</p>
    </div>
  );
}

export const Playground: Story = {
  render: (args) => (
    <Backdrop kind="plain" className="p-10">
      <ColumnView {...args} defaultPath={["documents"]} renderPreview={(file) => <Preview file={file} />} className={FRAME} />
    </Backdrop>
  ),
};

export const PathAndPreview: Story = {
  name: "Path and preview",
  render: (args) => (
    <Section
      title="Path and preview"
      note="Each column is one level; the first is always the root. A parent item is marked with a triangle, and selecting it shows its children in the next column. When the selected item has no nested items, information about it takes that place (HIG Column views). Drag the line after a column to resize it."
    >
      <Backdrop kind="plain" className="grid gap-6 p-6">
        <ColumnView
          {...args}
          defaultPath={["documents", "archive", "old"]}
          renderPreview={(file) => <Preview file={file} />}
          className={FRAME}
          data-testid="deep"
        />
        <ColumnView {...args} aria-label="Files, with an empty folder" defaultPath={["documents", "empty"]} className={FRAME} data-testid="empty" />
      </Backdrop>
    </Section>
  ),
};

export const ThemeStates: Story = {
  name: "Theme matrix",
  render: (args) => (
    <ThemeMatrix backdrop="plain" cellClassName="items-stretch p-3">
      {() => (
        <ColumnView
          {...args}
          defaultPath={["pictures"]}
          columnWidth={130}
          // Tall enough for three rows at iOS density: a row cut off by the column's own scrolling is one
          // axe cannot measure.
          className="h-40 w-full rounded-box border border-separator bg-background"
        />
      )}
    </ThemeMatrix>
  ),
};
