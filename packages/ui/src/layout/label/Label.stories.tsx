import type { Meta, StoryObj } from "@storybook/react-vite";
import { Icon } from "../../foundations/icon/Icon";
import { Backdrop, Section, ThemeMatrix } from "../../test/story-kit";
import { Label, type LabelTextStyle } from "./Label";

const TEXT_STYLES: LabelTextStyle[] = [
  "large-title",
  "title1",
  "title2",
  "title3",
  "headline",
  "body",
  "callout",
  "subheadline",
  "footnote",
  "caption1",
  "caption2",
];

const meta = {
  title: "Layout/Label",
  component: Label,
  args: { children: "About this device", level: "primary", textStyle: "body", labelStyle: "title-and-icon" },
  argTypes: {
    children: { control: "text" },
    level: { control: "inline-radio", options: ["primary", "secondary", "tertiary"] },
    textStyle: { control: "select", options: TEXT_STYLES },
    labelStyle: { control: "inline-radio", options: ["title-and-icon", "title-only", "icon-only"] },
    lineLimit: { control: "inline-radio", options: [undefined, 1, 2, 3] },
    selectable: { control: "boolean" },
  },
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <Backdrop kind="plain" className="p-10">
      <Label {...args} icon={<Icon name="info" />} />
    </Backdrop>
  ),
};

export const LevelsAndTextStyles: Story = {
  name: "Levels and text styles",
  render: () => (
    <Section
      title="Levels and text styles"
      note="Three label colors for relative importance (HIG Labels): primary information, supplemental text, and text that describes something unavailable. The quaternary color is not offered, because it has no contrast guarantee. The sizes follow the Density switch of the toolbar."
    >
      <Backdrop kind="plain" className="grid gap-6 p-6 sm:grid-cols-2">
        <div className="grid content-start gap-2" data-testid="levels">
          <Label level="primary">Primary: the main information</Label>
          <Label level="secondary">Secondary: a subheading or supplemental text</Label>
          <Label level="tertiary">Tertiary: an unavailable item or behavior</Label>
        </div>
        <div className="grid content-start gap-2" data-testid="text-styles">
          {TEXT_STYLES.map((textStyle) => (
            <Label key={textStyle} textStyle={textStyle} data-text-style={textStyle}>
              {textStyle}
            </Label>
          ))}
        </div>
      </Backdrop>
    </Section>
  ),
};

export const IconAndTruncation: Story = {
  name: "Icon, truncation and selection",
  render: () => (
    <Section
      title="Icon, truncation and selection"
      note="The icon is decoration and the text names it. With icon-only the text is hidden from sight and kept for assistive technology. A line limit cuts the title, never the icon. The last label can be selected and copied although its container turns selection off."
    >
      <Backdrop kind="plain" className="grid gap-6 p-6 sm:grid-cols-2">
        <div className="grid content-start justify-items-start gap-3" data-testid="styles">
          <Label icon={<Icon name="info" />}>Title and icon</Label>
          <Label icon={<Icon name="info" />} labelStyle="title-only">
            Title only
          </Label>
          <Label icon={<Icon name="info" />} labelStyle="icon-only">
            Icon only
          </Label>
          <Label icon={<Icon name="chevron-forward" />} level="secondary">
            A direction-sensitive icon mirrors in right-to-left
          </Label>
        </div>
        <div className="grid w-56 content-start gap-3 select-none" data-testid="limits">
          <Label icon={<Icon name="warning" />} lineLimit={1} data-testid="one-line">
            One line: a long piece of text that does not fit in the width it has been given
          </Label>
          <Label icon={<Icon name="warning" />} lineLimit={2} data-testid="two-lines">
            Two lines: a long piece of text that does not fit in the width it has been given, however it is wrapped
          </Label>
          <Label level="secondary" textStyle="callout" selectable data-testid="selectable">
            192.168.1.24
          </Label>
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
        <div className="grid gap-1">
          <Label icon={<Icon name="info" />}>Primary label</Label>
          <Label icon={<Icon name="info" />} level="secondary">
            Secondary label
          </Label>
          <Label icon={<Icon name="info" />} level="tertiary">
            Tertiary label
          </Label>
        </div>
      )}
    </ThemeMatrix>
  ),
};
