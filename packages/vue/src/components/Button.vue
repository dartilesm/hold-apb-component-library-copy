<script setup lang="ts">
// Public Button — the stable API. Mirrors @dept/react's components/Button/Button.tsx:
// adds isLoading + leftIcon/rightIcon (here as named slots, the Vue idiom) on top of
// the ui/ primitive. Shared prop contract + icon-slot classes come from @dept/core.
import { LoaderCircle } from "lucide-vue-next";
import { iconSlotClass, spinnerClass } from "@dept/core/recipes";
import type { ButtonBaseContract } from "@dept/core/contracts";
import UiButton from "../ui/Button.vue";

const props = withDefaults(
  defineProps<ButtonBaseContract & { class?: string }>(),
  { variant: "default", size: "default", isLoading: false }
);
</script>

<template>
  <UiButton
    :variant="props.variant"
    :size="props.size"
    :class="props.class"
    :disabled="props.disabled || props.isLoading || undefined"
    :aria-busy="props.isLoading || undefined"
    :data-loading="props.isLoading || undefined"
  >
    <span v-if="props.isLoading" data-icon="inline-start" :class="iconSlotClass">
      <LoaderCircle :class="spinnerClass" aria-hidden="true" />
    </span>
    <span v-else-if="$slots.leftIcon" data-icon="inline-start" :class="iconSlotClass">
      <slot name="leftIcon" />
    </span>

    <slot />

    <span v-if="$slots.rightIcon" data-icon="inline-end" :class="iconSlotClass">
      <slot name="rightIcon" />
    </span>
  </UiButton>
</template>
