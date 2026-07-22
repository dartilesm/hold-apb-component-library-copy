// Public API.
export { default as Button } from "./components/Button/Button.svelte";

// Framework-agnostic substrate re-exported for convenience (tokens/styles ship
// via "@dept/svelte/styles.css"). See @dept/core for the shared recipe + contract.
export {
  cn,
  buttonVariants,
  type ButtonVariantProps,
  type ButtonBaseContract,
} from "@dept/core";
