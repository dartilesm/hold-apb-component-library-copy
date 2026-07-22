/*
 * Library build config for @dartilesm/vue — compiles the Vue SFCs to ESM JS +
 * per-file type declarations (vite-plugin-dts uses vue-tsc for .vue types).
 * The shipped stylesheet is copied from @dartilesm/core (scripts/copy-core-styles.mjs,
 * run after this build); nothing here touches CSS.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import dts from "vite-plugin-dts";

const pkg = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf8")
);

// Externalize every runtime dependency (incl. subpaths like @dartilesm/core/recipes
// and reka-ui) — nothing gets bundled except our own source.
const external = [
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.peerDependencies ?? {}),
].map((dep) => new RegExp(`^${dep}(/|$)`));

export default defineConfig({
  plugins: [
    vue(),
    // Per-file .d.ts (NOT rolled up) — api-extractor can't roll up .vue types.
    dts({ tsconfigPath: "./tsconfig.json", entryRoot: "src" }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      formats: ["es"],
    },
    sourcemap: true,
    rollupOptions: {
      external,
      output: {
        preserveModules: true,
        preserveModulesRoot: "src",
        entryFileNames: "[name].js",
      },
    },
  },
});
