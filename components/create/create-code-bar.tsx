"use client";

import { Check, ClipboardPaste, Copy, RotateCcw, Shuffle } from "lucide-react";
import { type FormEvent, useEffect, useId, useRef, useState } from "react";
import type { CreateConfig } from "@/lib/create/config";
import { type CreateAction, readPastedCode, shuffleConfig } from "@/lib/create/state";
import { Button } from "@/registry/ui/button/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/registry/ui/dialog/dialog";
import { Field, FieldError, FieldLabel } from "@/registry/ui/field/field";
import { Input } from "@/registry/ui/input/input";
import { GetCodeDialog } from "./get-code-dialog";

const CONFIRM_MS = 2000;

/** The code in a read-only field, and a button that copies it and says so politely. */
function CodeField({ code }: { code: string }) {
  const id = useId();
  const [copied, setCopied] = useState(false);
  const timeout = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timeout.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      return; // A denied clipboard: the field is still there to select by hand.
    }
    setCopied(true);
    window.clearTimeout(timeout.current);
    timeout.current = window.setTimeout(() => setCopied(false), CONFIRM_MS);
  };

  return (
    <Field className="gap-1.5">
      <FieldLabel htmlFor={id} className="text-xs">
        Code
      </FieldLabel>
      <div className="flex gap-2">
        <Input
          id={id}
          readOnly
          value={code}
          className="font-mono"
          data-slot="create-code"
          onFocus={(event) => event.currentTarget.select()}
        />
        <Button type="button" variant="outline" size="icon" onClick={copy} aria-label="Copy code">
          {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
        </Button>
      </div>
      <span role="status" aria-live="polite" className="sr-only" data-slot="create-copy-status">
        {copied ? "Code copied" : ""}
      </span>
    </Field>
  );
}

/** "Paste a code": takes a code or a Create URL, opens it if `decode` accepts it. */
function PasteCodeDialog({ dispatch }: { dispatch: (action: CreateAction) => void }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [reason, setReason] = useState<string | null>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const result = readPastedCode(text);
    if (!result.ok) {
      setReason(result.reason);
      return;
    }
    dispatch({ type: "replace", config: result.config });
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setText("");
          setReason(null);
        }
      }}
    >
      <DialogTrigger render={<Button type="button" variant="outline" size="sm" />}>
        <ClipboardPaste aria-hidden />
        Paste a code
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Paste a code</DialogTitle>
            <DialogDescription>A code like 111, or a link to this page with one.</DialogDescription>
          </DialogHeader>
          <Field data-invalid={reason ? true : undefined}>
            <FieldLabel htmlFor={id}>Code or link</FieldLabel>
            <Input
              id={id}
              value={text}
              autoComplete="off"
              spellCheck={false}
              aria-invalid={reason ? true : undefined}
              onChange={(event) => {
                setText(event.target.value);
                setReason(null);
              }}
            />
            {reason && <FieldError>{`This code was not used: ${reason}.`}</FieldError>}
          </Field>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit">Open</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * The foot of the rail: the code with its copy button, paste, shuffle, reset and "Get code".
 */
export function CreateCodeBar({
  code,
  config,
  dispatch,
}: {
  code: string;
  config: CreateConfig;
  dispatch: (action: CreateAction) => void;
}) {
  return (
    <div data-slot="create-code-bar" className="grid gap-2.5">
      <CodeField code={code} />
      <div className="grid grid-cols-[1fr_auto_auto] gap-1.5">
        <PasteCodeDialog dispatch={dispatch} />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => dispatch({ type: "replace", config: shuffleConfig() })}
        >
          <Shuffle aria-hidden />
          Shuffle
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => dispatch({ type: "reset" })}>
          <RotateCcw aria-hidden />
          Reset
        </Button>
      </div>
      <GetCodeDialog code={code} config={config} />
    </div>
  );
}
