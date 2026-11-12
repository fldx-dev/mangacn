import type { ComponentType } from "react";
import AlertDemo from "@/registry/ui/alert/demos/default";
import BadgeDemo from "@/registry/ui/badge/demos/default";
import ButtonDemo from "@/registry/ui/button/demos/default";
import CardDemo from "@/registry/ui/card/demos/default";
import ChartDemo from "@/registry/ui/chart/demos/default";
import CheckboxDemo from "@/registry/ui/checkbox/demos/default";
import InputDemo from "@/registry/ui/input/demos/default";
import PowerGaugeDemo from "@/registry/ui/power-gauge/demos/default";
import SfxTextDemo from "@/registry/ui/sfx-text/demos/default";
import SpeechBubbleDemo from "@/registry/ui/speech-bubble/demos/default";
import StampDemo from "@/registry/ui/stamp/demos/default";
import SwitchDemo from "@/registry/ui/switch/demos/default";
import TabsDemo from "@/registry/ui/tabs/demos/default";

/**
 * The default demos of a dozen items, so one screenshot shows a theme preset (Task 99). Adding,
 * removing or reordering an entry moves every drawing after it (each outline is seeded by
 * `useId`), so every specimen baseline changes: append only, and expect new baselines.
 */
const DEMOS: [name: string, Demo: ComponentType][] = [
  ["button", ButtonDemo],
  ["badge", BadgeDemo],
  ["card", CardDemo],
  ["input", InputDemo],
  ["checkbox", CheckboxDemo],
  ["switch", SwitchDemo],
  ["tabs", TabsDemo],
  ["alert", AlertDemo],
  ["speech-bubble", SpeechBubbleDemo],
  ["stamp", StampDemo],
  ["sfx-text", SfxTextDemo],
  ["power-gauge", PowerGaugeDemo],
  ["chart", ChartDemo],
];

const TOKENS = ["paper", "tone-1", "tone-2", "tone-3", "tone-4", "ink", "spot"] as const;

/** The base colours, the screentones and the three text weights of the theme, side by side. */
function Tokens() {
  return (
    <div className="grid w-full gap-3">
      <ul className="grid grid-cols-7 overflow-hidden rounded-[var(--radius)] ink-border">
        {TOKENS.map((token) => (
          <li key={token} className="h-10" style={{ background: `var(--${token})` }}>
            <span className="sr-only">{`--${token}`}</span>
          </li>
        ))}
      </ul>
      <div className="grid grid-cols-3 gap-2" aria-hidden="true">
        <div className="halftone h-10 rounded-[var(--radius)] ink-border" />
        <div className="screentone-lines h-10 rounded-[var(--radius)] ink-border" />
        <div className="screentone-cross h-10 rounded-[var(--radius)] ink-border" />
      </div>
      <p className="text-sm">
        Ink text, <span className="text-muted-foreground">muted text</span> and{" "}
        <span className="font-semibold text-spot">the spot</span>.
      </p>
    </div>
  );
}

/** The stage's demo: `/demo/theme/specimen`, with `?theme=` and `?mode=` like every stage. */
export default function ThemeSpecimen() {
  return (
    <div
      data-slot="theme-specimen"
      className="grid w-full max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      <section
        aria-label="tokens"
        className="grid min-w-0 content-start gap-3 rounded-[var(--radius)] p-4 ink-border"
      >
        <p className="font-mono text-xs text-muted-foreground">tokens</p>
        <Tokens />
      </section>
      {DEMOS.map(([name, Demo]) => (
        <section
          key={name}
          aria-label={name}
          className="grid min-w-0 content-start gap-3 rounded-[var(--radius)] p-4 ink-border"
        >
          <p className="font-mono text-xs text-muted-foreground">{name}</p>
          <div className="flex min-h-24 min-w-0 flex-wrap items-center justify-center gap-4">
            <Demo />
          </div>
        </section>
      ))}
    </div>
  );
}
