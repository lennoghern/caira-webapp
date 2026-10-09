import type { Meta, StoryObj } from "@storybook/react-vite";
import { Backdrop, Section, ThemeMatrix } from "../../test/story-kit";
import { Icon } from "../icon/Icon";
import { GlassSurface } from "./GlassSurface";
import { concentric, concentricContainerStyle } from "./concentric";
import { glassSurface } from "./glass.styles";

const meta = {
  title: "Foundations/GlassSurface",
  component: GlassSurface,
  args: {
    variant: "regular",
    size: "medium",
    shape: "rounded",
    dim: false,
    interactive: false,
    bounce: false,
  },
  argTypes: {
    variant: { control: "inline-radio", options: ["regular", "clear"] },
    size: { control: "inline-radio", options: ["small", "medium", "large"] },
    shape: { control: "inline-radio", options: ["rounded", "capsule", "circle", "concentric", "none"] },
    tint: { control: "text" },
    appearance: { control: "inline-radio", options: [undefined, "light", "dark"] },
  },
} satisfies Meta<typeof GlassSurface>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <Backdrop className="flex min-h-80 items-center justify-center p-10">
      <GlassSurface {...args} className="px-5 py-3">
        <p className="text-body">Liquid Glass</p>
        <p className="text-footnote text-label-secondary">Secondary text</p>
      </GlassSurface>
    </Backdrop>
  ),
};

export const Variants: Story = {
  render: () => (
    <>
      <Section
        title="Regular"
        note="Blurs and evens out what is behind it. Use it when the background could hurt legibility or the surface holds real text. Primary and secondary labels keep 4.5:1 on any backdrop (contrast.test.ts)."
      >
        <Backdrop className="flex min-h-48 items-center justify-center gap-6 p-8">
          <GlassSurface className="px-5 py-3">
            <p className="text-body">Regular glass</p>
            <p className="text-footnote text-label-secondary">Secondary label</p>
            <p className="text-footnote text-label-tertiary">Tertiary label</p>
          </GlassSurface>
        </Backdrop>
      </Section>
      <Section
        title="Clear"
        note="Highly translucent, for surfaces floating over photos or video only. It carries no contrast guarantee: its label reaches 4.5:1 only while the media behind stays dark (relative luminance up to about 0.07 in light appearance, 0.11 in dark), or up to about 0.32 with the 35% dimming layer."
      >
        <Backdrop className="flex min-h-48 flex-wrap items-center justify-center gap-6 p-8">
          <GlassSurface variant="clear" shape="capsule" className="px-5 py-3">
            <p className="text-body">Clear</p>
          </GlassSurface>
          <GlassSurface variant="clear" dim shape="capsule" className="px-5 py-3">
            <p className="text-body">Clear with dimming</p>
          </GlassSurface>
        </Backdrop>
      </Section>
    </>
  ),
};

export const SizesAndShapes: Story = {
  render: () => (
    <>
      <Section title="Sizes" note="Larger surfaces are more opaque (HIG Color). small: controls. medium: bars and popovers. large: sidebars, sheets, windows.">
        <Backdrop className="flex min-h-56 flex-wrap items-center justify-center gap-6 p-8">
          <GlassSurface size="small" className="px-3 py-1.5 text-body">
            small
          </GlassSurface>
          <GlassSurface size="medium" className="px-5 py-4 text-body">
            medium
          </GlassSurface>
          <GlassSurface size="large" className="px-8 py-10 text-body">
            large
          </GlassSurface>
        </Backdrop>
      </Section>
      <Section title="Shapes">
        <Backdrop className="flex min-h-48 flex-wrap items-center justify-center gap-6 p-8">
          <GlassSurface shape="rounded" className="px-5 py-3 text-body">
            rounded
          </GlassSurface>
          <GlassSurface shape="capsule" className="px-5 py-3 text-body">
            capsule
          </GlassSurface>
          <GlassSurface shape="circle" size="small" className="grid size-11 place-items-center">
            <Icon name="add" label="Add" />
          </GlassSurface>
        </Backdrop>
      </Section>
      <Section
        title="Concentric corners"
        note="Inner radius = outer radius - padding. The outer surface publishes its radius and padding; each inner shape takes the rounded-concentric utility (on a GlassSurface: shape=&quot;concentric&quot;). Here 24 - 8 = 16."
      >
        <Backdrop className="flex min-h-56 items-center justify-center p-8">
          <GlassSurface size="large" shape="none" style={concentricContainerStyle(24, 8)} className="flex gap-2">
            {["One", "Two", "Three"].map((label) => (
              <div key={label} className="rounded-concentric bg-fill px-5 py-6 text-body" data-radius={concentric(24, 8)}>
                {label}
              </div>
            ))}
          </GlassSurface>
        </Backdrop>
      </Section>
    </>
  ),
};

export const TintAndInteraction: Story = {
  render: () => (
    <>
      <Section
        title="Tint"
        note="Color the background of the one primary action, not its label (HIG Color). The accent tint keeps its label at 4.5:1; with any other color the caller owns the contrast."
      >
        <Backdrop className="flex min-h-40 flex-wrap items-center justify-center gap-4 p-8">
          <GlassSurface shape="capsule" size="small" className="px-4 py-2 text-body">
            Cancel
          </GlassSurface>
          <GlassSurface tint="accent" shape="capsule" size="small" className="px-4 py-2 text-body font-semibold">
            Done
          </GlassSurface>
          <GlassSurface
            tint="rgb(128 60 0)"
            shape="capsule"
            size="small"
            className="px-4 py-2 text-body font-semibold"
          >
            Custom tint
          </GlassSurface>
        </Backdrop>
      </Section>
      <Section
        title="Interactive"
        note="The response is CSS on the element that owns the state. These are real buttons carrying the glass classes; hover, press, and Tab to them. The last one adds the opt-in macOS 27 bounce."
      >
        <Backdrop className="flex min-h-40 flex-wrap items-center justify-center gap-4 p-8">
          <button
            type="button"
            data-glass="regular"
            className={glassSurface({ size: "small", shape: "capsule", interactive: true, class: "px-4 py-2 text-body" })}
          >
            Interactive
          </button>
          <button
            type="button"
            data-glass="regular"
            className={glassSurface({
              size: "small",
              shape: "capsule",
              interactive: true,
              bounce: true,
              class: "px-4 py-2 text-body",
            })}
          >
            With bounce
          </button>
          <button
            type="button"
            disabled
            data-glass="regular"
            className={glassSurface({ size: "small", shape: "capsule", interactive: true, class: "px-4 py-2 text-body" })}
          >
            Disabled
          </button>
        </Backdrop>
      </Section>
    </>
  ),
};

export const NestedAndPinned: Story = {
  render: () => (
    <>
      <Section title="Glass on glass" note="Never layered: a surface inside another drops to a plain tint, with no second blur and no edge.">
        <Backdrop className="flex min-h-48 items-center justify-center p-8">
          <GlassSurface as="nav" aria-label="Example toolbar" shape="capsule" className="flex items-center gap-2 p-2">
            <GlassSurface shape="capsule" size="small" className="px-3 py-1.5 text-body">
              Nested
            </GlassSurface>
            <GlassSurface tint="accent" shape="capsule" size="small" className="px-3 py-1.5 text-body">
              Nested, tinted
            </GlassSurface>
          </GlassSurface>
        </Backdrop>
      </Section>
      <Section
        title="Pinned appearance"
        note="Apple's glass turns light or dark with what is behind it. The web cannot sample the backdrop, so a surface follows the page appearance unless it is pinned."
      >
        <Backdrop kind="black" className="flex min-h-40 items-center justify-center gap-4 p-8">
          <GlassSurface appearance="dark" shape="capsule" className="px-5 py-3 text-body">
            Pinned dark, over dark media
          </GlassSurface>
        </Backdrop>
      </Section>
    </>
  ),
};

export const OverContent: Story = {
  render: () => (
    <Backdrop kind="content" className="min-h-96">
      <div className="flex justify-center p-4">
        <GlassSurface as="nav" aria-label="Example bar" shape="capsule" className="flex items-center gap-4 px-5 py-2.5">
          <Icon name="sidebar" label="Sidebar" />
          <span className="text-body font-semibold">Title</span>
          <span className="text-body text-label-secondary">Subtitle</span>
          <Icon name="search" label="Search" />
        </GlassSurface>
      </div>
    </Backdrop>
  ),
};

export const ThemeStates: Story = {
  name: "Theme matrix",
  render: () => (
    <ThemeMatrix>
      {() => (
        <div className="flex flex-col items-center gap-3">
          <GlassSurface shape="capsule" className="px-4 py-2">
            <span className="text-body">Label </span>
            <span className="text-body text-label-secondary">Secondary</span>
          </GlassSurface>
          <GlassSurface tint="accent" shape="capsule" size="small" className="px-4 py-1.5 text-body font-semibold">
            Primary action
          </GlassSurface>
        </div>
      )}
    </ThemeMatrix>
  ),
};
