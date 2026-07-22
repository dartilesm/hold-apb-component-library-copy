<script lang="ts" module>
  // Public Button — the stable API. Mirrors @dartilesm/react's components/Button.tsx:
  // adds isLoading + leftIcon/rightIcon (Svelte Snippets) on top of the primitive.
  // Shared prop contract + icon-slot classes come from @dartilesm/core.
  import type { Snippet } from "svelte";
  import type { HTMLAnchorAttributes, HTMLButtonAttributes } from "svelte/elements";
  import type { WithElementRef } from "bits-ui";
  import type { ButtonBaseContract } from "@dartilesm/core/contracts";

  // Accept every native button/anchor attribute (typed) + the shared contract.
  // `class`/`href` come from the HTML attribute types.
  export type ButtonProps = WithElementRef<HTMLButtonAttributes & HTMLAnchorAttributes> &
    ButtonBaseContract & {
      children: Snippet;
      leftIcon?: Snippet;
      rightIcon?: Snippet;
    };
</script>

<script lang="ts">
  import { LoaderCircle } from "@lucide/svelte";
  import { iconSlotClass, spinnerClass } from "@dartilesm/core/recipes";
  import UiButton from "../primitives/button.svelte";

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
