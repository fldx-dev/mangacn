import { ArrowUpIcon } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupTextarea,
} from "@/registry/ui/input-group/input-group";

export default function InputGroupTextareaDemo() {
  return (
    <InputGroup className="max-w-sm">
      <InputGroupTextarea aria-label="Letter to the editor" placeholder="Dear editor…" />
      <InputGroupAddon align="block-end">
        <InputGroupText>Chapter 12 · 200 characters left</InputGroupText>
        <InputGroupButton
          variant="default"
          size="icon-xs"
          className="ml-auto rounded-full"
          aria-label="Send"
        >
          <ArrowUpIcon />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
