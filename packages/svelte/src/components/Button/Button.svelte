<script lang="ts" module>
  // Public Button — the stable API. Mirrors @dept/react's Button.tsx: adds
  // isLoading + leftIcon/rightIcon (here as Svelte Snippets) on top of the ui/
  // primitive. Shared prop contract + icon-slot classes come from @dept/core.
  import type { Snippet } from "svelte";
  import type { ButtonBaseContract } from "@dept/core/contracts";

  export type ButtonProps = ButtonBaseContract & {
    class?: string;
    href?: string;
    children: Snippet;
    leftIcon?: Snippet;
    rightIcon?: Snippet;
  };
</script>

<script lang="ts">
  import { LoaderCircle } from "@lucide/svelte";
  import { iconSlotClass, spinnerClass } from "@dept/core/recipes";
  import UiButton from "../ui/button.svelte";

  let {
    variant = "default",
    size = "default",
    isLoading = false,
    disabled = false,
    class: className,
    href,
    children,
    leftIcon,
    rightIcon,
    ...restProps
  }: ButtonProps = $props();
</script>

<UiButton
  {variant}
  {size}
  {href}
  class={className}
  disabled={disabled || isLoading}
  aria-busy={isLoading || undefined}
  data-loading={isLoading || undefined}
  {...restProps}
>
  {#if isLoading}
    <span data-icon="inline-start" class={iconSlotClass}>
      <LoaderCircle class={spinnerClass} aria-hidden="true" />
    </span>
  {:else if leftIcon}
    <span data-icon="inline-start" class={iconSlotClass}>
      {@render leftIcon()}
    </span>
  {/if}

  {@render children?.()}

  {#if rightIcon}
    <span data-icon="inline-end" class={iconSlotClass}>
      {@render rightIcon()}
    </span>
  {/if}
</UiButton>
