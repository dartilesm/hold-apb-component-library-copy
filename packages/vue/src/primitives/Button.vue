<script setup lang="ts">
// Raw primitive layer — mirrors @dept/react's primitives/button.tsx.
// Polymorphic via Reka UI's Primitive (as / as-child), styled entirely from
// @dept/core's shared recipe. Do NOT hand-write Tailwind utilities here — they
// must live in @dept/core/recipes so the shipped stylesheet stays complete.
import { Primitive, type PrimitiveProps } from "reka-ui";
import type { ButtonHTMLAttributes } from "vue";
import { buttonVariants } from "@dept/core/recipes";
import type { ButtonVariant, ButtonSize } from "@dept/core/contracts";
import { cn } from "@dept/core";

// Accepts every native <button> attribute (typed) + Reka's as/as-child + our
// variant props. `/* @vue-ignore */` keeps ButtonHTMLAttributes TYPE-ONLY so
// those attrs aren't runtime-declared props — they fall through Reka's Primitive
// ($attrs) onto the element automatically. Plain ButtonVariant/ButtonSize unions
// are used (not cva's ButtonVariantProps) because Vue's defineProps macro can't
// resolve the cva-derived type across the package boundary.
const props = withDefaults(
  defineProps<
    PrimitiveProps &
      /* @vue-ignore */ ButtonHTMLAttributes & {
        variant?: ButtonVariant;
        size?: ButtonSize;
        /** Extra classes merged (and Tailwind-deduped) onto the button. */
        class?: string;
      }
  >(),
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
