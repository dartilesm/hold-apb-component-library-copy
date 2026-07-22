---
"@dept/core": minor
"@dept/react": minor
"@dept/vue": minor
"@dept/svelte": minor
---

Restructure into a pnpm + Turborepo monorepo. Introduce `@dept/core` (design tokens, compiled stylesheet, CVA variant recipes, prop-type contracts, story specs) as the framework-agnostic substrate. Rename `@dept/component-library` → `@dept/react` (now consuming core; styles re-exported via `@dept/react/styles.css`). Add `@dept/vue` (Reka UI) and `@dept/svelte` (Bits UI) with a reference `Button` mirroring React's, all styled from the shared core recipe.
