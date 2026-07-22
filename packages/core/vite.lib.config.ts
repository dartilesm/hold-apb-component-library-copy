/*
 * Library build config for @dartilesm/core — builds the framework-agnostic JS + type
 * declarations only. The shipped stylesheet (dist/styles.css) is built separately
 * by the Tailwind CLI (see `build:css` in package.json); nothing here touches CSS.
 *
 * Each published subpath (., ./cn, ./recipes, ./contracts) is an explicit lib
 * entry so its file is always emitted — a single entry + preserveModules drops
 * re-export-only barrels like recipes/index.ts.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

const pkg = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf8")
);

// Externalize every runtime dependency — nothing gets bundled except our own source.
const external = [
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.peerDependencies ?? {}),
].map((dep) => new RegExp(`^${dep}(/|$)`));

export default defineConfig({
  plugins: [
    dts({
      tsconfigPath: "./tsconfig.json",
      // Per-module declarations (NOT rolled up) so each subpath export gets its
      // own .d.ts mirroring the source layout.
      entryRoot: "src",
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, "src/index.ts"),
        cn: resolve(__dirname, "src/cn.ts"),
        "recipes/index": resolve(__dirname, "src/recipes/index.ts"),
        "contracts/index": resolve(__dirname, "src/contracts/index.ts"),
      },
      formats: ["es"],
    },
    sourcemap: true,
    rollupOptions: {
      external,
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
      },
    },
  },
});
