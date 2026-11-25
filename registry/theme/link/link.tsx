import type * as React from "react";

/**
 * The link every mangacn block renders for an internal route. By default a plain `<a>` that
 * passes every prop and the ref through, so blocks work in any React app. To get client-side
 * navigation, swap this file's body for your router's link, in one line:
 *
 *   export { default as Link } from "next/link"; // Next.js
 *
 * React Router's `Link` takes `to`, not `href`: see https://www.mangacn.com/docs/installation#client-side-navigation.
 * External links (a new tab, a download) stay plain `<a>` in the blocks.
 */
export function Link(props: React.ComponentProps<"a">) {
  return <a {...props} />;
}
