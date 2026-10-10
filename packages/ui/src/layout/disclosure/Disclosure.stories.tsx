import type { Meta, StoryObj } from "@storybook/react-vite";
import { Backdrop, Section, ThemeMatrix } from "../../test/story-kit";
import { Disclosure, DisclosureGroup, DisclosurePanel, DisclosureTrigger } from "./Disclosure";

const meta = {
  title: "Layout/Disclosure",
  component: Disclosure,
  args: { variant: "triangle", defaultExpanded: false, isDisabled: false },
  argTypes: {
    variant: { control: "inline-radio", options: ["triangle", "button"] },
    defaultExpanded: { control: "boolean" },
    isDisabled: { control: "boolean" },
  },
} satisfies Meta<typeof Disclosure>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Native controls: the library's own toggles arrive in a later batch. */
function ExportOptions() {
  return (
    <div className="grid gap-2">
      <label className="flex items-center gap-2">
        <input type="checkbox" defaultChecked /> Include presenter notes
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" /> Print each stage of builds
      </label>
      <p className="text-callout text-label-secondary">These apply to this export only.</p>
    </div>
  );
}

export const Playground: Story = {
  render: (args) => (
    <Backdrop kind="plain" className="p-10">
      {/* Remounted when a control changes, so `defaultExpanded` takes effect. */}
      <Disclosure {...args} key={`${args.variant}-${args.defaultExpanded}`} className="max-w-sm">
        <DisclosureTrigger aria-label={args.variant === "button" ? "Advanced options" : undefined}>
          {args.variant === "button" ? null : "Advanced options"}
        </DisclosureTrigger>
        <DisclosurePanel>
          <ExportOptions />
        </DisclosurePanel>
      </Disclosure>
    </Backdrop>
  ),
};

export const TriangleAndButton: Story = {
  name: "Triangle and button",
  render: () => (
    <Section
      title="Triangle and button"
      note="A disclosure triangle points inward from the leading edge when its content is hidden and down when it is visible; give it a label that says what it shows. A disclosure button belongs to one control, points down when its content is hidden and up when it is visible, and there is no more than one in a view (HIG Disclosure controls)."
    >
      <Backdrop kind="plain" className="grid items-start gap-8 p-6 sm:grid-cols-2">
        <div className="grid content-start gap-2">
          <Disclosure data-testid="collapsed">
            <DisclosureTrigger>Advanced options</DisclosureTrigger>
            <DisclosurePanel>
              <ExportOptions />
            </DisclosurePanel>
          </Disclosure>
          <Disclosure defaultExpanded data-testid="expanded">
            <DisclosureTrigger>Shown from the start</DisclosureTrigger>
            <DisclosurePanel>
              <ExportOptions />
            </DisclosurePanel>
          </Disclosure>
          <Disclosure isDisabled data-testid="disabled">
            <DisclosureTrigger>Unavailable</DisclosureTrigger>
            <DisclosurePanel>
              <ExportOptions />
            </DisclosurePanel>
          </Disclosure>
          <button className="justify-self-start text-accent-text underline">After the disclosures</button>
        </div>
        <Disclosure variant="button" data-testid="button-form">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2">
              Save as
              <input defaultValue="Untitled" className="rounded-field border border-separator bg-background px-2 py-1" />
            </label>
            <DisclosureTrigger aria-label="Show more locations" />
          </div>
          <DisclosurePanel>
            <p className="text-label-secondary">A browser for choosing where to save would go here.</p>
          </DisclosurePanel>
        </Disclosure>
      </Backdrop>
    </Section>
  ),
};

export const Group: Story = {
  render: () => (
    <Section
      title="A group of disclosures"
      note="One open at a time, as an accordion (APG). Each trigger sits in a level 3 heading. The second group lets several stay open."
    >
      <Backdrop kind="plain" className="grid items-start gap-8 p-6 sm:grid-cols-2">
        <DisclosureGroup defaultExpandedKeys={["general"]} data-testid="single">
          <Disclosure id="general">
            <DisclosureTrigger>General</DisclosureTrigger>
            <DisclosurePanel>Name, appearance and language.</DisclosurePanel>
          </Disclosure>
          <Disclosure id="sharing">
            <DisclosureTrigger>Sharing</DisclosureTrigger>
            <DisclosurePanel>Who can see this document and what they can do with it.</DisclosurePanel>
          </Disclosure>
          <Disclosure id="advanced">
            <DisclosureTrigger>Advanced</DisclosureTrigger>
            <DisclosurePanel>Options most people never need to change.</DisclosurePanel>
          </Disclosure>
        </DisclosureGroup>
        <DisclosureGroup allowsMultipleExpanded defaultExpandedKeys={["a", "b"]} data-testid="multiple">
          <Disclosure id="a">
            <DisclosureTrigger>Fonts</DisclosureTrigger>
            <DisclosurePanel>Typefaces used in this document.</DisclosurePanel>
          </Disclosure>
          <Disclosure id="b">
            <DisclosureTrigger>Colors</DisclosureTrigger>
            <DisclosurePanel>The palette of this document.</DisclosurePanel>
          </Disclosure>
        </DisclosureGroup>
      </Backdrop>
    </Section>
  ),
};

export const ThemeStates: Story = {
  name: "Theme matrix",
  render: () => (
    <ThemeMatrix backdrop="plain" cellClassName="items-start justify-start">
      {() => (
        <div className="grid w-full gap-1">
          <Disclosure defaultExpanded>
            <DisclosureTrigger>Advanced options</DisclosureTrigger>
            <DisclosurePanel>
              <p className="text-label-secondary">Secondary label</p>
            </DisclosurePanel>
          </Disclosure>
          <Disclosure isDisabled>
            <DisclosureTrigger>Unavailable</DisclosureTrigger>
            <DisclosurePanel>Hidden</DisclosurePanel>
          </Disclosure>
        </div>
      )}
    </ThemeMatrix>
  ),
};
