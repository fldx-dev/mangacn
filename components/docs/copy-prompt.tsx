import { promptFor } from "@/lib/docs/install-command";
import { CopyPromptButton } from "./copy-prompt-button";

/** "Copy prompt for AI": the prompt is built from the catalog on the server, copied on the client. */
export function CopyPrompt({ item }: { item: string }) {
  return <CopyPromptButton prompt={promptFor(item)} />;
}
