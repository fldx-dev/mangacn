import { Suspense } from "react";
import { AgentStrip } from "./agent-strip";
import { landingCatalog } from "./catalog";
import { ComponentWall } from "./component-wall";
import { Hero } from "./hero";
import { SiteFooter } from "./site-footer";
import { ThemeTeaser } from "./theme-teaser";
import { ThreeCommands } from "./three-commands";
import { WholePage } from "./whole-page";
import { Why } from "./why";

/** Sections 2–9 of the landing, under the navbar `HomeLayout` draws (section 1). */
export async function LandingSections() {
  const catalog = landingCatalog();
  // Awaited here rather than rendered as async elements, so a test can render the page too.
  const [hero, wall] = await Promise.all([
    Hero({ total: catalog.items.length }),
    ComponentWall({ catalog }),
  ]);
  return (
    <>
      {hero}
      <ThreeCommands />
      {/* The wall's demos load through the demo map's lazy imports. `next dev` checks the App
          Shell for instant navigation without those chunks and reports a missing module
          factory, so they sit behind a boundary as on the docs pages. Nothing in it is
          dynamic: it still prerenders into the static page. */}
      <Suspense fallback={null}>{wall}</Suspense>
      <Why primitives={catalog.primitives} />
      <ThemeTeaser />
      <WholePage />
      <AgentStrip />
      <SiteFooter />
    </>
  );
}
