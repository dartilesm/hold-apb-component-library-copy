<script setup lang="ts">
// Raw primitive layer — mirrors @dept/react's components/ui/button.tsx.
// Polymorphic via Reka UI's Primitive (as / as-child), styled entirely from
// @dept/core's shared recipe. Do NOT hand-write Tailwind utilities here — they
// must live in @dept/core/recipes so the shipped stylesheet stays complete.
import { Primitive } from "reka-ui";
import { buttonVariants } from "@dept/core/recipes";
import type { ButtonVariant, ButtonSize } from "@dept/core/contracts";
import { cn } from "@dept/core";

// Plain union types (not cva's ButtonVariantProps) — Vue's defineProps macro
// can't resolve the cva-derived type across the package boundary.
const props = withDefaults(
  defineProps<{
    variant?: ButtonVariant;
    size?: ButtonSize;
    /** Extra classes merged (and Tailwind-deduped) onto the button. */
    class?: string;
    /** Element/component to render (Reka `as`). */
    as?: string;
    /** Merge props onto the default slot's child instead of rendering an element. */
    asChild?: boolean;
  }>(),
  { variant: "default", size: "default", as: "button" }
);
</script>

<template>
  <Primitive
    :as="props.as"
    :as-child="props.asChild"
    data-slot="button"
    :class="cn(buttonVariants({ variant: props.variant, size: props.size }), props.class)"
  >
    <slot />
  </Primitive>
</template>
