import type { ButtonVariantProps } from "../recipes/button";

/**
 * Framework-agnostic public contract for Button. Each framework package extends
 * this with its own renderable-node types for the icon slots (React `ReactNode`,
 * Vue `VNode`/slots, Svelte `Snippet`). Keeping the enumerable props here means a
 * variant/size change in the recipe propagates into every framework's typed API.
 */
export interface ButtonBaseContract extends ButtonVariantProps {
  /** Shows a loading spinner and disables the button */
  isLoading?: boolean;
  disabled?: boolean;
}
