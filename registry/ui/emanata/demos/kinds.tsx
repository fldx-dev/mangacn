import { Emanata } from "@/registry/ui/emanata/emanata";

const kinds = ["sweat", "anger", "sparkle", "surprise", "puff"] as const;

export default function EmanataKindsDemo() {
  return (
    <div className="grid w-full max-w-xl gap-6">
      <div className="flex flex-wrap items-end justify-center gap-6">
        {kinds.map((kind) => (
          <div key={kind} className="flex flex-col items-center gap-2">
            <Emanata kind={kind} size="lg" />
            <span className="text-xs">{kind}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Emanata kind="anger" size="sm" />
        <Emanata kind="anger" color="spot" />
        <Emanata kind="sparkle" color="tone" size="lg" />
        <Emanata kind="puff" decorative />
      </div>
    </div>
  );
}
