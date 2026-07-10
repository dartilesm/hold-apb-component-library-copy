/*
 * Library build config — used by `npm run build` ONLY.
 *
 * Kept separate from Storybook on purpose: Storybook's Vite builder auto-merges
 * a root `vite.config.ts`, and the settings below (externals, preserveModules)
 * would break its bundle. Do not rename this file to vite.config.ts.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import dts from "vite-plugin-dts";
import preserveDirectives from "rollup-preserve-directives";

const pkg = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf8")
);

// Externalize every runtime dependency (and subpath imports like
// @base-ui/react/button) — the lib owns the version ranges via package.json;
// nothing gets bundled except our own source.
const external = [
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.peerDependencies ?? {}),
].map((dep) => new RegExp(`^${dep}(/|$)`));

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    dts({
      tsconfigPath: "./tsconfig.json",
      rollupTypes: true,
      insertTypesEntry: true,
    }),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      formats: ["es"],
    },
    sourcemap: true,
    cssCodeSplit: false,
    rollupOptions: {
      external,
      // Keeps "use client" directives on a per-module basis — required for
      // Next.js App Router consumers.
      plugins: [preserveDirectives()],
      output: {
        preserveModules: true,
        preserveModulesRoot: "src",
        entryFileNames: "[name].js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.names?.some((n) => n.endsWith(".css"))) return "styles.css";
          return "[name][extname]";
        },
      },
    },
  },
});
