/**
 * Public variant/size names as PLAIN string unions.
 *
 * Why not reuse the cva-derived `ButtonVariantProps` from the recipe? Vue's
 * `defineProps<T>()` macro resolves types with its own compiler (not full
 * TypeScript) and cannot evaluate cva's `VariantProps<…>` mapped type across a
 * package boundary. Plain unions resolve everywhere (React/Svelte via tsc, Vue
 * via its SFC resolver).
 *
 * KEEP IN LOCKSTEP with the cva recipe in `recipes/button.ts` — if you add or
 * rename a variant/size there, mirror it here.
 */
export type ButtonVariant =
  | "default"
  | "outline"
  | "secondary"
  | "ghost"
  | "destructive"
  | "link";

export type ButtonSize =
  | "default"
  | "xs"
  | "sm"
  | "lg"
  | "icon"
  | "icon-xs"
  | "icon-sm"
  | "icon-lg";

/**
 * Framework-agnostic public contract for Button. Each framework package extends
 * this with its own renderable-node types for the icon slots (React `ReactNode`,
 * Vue slots, Svelte `Snippet`).
 */
export interface ButtonBaseContract {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a loading spinner and disables the button */
  isLoading?: boolean;
  disabled?: boolean;
}
