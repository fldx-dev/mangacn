import { AgentStrip } from "../landing/agent-strip";
import { SiteFooter } from "../landing/site-footer";
import { ThreeCommands } from "../landing/three-commands";
import { WholePage } from "../landing/whole-page";
import { Bento } from "./bento";
import { ModeSplit } from "./mode-split";
import { SfxBand } from "./sfx-band";
import { SplashHero } from "./splash-hero";
import { SwapImport } from "./swap-import";

/**
 * The alternative landing ("B"), under the same navbar: a splash hero, a sound-effect band, the
 * swap-an-import toggle, a bento of pieces, the day/night split, then the sections shared with
 * the current landing: the whole page, the three commands, the agent strip and the footer.
 */
export function AltSections() {
  return (
    <>
      <SplashHero />
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
