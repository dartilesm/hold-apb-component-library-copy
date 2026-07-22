import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge class names, deduping conflicting Tailwind utilities.
 * Framework-agnostic — consumed by @dartilesm/react, @dartilesm/vue and @dartilesm/svelte.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
