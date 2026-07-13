# @dept/component-library

DEPT's shared React component library. [shadcn/ui](https://ui.shadcn.com) components (base-nova style) on [Base UI](https://base-ui.com) primitives, styled with Tailwind CSS v4 and [lucide](https://lucide.dev) icons, wrapped behind a stable API and published privately to GitHub Packages.

**Styling model: self-contained CSS, shared vocabulary.** The package ships its own precompiled stylesheet using standard (unprefixed) Tailwind class names and the standard shadcn token names — so consuming apps don't need Tailwind, and apps that have it can pass their own classes via `className`. This deliberately relies on all DEPT frontends sharing the same org `globals.css` (identical tokens, Tailwind v4): duplicate class definitions are then identical and collisions harmless. See "Styling model" below for the trade-off we accepted.

## Consumer setup

### 1. Configure the registry

Create or update `.npmrc` in the consuming repo:

```
@dept:registry=https://npm.pkg.github.com/
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

Locally, set `NODE_AUTH_TOKEN` to a GitHub personal access token with `read:packages`. In GitHub Actions, `${{ secrets.GITHUB_TOKEN }}` works once this package grants the consuming repo access (package settings → Manage Actions access), or use an org-level token.

### 2. Install

```bash
pnpm add @dept/component-library   # or npm/yarn — any client works against the registry
```

### 3. Import the stylesheet once, then use components

```tsx
// app entry point (e.g. app/layout.tsx or main.tsx) — once,
// BEFORE your own globals.css so the app's definitions win cascade ties
import "@dept/component-library/styles.css";

// anywhere
import { Button } from "@dept/component-library";
import { MailIcon } from "lucide-react";

<Button variant="secondary" leftIcon={<MailIcon />} isLoading={saving}>
  Send
</Button>;
```

That's the entire integration. No Tailwind config, no token setup, no `@source` lines.

**Dark mode:** components follow the host app's `.dark` class on `<html>` (the `next-themes` convention) with the library's own dark palette.

**Module format:** ESM only, React 18/19. `"use client"` directives are preserved per module — safe to import from Next.js App Router server components.

## Development

This repo uses **pnpm** (pinned via `packageManager`; `corepack enable` once if you don't have pnpm 10).

```bash
nvm use            # Node 22
pnpm install
pnpm dev           # Storybook on :6006 — the component workbench
pnpm build         # library build → dist/
pnpm typecheck
pnpm lint
```

### Adding a component

1. **Generate:** `pnpm dlx shadcn@latest add <component>` — writes the raw base-nova component to `src/components/ui/`.
2. **Wrap:** create `src/components/<PascalName>/` with the public component, stories, and an `index.ts`, following `src/components/Button/` as the template. The wrapper is our API contract — keep it stable even if the underlying shadcn component changes.
3. **Export** it from `src/index.ts`.
4. **Review checklist:**
   - `"use client"` at the top of interactive components (preserved into dist).
   - No bare `border`/`divide` classes without an explicit color — the library ships **no preflight and no base styles**, so components must be fully self-contained (this is why Storybook deliberately adds nothing beyond preflight to the canvas).
   - Composition uses Base UI's `render` prop, not Radix's `asChild`.
   - Stories cover every variant; check the a11y addon panel.

### Styling model

- The package ships `dist/styles.css`: standard Tailwind class names, standard shadcn tokens (`--primary`, `--radius`, …), **no preflight, no base styles**. Consumers import it once, before their own globals.
- **The accepted trade-off:** because class names are unprefixed, the library's stylesheet and a Tailwind consumer's stylesheet define the same class names. This is harmless *as long as both sides use the same org tokens and Tailwind v4* — the duplicate definitions are identical, so it doesn't matter which wins. If a consumer's tokens/config drift, whichever stylesheet loads later restyles both sides (hence the import-order convention: library first, app last, so the app wins). We chose to rely on the org's shared-globals.css process instead of technical isolation (prefixing/scoping); if this ever bites, those options are documented in git history (`scripts/prefix-tw-classes.mjs` before its removal) and can be reinstated — including as a build-time transform.
- `className` passthrough works natively: tailwind-merge resolves conflicts (consumer `px-8` beats a component's built-in padding), and in non-Tailwind consumers any of their own CSS classes can be passed.
- Tokens in [src/styles/globals.css](src/styles/globals.css) use standard shadcn names so the org token block can be pasted in wholesale. Only the file's first imports differ (no preflight) — see the comment at the top of the file.
- Dynamic class composition (`"px-" + size`) is forbidden — class strings must be statically analyzable or their CSS is never generated. CVA variant tables are the pattern.

### Testing against a consuming app locally

```bash
pnpm add -g yalc             # one-time
pnpm yalc:publish            # build + push to the local yalc store
pnpm yalc:watch              # rebuild + push on every change

# in the consuming repo:
yalc add @dept/component-library && pnpm install
# when done:
yalc remove @dept/component-library && pnpm install
```

**The `pnpm install` after `yalc add` is not optional.** yalc only copies files and edits package.json — it's the install that fetches the library's own dependencies (`@base-ui/react`, `lucide-react`, …) and links them in pnpm's store. Skipping it fails the consumer's dev server with `Could not resolve "@base-ui/react/button"`.

Troubleshooting:

- `Could not resolve "@base-ui/react/..."` → run `pnpm install` in the consumer, restart its dev server (stale Vite cache: `rm -rf node_modules/.vite`).
- A yalc push that **changes the library's dependencies** needs another `pnpm install` in the consumer; content-only pushes apply immediately.
- Consumers without a `packageManager` field can end up on an ancient corepack fallback pnpm that silently no-ops — pin `"packageManager": "pnpm@10.7.0"` there too.

(Consuming repo's `.gitignore` needs `.yalc/` and `yalc.lock`.)

## Publishing

1. `pnpm version patch|minor|major`
2. `git push && git push --tags`
3. Create a GitHub Release from the tag → the [publish workflow](.github/workflows/publish.yml) type-checks, builds, and publishes to GitHub Packages.

## Architecture decisions

| Decision                                                               | Why                                                                                                                                                                                                                                                                    |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Base UI primitives** (`@base-ui/react`)                              | shadcn's default since July 2026; actively maintained by the ex-Radix team at MUI; more components than Radix. Invisible to consumers — the wrapper layer is the API.                                                                                                  |
| **Precompiled, unprefixed CSS** (no `@source`, no prefix)              | Must work in future non-Tailwind consumers → CSS ships precompiled. Prefixing was built, then removed (2026-07): we rely on the org-wide shared globals.css keeping all repos' definitions identical, in exchange for zero authoring friction and native `className` support. Revisit isolation (prefix / selector scoping) only if drift actually bites. |
| **No preflight in dist/styles.css**                                    | A library must not ship global resets into host apps. Storybook adds preflight to its canvas only.                                                                                                                                                                     |
| **ESM-only, per-module output with preserved directives**              | All target repos are modern (Next.js 16, Vite). `preserveModules` + `rollup-preserve-directives` keeps `"use client"` boundaries intact for App Router.                                                                                                                |
| **Runtime deps externalized, versions owned by the lib**               | react/react-dom are peers (must be singletons). Base UI, lucide, CVA, clsx, tailwind-merge are regular dependencies: consumer version bumps can't affect the lib; package managers dedupe when ranges are compatible.                                                  |
| **Library build isolated in `vite.lib.config.ts`**                     | Storybook's Vite builder auto-merges a root `vite.config.ts`; externals/preserveModules would break its bundle. Never rename that file.                                                                                                                                |

### Theming

The library's tokens use the standard shadcn names, so a consumer app's own token definitions (loaded after the library's stylesheet) restyle library components to match the app — with identical org globals this is a no-op; with deliberate overrides it's the theming mechanism. Storybook shows the library's default tokens.
