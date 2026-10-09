import type { Meta, StoryObj } from "@storybook/react-vite";
import { Backdrop, Section, ThemeMatrix } from "../../test/story-kit";
import { Material, type MaterialThickness } from "./Material";

const THICKNESSES: MaterialThickness[] = ["ultraThin", "thin", "regular", "thick"];

const meta = {
  title: "Foundations/Materials",
  component: Material,
  args: { thickness: "regular" },
  argTypes: {
    thickness: { control: "inline-radio", options: THICKNESSES },
  },
} satisfies Meta<typeof Material>;

export default meta;
type Story = StoryObj<typeof meta>;

function Sample({ thickness }: { thickness: MaterialThickness }) {
  return (
    <Material thickness={thickness} className="w-44 rounded-2xl p-4">
      <p className="text-headline">{thickness}</p>
      <p className="text-body">Primary label</p>
      <p className="text-callout text-label-secondary">Secondary label</p>
      <p className="text-footnote text-label-tertiary">Tertiary label</p>
    </Material>
  );
}

export const Playground: Story = {
  render: (args) => (
    <Backdrop className="flex min-h-80 items-center justify-center p-10">
      <Material {...args} className="rounded-2xl p-6">
        <p className="text-title3">Standard material</p>
        <p className="text-body text-label-secondary">For the content layer, beneath glass.</p>
      </Material>
    </Backdrop>
  ),
};

export const Thicknesses: Story = {
  render: () => (
    <>
      <Section
        title="Over media"
        note="Thicker materials are more opaque and give text more contrast; thinner ones keep more of the context visible (HIG Materials). Every thickness keeps primary and secondary labels at 4.5:1."
      >
        <Backdrop className="flex flex-wrap items-center justify-center gap-4 p-8">
          {THICKNESSES.map((thickness) => (
            <Sample key={thickness} thickness={thickness} />
          ))}
        </Backdrop>
      </Section>
      <Section title="Over black and over white" note="The two extreme backdrops the contrast floor is computed for.">
        <div className="grid gap-3 sm:grid-cols-2">
          {(["black", "white"] as const).map((kind) => (
            <Backdrop key={kind} kind={kind} className="flex flex-wrap items-center justify-center gap-4 p-6">
              {THICKNESSES.map((thickness) => (
                <Sample key={thickness} thickness={thickness} />
              ))}
            </Backdrop>
          ))}
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
        <Material thickness="thin" className="rounded-xl px-4 py-3">
          <p className="text-body">Thin material</p>
          <p className="text-footnote text-label-secondary">Secondary label</p>
        </Material>
      )}
    </ThemeMatrix>
  ),
};
