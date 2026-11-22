import type { ComponentType } from "react";
import AlertVariant from "@/registry/ui/alert/variants/default";
import BadgeVariant from "@/registry/ui/badge/variants/default";
import ButtonVariant from "@/registry/ui/button/variants/default";
import CardVariant from "@/registry/ui/card/variants/default";
import ChartVariant from "@/registry/ui/chart/variants/default";
import CheckboxVariant from "@/registry/ui/checkbox/variants/default";
import InputVariant from "@/registry/ui/input/variants/default";
import PowerGaugeVariant from "@/registry/ui/power-gauge/variants/default";
import SfxTextVariant from "@/registry/ui/sfx-text/variants/default";
import SpeechBubbleVariant from "@/registry/ui/speech-bubble/variants/default";
import StampVariant from "@/registry/ui/stamp/variants/default";
import SwitchVariant from "@/registry/ui/switch/variants/default";
import TabsVariant from "@/registry/ui/tabs/variants/default";

/**
 * The default variants of a dozen items, so one screenshot shows a theme preset (Task 99). Adding,
 * removing or reordering an entry moves every drawing after it (each outline is seeded by
 * `useId`), so every specimen baseline changes: append only, and expect new baselines.
 */
const VARIANTS: [name: string, Variant: ComponentType][] = [
  ["button", ButtonVariant],
  ["badge", BadgeVariant],
  ["card", CardVariant],
  ["input", InputVariant],
  ["checkbox", CheckboxVariant],
  ["switch", SwitchVariant],
  ["tabs", TabsVariant],
  ["alert", AlertVariant],
  ["speech-bubble", SpeechBubbleVariant],
  ["stamp", StampVariant],
  ["sfx-text", SfxTextVariant],
  ["power-gauge", PowerGaugeVariant],
  ["chart", ChartVariant],
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

/** The stage's variant: `/gallery/theme/specimen`, with `?theme=` and `?mode=` like every stage. */
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
      {VARIANTS.map(([name, Variant]) => (
        <section
          key={name}
          aria-label={name}
          className="grid min-w-0 content-start gap-3 rounded-[var(--radius)] p-4 ink-border"
        >
          <p className="font-mono text-xs text-muted-foreground">{name}</p>
          <div className="flex min-h-24 min-w-0 flex-wrap items-center justify-center gap-4">
            <Variant />
          </div>
        </section>
      ))}
    </div>
  );
}
