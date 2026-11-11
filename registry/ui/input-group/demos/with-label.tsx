import { AtSignIcon } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/registry/ui/input-group/input-group";
import { Label } from "@/registry/ui/label/label";

export default function InputGroupWithLabelDemo() {
  return (
    <div className="grid w-full max-w-sm gap-2">
      <Label htmlFor="input-group-demo-handle">Artist handle</Label>
      <InputGroup>
        <InputGroupAddon>
          <AtSignIcon aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput id="input-group-demo-handle" placeholder="inkwell" />
        <InputGroupAddon align="inline-end">
          <InputGroupText>on mangacn</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}
