import type { Meta, StoryObj } from "@storybook/react-vite";
import { Backdrop, Section, ThemeMatrix } from "../../test/story-kit";
import { Lockup } from "./Lockup";

const meta = {
  title: "Layout/Lockup",
  component: Lockup,
  args: { variant: "caption", title: "The Long Road", subtitle: "2024", isDisabled: false },
  argTypes: {
    variant: { control: "inline-radio", options: ["card", "caption", "monogram", "poster"] },
    title: { control: "text" },
    subtitle: { control: "text" },
    isDisabled: { control: "boolean" },
  },
} satisfies Meta<typeof Lockup>;

export default meta;
type Story = StoryObj<typeof meta>;

// Drawn with gradients: no photograph, poster or other asset is used in the playground (DECISIONS D-016).
function Art({ from, to, shape = "aspect-video" }: { from: string; to: string; shape?: string }) {
  return <span aria-hidden="true" className={`block w-full ${shape}`} style={{ background: `linear-gradient(160deg, ${from}, ${to})` }} />;
}

export const Playground: Story = {
  render: (args) => (
    <Backdrop kind="plain" className="p-10">
      {/* The controls drive the button form; `href` makes it a link, as in the stories below. */}
      <Lockup variant={args.variant} title={args.title} subtitle={args.subtitle} isDisabled={args.isDisabled} className="w-44">
        <Art from="#2d3561" to="#c05c7e" shape={args.variant === "monogram" ? "aspect-square" : args.variant === "poster" ? "aspect-2/3" : "aspect-video"} />
      </Lockup>
    </Backdrop>
  ),
};

export const Types: Story = {
  name: "The four types",
  render: () => (
    <Section
      title="The four types"
      note="A lockup combines a header, a content view and a footer into one interactive unit (HIG Lockups, a tvOS component: this is its web analogue). Card, caption button, monogram (initials stand in when there is no picture) and poster, whose title and subtitle show on hover or focus. A lockup grows when it gets focus, so leave room between them."
    >
      <Backdrop kind="plain" className="flex flex-wrap items-start gap-8 p-8">
        <Lockup variant="card" header="Review" title="A fine film" subtitle="4 of 5" className="w-44" data-testid="card">
          <Art from="#136a8a" to="#9bd3d0" />
        </Lockup>
        <Lockup variant="caption" href="#caption" title="The Long Road" subtitle="A link" className="w-44" data-testid="caption">
          <Art from="#2d3561" to="#c05c7e" />
        </Lockup>
        <Lockup variant="monogram" title="Ada Lovelace" initials="AL" className="w-24" data-testid="monogram" />
        <Lockup variant="monogram" title="Grace Hopper" initials="GH" className="w-24" data-testid="monogram-picture">
          <Art from="#f3904f" to="#fbd786" shape="aspect-square" />
        </Lockup>
        <Lockup variant="poster" title="Night Sky" subtitle="2025" className="w-36" data-testid="poster">
          <Art from="#0f2027" to="#5a4fcf" shape="aspect-2/3" />
        </Lockup>
        <Lockup variant="caption" title="Unavailable" subtitle="Disabled" isDisabled className="w-44" data-testid="disabled">
          <Art from="#8e9eab" to="#eef2f3" />
        </Lockup>
      </Backdrop>
    </Section>
  ),
};

export const Row: Story = {
  name: "A row of lockups",
  render: () => (
    <Section title="A row of lockups" note="Use consistent sizes within a row or group, and enough space for the one in focus to grow.">
      <Backdrop kind="plain" className="flex gap-6 overflow-x-auto p-8" data-testid="row">
        {(
          [
            ["Morning", "#6ec6ff", "#ffe29a"],
            ["Forest", "#1f6f43", "#b9e769"],
            ["Harbor", "#355c7d", "#f8b195"],
            ["Desert", "#f3904f", "#fbd786"],
          ] as const
        ).map(([name, from, to]) => (
          <Lockup key={name} variant="caption" title={name} subtitle="Collection" className="w-40 shrink-0">
            <Art from={from} to={to} />
          </Lockup>
        ))}
      </Backdrop>
    </Section>
  ),
};

export const ThemeStates: Story = {
  name: "Theme matrix",
  render: () => (
    <ThemeMatrix backdrop="plain" cellClassName="items-start gap-4">
      {() => (
        <>
          <Lockup variant="card" header="Review" title="A fine film" subtitle="4 of 5" className="w-28">
            <Art from="#136a8a" to="#9bd3d0" />
          </Lockup>
          <Lockup variant="monogram" title="Ada" initials="AL" className="w-16" />
        </>
      )}
    </ThemeMatrix>
  ),
};
