import { CopyButton } from "@/registry/ui/copy-button/copy-button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/registry/ui/input-group/input-group";
import { Label } from "@/registry/ui/label/label";

const link = "https://www.mangacn.com/read/ink-and-steel/chapter-12";

// A reader's share panel: the chapter's link, read-only, with the copy button inside the field.
export default function CopyButtonShareLinkVariant() {
  return (
    <div className="grid w-full max-w-sm gap-2">
      <Label htmlFor="copy-button-share-link">Share chapter 12</Label>
      <InputGroup>
        <InputGroupInput id="copy-button-share-link" defaultValue={link} readOnly />
        <InputGroupAddon align="inline-end">
          <CopyButton value={link} size="icon-xs" labels={{ copy: "Copy link" }} />
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}
