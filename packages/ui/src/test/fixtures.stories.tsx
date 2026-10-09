import type { Meta, StoryObj } from "@storybook/react-vite";
import { GlassSurface } from "../foundations/glass/GlassSurface";
import { Material, type MaterialThickness } from "../foundations/materials/Material";
import { LiquidGlassScope } from "../foundations/theme/LiquidGlassScope";
import { ExpandingPill } from "./ExpandingPill";
import { Backdrop } from "./story-kit";

/**
 * Fixtures for the Playwright suite in tests/browser. They are measurements, not
 * documentation: bare surfaces at known positions so real pixels can be sampled.
 */
const meta = {
  title: "Tests/Fixtures",
  parameters: { controls: { disable: true }, a11y: { test: "off" } },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const THICKNESSES: MaterialThickness[] = ["ultraThin", "thin", "regular", "thick"];
const CLARITIES = [0, 0.5, 1] as const;

/**
 * Empty surfaces over pure black and pure white, in both appearances. The
 * contrast model (src/styles/contrast.test.ts) predicts the color of each one;
 * glass-pixels.spec.ts reads what the browser actually painted.
 *
 * Each row holds the four materials and regular glass at three clarity settings
 * at rest, then the same glass held in its hovered and pressed states through
 * the data attributes React Aria sets, so those states can be read without a pointer.
 */
export const SurfacePixels: Story = {
  render: () => (
    <div className="grid w-[1240px] gap-0">
      {(["light", "dark"] as const).flatMap((appearance) =>
        (["black", "white"] as const).map((backdrop) => (
          <LiquidGlassScope key={`${appearance}-${backdrop}`} appearance={appearance}>
            <Backdrop kind={backdrop} className="flex gap-3 p-4" data-row={`${appearance}/${backdrop}`}>
              {THICKNESSES.map((thickness) => (
                <Material
                  key={thickness}
                  thickness={thickness}
                  data-sample={`${appearance}/${backdrop}/material-${thickness.toLowerCase()}`}
                  className="h-16 w-20"
                />
              ))}
              {CLARITIES.map((clarity) => (
                <GlassSurface
                  key={clarity}
                  size="small"
                  shape="none"
                  data-sample={`${appearance}/${backdrop}/glass-${clarity}`}
                  className="h-16 w-20"
                  style={{ "--glass-clarity": clarity } as React.CSSProperties}
                />
              ))}
              {(["hovered", "pressed"] as const).flatMap((state) =>
                CLARITIES.map((clarity) => (
                  <GlassSurface
                    key={`${state}-${clarity}`}
                    size="small"
                    shape="none"
                    interactive
                    data-hovered={state === "hovered" ? "true" : undefined}
                    data-pressed={state === "pressed" ? "true" : undefined}
                    data-sample={`${appearance}/${backdrop}/glass-${clarity}-${state}`}
                    className="h-16 w-20"
                    style={{ "--glass-clarity": clarity } as React.CSSProperties}
                  />
                )),
              )}
            </Backdrop>
          </LiquidGlassScope>
        )),
      )}
    </div>
  ),
};

/** One large surface over hard stripes: displacement at the rim shows up as bent stripes. */
export const Refraction: Story = {
  render: () => (
    <Backdrop kind="stripes" className="flex h-[320px] w-[480px] items-center justify-center">
      <GlassSurface
        data-sample="refraction"
        size="small"
        className="h-[200px] w-[320px]"
        // Little blur and no tint, so the stripes stay readable through the glass.
        style={{ "--glass-clarity": 1, "--glass-blur-clear": "1px" } as React.CSSProperties}
      />
    </Backdrop>
  ),
};

/** Many surfaces over tall content, for the frame-time measurement behind the glass budget. */
export const Budget: Story = {
  render: () => {
    const count = Number(new URLSearchParams(window.location.search).get("surfaces") ?? "12");
    return (
      <div data-testid="scroller" className="h-screen overflow-y-auto">
        <Backdrop kind="media" className="h-[6000px]">
          <div className="sticky top-0 grid grid-cols-6 gap-3 p-4">
            {Array.from({ length: count }, (_, index) => (
              <GlassSurface key={index} shape="capsule" className="h-12" />
            ))}
          </div>
        </Backdrop>
      </div>
    );
  },
};

/**
 * One expandable surface over hard stripes. If the surface ever lost its blur or
 * its tint while changing size, the stripes would show through sharp:
 * expand.spec.ts reads video frames of this to make sure they never do.
 */
export const Expansion: Story = {
  render: () => (
    <Backdrop kind="stripes" className="flex h-64 w-[480px] items-start justify-center p-6" data-testid="expansion">
      <ExpandingPill />
    </Backdrop>
  ),
};
