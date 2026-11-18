import { ColorPicker } from "@/registry/ui/color-picker/color-picker";

// Spot colours a theme might pick from: a few print inks.
const spots = ["#e60012", "#f39800", "#ffe100", "#009944", "#0068b7", "#1d2088", "#920783"];

export default function ColorPickerSwatchesDemo() {
  return (
    <ColorPicker
      defaultValue="#0068b7"
      swatches={spots}
      alpha={false}
      labels={{ trigger: "Spot" }}
    />
  );
}
