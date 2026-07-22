// Public API.
export { default as Button } from "./components/Button.svelte";

// Framework-agnostic substrate re-exported for convenience (tokens/styles ship
// via "@dartilesm/svelte/styles.css"). See @dartilesm/core for the shared recipe + contract.
export {
  cn,
  buttonVariants,
  type ButtonVariantProps,
  type ButtonBaseContract,
} from "@dartilesm/core";
