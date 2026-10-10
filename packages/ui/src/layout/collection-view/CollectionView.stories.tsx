import type { Meta, StoryObj } from "@storybook/react-vite";
import { Backdrop, Section, ThemeMatrix } from "../../test/story-kit";
import { CollectionItem, CollectionView } from "./CollectionView";

const meta = {
  title: "Layout/CollectionView",
  component: CollectionView,
  args: { layout: "grid", itemSize: "medium", selectionMode: "multiple" },
  argTypes: {
    layout: { control: "inline-radio", options: ["grid", "row"] },
    itemSize: { control: "inline-radio", options: ["small", "medium", "large"] },
    selectionMode: { control: "inline-radio", options: ["none", "single", "multiple"] },
  },
} satisfies Meta<typeof CollectionView>;

export default meta;
type Story = StoryObj<typeof meta>;

// Drawn with gradients: no photograph or other asset is used in the playground (DECISIONS D-016).
const PHOTOS = [
  ["beach", "Beach", "linear-gradient(160deg, #6ec6ff, #ffe29a)"],
  ["forest", "Forest", "linear-gradient(160deg, #1f6f43, #b9e769)"],
  ["city", "City", "linear-gradient(160deg, #2d3561, #c05c7e)"],
  ["desert", "Desert", "linear-gradient(160deg, #f3904f, #fbd786)"],
  ["lake", "Lake", "linear-gradient(160deg, #136a8a, #9bd3d0)"],
  ["night", "Night sky", "linear-gradient(160deg, #0f2027, #5a4fcf)"],
  ["snow", "Snow", "linear-gradient(160deg, #e6f0ff, #9fb8d9)"],
  ["harbor", "Harbor", "linear-gradient(160deg, #355c7d, #f8b195)"],
] as const;

function Photos({ count = PHOTOS.length, ...props }: React.ComponentProps<typeof CollectionView> & { count?: number }) {
  return (
    <CollectionView aria-label="Photos" {...props}>
      {PHOTOS.slice(0, count).map(([id, name, background]) => (
        <CollectionItem key={id} id={id} textValue={name}>
          <span aria-hidden="true" className="block aspect-4/3 w-full rounded-field" style={{ background }} />
          <span className="truncate text-center">{name}</span>
        </CollectionItem>
      ))}
    </CollectionView>
  );
}

export const Playground: Story = {
  render: (args) => (
    <Backdrop kind="plain" className="p-10">
      <Photos {...args} defaultSelectedKeys={["forest"]} className="max-w-2xl" />
    </Backdrop>
  ),
};

export const GridAndRow: Story = {
  name: "Grid and row",
  render: () => (
    <Section
      title="Grid and row"
      note="The two standard layouts (HIG Collections). In a grid the four arrow keys move to the item in that direction; in a row, Left and Right, and the row scrolls. Padding around each image keeps the hover, focus and selection effects visible."
    >
      <Backdrop kind="plain" className="grid gap-8 p-6">
        <Photos selectionMode="multiple" defaultSelectedKeys={["forest", "lake"]} disabledKeys={["harbor"]} className="max-w-2xl" data-testid="grid" />
        <Photos aria-label="Recent photos" layout="row" itemSize="small" selectionMode="single" className="max-w-md" data-testid="row" />
      </Backdrop>
    </Section>
  ),
};

export const SizesAndEmpty: Story = {
  name: "Item sizes and the empty state",
  render: () => (
    <Section title="Item sizes and the empty state" note="Keep the sizes of the items in a collection consistent.">
      <Backdrop kind="plain" className="grid gap-6 p-6">
        <Photos aria-label="Small photos" itemSize="small" count={4} data-testid="small" />
        <Photos aria-label="Large photos" itemSize="large" count={3} data-testid="large" />
        <CollectionView aria-label="Albums" renderEmptyState={() => "No albums"} data-testid="empty" />
      </Backdrop>
    </Section>
  ),
};

export const ThemeStates: Story = {
  name: "Theme matrix",
  render: () => (
    <ThemeMatrix backdrop="plain" cellClassName="items-start p-3">
      {() => <Photos itemSize="small" count={3} selectionMode="single" defaultSelectedKeys={["forest"]} disabledKeys={["city"]} className="w-full" />}
    </ThemeMatrix>
  ),
};
