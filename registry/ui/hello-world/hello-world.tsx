import type * as React from "react";
import { cn } from "@/lib/utils";

export interface HelloWorldProps extends React.HTMLAttributes<HTMLDivElement> {
  name?: string;
}

export function HelloWorld({ name = "world", className, ...props }: HelloWorldProps) {
  return (
    <div data-slot="hello-world" className={cn("rounded-md border p-4", className)} {...props}>
      Hello, {name}!
    </div>
  );
}
