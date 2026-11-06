# AGENTS.md snippet

Offer this to the user when they want mangacn's rules in their project's `AGENTS.md` (or
`CLAUDE.md`). Do not write it there yourself unless they ask; they paste it.

```markdown
## UI: mangacn (manga-styled shadcn registry, https://www.mangacn.com)

- Install items with `npx shadcn@latest add @mangacn/<item> --overwrite`, and `--yes --overwrite` when `@mangacn/theme` is in the set (only `--yes` answers the theme's prompt); the registry is `"@mangacn": "https://www.mangacn.com/r/{name}.json"` in components.json.
- Read an item's props at https://www.mangacn.com/docs/components/<item>.md (or the MCP at https://www.mangacn.com/api/mcp) before using it; never guess props.
- No drop shadows, gradients or CSS borders on surfaces: outlines come from the items or `InkFrame` (`@/components/ink-frame`).
- Colours are tokens only: ink, paper, tone-1 to tone-4. `--spot` red at most once per surface, never as a background.
- Every Japanese string sits under `lang="ja"`.
- `font-display` for sound effects and headings, `font-dialogue` for bubbles and captions; body text keeps the project font.
- Restyled primitives (`@/components/ui/*`) keep shadcn's API; manga-native pieces live in `@/components/*`.
- Motion is opt-in and must respect `prefers-reduced-motion`.
- Decorative pieces stay `aria-hidden`; name every speech bubble's speaker with `aria-label`.
```
