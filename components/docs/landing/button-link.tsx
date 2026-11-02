import Link from "next/link";
import type * as React from "react";
import { Button } from "@/registry/ui/button/button";

export interface ButtonLinkProps
  extends Omit<React.ComponentProps<typeof Button>, "render" | "nativeButton"> {
  href: string;
}

/**
 * The registry `Button` drawn as a Next.js link. Base UI gives a non-native button
 * `role="button"`; `role="link"` keeps it announced as what it is.
 */
export function ButtonLink({ href, ...props }: ButtonLinkProps) {
  return <Button {...props} nativeButton={false} role="link" render={<Link href={href} />} />;
}
