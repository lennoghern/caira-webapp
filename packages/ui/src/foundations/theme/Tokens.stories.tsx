import type { Meta, StoryObj } from "@storybook/react-vite";
import { Section } from "../../test/story-kit";
import { RADII, TEXT_STYLES } from "../utils/tailwind-merge-config";
import { LiquidGlassScope } from "./LiquidGlassScope";

const meta = {
  title: "Foundations/Tokens",
  parameters: { controls: { disable: true } },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const SYSTEM_COLORS = [
  ["red", "bg-system-red"],
  ["orange", "bg-system-orange"],
  ["yellow", "bg-system-yellow"],
  ["green", "bg-system-green"],
  ["mint", "bg-system-mint"],
  ["teal", "bg-system-teal"],
  ["cyan", "bg-system-cyan"],
  ["blue", "bg-system-blue"],
  ["indigo", "bg-system-indigo"],
  ["purple", "bg-system-purple"],
  ["pink", "bg-system-pink"],
  ["brown", "bg-system-brown"],
  ["gray", "bg-system-gray"],
  ["gray2", "bg-system-gray2"],
  ["gray3", "bg-system-gray3"],
  ["gray4", "bg-system-gray4"],
  ["gray5", "bg-system-gray5"],
  ["gray6", "bg-system-gray6"],
] as const;

const SEMANTIC_FILLS = [
  ["background", "bg-background"],
  ["background-secondary", "bg-background-secondary"],
  ["background-tertiary", "bg-background-tertiary"],
  ["surface-solid", "bg-surface-solid"],
  ["fill", "bg-fill"],
  ["fill-secondary", "bg-fill-secondary"],
  ["fill-tertiary", "bg-fill-tertiary"],
  ["fill-quaternary", "bg-fill-quaternary"],
  ["separator", "bg-separator"],
  ["separator-opaque", "bg-separator-opaque"],
  ["accent", "bg-accent"],
  ["accent-fill", "bg-accent-fill"],
] as const;

// Spelled out in full so Tailwind's scanner finds every class.
const TEXT_CLASSES: Record<(typeof TEXT_STYLES)[number], string> = {
  "large-title": "text-large-title",
  title1: "text-title1",
  title2: "text-title2",
  title3: "text-title3",
  headline: "text-headline",
  body: "text-body",
  callout: "text-callout",
  subheadline: "text-subheadline",
  footnote: "text-footnote",
  caption1: "text-caption1",
  caption2: "text-caption2",
};

const RADIUS_CLASSES: Record<(typeof RADII)[number], string> = {
  control: "rounded-control",
  field: "rounded-field",
  menu: "rounded-menu",
  popover: "rounded-popover",
  panel: "rounded-panel",
  sheet: "rounded-sheet",
  window: "rounded-window",
};

function Swatches({ items }: { items: readonly (readonly [string, string])[] }) {
  return (
    <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {items.map(([name, className]) => (
        <li key={name} className="text-caption1 text-label-secondary">
          <div className={`h-10 rounded-lg outline outline-1 -outline-offset-1 outline-separator ${className}`} />
          {name}
        </li>
      ))}
    </ul>
  );
}

function Palette() {
  return (
    <div className="grid gap-4 bg-background p-4">
      <Swatches items={SYSTEM_COLORS} />
      <Swatches items={SEMANTIC_FILLS} />
      <div className="text-body">
        <p className="text-label">label: primary text</p>
        <p className="text-label-secondary">label-secondary: descriptive text</p>
        <p className="text-label-tertiary">label-tertiary: 3:1 only, not for body text</p>
        <p className="flex items-center gap-2 text-label-secondary">
          {/* Shown as a shape: quaternary carries no contrast guarantee, so it never colors text. */}
          <span aria-hidden="true" className="inline-block h-2 w-10 rounded-full bg-label-quaternary" />
          label-quaternary: decoration only, no guarantee
        </p>
        <p className="text-accent-text">accent-text: links and accent-colored text</p>
        <p className="mt-2 inline-block rounded-control bg-accent-fill px-3 py-1 text-on-accent">on-accent on accent-fill</p>
      </div>
    </div>
  );
}

export const Colors: Story = {
  render: () => (
    <Section
      title="Colors"
      note="System colors are VERIFIED against HIG Color (four columns: light, dark, and each with increased contrast). Labels, fills, separators and backgrounds are INFERRED: the HIG names the levels and publishes no values."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {(["light", "dark"] as const).flatMap((appearance) =>
          ([undefined, "more"] as const).map((contrast) => (
            <LiquidGlassScope
              key={`${appearance}-${contrast}`}
              appearance={appearance}
              contrast={contrast}
              className="overflow-hidden rounded-xl outline outline-1 outline-separator"
            >
              <p className="bg-background px-4 pt-3 text-footnote text-label-secondary">
                {appearance}
                {contrast ? ", increased contrast" : ""}
              </p>
              <Palette />
            </LiquidGlassScope>
          )),
        )}
      </div>
    </Section>
  ),
};

function Ramp() {
  return (
    <ul className="grid gap-1 text-label">
      {TEXT_STYLES.map((style) => (
        <li key={style} className={TEXT_CLASSES[style]}>
          {style}: The quick brown fox
        </li>
      ))}
    </ul>
  );
}

export const Typography: Story = {
  render: () => (
    <Section
      title="Text styles"
      note="Sizes, line heights and weights are VERIFIED against HIG Typography. The font is the system stack: no San Francisco file is bundled, and on Apple devices the system font is used as installed. Apple's tracking table is not applied: it describes SF Pro, and the browser already tracks the system font."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <LiquidGlassScope appearance="light" platform="macos" className="rounded-xl bg-background p-4">
          <p className="mb-2 text-footnote text-label-secondary">macOS built-in text styles</p>
          <Ramp />
        </LiquidGlassScope>
        <LiquidGlassScope appearance="light" platform="ios" className="rounded-xl bg-background p-4">
          <p className="mb-2 text-footnote text-label-secondary">iOS, iPadOS Dynamic Type, Large (default)</p>
          <Ramp />
        </LiquidGlassScope>
      </div>
    </Section>
  ),
};

export const RadiiAndMotion: Story = {
  render: () => (
    <>
      <Section title="Radii" note="INFERRED. Apple publishes no corner radius, including the macOS 27 window radius.">
        <ul className="flex flex-wrap gap-3">
          {RADII.map((radius) => (
            <li key={radius} className="text-caption1 text-label-secondary">
              <div className={`size-16 bg-fill outline outline-1 -outline-offset-1 outline-separator ${RADIUS_CLASSES[radius]}`} />
              {radius}
            </li>
          ))}
        </ul>
      </Section>
      <Section
        title="Motion"
        note="INFERRED durations and curves. Hover a bar. With Reduced motion on in the toolbar, every moving duration collapses."
      >
        <ul className="grid max-w-md gap-2 text-callout text-label-secondary">
          <li className="group">
            fast, standard
            <div className="h-2 w-8 rounded-full bg-accent transition-[width] duration-fast ease-standard group-hover:w-full" />
          </li>
          <li className="group">
            base, standard
            <div className="h-2 w-8 rounded-full bg-accent transition-[width] duration-base ease-standard group-hover:w-full" />
          </li>
          <li className="group">
            slow, bounce
            <div className="h-2 w-8 rounded-full bg-accent transition-[width] duration-slow ease-bounce group-hover:w-3/4" />
          </li>
        </ul>
      </Section>
    </>
  ),
};
