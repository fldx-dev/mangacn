import { Textarea } from "@/registry/ui/textarea/textarea";

export default function TextareaDefaultVariant() {
  return (
    <div className="grid w-full max-w-xs gap-1.5">
      <label htmlFor="textarea-variant-script" className="text-sm font-medium">
        Script
      </label>
      <Textarea id="textarea-variant-script" placeholder="Panel 1: the city at night…" />
    </div>
  );
}
