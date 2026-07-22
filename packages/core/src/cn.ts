import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge class names, deduping conflicting Tailwind utilities.
 * Framework-agnostic — consumed by @dept/react, @dept/vue and @dept/svelte.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
