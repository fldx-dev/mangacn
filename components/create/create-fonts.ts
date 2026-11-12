import { Patrick_Hand_SC, Reggae_One } from "next/font/google";

// The Create page's extra faces: the site loads Dela Gothic One and Shantell Sans itself
// (app/layout.tsx); these two are only drawn when the preview picks them, so neither is
// preloaded. Each sits under the variable `FONT_FACE_VARIABLES` names (lib/create/preview.ts).

const reggaeOne = Reggae_One({
  variable: "--font-create-reggae-one",
  weight: "400",
  subsets: ["latin"],
  preload: false,
});

const patrickHandSc = Patrick_Hand_SC({
  variable: "--font-create-patrick-hand-sc",
  weight: "400",
  subsets: ["latin"],
  preload: false,
});

/** The classes that define the faces' variables, for the preview wrapper. */
export const CREATE_FONT_CLASSES = `${reggaeOne.variable} ${patrickHandSc.variable}`;
