import type { StorybookConfig } from "@storybook/react-vite";
import tailwindcss from "@tailwindcss/vite";

// The playground. `@storybook/react-vite`, not the Next.js framework: everything
// outside `src/next/` is plain React (ARCHITECTURE.md section 3).
//
// The app compiles CSS with the `@tailwindcss/turbopack` loader; Vite cannot see
// that loader, so Storybook uses `@tailwindcss/vite`, pinned to the same Tailwind
// version in package.json. Keep the two versions in step.
const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-a11y"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  core: {
    disableTelemetry: true,
    disableWhatsNewNotifications: true,
  },
  viteFinal: (viteConfig) => ({
    ...viteConfig,
    plugins: [...(viteConfig.plugins ?? []), tailwindcss()],
  }),
};

export default config;
