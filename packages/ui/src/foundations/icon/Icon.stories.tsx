import type { Meta, StoryObj } from "@storybook/react-vite";
import { Section, ThemeMatrix } from "../../test/story-kit";
import { GlassSurface } from "../glass/GlassSurface";
import { Icon } from "./Icon";
import { iconRegistry, type IconName } from "./registry";

const NAMES = Object.keys(iconRegistry) as IconName[];

const meta = {
  title: "Foundations/Icon",
  component: Icon,
  args: { name: "search", size: "1.25em" },
  argTypes: {
    name: { control: "select", options: NAMES },
    label: { control: "text" },
  },
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <p className="p-6 text-title2 text-label">
      <Icon {...args} /> Icon next to text
    </p>
  ),
};

export const Registry: Story = {
  render: () => (
    <Section
      title="Registry"
      note="Semantic names mapped to Lucide glyphs (ISC license). No SF Symbols. Switch the toolbar to right to left: the forward, backward and sidebar icons mirror, the others do not."
    >
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {NAMES.map((name) => (
          <li key={name} className="flex items-center gap-3 rounded-lg bg-fill-quaternary px-3 py-2 text-body text-label">
            <Icon name={name} size={20} />
            <code className="text-callout text-label-secondary">{name}</code>
          </li>
        ))}
      </ul>
    </Section>
  ),
};

export const SizesAndLabels: Story = {
  render: () => (
    <>
      <Section title="Sizes" note="The default size is 1.25em, so an icon follows the text style it sits in.">
        <div className="flex flex-col gap-2 text-label">
          <p className="text-caption1">
            <Icon name="info" /> caption1
          </p>
          <p className="text-body">
            <Icon name="info" /> body
          </p>
          <p className="text-title1">
            <Icon name="info" /> title1
          </p>
          <p className="text-body">
            <Icon name="info" size={32} /> explicit 32 px
          </p>
        </div>
      </Section>
      <Section
        title="Accessible name"
        note="Decorative by default (hidden from assistive technology). With a label it is exposed as an image. Color alone never carries the meaning: the labelled icons below also differ in shape."
      >
        <div className="flex gap-6 text-body">
          <span className="text-system-orange">
            <Icon name="warning" label="Warning" size={24} />
          </span>
          <span className="text-system-red">
            <Icon name="error" label="Error" size={24} />
          </span>
          <span className="text-label">
            <Icon name="checkmark" label="Done" size={24} />
          </span>
        </div>
      </Section>
    </>
  ),
};

export const ThemeStates: Story = {
  name: "Theme matrix",
  render: () => (
    <ThemeMatrix>
      {() => (
        <GlassSurface shape="capsule" className="flex items-center gap-3 px-4 py-2 text-body">
          <Icon name="chevron-backward" />
          <span>Back</span>
          <Icon name="search" label="Search" />
          <Icon name="more" label="More" />
        </GlassSurface>
      )}
    </ThemeMatrix>
  ),
};
