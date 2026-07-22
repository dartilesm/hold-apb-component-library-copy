import type { StorybookConfig } from "@storybook/react-vite";
import tailwindcss from "@tailwindcss/vite";

const config: StorybookConfig = {
  // Stories live in this app and import each component from its published package
  // (e.g. `@dept/react`), which resolves to the built dist — exactly like a real
  // consumer. In dev, run the package's build:watch alongside `storybook dev`.
  stories: [{ directory: "../src", files: "**/*.stories.@(ts|tsx)", titlePrefix: "" }],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],
  framework: { name: "@storybook/react-vite", options: {} },
  // Composition placeholder — empty today. Future Vue/Svelte showcases run as
  // their own (vue3-vite / svelte-vite) Storybooks and federate here via refs.
  refs: {},
  viteFinal: async (config) => {
    config.plugins = config.plugins || [];
    config.plugins.push(tailwindcss());
    return config;
  },
};

export default config;
