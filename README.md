# DEPT Component Library

DEPT's brand UI library, published privately to GitHub Packages. It is a **pnpm + Turborepo monorepo**: one framework-agnostic core (design tokens, compiled styles, variant recipes, prop contracts) and one thin package per framework. The consumer's framework is not friction — install the package for your framework and the DEPT look is identical across all of them.

## Packages

| Package | What it is | Status |
| --- | --- | --- |
| [`@dartilesm/core`](packages/core) | Design tokens, the compiled stylesheet, CVA variant recipes, prop-type contracts, `cn()`, story specs. Framework-agnostic. | Published |
| [`@dartilesm/react`](packages/react) | React components — shadcn/ui on [Base UI](https://base-ui.com) primitives, [lucide](https://lucide.dev) icons. | Published, has components |
| [`@dartilesm/vue`](packages/vue) | Vue package — scaffold; components to be built on Reka UI / shadcn-vue. | Published shell |
| [`@dartilesm/svelte`](packages/svelte) | Svelte package — scaffold; components to be built on Bits UI / shadcn-svelte. | Published shell |
| [`@dartilesm/storybook`](apps/storybook) | Component workbench (React renderer). Composition-ready for Vue/Svelte. | Private app |

Each framework package depends on `@dartilesm/core` and **re-exports its stylesheet**, so consumers install a single package and get one `styles.css`. Change a token or recipe in `@dartilesm/core` and it propagates to every framework's shipped CSS.

```
apps/storybook          # showcase (React now; Vue/Svelte compose in later)
packages/core           # @dartilesm/core   — tokens + compiled styles.css + recipes + contracts
packages/{react,vue,svelte}
```

## Consumer setup

### 1. Get a GitHub token (one-time per developer)

The packages are private to the `dept` org, so installing requires authentication:

1. GitHub → avatar → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)** → **Generate new token (classic)**. Use _classic_ — fine-grained tokens are still unreliable with the npm package registry.
2. Name it (e.g. `dept packages read`), pick an expiration, tick exactly one scope: **`read:packages`**.
3. **Generate token** and copy it immediately.
4. If a **Configure SSO** button appears next to the token, click it and **Authorize** the `dept` org, or installs fail with 401/403.

### 2. Configure the registry globally (one-time per developer)

Add to `~/.npmrc` (home directory, so the token never lands in a commit):

```
@dartilesm:registry=https://npm.pkg.github.com/
//npm.pkg.github.com/:_authToken=ghp_YOUR_TOKEN_HERE
```

### 3. Install the package for your framework

```bash
pnpm add @dartilesm/react     # or @dartilesm/vue, @dartilesm/svelte
```

`@dartilesm/core` comes transitively — you don't install it directly unless you want raw tokens (`@dartilesm/core/styles.css`, `@dartilesm/core/tokens.css`) outside of components.

### 4. Import the stylesheet once, then use components

```tsx
// app entry point (e.g. app/layout.tsx or main.tsx) — once,
// BEFORE your own globals.css so the app's definitions win cascade ties
import "@dartilesm/react/styles.css";

// anywhere
import { Button } from "@dartilesm/react";
import { MailIcon } from "lucide-react";

<Button variant="secondary" leftIcon={<MailIcon />} isLoading={saving}>
  Send
</Button>;
```

- **No Tailwind required** — the stylesheet ships precompiled, unprefixed, with no preflight. Apps that _do_ use Tailwind can still customize via `className`.
- **Dark mode:** components follow the host app's `.dark` class on `<html>` (the `next-themes` convention).
- **Module format:** ESM only, React 18/19. `"use client"` directives are preserved per module — safe to import from Next.js App Router server components.
- **CI:** `${{ secrets.GITHUB_TOKEN }}` works as the auth token once the package grants the consuming repo access (package settings → **Manage Actions access**), or use an org-level token secret.

## How propagation works

`@dartilesm/core` is the single source of truth for **tokens** (CSS custom properties) and **recipes** (the CVA variant→class maps). It compiles one `dist/styles.css`; the framework packages copy it verbatim. Because every DOM-bound Tailwind utility originates from a string literal in `@dartilesm/core`, that one compiled stylesheet is complete for all frameworks. Change `--primary` (or a variant's classes) in `packages/core/src/…` → rebuild → every framework's `styles.css` reflects it.

> **Adding stateful components later:** Base UI (React) emits `data-open`/`data-checked`, while Reka UI (Vue) and Bits UI (Svelte) emit `data-state="open|checked"`. Before the second stateful component lands in Vue/Svelte, add a `@custom-variant ui-open`/`ui-checked` compatibility layer in `packages/core/src/styles/globals.css` so recipe strings stay identical across frameworks. (Button is unaffected — it keys only on native/ARIA state.)

## Development

Uses **pnpm** (pinned via `packageManager`) + **Turborepo**.

```bash
nvm use            # Node 22
pnpm install
pnpm build         # turbo build — core first, then framework packages
pnpm typecheck
pnpm lint
pnpm build-storybook

# Storybook (imports the built packages, like a real consumer) — run its build in
# watch alongside the dev server so component edits show up:
pnpm --filter @dartilesm/react build:watch   # (in one terminal)
pnpm dev                                # Storybook on :6006 (@dartilesm/storybook)
```

Turbo orders builds via `dependsOn: ["^build"]`, so `@dartilesm/core` always builds before the packages that copy its stylesheet.

### Component structure (all packages)

Two layers, in two top-level dirs: **`src/primitives/<name>`** — the raw shadcn/primitive-based building block (the `shadcn add` target); **`src/components/<Name>`** — the public DEPT component (stable API: `isLoading`, icon slots, …). Primitives (and their wrappers) accept the full native HTML attribute surface, typed. **Stories live in `apps/storybook`**, not in the packages. See the [`building-components` skill](.agents/skills/building-components/SKILL.md) for the full workflow.

### Adding a React component

1. **Generate:** `pnpm --filter @dartilesm/react dlx shadcn@latest add <component>` — writes the raw component to `packages/react/src/primitives/` (`components.json` sets `aliases.ui: "@/primitives"`).
2. **Hoist the recipe:** move the generated `cva(...)` block into `packages/core/src/recipes/<name>.ts` (export it + its `VariantProps` type) and import it back into the primitive. This keeps the shipped stylesheet complete and lets Vue/Svelte reuse the exact classes. The `@/lib/utils` `cn` import keeps working (it re-exports from `@dartilesm/core/cn`).
3. **Wrap:** create the public component `packages/react/src/components/<PascalName>.tsx` (flat file), following `components/Button.tsx` — the wrapper is the stable API contract, and it accepts native HTML attrs via `ComponentProps<typeof Primitive>`.
4. **Contract & spec (optional but encouraged):** add the framework-agnostic prop slice to `packages/core/src/contracts/` and a story spec to `packages/core/src/story-specs/` so future Vue/Svelte components match by construction.
5. **Export** from `packages/react/src/index.ts`.
6. **Story:** add `apps/storybook/src/stories/<Name>.stories.tsx` importing `{ <Name> } from "@dartilesm/react"` (+ the core story-spec). Storybook consumes the built package, so run `pnpm --filter @dartilesm/react build:watch` alongside `storybook dev`.
7. **Checklist:** `"use client"` on interactive components; no bare `border`/`divide` without an explicit color (the lib ships no base styles); native HTML attrs accepted + typed; composition via Base UI's `render` prop; stories cover every variant (check the a11y panel).

### Local testing (yalc)

Because a consumer installs `@dartilesm/react` **and** its transitive `@dartilesm/core`, publish/add both (yalc does not rewrite `workspace:^`):

```bash
pnpm --filter @dartilesm/core  exec yalc publish --push
pnpm --filter @dartilesm/react exec yalc publish --push
# in the consuming repo:
yalc add @dartilesm/core @dartilesm/react && pnpm install && pnpm dev -- --force
```

## Publishing (Changesets)

Independent versioning via [Changesets](https://github.com/changesets/changesets), published to GitHub Packages by CI.

1. In a feature PR, run `pnpm changeset` and describe the change (pick the packages + bump levels). Commit the generated `.changeset/*.md`.
2. Merge to `main`. The [release workflow](.github/workflows/release.yml) runs `changesets/action`, which opens/updates a **"Version Packages"** PR that applies the bumps and changelogs. A core change cascades a bump to the framework packages that depend on it.
3. Merge the Version Packages PR → CI versions and **publishes** the changed packages to GitHub Packages (`workspace:^` is rewritten to a real range in each tarball). `@dartilesm/storybook` is private and never published.

## Architecture decisions

| Decision | Why |
| --- | --- |
| **Per-framework native stack** (Base UI / Reka UI / Bits UI) | Behavior primitives are framework-specific and can't be shared across React/Vue/Svelte. Sharing tokens + compiled CSS + recipes + contracts gives visual/API parity without a shared behavior runtime (Zag/Ark) or Web Components. |
| **`@dartilesm/core` owns all DOM-bound utilities** | The shipped `styles.css` is a closed set; a class absent at scan time renders unstyled. Keeping every utility as a literal in core (recipes + exported structural consts) makes one centrally-compiled stylesheet complete for every framework — no cross-package `@source` coupling. |
| **Framework packages copy core's `styles.css`** | Satisfies "install one package, get one stylesheet" and guarantees the sheet is _sourced_ from core rather than re-derived per framework. |
| **Precompiled, unprefixed CSS, no preflight** | Must work in non-Tailwind consumers → CSS ships precompiled. A library must not ship global resets; Storybook adds preflight to its canvas only. |
| **ESM-only, per-module output, preserved directives** | Modern targets (Next.js, Vite). `preserveModules` + `rollup-preserve-directives` keep `"use client"` boundaries intact for the App Router. |
| **Independent versioning (Changesets)** | Each package versions on its own; framework packages depend on a `@dartilesm/core` range. When a core change breaks a framework's public types, add an explicit major changeset for that framework. |
