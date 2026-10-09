import type { Meta, StoryObj } from "@storybook/react-vite";
import { ExpandingPill } from "../../test/ExpandingPill";
import { Backdrop, Section, ThemeMatrix } from "../../test/story-kit";
import { Icon } from "../icon/Icon";
import { GlassGroup } from "./GlassGroup";
import { GlassSurface } from "./GlassSurface";

const meta = {
  title: "Foundations/GlassGroup",
  component: GlassGroup,
  parameters: { controls: { disable: true } },
} satisfies Meta<typeof GlassGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Expanding: Story = {
  name: "Expanding surface",
  render: () => (
    <>
      <Section
        title="A surface that grows and shrinks"
        note="GlassSurface with expanded, and a GlassReveal inside. The element itself changes size and corner radius, so the blur and the tint are painted on every frame. Press it again while it moves: it turns around from where it is. With Reduced motion the size changes at once."
      >
        <Backdrop kind="stripes" className="flex min-h-56 items-start justify-center p-8">
          <ExpandingPill />
        </Backdrop>
      </Section>
      <Section title="Over media">
        <Backdrop className="flex min-h-56 items-start justify-center p-8">
          <ExpandingPill />
        </Backdrop>
      </Section>
    </>
  ),
};

export const Spacing: Story = {
  render: () => (
    <Section
      title="Spacing"
      note="On Apple platforms the container's spacing is the distance at which neighboring shapes begin to fuse. Here it is only the gap: shapes never fuse. That deviation is documented on the component."
    >
      <Backdrop className="flex min-h-40 flex-col items-center justify-center gap-6 p-8">
        {[4, 12, 24].map((spacing) => (
          <GlassGroup key={spacing} spacing={spacing}>
            {(["chevron-backward", "search", "share", "more"] as const).map((name) => (
              <GlassSurface key={name} shape="circle" size="small" className="grid size-10 place-items-center">
                <Icon name={name} label={name} />
              </GlassSurface>
            ))}
          </GlassGroup>
        ))}
      </Backdrop>
    </Section>
  ),
};

export const ThemeStates: Story = {
  name: "Theme matrix",
  render: () => (
    <ThemeMatrix cellClassName="items-start">
      {() => (
        <GlassGroup>
          <ExpandingPill />
        </GlassGroup>
      )}
    </ThemeMatrix>
  ),
};
