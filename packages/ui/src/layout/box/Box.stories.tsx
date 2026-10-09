import type { Meta, StoryObj } from "@storybook/react-vite";
import { Icon } from "../../foundations/icon/Icon";
import { Backdrop, Section, ThemeMatrix } from "../../test/story-kit";
import { Box } from "./Box";

const meta = {
  title: "Layout/Box",
  component: Box,
  args: { title: "Playback", role: "group" },
  argTypes: {
    title: { control: "text" },
    role: { control: "inline-radio", options: ["group", "region"] },
  },
} satisfies Meta<typeof Box>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Native controls: the library's own toggles arrive in a later batch. */
function Settings() {
  return (
    <div className="grid gap-2">
      <label className="flex items-center gap-2">
        <input type="checkbox" defaultChecked /> Crossfade between songs
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" /> Sound check
      </label>
      <p className="text-callout text-label-secondary">Applies to this device only.</p>
    </div>
  );
}

export const Playground: Story = {
  render: (args) => (
    <Backdrop kind="plain" className="p-10">
      <Box {...args} className="max-w-sm">
        <Settings />
      </Box>
    </Backdrop>
  ),
};

export const TitleAndContent: Story = {
  name: "Title and content",
  render: () => (
    <Section
      title="Title and content"
      note="A title is optional. Without one, give the box an aria-label when the grouping is not obvious from what is around it. The title takes any node, so it can carry an icon."
    >
      <Backdrop kind="plain" className="grid items-start gap-6 p-6 sm:grid-cols-3">
        <Box title="Playback">
          <Settings />
        </Box>
        <Box aria-label="Playback, untitled">
          <Settings />
        </Box>
        <Box
          title={
            <span className="flex items-center gap-1.5">
              <Icon name="info" /> About this device
            </span>
          }
        >
          <p>Three label levels on the box background.</p>
          <p className="text-label-secondary">Secondary label</p>
          <p className="text-label-tertiary">Tertiary label</p>
        </Box>
      </Backdrop>
    </Section>
  ),
};

export const Nested: Story = {
  render: () => (
    <Section
      title="A box inside a box"
      note="The inner box takes the tertiary background. The HIG prefers padding and alignment for subgroups: a box's border is a visual element of its own, and nesting boxes makes an interface feel busy. Shown here so the second background can be seen."
    >
      <Backdrop kind="plain" className="p-6">
        <Box title="Sound" className="max-w-sm">
          <div className="grid gap-3">
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked /> Play sound effects
            </label>
            <Box title="Alerts">
              <Settings />
            </Box>
          </div>
        </Box>
      </Backdrop>
    </Section>
  ),
};

export const Platforms: Story = {
  render: () => (
    <Section
      title="Density"
      note="At macOS density the title sits above the frame (HIG Boxes). At iOS density the whole box is the filled shape, with the title inside. The first box follows the Density switch of the toolbar; the second is always iOS."
    >
      <Backdrop kind="plain" className="grid items-start gap-6 p-6 sm:grid-cols-2">
        <Box title="Page density">
          <Settings />
        </Box>
        {/*
          The attribute LiquidGlassProvider writes on <html>, here on a subtree so the appearance still
          follows the page. Font size is inherited as a computed value, so the body style is restated.
        */}
        <div data-platform="ios" className="text-body">
          <Box title="iOS density">
            <Settings />
          </Box>
        </div>
      </Backdrop>
    </Section>
  ),
};

export const ThemeStates: Story = {
  name: "Theme matrix",
  render: () => (
    <ThemeMatrix backdrop="plain">
      {() => (
        <Box title="Playback" className="w-full max-w-xs">
          <p>Primary label</p>
          <p className="text-label-secondary">Secondary label</p>
          <p className="text-label-tertiary">Tertiary label</p>
        </Box>
      )}
    </ThemeMatrix>
  ),
};
