"use client";

import { ButtonLink } from "@/components/docs/landing/button-link";
import type { CreateConfig } from "@/lib/create/config";
import { Button } from "@/registry/ui/button/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/registry/ui/dialog/dialog";

export interface GetCodeDialogProps {
  /** The configuration's canonical code. */
  code: string;
  /** The configuration itself, for the install command (Task C6). */
  config: CreateConfig;
}

/**
 * "Get code": the way out of the Create page. Until the install command exists (Task C6), it
 * says so and hands over the code and the Installation page, so the page is honest on its own.
 * C6 replaces this component's dialog body; it is mounted once, at the foot of the rail.
 */
export function GetCodeDialog({ code }: GetCodeDialogProps) {
  return (
    <Dialog>
      <DialogTrigger render={<Button className="w-full" data-slot="create-get-code" />}>
        Get code
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Get code</DialogTitle>
          <DialogDescription>
            The command that installs this configuration arrives with the next update. Keep the code
            to come back to it, or set up mangacn by hand today.
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm">
          Your code:{" "}
          <code
            className="rounded-sm bg-muted px-1.5 py-0.5 font-mono"
            data-slot="create-dialog-code"
          >
            {code}
          </code>
        </p>
        <DialogFooter>
          <ButtonLink variant="outline" href="/docs/installation">
            Installation
          </ButtonLink>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
