// cn() is centralized in @dartilesm/core so every framework dedupes classes identically.
// This shim keeps shadcn-generated `@/lib/utils` imports compiling unchanged.
export { cn } from "@dartilesm/core/cn";
