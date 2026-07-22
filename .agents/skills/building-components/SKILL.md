---
name: building-components
description: Create or extend a component in the DEPT component library (@dept/react, @dept/vue, @dept/svelte) while keeping it consistent with @dept/core. Use when adding a new component, porting an existing one to another framework, or changing shared variants/tokens.
---

# 🧩 Building DEPT components

This is a per-framework-native monorepo: **`@dept/core` is the single source of truth** (design tokens, the compiled stylesheet, CVA variant recipes, prop-type contracts, `cn`). Each framework package (`@dept/react` on Base UI, `@dept/vue` on Reka UI, `@dept/svelte` on Bits UI) is a **thin wrapper** that consumes core and adds framework-idiomatic behavior. Follow this every time so all three frameworks stay visually and API-consistent.

## 🔑 Golden rules — read before writing any component

1. **Core owns everything shared.** Variant classes, tokens, `cn`, and the public prop shape live in `@dept/core`. A framework wrapper never re-defines them.
2. **The closed-set CSS invariant (most important).** The shipped `styles.css` is compiled **only** from `@dept/core` and then **copied verbatim** into each framework package (`scripts/copy-core-styles.mjs`) — framework packages do **not** recompile Tailwind. Therefore **every Tailwind utility that reaches the DOM in any framework MUST be a string literal inside `packages/core/src/recipes/*.ts`** — either in a `cva(...)` recipe or an exported const (e.g. `iconSlotClass = "contents"`, `spinnerClass = "animate-spin"`). ❗ **Never hand-write a Tailwind class in a `.tsx` / `.vue` / `.svelte` file.** It will render in Storybook (which recompiles from source) but be **silently missing** for real consumers.
3. **Two layers per component**, mirrored across frameworks:
   - `components/ui/<Name>` — the raw primitive: framework primitive + core recipe + `data-slot`.
   - `components/<Name>/<Name>` — the public wrapper: the stable API (`isLoading`, `leftIcon`, `rightIcon`, …).
4. **Shared DOM contract.** Root element gets `data-slot="<name>"`. Icon slots are `<span data-icon="inline-start|inline-end" class={iconSlotClass}>…`. These drive the recipe's `data-slot` / `has-data-[icon=…]` utilities identically in every framework — so all three produce the same markup hooks.
5. **Shared types in core.** `variant`/`size` + boolean flags live in `@dept/core/contracts` as `…BaseContract` plus **plain string unions** (`ButtonVariant`, `ButtonSize`). Use the plain unions in Vue — see the Vue note. Icon/children slots stay framework-native (`ReactNode` / Vue slots / Svelte `Snippet`).

## 🧭 Universal workflow (framework-agnostic first)

1. **Recipe** → `packages/core/src/recipes/<name>.ts`: `export const <name>Variants = cva("…all classes as literals…", { variants, defaultVariants })` and `export type <Name>VariantProps = VariantProps<typeof <name>Variants>`. Put any wrapper-structural utility here as an exported const. Re-export from `recipes/index.ts`.
2. **Contract** → `packages/core/src/contracts/<name>.ts`: plain unions (`<Name>Variant`, `<Name>Size`) + `interface <Name>BaseContract`. Keep the unions in lockstep with the recipe. Re-export from `contracts/index.ts`.
3. **(Optional) Story spec** → `packages/core/src/story-specs/<name>.ts`: data-only args matrix (icons as string keys).
4. **`ui/` primitive** in each framework (cheatsheets below).
5. **Public wrapper** in each framework.
6. **Export** from each package's `src/index.ts`.
7. **Verify** (bottom).

## ⚛️ React — `@dept/react` (Base UI)

- `ui/<Name>.tsx`: `"use client"`; import the primitive from `@base-ui/react/<x>`; `import { <name>Variants, type <Name>VariantProps } from "@dept/core/recipes"`; `import { cn } from "@/lib/utils"` (a shim re-exporting `@dept/core/cn`). Apply `data-slot="<name>"` + `className={cn(<name>Variants({ variant, size, className }))}`.
- `<Name>/<Name>.tsx`: `interface Props extends Omit<ComponentProps<typeof Base>, keyof <Name>BaseContract>, <Name>BaseContract { leftIcon?: React.ReactNode; rightIcon?: React.ReactNode }`; icons from `lucide-react`; icon spans use `iconSlotClass`/`spinnerClass` from `@dept/core/recipes`.
- **shadcn generation:** `pnpm --filter @dept/react dlx shadcn@latest add <c>` writes a `ui/` file with an **inline `cva`** → **hoist that cva into `@dept/core/src/recipes/`** and import it back; don't leave variants inline (rule 2).
- Build: vite lib (ESM, `preserveModules`, `rollup-preserve-directives`). Stories: co-located, **static `title` literal** (CSF indexer), args/argTypes from the core spec.

## 🟢 Vue — `@dept/vue` (Reka UI)

- `ui/<Name>.vue` `<script setup lang="ts">`: `import { Primitive } from "reka-ui"`; `import { <name>Variants } from "@dept/core/recipes"`; **`import type { <Name>Variant, <Name>Size } from "@dept/core/contracts"`** — use these PLAIN unions in `defineProps`, **not** the cva `…VariantProps` type (Vue's `defineProps<T>` macro resolver can't evaluate cva's mapped type across packages). `import { cn } from "@dept/core"`. Template: `<Primitive :as="props.as" :as-child="props.asChild" data-slot="<name>" :class="cn(<name>Variants({ variant: props.variant, size: props.size }), props.class)"><slot /></Primitive>`.
- `<Name>/<Name>.vue`: `defineProps<<Name>BaseContract & { class?: string }>()`; icons as **named slots** (`leftIcon`/`rightIcon`), guarded with `v-if="$slots.leftIcon"`; icons from `lucide-vue-next`.
- Use `:class` (not `className`); the passthrough prop is `props.class`.
- Build: vite + `@vitejs/plugin-vue` + `vite-plugin-dts` (**per-file dts, no `rollupTypes`** — api-extractor can't roll up `.vue` types). Typecheck: `vue-tsc --noEmit`.

## 🔶 Svelte — `@dept/svelte` (Bits UI, Svelte 5)

- `ui/<name>.svelte`: `<script lang="ts" module>` exports the props type (`WithElementRef<HTMLButtonAttributes> & WithElementRef<HTMLAnchorAttributes> & <Name>VariantProps`; `WithElementRef` from `bits-ui`; the cva `…VariantProps` type **is fine here** — Svelte checks with tsc). Instance `<script lang="ts">` uses runes: `let { class: className, variant = "default", ref = $bindable(null), children, ...restProps }: Props = $props()`. Native element (or a Bits UI primitive for stateful components) with `data-slot="<name>"` + `class={cn(<name>Variants({ variant, size }), className)}`; `{@render children?.()}`.
- `<Name>/<Name>.svelte`: props extend `<Name>BaseContract`; `leftIcon`/`rightIcon`/`children` are `Snippet`; render with `{@render x()}`; icons from `@lucide/svelte`; icon spans use `iconSlotClass`/`spinnerClass`.
- Use `class` (reserved → destructure as `class: className`).
- Build: **`svelte-package -i src -o dist`** (ships raw `.svelte` + `.svelte.d.ts`) — **not** vite. Requires `svelte.config.js` (`vitePreprocess`) and a `"svelte"` condition in the package's `exports`. Typecheck: `svelte-check`.

## ⚠️ Cross-framework state attributes (stateful components only)

Base UI emits `data-open`/`data-closed`/`data-checked`; Reka UI and Bits UI keep Radix's `data-state="open|checked"`. A recipe using `data-[open]:` silently won't match in Vue/Svelte. **Before the first stateful component (Dialog, Select, Checkbox, Tooltip, Accordion…) in Vue/Svelte**, add ONE compat layer in `packages/core/src/styles/globals.css` and use `ui-open:` / `ui-checked:` in recipes instead of the raw `data-*` variants:

```css
@custom-variant ui-open    (&[data-open], &[data-state="open"]);
@custom-variant ui-closed  (&[data-closed], &[data-state="closed"]);
@custom-variant ui-checked (&[data-checked], &[data-state="checked"], &[aria-checked="true"]);
```

For multi-part components (Dialog, Select), **stamp a canonical `data-slot="<part>"` in each framework wrapper** and key the recipe off that, not off the primitive library's internal attributes. Irreducible positioner/portal deltas can live in a small per-framework recipe override.

## ✅ Verify

```bash
pnpm turbo run build       # core → frameworks (svelte builds via svelte-package)
pnpm turbo run typecheck   # tsc (react/core) · vue-tsc (vue) · svelte-check (svelte)
pnpm run lint

# CSS must stay complete and identical across packages:
grep -q 'bg-primary' packages/core/dist/styles.css
diff -q packages/core/dist/styles.css packages/react/dist/styles.css   # repeat for vue, svelte
```

> ❗ If a class shows in Storybook but is missing for a consumer, you hand-wrote a utility outside core (rule 2). Move it into a core recipe or exported const and rebuild.

## 📎 Canonical examples (copy these when adding a component)

- **Core:** `packages/core/src/{recipes/button.ts, contracts/button.ts, story-specs/button.ts}`
- **React:** `packages/react/src/components/{ui/button.tsx, Button/Button.tsx, Button/Button.stories.tsx}`
- **Vue:** `packages/vue/src/components/{ui/Button.vue, Button/Button.vue}`
- **Svelte:** `packages/svelte/src/components/{ui/button.svelte, Button/Button.svelte}`
