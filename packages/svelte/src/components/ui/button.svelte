<script lang="ts" module>
  // Raw primitive layer — mirrors @dept/react's components/ui/button.tsx and
  // shadcn-svelte's button.svelte. Native <button>/<a>, styled entirely from
  // @dept/core's shared recipe. Do NOT hand-write Tailwind utilities here.
  import type { HTMLAnchorAttributes, HTMLButtonAttributes } from "svelte/elements";
  import type { WithElementRef } from "bits-ui";
  import { type ButtonVariantProps } from "@dept/core/recipes";

  export type ButtonProps = WithElementRef<HTMLButtonAttributes> &
    WithElementRef<HTMLAnchorAttributes> &
    ButtonVariantProps;
</script>

<script lang="ts">
  import { buttonVariants } from "@dept/core/recipes";
  import { cn } from "@dept/core";

  let {
    class: className,
    variant = "default",
    size = "default",
    ref = $bindable(null),
    href = undefined,
    type = "button",
    disabled,
    children,
    ...restProps
  }: ButtonProps = $props();
</script>

{#if href}
  <a
    bind:this={ref}
    data-slot="button"
    class={cn(buttonVariants({ variant, size }), className)}
    href={disabled ? undefined : href}
    aria-disabled={disabled}
    role={disabled ? "link" : undefined}
    tabindex={disabled ? -1 : undefined}
    {...restProps}
  >
    {@render children?.()}
  </a>
{:else}
  <button
    bind:this={ref}
    data-slot="button"
    class={cn(buttonVariants({ variant, size }), className)}
    {type}
    {disabled}
    {...restProps}
  >
    {@render children?.()}
  </button>
{/if}
