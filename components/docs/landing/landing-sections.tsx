import { Suspense } from "react";
import { landingCatalog } from "./catalog";
import { ComponentWall } from "./component-wall";
import { Hero } from "./hero";
import { ThreeCommands } from "./three-commands";

/** Sections 2–9 of the landing, under the navbar `HomeLayout` draws (section 1). */
export async function LandingSections() {
  const catalog = landingCatalog();
  return (
    <>
      <Hero total={catalog.items.length} />
      <ThreeCommands />
      {/* The wall's demos load through the demo map's lazy imports. `next dev` checks the App
          Shell for instant navigation without those chunks and reports a missing module
          factory, so they sit behind a boundary as on the docs pages. Nothing in it is
          dynamic: it still prerenders into the static page. */}
      <Suspense fallback={null}>
        <ComponentWall catalog={catalog} />
      </Suspense>
    </>
  );
}
