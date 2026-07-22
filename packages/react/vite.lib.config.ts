/*
 * Library build config for @dept/react — builds the React components + type
 * declarations only. The shipped stylesheet is NOT produced here: it is copied
 * verbatim from @dept/core's compiled dist/styles.css by scripts/copy-core-styles.mjs
 * (run after this build). Keep this file named vite.lib.config.ts and ensure no
 * root/package vite.config.ts exists that a tool might auto-merge.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import preserveDirectives from "rollup-preserve-directives";

const pkg = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf8")
);

// Externalize every runtime dependency (incl. subpaths like @base-ui/react/button
// and @dept/core/recipes) — nothing gets bundled except our own source.
const external = [
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.peerDependencies ?? {}),
].map((dep) => new RegExp(`^${dep}(/|$)`));

export default defineConfig({
  plugins: [
    react(),
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
    rollupOptions: {
      external,
      // Keeps "use client" directives per module — required for Next.js App Router.
      plugins: [preserveDirectives()],
      output: {
        preserveModules: true,
        preserveModulesRoot: "src",
        entryFileNames: "[name].js",
      },
    },
  },
});
