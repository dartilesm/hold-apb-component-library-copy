---
name: building-components
description: Create or extend a component in the DEPT component library (@dept/react, @dept/vue, @dept/svelte) while keeping it consistent with @dept/core. Use when adding a new component, porting an existing one to another framework, or changing shared variants/tokens.
---

# 🧩 Building DEPT components

This is a per-framework-native monorepo: **`@dept/core` is the single source of truth** (design tokens, the compiled stylesheet, CVA variant recipes, prop-type contracts, `cn`). Each framework package (`@dept/react` on Base UI, `@dept/vue` on Reka UI, `@dept/svelte` on Bits UI) is a **thin wrapper** that consumes core and adds framework-idiomatic behavior. Follow this every time so all three frameworks stay visually and API-consistent.

## 🔑 Golden rules — read before writing any component

1. **Core owns everything shared.** Variant classes, tokens, `cn`, and the public prop shape live in `@dept/core`. A framework wrapper never re-defines them.
2. **The closed-set CSS invariant (most important).** The shipped `styles.css` is compiled **only** from `@dept/core` and then **copied verbatim** into each framework package (`scripts/copy-core-styles.mjs`) — framework packages do **not** recompile Tailwind. Therefore **every Tailwind utility that reaches the DOM in any framework MUST be a string literal inside `packages/core/src/recipes/*.ts`** — either in a `cva(...)` recipe or an exported const (e.g. `iconSlotClass = "contents"`, `spinnerClass = "animate-spin"`). ❗ **Never hand-write a Tailwind class in a `.tsx` / `.vue` / `.svelte` file.** It renders in Storybook but is silently missing for real consumers.
3. **Two layers per component**, in two top-level dirs (mirrored across frameworks):
   - `src/primitives/<name>` — the raw shadcn/primitive-based building block (framework primitive + core recipe + `data-slot`). This is the `shadcn add` target.
   - `src/components/<Name>` — the public DEPT component (the stable API: `isLoading`, icon slots, …), a flat file.
4. **Accept the full native HTML surface, typed.** A primitive (and its public wrapper) must accept every valid attribute of its host element (`id`, `type`, `disabled`, `aria-*`, `data-*`, event handlers), not just the custom props — typed as `HTML<El>Attributes & <custom>`, forwarded to the element. See per-framework notes.
5. **Shared DOM contract.** Root element gets `data-slot="<name>"`. Icon slots are `<span data-icon="inline-start|inline-end" class={iconSlotClass}>…`. These drive the recipe's `data-slot` / `has-data-[icon=…]` utilities identically in every framework.
6. **Shared types in core.** `variant`/`size` + boolean flags live in `@dept/core/contracts` as `…BaseContract` plus **plain string unions** (`ButtonVariant`, `ButtonSize`). Icon/children slots stay framework-native (`ReactNode` / Vue slots / Svelte `Snippet`).
7. **Stories live in `apps/storybook`**, importing each component from its **package** (`import { Button } from "@dept/react"`) — never deep relative paths. Storybook resolves that to the built dist (real-consumer fidelity), so run the package's `build:watch` alongside `storybook dev`.

## 🧭 Universal workflow (framework-agnostic first)

1. **Recipe** → `packages/core/src/recipes/<name>.ts`: `export const <name>Variants = cva("…all classes as literals…", {...})` + `export type <Name>VariantProps = VariantProps<typeof <name>Variants>`. Add wrapper-structural utilities as exported consts. Re-export from `recipes/index.ts`.
2. **Contract** → `packages/core/src/contracts/<name>.ts`: plain unions (`<Name>Variant`, `<Name>Size`) + `interface <Name>BaseContract`. Keep the unions in lockstep with the recipe. Re-export from `contracts/index.ts`.
3. **(Optional) Story spec** → `packages/core/src/story-specs/<name>.ts` (data-only args matrix; icons as string keys).
4. **`primitives/` primitive** in each framework (cheatsheets below).
5. **Public wrapper** in each framework (`components/<Name>`).
6. **Export** from each package's `src/index.ts`.
7. **Story** in `apps/storybook/src/stories/` (imports the package + core story-spec). **Verify** (bottom).

## ⚛️ React — `@dept/react` (Base UI)

- `primitives/<name>.tsx`: `"use client"`; import the primitive from `@base-ui/react/<x>`; `import { <name>Variants, type <Name>VariantProps } from "@dept/core/recipes"`; `import { cn } from "@/lib/utils"` (shim → `@dept/core/cn`). Apply `data-slot="<name>"` + `className={cn(<name>Variants({ variant, size, className }))}`. **Native attrs:** Base UI's `Props` already extends `ComponentPropsWithRef<'button'>`, so `id`/`type`/`aria-*`/`disabled` are accepted for free.
- `components/<Name>.tsx`: `interface Props extends Omit<ComponentProps<typeof Base>, keyof <Name>BaseContract>, <Name>BaseContract { leftIcon?: React.ReactNode; rightIcon?: React.ReactNode }`; icons from `lucide-react`; icon spans use `iconSlotClass`/`spinnerClass`.
- **shadcn generation:** `pnpm --filter @dept/react dlx shadcn@latest add <c>` → writes a raw primitive to `src/primitives/` (because `components.json` has `aliases.ui: "@/primitives"`). It ships an **inline `cva`** → **hoist it into `@dept/core/src/recipes/`** and import it back (rule 2).
- Build: vite lib (ESM, `preserveModules`, `rollup-preserve-directives`). Typecheck: `tsc --noEmit`.

## 🟢 Vue — `@dept/vue` (Reka UI)

- `primitives/<Name>.vue` `<script setup lang="ts">`: `import { Primitive, type PrimitiveProps } from "reka-ui"`; `import type { ButtonHTMLAttributes } from "vue"`; `import { <name>Variants } from "@dept/core/recipes"`; **`import type { <Name>Variant, <Name>Size } from "@dept/core/contracts"`** (PLAIN unions — Vue's `defineProps` macro can't resolve cva's mapped type). **Native attrs (typed):** `defineProps<PrimitiveProps & /* @vue-ignore */ <El>HTMLAttributes & { variant?; size?; class? }>()`. The `/* @vue-ignore */` keeps the HTML attrs **type-only** (typed for consumers) so they aren't runtime-declared props → they fall through Reka's `Primitive` ($attrs) to the element automatically. Template: `<Primitive :as :as-child data-slot :class="cn(<name>Variants({...}), props.class)"><slot/></Primitive>`.
- `components/<Name>.vue`: `defineProps<<Name>BaseContract & /* @vue-ignore */ <El>HTMLAttributes & { class? }>()`; icons as **named slots** guarded with `v-if="$slots.leftIcon"`; icons from `lucide-vue-next`.
- Use `:class` (not `className`). Build: vite + `@vitejs/plugin-vue` + `vite-plugin-dts` (**per-file dts, no `rollupTypes`**). Typecheck: `vue-tsc --noEmit`.

## 🔶 Svelte — `@dept/svelte` (Bits UI, Svelte 5)

- `primitives/<name>.svelte`: `<script lang="ts" module>` exports the props type — **`WithElementRef<HTMLButtonAttributes> & WithElementRef<HTMLAnchorAttributes> & <Name>VariantProps`** (`WithElementRef` from `bits-ui`; native attrs from `svelte/elements`; the cva `…VariantProps` type is fine here — Svelte checks with tsc). Instance `<script lang="ts">` uses runes: `let { class: className, variant = "default", ref = $bindable(null), children, ...restProps }: Props = $props()`. Native element (or a Bits UI primitive for stateful components) with `data-slot="<name>"` + `class={cn(<name>Variants({...}), className)}`; `{...restProps}` forwards native attrs; `{@render children?.()}`.
- `components/<Name>.svelte`: props type = **`WithElementRef<HTMLButtonAttributes & HTMLAnchorAttributes> & <Name>BaseContract & { children: Snippet; leftIcon?: Snippet; rightIcon?: Snippet }`** (so `...restProps` is typed and forwards); icons from `@lucide/svelte`; icon spans use `iconSlotClass`/`spinnerClass`.
- Use `class` (reserved → destructure as `class: className`). Build: **`svelte-package -i src -o dist`** (ships raw `.svelte` + `.svelte.d.ts`) — needs `svelte.config.js` (`vitePreprocess`) + a `"svelte"` condition in `exports`. Typecheck: `svelte-check`.

> When Vue/Svelte adopt their shadcn CLIs (`shadcn-vue` / `shadcn-svelte init`), set their `components.json` `aliases.ui` to `@/primitives` too, so generated primitives land in `src/primitives/`.

## ⚠️ Cross-framework state attributes (stateful components only)

Base UI emits `data-open`/`data-closed`/`data-checked`; Reka UI and Bits UI keep Radix's `data-state="open|checked"`. A recipe using `data-[open]:` silently won't match in Vue/Svelte. **Before the first stateful component (Dialog, Select, Checkbox, Tooltip…) in Vue/Svelte**, add ONE compat layer in `packages/core/src/styles/globals.css` and use `ui-open:` / `ui-checked:` in recipes:

```css
@custom-variant ui-open    (&[data-open], &[data-state="open"]);
@custom-variant ui-checked (&[data-checked], &[data-state="checked"], &[aria-checked="true"]);
```

For multi-part components, **stamp a canonical `data-slot="<part>"` in each framework wrapper** and key the recipe off that (not the primitive library's internal attributes). Irreducible positioner/portal deltas can live in a small per-framework recipe override.

## ✅ Verify

```bash
pnpm turbo run build       # core → frameworks (svelte builds via svelte-package)
pnpm turbo run typecheck   # tsc (react/core) · vue-tsc (vue) · svelte-check (svelte)
pnpm run lint

# CSS must stay complete and identical across packages:
grep -q 'bg-primary' packages/core/dist/styles.css
diff -q packages/core/dist/styles.css packages/react/dist/styles.css   # repeat for vue, svelte

# Storybook (consumes built dist — run the package build first / in watch):
pnpm --filter @dept/react build && pnpm --filter @dept/storybook build-storybook
# dev:  pnpm --filter @dept/react build:watch   +   pnpm --filter @dept/storybook dev
```

> ❗ If a class shows in Storybook but is missing for a consumer, you hand-wrote a utility outside core (rule 2). Move it into a core recipe or exported const and rebuild.

## 📎 Canonical examples (copy these when adding a component)

- **Core:** `packages/core/src/{recipes/button.ts, contracts/button.ts, story-specs/button.ts}`
- **React:** `packages/react/src/{primitives/button.tsx, components/Button.tsx}`
- **Vue:** `packages/vue/src/{primitives/Button.vue, components/Button.vue}`
- **Svelte:** `packages/svelte/src/{primitives/button.svelte, components/Button.svelte}`
- **Story:** `apps/storybook/src/stories/Button.stories.tsx`
