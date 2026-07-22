import { resolve } from "node:path";
import type { StorybookConfig } from "@storybook/react-vite";
import tailwindcss from "@tailwindcss/vite";

const config: StorybookConfig = {
  // Stories stay co-located in the framework packages; Storybook compiles their
  // SOURCE (instant HMR), not the built dist.
  stories: [
    {
      directory: "../../../packages/react/src",
      files: "**/*.stories.@(ts|tsx)",
      titlePrefix: "",
    },
  ],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  // Composition placeholder — empty today. When @dept/vue and @dept/svelte get
  // real components, each gets its own Storybook (vue3-vite / svelte-vite) and is
  // federated here via refs (one instance = one renderer, no mixed canvas).
  refs: {},
  viteFinal: async (config) => {
    config.plugins = config.plugins || [];
    config.plugins.push(tailwindcss());
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      // Resolves the `@/…` imports inside @dept/react's component source.
      "@": resolve(import.meta.dirname, "../../../packages/react/src"),
    };
    return config;
  },
};

export default config;
