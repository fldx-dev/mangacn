import { AgentStrip } from "./agent-strip";
import { Bento } from "./bento";
import { Hero } from "./hero";
import { ModeSplit } from "./mode-split";
import { SfxBand } from "./sfx-band";
import { SiteFooter } from "./site-footer";
import { SwapImport } from "./swap-import";
import { ThreeCommands } from "./three-commands";
import { WholePage } from "./whole-page";

/**
 * The landing's sections, under the Fumadocs navbar (SPEC-docs-site §4.1): the splash hero, a
 * sound-effect band, the swap-an-import toggle, a bento of pieces, the day/night split, the
 * whole page, the three commands, the agent strip and the footer.
 */
export function LandingSections() {
  return (
    <>
      <Hero />
      <SfxBand />
      <SwapImport />
      <Bento />
      <ModeSplit />
      <WholePage />
      <ThreeCommands />
      <AgentStrip />
      <SiteFooter />
    </>
  );
}
