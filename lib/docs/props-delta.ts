// What the restyled primitives add to the stock shadcn API (base-nova). Parity keeps every
// stock prop and value (registry/ui/parity.test.ts), so the docs link to shadcn for those and
// list only these. Checked against each item's source and the stock cva variants in
// registry/ui/__parity__/base-nova.json: no other primitive adds a prop or a variant value.

export interface PropDelta {
  /** The TypeScript type; for an added value of a stock prop, only the added value. */
  type: string;
  default?: string;
  description: string;
}

export const PROPS_DELTA: Readonly<Record<string, Readonly<Record<string, PropDelta>>>> = {
  badge: {
    variant: {
      type: '"spot"',
      default: '"default"',
      description: "Added value: a spot-colour caption box for the one label that needs emphasis.",
    },
  },
  button: {
    variant: {
      type: '"sfx"',
      default: '"default"',
      description: "Added value: a sound-effect button in the display face, uppercase on paper.",
    },
  },
  card: {
    shadow: {
      type: '"none" | "ink" | "hatch"',
      default: '"none"',
      description: "An ink shadow behind the card: solid (`ink`) or hatched (`hatch`).",
    },
  },
  progress: {
    variant: {
      type: '"default" | "tone"',
      default: '"default"',
      description: "`tone` fills the indicator with screentone lines instead of solid ink.",
    },
  },
  skeleton: {
    shape: {
      type: '"rect" | "ellipse"',
      default: '"rect"',
      description: "`ellipse` for round placeholders, such as an avatar.",
    },
  },
};

/** shadcn's page for a stock primitive (the Base UI docs, which mangacn's base-nova follows). */
export function shadcnDocsUrl(item: string): string {
  return `https://ui.shadcn.com/docs/components/base/${item}`;
}
