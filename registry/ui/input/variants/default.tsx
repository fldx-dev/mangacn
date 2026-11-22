import { Input } from "@/registry/ui/input/input";

export default function InputDefaultVariant() {
  return (
    <div className="grid w-full max-w-xs gap-1.5">
      <label htmlFor="input-variant-email" className="text-sm font-medium">
        Email
      </label>
      <Input id="input-variant-email" type="email" placeholder="mangaka@example.com" />
    </div>
  );
}
