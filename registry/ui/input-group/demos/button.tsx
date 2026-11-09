import { CopyIcon } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/registry/ui/input-group/input-group";

export default function InputGroupButtonDemo() {
  return (
    <div className="grid w-full max-w-sm gap-4">
      <InputGroup>
        <InputGroupInput aria-label="Share link" defaultValue="mangacn.com/r/ch-12" readOnly />
        <InputGroupAddon align="inline-end">
          <InputGroupButton size="icon-xs" aria-label="Copy link">
            <CopyIcon />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <InputGroup>
        <InputGroupInput type="email" aria-label="Email" placeholder="you@example.com" />
        <InputGroupAddon align="inline-end">
          <InputGroupButton variant="default">Subscribe</InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}
