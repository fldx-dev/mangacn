# Japanese text

Manga pages mix Japanese and Latin script constantly: dialogue, sound effects, chapter
titles, stamps. mangacn handles both, as long as the markup says which is which.

## `lang="ja"` on every Japanese string

Mark every Japanese string, on the element itself or its nearest wrapper:

```tsx
<SpeechBubble aria-label="Kenji" lang="ja">遅いぞ。もう始まってる！</SpeechBubble>

<p>
  He shouted <span lang="ja">遅いぞ！</span> and ran.
</p>
```

Why it matters:

- **The font.** The theme's `--font-dialogue` stack is Shantell Sans, then Yusei Magic. The
  browser picks per glyph, and `lang="ja"` makes it shape kana and kanji with Japanese
  conventions (punctuation, line breaking) rather than Chinese ones. Yusei Magic is fetched
  only on pages that use it.
- **Screen readers** switch to a Japanese voice instead of spelling the characters out.
- **Vertical text** needs the language for correct glyph rotation and punctuation.

A wrapper with `lang="ja"` covers its children, as the stamp and ink-mark demos do. A Latin
word inside a Japanese line (`HEROは遅れて来るものよ。`) needs no extra markup.

## Which item uses which face

| Face                                          | Items                                                                                                   | Japanese                                    |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `font-dialogue` (Shantell Sans → Yusei Magic) | `speech-bubble`, `thought-bubble`, `caption-box` (`font="dialogue"` by default)                         | kana and kanji fall through to Yusei Magic  |
| `font-display` (Dela Gothic One)              | `sfx-text`, `sfx-ticker`, `stamp`, `page-number`, `power-gauge`, `badge`, `kbd`, `button variant="sfx"` | Dela Gothic One has its own Japanese glyphs |
| inherited                                     | `vertical-text`, `ink-mark`, the other primitives                                                       | whatever the surrounding text uses          |

The bubbles and caption box take `font="inherit"` (bubbles) or `font="body"` (caption box)
to drop the dialogue face. Give `vertical-text` a class (`font-display` for a title,
`font-dialogue` for speech) when it should not inherit.

## Vertical text

`VerticalText` sets `writing-mode: vertical-rl` (right to left, top to bottom, as manga is
printed). Give it a height; the text wraps into the next column to the left.

```tsx
<SpeechBubble tail="left" className="px-5 py-7">
  <VerticalText lang="ja" className="h-40 text-xl leading-relaxed">
    まさか、 君がHEROなの？
  </VerticalText>
</SpeechBubble>

<VerticalText lang="ja" className="h-48 font-display text-3xl">
  第1話 東京NIGHT
</VerticalText>
```

`orientation`: `"mixed"` (default: Japanese upright, Latin turned on its side, the usual
tategaki mix), `"upright"` (every character upright, Latin stacked), `"sideways"` (the whole
line turned). Short numbers inside vertical text read best upright.

## Sound effects

Sound effects are lettering, not body text: the display face, heavy, tilted. Katakana is the
native script for them.

```tsx
<SfxText lang="ja" size="lg" rotate={-4}>東京</SfxText>

<SfxTicker
  words={["BOOM", { text: "東京！", lang: "ja" }, "BAM", { text: "ゴゴゴ", lang: "ja" }]}
/>
```

`SfxTicker` takes `lang` per word, because one band mixes both scripts. `SfxText` keeps the
plain text in the DOM, so it reads aloud as the word. Kanji in `Stamp` need `size="lg"` to
stay legible in the heavy face.

## Sample strings

The docs use these; reuse them for placeholders so demos and your pages look alike:

| String                                     | Meaning                             | Where                     |
| ------------------------------------------ | ----------------------------------- | ------------------------- |
| 遅いぞ！                                   | You're late!                        | shout bubble              |
| 遅いぞ。もう始まってる！                   | You're late. It's already started!  | speech bubble             |
| HEROは遅れて来るものよ。                   | A hero always arrives late.         | mixed-script bubble       |
| その頃、街の反対側では……                   | Meanwhile, across town…             | caption box               |
| まさか、 君がHEROなの？                    | No way, you're the hero?            | vertical text in a bubble |
| 第1話 東京NIGHT                            | Chapter 1: Tokyo Night              | vertical title            |
| 第12話                                     | Chapter 12                          | chapter mark              |
| ドカン / ドン！ / バン！ / ゴゴゴ / ドドド | boom / bang / bam / rumble / menace | sound effects             |
| 完結 / 検印 / 済                           | complete / seal of approval / done  | stamps                    |
