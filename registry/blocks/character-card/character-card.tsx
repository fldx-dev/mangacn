import { cn } from "cn";
import type * as React from "react";
import { CaptionBox } from "@/components/caption-box";
import { MangaFrame } from "@/components/manga-frame";
import { PowerGauge } from "@/components/power-gauge";
import { SpeechBubble } from "@/components/speech-bubble";
import { Stamp } from "@/components/stamp";
import { Card, CardContent } from "@/components/ui/card";

/** The character's picture. */
export interface CharacterPortrait {
  /** The picture's URL, passed to a plain `<img>`. */
  src: string;
  /** Who is shown and how, for readers who cannot see it. */
  alt: string;
}

/** One stat, drawn as a power gauge and given as text. */
export interface CharacterStat {
  /** What is measured ("Speed"). */
  label: string;
  /** The stat's value. */
  value: number;
  /**
   * The value of a full gauge.
   * @default 100
   */
  max?: number;
}

export interface CharacterCardProps extends Omit<React.ComponentProps<"article">, "children"> {
  /** The character's name: the card's heading and the article's name. */
  name: string;
  /** How the name is read, set as ruby over it under `lang="ja"` (あまの みお). */
  reading?: string;
  /** The part they play: Protagonist, Rival…, in a caption box. */
  castRole?: string;
  /** The portrait, in a 3:4 manga-frame. */
  portrait: CharacterPortrait;
  /** A line the character says, in a speech bubble. */
  quote?: React.ReactNode;
  /** Stats as power gauges, listed in a description list with each value as text. */
  stats?: CharacterStat[];
  /** One stamp word pressed on the portrait's top corner (MAIN, 新人). */
  status?: string;
  /** Makes the whole card one link to the character's page, named by the name. */
  href?: string;
}

/**
 * A cast entry: the portrait in a manga-frame with an optional status stamp, the name with its
 * reading as ruby, the part they play in a caption box, a line of dialogue in a speech bubble and stats as
 * power gauges, on a card. An `article` named by the name; the stats are a description list
 * whose values are text, so they do not rely on the gauges; with `href` the name is one link
 * whose hit area covers the card. A server component; it composes card, manga-frame,
 * caption-box, speech-bubble, power-gauge and stamp and draws nothing of its own.
 */
export function CharacterCard({
  name,
  reading,
  castRole,
  portrait,
  quote,
  stats,
  status,
  href,
  className,
  ...props
}: CharacterCardProps) {
  // The ruby reads above the name; the name alone names the article.
  const title = reading ? (
    <ruby lang="ja">
      {name}
      <rp>(</rp>
      <rt className="font-sans text-xs font-normal tracking-wide">{reading}</rt>
      <rp>)</rp>
    </ruby>
  ) : (
    name
  );

  return (
    <article
      data-slot="character-card"
      aria-label={name}
      className={cn("@container w-full max-w-md text-ink", className)}
      {...props}
    >
      <Card
        className={cn(
          "h-full",
          href &&
            "has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-ring has-[a:focus-visible]:outline-solid",
        )}
      >
        <CardContent className="grid gap-4 @sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] @sm:items-start">
          <div data-slot="character-card-portrait" className="relative">
            <MangaFrame src={portrait.src} alt={portrait.alt} aspect="3/4" />
            {status && (
              <Stamp size="sm" rotate={-10} className="absolute -top-3 -left-3">
                {status}
              </Stamp>
            )}
          </div>
          <div className="flex min-w-0 flex-col gap-3">
            <div className="flex flex-col items-start gap-2">
              <p
                data-slot="character-card-name"
                className="font-display text-xl leading-tight wrap-break-word @sm:text-2xl"
              >
                {href ? (
                  // Its ::after covers the card, so the whole card is the link's hit area. Named by
                  // its content, the name and its reading: an `aria-label` of the name alone left
                  // the visible reading out and failed WCAG 2.5.3 Label in Name.
                  <a
                    href={href}
                    className="outline-none after:absolute after:inset-0 hover:text-spot"
                  >
                    {title}
                  </a>
                ) : (
                  title
                )}
              </p>
              {castRole && (
                <CaptionBox font="body" className="text-xs">
                  {castRole}
                </CaptionBox>
              )}
            </div>
            {quote != null && (
              <SpeechBubble tail="top-left" className="self-start text-sm">
                {quote}
              </SpeechBubble>
            )}
            {stats && stats.length > 0 && (
              <dl data-slot="character-card-stats" className="flex flex-col gap-2">
                {stats.map((stat) => {
                  const max = stat.max ?? 100;
                  return (
                    <div key={stat.label}>
                      {/* The text is the stat for assistive tech; the gauge draws the same
                          label and value for the eye, so it is hidden from it. */}
                      <dt className="sr-only">{stat.label}</dt>
                      <dd>
                        <span className="sr-only">{`${stat.value} of ${max}`}</span>
                        <PowerGauge
                          aria-hidden
                          label={stat.label}
                          value={stat.value}
                          max={max}
                          segments={10}
                        />
                      </dd>
                    </div>
                  );
                })}
              </dl>
            )}
          </div>
        </CardContent>
      </Card>
    </article>
  );
}
