// Convenience barrel — the runtime substrate every framework package builds on.
// NOTE: this barrel deliberately imports NO CSS. The compiled stylesheet ships
// only via the "./styles.css" subpath, so importing recipes/cn never drags a
// CSS side effect into a consumer's bundle.
export { cn } from "./cn";
export * from "./recipes";
export * from "./contracts";
