import { Input } from "@/registry/ui/input/input";

export default function InputDefaultDemo() {
  return (
    <div className="grid w-full max-w-xs gap-1.5">
      <label htmlFor="input-demo-email" className="text-sm font-medium">
        Email
      </label>
      <Input id="input-demo-email" type="email" placeholder="mangaka@example.com" />
    </div>
  );
}
