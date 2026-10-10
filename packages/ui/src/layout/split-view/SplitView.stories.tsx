import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Backdrop, Section, ThemeMatrix } from "../../test/story-kit";
import { SplitView, SplitViewPane } from "./SplitView";

const meta = {
  title: "Layout/SplitView",
  component: SplitView,
  args: { orientation: "horizontal", dividerStyle: "thin" },
  argTypes: {
    orientation: { control: "inline-radio", options: ["horizontal", "vertical"] },
    dividerStyle: { control: "inline-radio", options: ["thin", "thick"] },
  },
} satisfies Meta<typeof SplitView>;

export default meta;
type Story = StoryObj<typeof meta>;

function Pane({ title, children }: { title: string; children?: string }) {
  return (
    <div className="p-3">
      <p className="text-headline">{title}</p>
      <p className="text-label-secondary">{children ?? "Content of this pane."}</p>
    </div>
  );
}

const FRAME = "rounded-box border border-separator bg-background";

export const Playground: Story = {
  render: (args) => (
    <Backdrop kind="plain" className="p-10">
      <SplitView {...args} className={`h-72 max-w-2xl ${FRAME}`}>
        <SplitViewPane aria-label="Mailboxes" divider="end" collapsible className="bg-background-secondary">
          <Pane title="Mailboxes">Drag the divider, or focus it and use the arrow keys. Enter hides this pane.</Pane>
        </SplitViewPane>
        <SplitViewPane>
          <Pane title="Message" />
        </SplitViewPane>
      </SplitView>
    </Backdrop>
  ),
};

export const ThreePanes: Story = {
  name: "Three panes",
  render: () => (
    <Section
      title="Three panes"
      note="A sidebar with its divider on its trailing edge, a pane that takes the rest, and an inspector with its divider on its leading edge. Each divider is a separator named after the pane it resizes (APG Window Splitter)."
    >
      <Backdrop kind="plain" className="p-6">
        <SplitView className={`h-64 ${FRAME}`} data-testid="three">
          <SplitViewPane aria-label="Sidebar" divider="end" defaultSize={180} minSize={120} maxSize={280} className="bg-background-secondary" data-testid="sidebar">
            <Pane title="Sidebar" />
          </SplitViewPane>
          <SplitViewPane data-testid="content">
            <Pane title="Content">This pane has no size of its own: it takes what the others leave.</Pane>
          </SplitViewPane>
          <SplitViewPane aria-label="Inspector" divider="start" defaultSize={200} minSize={160} maxSize={320} className="bg-background-secondary" data-testid="inspector">
            <Pane title="Inspector" />
          </SplitViewPane>
        </SplitView>
      </Backdrop>
    </Section>
  ),
};

function CollapsibleExample() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="grid gap-3">
      <button
        aria-pressed={!collapsed}
        onClick={() => setCollapsed((value) => !value)}
        className="justify-self-start text-accent-text underline"
      >
        Show sidebar
      </button>
      <SplitView className={`h-56 ${FRAME}`} data-testid="collapsible">
        <SplitViewPane
          aria-label="Sidebar"
          divider="end"
          collapsible
          collapsed={collapsed}
          onCollapsedChange={setCollapsed}
          className="bg-background-secondary"
          data-testid="collapsible-sidebar"
        >
          <Pane title="Sidebar">
            Hidden with Enter on the divider, by dragging the divider past half the minimum width, or with the button above.
          </Pane>
        </SplitViewPane>
        <SplitViewPane>
          <Pane title="Content" />
        </SplitViewPane>
      </SplitView>
    </div>
  );
}

export const CollapsingAndStacking: Story = {
  name: "Collapsing, stacking and the thick divider",
  render: () => (
    <Section
      title="Collapsing, stacking and the thick divider"
      note="When a pane can be hidden, give more than one way to bring it back (HIG Split views): here the divider and a button. Stacked panes use a horizontal divider. The thick divider is for where a hairline would be hard to see."
    >
      <Backdrop kind="plain" className="grid items-start gap-8 p-6 lg:grid-cols-2">
        <CollapsibleExample />
        <SplitView orientation="vertical" dividerStyle="thick" className={`h-72 ${FRAME}`} data-testid="stacked">
          <SplitViewPane aria-label="Slide" divider="end" defaultSize={150} minSize={80} maxSize={220} data-testid="stacked-top">
            <Pane title="Slide" />
          </SplitViewPane>
          <SplitViewPane className="bg-background-secondary">
            <Pane title="Presenter notes" />
          </SplitViewPane>
        </SplitView>
      </Backdrop>
    </Section>
  ),
};

export const ThemeStates: Story = {
  name: "Theme matrix",
  render: () => (
    <ThemeMatrix backdrop="plain" cellClassName="items-stretch p-3">
      {() => (
        <SplitView className={`h-28 w-full ${FRAME}`}>
          <SplitViewPane aria-label="Sidebar" divider="end" defaultSize={110} minSize={60} maxSize={200} className="bg-background-secondary">
            <p className="p-2">Sidebar</p>
          </SplitViewPane>
          <SplitViewPane>
            <p className="p-2 text-label-secondary">Secondary label</p>
          </SplitViewPane>
        </SplitView>
      )}
    </ThemeMatrix>
  ),
};
