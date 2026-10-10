import type { Meta, StoryObj } from "@storybook/react-vite";
import { Backdrop, Section, ThemeMatrix } from "../../test/story-kit";
import { Tab, TabList, TabPanel, Tabs } from "./Tabs";

const meta = {
  title: "Layout/Tabs",
  component: Tabs,
  args: { orientation: "horizontal", keyboardActivation: "automatic", isDisabled: false },
  argTypes: {
    orientation: { control: "inline-radio", options: ["horizontal", "vertical"] },
    keyboardActivation: { control: "inline-radio", options: ["automatic", "manual"] },
    isDisabled: { control: "boolean" },
  },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

function DisplaySettings(props: React.ComponentProps<typeof Tabs>) {
  return (
    <Tabs {...props}>
      <TabList aria-label="Display settings">
        <Tab id="display">Display</Tab>
        <Tab id="color">Color</Tab>
        <Tab id="night">Night Shift</Tab>
      </TabList>
      <TabPanel id="display">
        <p>Resolution and brightness of this display.</p>
        <p className="text-label-secondary">Secondary label</p>
      </TabPanel>
      <TabPanel id="color">
        <p>The color profile this display uses.</p>
        <button className="mt-2 text-accent-text underline">Calibrate</button>
      </TabPanel>
      <TabPanel id="night">
        <p>Shifts the colors of the display to the warmer end after dark.</p>
      </TabPanel>
    </Tabs>
  );
}

export const Playground: Story = {
  render: (args) => (
    <Backdrop kind="plain" className="p-10">
      <DisplaySettings {...args} className="max-w-md" />
    </Backdrop>
  ),
};

export const Orientations: Story = {
  render: () => (
    <Section
      title="Where the control sits"
      note="On the top edge of the content area (HIG Tab views), or on the leading side when vertical. The pane is framed: a tab view gives a strong visual indication of enclosure. Inset it from the edges of its window."
    >
      <Backdrop kind="plain" className="grid items-start gap-8 p-6 lg:grid-cols-2">
        <DisplaySettings data-testid="horizontal" />
        <DisplaySettings orientation="vertical" defaultSelectedKey="color" data-testid="vertical" />
      </Backdrop>
    </Section>
  ),
};

export const States: Story = {
  render: () => (
    <Section
      title="States"
      note="A disabled tab is skipped by the arrow keys. With manual activation the arrows move focus only, and Enter or Space selects: for panes that are slow to show. The HIG advises no more than six tabs."
    >
      <Backdrop kind="plain" className="grid items-start gap-8 p-6 lg:grid-cols-2">
        <DisplaySettings disabledKeys={["color"]} data-testid="disabled-tab" />
        <DisplaySettings keyboardActivation="manual" defaultSelectedKey="night" data-testid="manual" />
      </Backdrop>
    </Section>
  ),
};

export const ThemeStates: Story = {
  name: "Theme matrix",
  render: () => (
    <ThemeMatrix backdrop="plain" cellClassName="items-start">
      {() => (
        <Tabs className="w-full" disabledKeys={["c"]}>
          <TabList aria-label="Sections">
            <Tab id="a">Display</Tab>
            <Tab id="b">Color</Tab>
            <Tab id="c">Disabled</Tab>
          </TabList>
          <TabPanel id="a">
            <p>Primary label</p>
            <p className="text-label-secondary">Secondary label</p>
          </TabPanel>
          <TabPanel id="b">Color</TabPanel>
          <TabPanel id="c">Disabled</TabPanel>
        </Tabs>
      )}
    </ThemeMatrix>
  ),
};
