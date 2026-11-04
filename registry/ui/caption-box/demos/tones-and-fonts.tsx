import { CaptionBox } from "@/registry/ui/caption-box/caption-box";

export default function CaptionBoxTonesAndFontsDemo() {
  return (
    <div className="grid w-full max-w-lg gap-4 sm:grid-cols-2">
      <CaptionBox>Paper, dialogue face: the default.</CaptionBox>
      <CaptionBox tone="tone">Tone, dialogue face: a flashback.</CaptionBox>
      <CaptionBox font="body">Paper, body face: a plain note.</CaptionBox>
      <CaptionBox tone="tone" font="body">
        Tone, body face: a quiet aside.
      </CaptionBox>
    </div>
  );
}
