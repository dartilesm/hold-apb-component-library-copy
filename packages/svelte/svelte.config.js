import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

// Used by svelte-package (build) and svelte-check (typecheck). vitePreprocess
// strips <script lang="ts"> so the shipped .svelte files are plain JS.
export default {
  preprocess: vitePreprocess(),
};
