import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// All library classes carry the `ui:` prefix (sealed styling — see README);
// tailwind-merge must know it to resolve conflicts like `ui:px-4 ui:px-8`.
const twMerge = extendTailwindMerge({ prefix: "ui" });

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
