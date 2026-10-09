import type { Preview } from "@storybook/react-vite";
import { useLayoutEffect, type ReactNode } from "react";
import { LiquidGlassProvider, type LiquidGlassPreferences } from "../src/foundations";
import "./preview.css";

/**
 * Toolbar switches for the theme matrix (ARCHITECTURE.md section 10): light and
 * dark, glass clarity, reduced transparency, increased contrast, reduced motion,
 * density and direction. Forced colors is a system state with no manual
 * override: emulate it in the browser's developer tools ("Rendering" panel), or
 * see the Playwright suite, which emulates it.
 */
const preview: Preview = {
  parameters: {
    layout: "fullscreen",
    controls: { expanded: true },
    options: {
      storySort: { order: ["Foundations", ["Tokens", "Materials", "GlassSurface", "Glass recipes", "GlassGroup", "Icon", "Theme"], "Layout", "Tests"] },
    },
  },
  globalTypes: {
    appearance: {
      description: "Appearance",
      toolbar: {
        title: "Appearance",
        icon: "mirror",
        items: [
          { value: "system", title: "System" },
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
        dynamicTitle: true,
      },
    },
    clarity: {
      description: "Liquid Glass clarity (macOS 27 setting)",
      toolbar: {
        title: "Glass",
        icon: "contrast",
        items: [
          { value: "0", title: "Tinted (0)" },
          { value: "0.5", title: "Regular (0.5)" },
          { value: "1", title: "Clear (1)" },
        ],
        dynamicTitle: true,
      },
    },
    transparency: {
      description: "Reduce transparency",
      toolbar: {
        title: "Transparency",
        icon: "eye",
        items: [
          { value: "system", title: "Transparency: system" },
          { value: "reduced", title: "Reduced transparency" },
        ],
        dynamicTitle: true,
      },
    },
    contrast: {
      description: "Increase contrast",
      toolbar: {
        title: "Contrast",
        icon: "accessibility",
        items: [
          { value: "system", title: "Contrast: system" },
          { value: "more", title: "Increased contrast" },
        ],
        dynamicTitle: true,
      },
    },
    motion: {
      description: "Reduce motion",
      toolbar: {
        title: "Motion",
        icon: "lightning",
        items: [
          { value: "system", title: "Motion: system" },
          { value: "reduced", title: "Reduced motion" },
        ],
        dynamicTitle: true,
      },
    },
    platform: {
      description: "Density",
      toolbar: {
        title: "Density",
        icon: "mobile",
        items: [
          { value: "macos", title: "macOS density" },
          { value: "ios", title: "iOS density" },
        ],
        dynamicTitle: true,
      },
    },
    direction: {
      description: "Text direction",
      toolbar: {
        title: "Direction",
        icon: "transfer",
        items: [
          { value: "ltr", title: "Left to right" },
          { value: "rtl", title: "Right to left" },
        ],
        dynamicTitle: true,
      },
    },
    refraction: {
      description: "Rendering tier 2 (Chromium only)",
      toolbar: {
        title: "Refraction",
        icon: "lightning",
        items: [
          { value: "auto", title: "Refraction: auto" },
          { value: "on", title: "Refraction: forced on" },
          { value: "off", title: "Refraction: off" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    appearance: "system",
    clarity: "0.5",
    transparency: "system",
    contrast: "system",
    motion: "system",
    platform: "macos",
    direction: "ltr",
    refraction: "auto",
  },
  decorators: [
    (Story, context) => {
      // A story that demonstrates the provider itself mounts its own.
      if (context.parameters.liquidGlass === "own-provider") return <Story />;
      const globals = context.globals;
      const preferences: Partial<LiquidGlassPreferences> = {
        appearance: globals.appearance,
        clarity: Number(globals.clarity),
        transparency: globals.transparency,
        contrast: globals.contrast,
        motion: globals.motion,
        platform: globals.platform,
      };
      return (
        // Controlled and without storage: the toolbar is the source of truth here.
        <LiquidGlassProvider preferences={preferences} storageKey={null} refraction={globals.refraction} glassBudget={false}>
          <Direction value={globals.direction}>
            <Story />
          </Direction>
        </LiquidGlassProvider>
      );
    },
  ],
};

function Direction({ value, children }: { value: "ltr" | "rtl"; children: ReactNode }) {
  useLayoutEffect(() => {
    document.documentElement.dir = value;
    return () => document.documentElement.removeAttribute("dir");
  }, [value]);
  return children;
}

export default preview;
