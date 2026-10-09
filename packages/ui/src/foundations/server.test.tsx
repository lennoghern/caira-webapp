// @vitest-environment node

import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  GlassFilterDefs,
  GlassGroup,
  GlassReveal,
  GlassSurface,
  Icon,
  LiquidGlassProvider,
  LiquidGlassScope,
  Material,
  ThemeScript,
} from "./index";

/**
 * Renders the foundations with no DOM at all, the way a server does. This
 * proves that nothing touches `window`, `document` or `localStorage` while
 * rendering. It does not prove React Server Component compatibility: Vitest has
 * no RSC runtime. That is checked by building the Next.js app (PROGRESS.md).
 */
describe("server rendering", () => {
  it("renders every foundation without a browser and without console errors", () => {
    expect(typeof window).toBe("undefined");
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const html = renderToString(
      <LiquidGlassProvider defaultPreferences={{ appearance: "dark", clarity: 0.25 }}>
        <Material thickness="thin">
          <GlassGroup>
            <GlassSurface tint="accent" interactive bounce>
              <Icon name="search" /> Search
            </GlassSurface>
            <GlassSurface expanded>
              <GlassReveal expanded axis="both" className="w-64">
                Details
              </GlassReveal>
            </GlassSurface>
            <GlassSurface variant="clear" dim shape="capsule" />
          </GlassGroup>
          <LiquidGlassScope appearance="light">
            <Icon name="chevron-forward" label="Next" />
          </LiquidGlassScope>
        </Material>
      </LiquidGlassProvider>,
    );

    expect(error).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
    expect(html).toContain('data-glass="regular"');
    expect(html).toContain('data-glass="clear"');
    expect(html).toContain('data-material="thin"');
    expect(html).toContain("caira-glass-refraction");
    expect(html).toContain('aria-label="Next"');
  });

  it("emits a runnable script type on the server", () => {
    const html = renderToString(<ThemeScript defaultPreferences={{ appearance: "dark" }} />);
    expect(html).toContain('type="text/javascript"');
    expect(html).toContain("localStorage");
  });

  it("renders the shared filter on its own", () => {
    expect(renderToString(<GlassFilterDefs />)).toContain("feDisplacementMap");
  });
});
