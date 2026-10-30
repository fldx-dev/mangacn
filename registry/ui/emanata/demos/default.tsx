import { Emanata } from "@/registry/ui/emanata/emanata";

export default function EmanataDefaultDemo() {
  return (
    <p className="flex items-center gap-2 text-lg">
      <span>I forgot my homework</span>
      <Emanata kind="sweat" />
    </p>
  );
}
