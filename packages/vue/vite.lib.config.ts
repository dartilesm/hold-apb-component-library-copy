/*
 * Library build config for @dept/vue (scaffold). Builds the TS re-export shell +
 * types; the stylesheet is copied from @dept/core. When real Vue components land,
 * add @vitejs/plugin-vue here and author components on Reka UI / shadcn-vue.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

const pkg = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf8")
);

const external = [
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.peerDependencies ?? {}),
].map((dep) => new RegExp(`^${dep}(/|$)`));

export default defineConfig({
  plugins: [
    dts({
      tsconfigPath: "./tsconfig.json",
      rollupTypes: true,
      insertTypesEntry: true,
    }),
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
