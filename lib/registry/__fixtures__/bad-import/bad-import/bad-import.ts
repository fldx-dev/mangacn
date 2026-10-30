// Test fixture for lib/registry/imports.test.ts. Only `react` and `@/lib/utils` are allowed
// here; every other import breaks SPEC-registry-core §6.5. Not part of any registry.
import "@/app/page";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export { loadRegistry } from "@/lib/registry";
export { HelloWorld } from "../../../../../registry/ui/hello-world/hello-world";

export const loadPopover = () => import("@base-ui/react/popover");

export function join(...classes: string[]): ReactNode {
  return cn(...classes);
}
