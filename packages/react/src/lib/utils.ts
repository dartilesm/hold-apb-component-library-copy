// cn() is centralized in @dept/core so every framework dedupes classes identically.
// This shim keeps shadcn-generated `@/lib/utils` imports compiling unchanged.
export { cn } from "@dept/core/cn";
