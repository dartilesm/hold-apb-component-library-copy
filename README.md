# @dept/component-library

DEPT's shared React component library. [shadcn/ui](https://ui.shadcn.com) components (base-nova style) on [Base UI](https://base-ui.com) primitives, styled with Tailwind CSS v4 and [lucide](https://lucide.dev) icons, wrapped behind a stable API and published privately to GitHub Packages.

The package ships its own precompiled stylesheet (standard Tailwind class names, standard shadcn tokens, no preflight) — consuming apps don't need Tailwind, and apps that have it can customize components via `className`.

## Local testing (yalc)

Test library changes in a consuming app without publishing a release. One-time setup: `pnpm add -g yalc`.

**1. In this repo** — build and push to the local yalc store:

```bash
pnpm yalc:publish   # runs the build, then `yalc publish --push`
pnpm yalc:watch     # same, but re-publishes automatically on every file change
```

(`--push` also updates any consuming project that already added the package via yalc.)

**2. In the consuming repo:**

```bash
yalc remove --all && pnpm install && yalc add @dept/component-library@0.1.0 && pnpm run dev -- --force
```

Notes:

- Replace `0.1.0` with the current `"version"` from this repo's [package.json](package.json).
- `pnpm run dev` is whatever starts that project — adjust if the consuming repo uses a different command (`pnpm start`, …).
- **Why `-- --force`:** everything after the `--` is passed through to the underlying dev command (Vite). `--force` makes Vite throw away its dependency cache (`node_modules/.vite`) and re-bundle. Without it, Vite sees an unchanged lockfile (yalc swaps the package's files behind pnpm's back) and keeps serving the _old_ cached copy of the library.
- The `pnpm install` in the middle is not optional — it's what installs the library's own dependencies (`@base-ui/react`, `lucide-react`, …). Skipping it fails the dev server with `Could not resolve "@base-ui/react/button"`.
- When you're done: `yalc remove --all && pnpm install`.
- The consuming repo's `.gitignore` needs `.yalc/` and `yalc.lock`.

## Consumer setup

### 1. Get a GitHub token (one-time per developer)

The package is private to the `dept` org, so installing it requires authentication:

1. GitHub → your avatar → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)** → **Generate new token (classic)**. Use _classic_ — fine-grained tokens are still unreliable with the npm package registry.
2. Name it (e.g. `dept packages read`), pick an expiration, and tick exactly one scope: **`read:packages`**.
3. **Generate token** and copy it immediately — it is shown only once.
4. Back in the token list, if a **Configure SSO** button appears next to the token: click it and **Authorize** the `dept` org. Without this step installs fail with 401/403 even though the token is valid.

### 2. Configure the registry globally (one-time per developer)

Add these two lines to `~/.npmrc` — the file in your **home directory**, not a project file, so the token can never end up in a commit:

```
@dept:registry=https://npm.pkg.github.com/
//npm.pkg.github.com/:_authToken=ghp_YOUR_TOKEN_HERE
```

Line 1 routes all `@dept/*` packages to GitHub Packages (everything else still comes from the regular npm registry). Line 2 authenticates against that host. Because it's global, it works for every project on your machine.

> npm/pnpm allows only **one** `_authToken` line per host. If your `~/.npmrc` already has one for `npm.pkg.github.com` (packages from another org), keep a single token line and make sure that token is SSO-authorized for every org you pull from.

### 3. Install

```bash
pnpm add @dept/component-library
```

### 4. Import the stylesheet once, then use components

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

**Dark mode:** components follow the host app's `.dark` class on `<html>` (the `next-themes` convention).

**Module format:** ESM only, React 18/19. `"use client"` directives are preserved per module — safe to import from Next.js App Router server components.

**CI:** in GitHub Actions, `${{ secrets.GITHUB_TOKEN }}` works as the auth token once this package grants the consuming repo access (package settings → **Manage Actions access**), or use an org-level token secret.

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

> **⚠️ Work in progress** — this flow is not finalized yet; expect it to change.

1. **Generate:** `pnpm dlx shadcn@latest add <component>` — writes the raw base-nova component to `src/components/ui/`.
2. **Wrap:** create `src/components/<PascalName>/` with the public component, stories, and an `index.ts`, following `src/components/Button/` as the template. The wrapper is our API contract — keep it stable even if the underlying shadcn component changes.
3. **Export** it from `src/index.ts`.
4. **Review checklist:**
   - `"use client"` at the top of interactive components (preserved into dist).
   - No bare `border`/`divide` classes without an explicit color — the library ships **no preflight and no base styles**, so components must be fully self-contained (this is why Storybook deliberately adds nothing beyond preflight to the canvas).
   - Composition uses Base UI's `render` prop, not Radix's `asChild`.
   - Stories cover every variant; check the a11y addon panel.

## Publishing

Direct pushes to `main` are blocked, so releases are done entirely on github.com:

1. **Bump `"version"`** in [package.json](package.json) through a normal PR and merge it — that field is the single source of truth for what gets published.
2. On the repo page: **Releases** → **Draft a new release**.
3. **Choose a tag** → type the version exactly as in package.json (e.g. `0.1.1` — no `v` prefix, matching existing tags) → **Create new tag on publish**, target `main`.
4. Set the release title (the version) and describe the changes.
5. Click **Publish release** — not _Save draft_; draft releases don't trigger the workflow.

Publishing the release triggers the [publish workflow](.github/workflows/publish.yml), which type-checks, builds, and publishes whatever version package.json declares to GitHub Packages. A version can only be published once — if the workflow fails with "version already exists", the bump in step 1 was missed.

## Architecture decisions

| Decision                                                   | Why                                                                                                                                                                                                                                                                                                                                                       |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Base UI primitives** (`@base-ui/react`)                  | shadcn's default since July 2026; actively maintained by the ex-Radix team at MUI; more components than Radix. Invisible to consumers — the wrapper layer is the API.                                                                                                                                                                                     |
| **Precompiled, unprefixed CSS** (no `@source`, no prefix)  | Must work in future non-Tailwind consumers → CSS ships precompiled. Prefixing was built, then removed (2026-07): we rely on the org-wide shared globals.css keeping all repos' definitions identical, in exchange for zero authoring friction and native `className` support. Revisit isolation (prefix / selector scoping) only if drift actually bites. |
| **No preflight in dist/styles.css**                        | A library must not ship global resets into host apps. Storybook adds preflight to its canvas only.                                                                                                                                                                                                                                                       |
| **ESM-only, per-module output with preserved directives**  | All target repos are modern (Next.js 16, Vite). `preserveModules` + `rollup-preserve-directives` keeps `"use client"` boundaries intact for App Router.                                                                                                                                                                                                  |
| **Runtime deps externalized, versions owned by the lib**   | react/react-dom are peers (must be singletons). Base UI, lucide, CVA, clsx, tailwind-merge are regular dependencies: consumer version bumps can't affect the lib; package managers dedupe when ranges are compatible.                                                                                                                                     |
| **Library build isolated in `vite.lib.config.ts`**         | Storybook's Vite builder auto-merges a root `vite.config.ts`; externals/preserveModules would break its bundle. Never rename that file.                                                                                                                                                                                                                    |
