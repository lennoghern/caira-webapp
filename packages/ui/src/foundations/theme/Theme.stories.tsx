import type { Meta, StoryObj } from "@storybook/react-vite";
import { useId } from "react";
import { Backdrop, Section } from "../../test/story-kit";
import { GlassSurface } from "../glass/GlassSurface";
import { Material } from "../materials/Material";
import { LiquidGlassProvider } from "./LiquidGlassProvider";
import { useLiquidGlass } from "./context";
import type { LiquidGlassPreferences } from "./types";

const meta = {
  title: "Foundations/Theme",
  parameters: {
    controls: { disable: true },
    // This story mounts its own provider; the toolbar switches do not apply to it.
    liquidGlass: "own-provider",
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function Choice<K extends keyof LiquidGlassPreferences>({
  field,
  legend,
  options,
}: {
  field: K;
  legend: string;
  options: readonly (readonly [LiquidGlassPreferences[K] & string, string])[];
}) {
  const { preferences, setPreferences } = useLiquidGlass();
  const name = useId();
  return (
    <fieldset className="text-body">
      <legend className="text-footnote text-label-secondary">{legend}</legend>
      <div className="flex flex-wrap gap-x-4">
        {options.map(([value, label]) => (
          <label key={value} className="flex items-center gap-1.5 py-1">
            <input
              type="radio"
              name={name}
              checked={preferences[field] === value}
              onChange={() => setPreferences({ [field]: value } as Partial<LiquidGlassPreferences>)}
            />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Settings() {
  const { preferences, resolved, refraction, setPreferences, resetPreferences } = useLiquidGlass();
  const clarityId = useId();
  return (
    <Backdrop className="min-h-screen p-6">
      <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
        <Material thickness="thick" className="grid gap-3 rounded-2xl p-5">
          <h2 className="text-title3 font-semibold">Appearance settings</h2>
          <div className="text-body">
            <label htmlFor={clarityId} className="text-footnote text-label-secondary">
              Liquid Glass: {preferences.clarity === 0 ? "fully tinted" : preferences.clarity === 1 ? "ultra clear" : preferences.clarity.toFixed(2)}
            </label>
            <input
              id={clarityId}
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={preferences.clarity}
              onChange={(event) => setPreferences({ clarity: event.target.valueAsNumber })}
              className="block w-full"
            />
          </div>
          <Choice
            field="appearance"
            legend="Appearance"
            options={[
              ["system", "System"],
              ["light", "Light"],
              ["dark", "Dark"],
            ]}
          />
          <Choice
            field="transparency"
            legend="Transparency"
            options={[
              ["system", "System"],
              ["reduced", "Reduced"],
            ]}
          />
          <Choice
            field="contrast"
            legend="Contrast"
            options={[
              ["system", "System"],
              ["more", "Increased"],
            ]}
          />
          <Choice
            field="motion"
            legend="Motion"
            options={[
              ["system", "System"],
              ["reduced", "Reduced"],
            ]}
          />
          <Choice
            field="platform"
            legend="Density"
            options={[
              ["macos", "macOS"],
              ["ios", "iOS"],
            ]}
          />
          <button type="button" onClick={resetPreferences} className="justify-self-start text-body text-accent-text underline">
            Reset to defaults
          </button>
          <p className="text-footnote text-label-secondary">
            In effect: {resolved.appearance}
            {resolved.reducedTransparency ? ", reduced transparency" : ""}
            {resolved.increasedContrast ? ", increased contrast" : ""}
            {resolved.reducedMotion ? ", reduced motion" : ""}
            {resolved.forcedColors ? ", forced colors" : ""}. Refraction tier: {refraction ? "on" : "off"}.
          </p>
        </Material>

        <div className="grid content-start gap-4">
          <GlassSurface as="nav" aria-label="Preview bar" shape="capsule" className="flex items-center gap-4 px-5 py-2.5">
            <span className="text-body font-semibold">Regular glass</span>
            <span className="text-body text-label-secondary">Secondary</span>
          </GlassSurface>
          <GlassSurface size="large" className="p-5">
            <p className="text-headline">Large surface</p>
            <p className="text-body text-label-secondary">More opaque than the bar above, at every clarity.</p>
          </GlassSurface>
          <GlassSurface variant="clear" dim shape="capsule" className="px-5 py-2.5 text-body">
            Clear glass with dimming
          </GlassSurface>
        </div>
      </div>
    </Backdrop>
  );
}

export const SettingsPanel: Story = {
  name: "Settings (persisted)",
  render: () => (
    <LiquidGlassProvider storageKey="caira-ui:storybook-demo">
      <Section
        title="LiquidGlassProvider"
        note="An uncontrolled provider with its own storage key. Change a setting and reload: it comes back. The slider is the web counterpart of the macOS 27 Liquid Glass setting, from fully tinted to ultra clear."
      >
        <Settings />
      </Section>
    </LiquidGlassProvider>
  ),
};
