// Public API.
export { default as Button } from "./components/Button/Button.vue";

// Framework-agnostic substrate re-exported for convenience (tokens/styles ship
// via "@dept/vue/styles.css"). See @dept/core for the shared recipe + contract.
export {
  cn,
  buttonVariants,
  type ButtonVariantProps,
  type ButtonBaseContract,
} from "@dept/core";
