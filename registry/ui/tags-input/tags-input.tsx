"use client";

import { cn } from "cn";
import { XIcon } from "lucide-react";
import * as React from "react";
import { InkFrame } from "@/components/ink-frame";
import { Badge } from "@/components/ui/badge";

// mangacn tags input: free-text tags as mangacn badges in one hand-drawn field. The chips are a
// list before a plain text input; every add, removal and refusal is announced once in a polite
// live region, and a refusal also shows under the field.

/** How long a repeated announcement waits after the live region is cleared. */
const REANNOUNCE_MS = 100;

/** Built-in words, each overridable through `labels`. */
const defaultLabels = {
  remove: (tag: string) => `Remove ${tag}`,
  added: (tag: string) => `${tag} added`,
  removed: (tag: string) => `${tag} removed`,
  duplicate: (tag: string) => `${tag} is already added`,
  limit: (max: number) => `Up to ${max} tags`,
  invalid: (tag: string) => `${tag} is not valid`,
};

export interface TagsInputProps
  extends Omit<
    React.ComponentProps<"input">,
    "value" | "defaultValue" | "onChange" | "type" | "max" | "name" | "disabled"
  > {
  /** The tags, controlled. */
  value?: string[];
  /** The tags it starts with, uncontrolled. */
  defaultValue?: string[];
  /** Called with the new list on every add and removal. */
  onValueChange?: (tags: string[]) => void;
  /** The most tags it takes; one more is refused and announced. */
  max?: number;
  /**
   * Keys that add the typed text as a tag; character delimiters also split a paste.
   * @default ["Enter", ","]
   */
  delimiters?: string[];
  /**
   * Takes the same tag twice.
   * @default false
   */
  allowDuplicates?: boolean;
  /** Checks a tag before it is added: `false` refuses it, a string refuses it with that message. */
  validate?: (tag: string) => boolean | string;
  /**
   * Splits a pasted list by the delimiters (and new lines) into tags.
   * @default true
   */
  addOnPaste?: boolean;
  /**
   * Adds the typed text when the input loses focus.
   * @default false
   */
  addOnBlur?: boolean;
  /**
   * Turns the field and its remove buttons off.
   * @default false
   */
  disabled?: boolean;
  /** The form field name; one hidden input per tag posts with a plain `<form>`. */
  name?: string;
  /**
   * The remove buttons' names, the announcements and the refusal messages.
   * @default { remove: (tag) => `Remove ${tag}`, added: (tag) => `${tag} added`, removed: (tag) => `${tag} removed`, duplicate: (tag) => `${tag} is already added`, limit: (max) => `Up to ${max} tags`, invalid: (tag) => `${tag} is not valid` }
   */
  labels?: Partial<typeof defaultLabels>;
  /** Classes for the root, which fills its container. */
  className?: string;
}

export function TagsInput({
  value,
  defaultValue,
  onValueChange,
  max,
  delimiters = ["Enter", ","],
  allowDuplicates = false,
  validate,
  addOnPaste = true,
  addOnBlur = false,
  disabled = false,
  name,
  labels,
  className,
  id,
  placeholder,
  "aria-describedby": describedBy,
  "aria-invalid": ariaInvalid,
  onKeyDown,
  onPaste,
  onBlur,
  ...props
}: TagsInputProps) {
  const words = { ...defaultLabels, ...labels };
  const [inner, setInner] = React.useState<string[]>(defaultValue ?? []);
  const tags = value ?? inner;
  const [draft, setDraft] = React.useState("");
  const [error, setError] = React.useState("");
  const [announcement, setAnnouncement] = React.useState("");
  const announceTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  React.useEffect(() => () => clearTimeout(announceTimer.current), []);
  // The same text twice in a row would not change the live region, so it would be read once:
  // clear the region, then set the text again a moment later. A new text is set at once.
  const announce = (text: string) => {
    clearTimeout(announceTimer.current);
    if (text !== announcement || !text) {
      setAnnouncement(text);
      return;
    }
    setAnnouncement("");
    announceTimer.current = setTimeout(() => setAnnouncement(text), REANNOUNCE_MS);
  };
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);
  const errorId = React.useId();

  const commit = (next: string[]) => {
    if (value === undefined) setInner(next);
    onValueChange?.(next);
  };

  /** Adds each candidate in turn; returns whether every one was taken. */
  const add = (candidates: string[]) => {
    const next = [...tags];
    const added: string[] = [];
    let refusal = "";
    for (const candidate of candidates) {
      const tag = candidate.trim();
      if (!tag) continue;
      if (max !== undefined && next.length >= max) {
        refusal = words.limit(max);
        break;
      }
      if (!allowDuplicates && next.includes(tag)) {
        refusal = words.duplicate(tag);
        continue;
      }
      const verdict = validate?.(tag) ?? true;
      if (verdict !== true) {
        refusal = typeof verdict === "string" ? verdict : words.invalid(tag);
        continue;
      }
      next.push(tag);
      added.push(tag);
    }
    if (added.length > 0) commit(next);
    setError(refusal);
    announce([...added.map(words.added), refusal].filter(Boolean).join(". "));
    return refusal === "";
  };

  const remove = (index: number) => {
    const tag = tags[index];
    commit(tags.filter((_, i) => i !== index));
    setError("");
    announce(words.removed(tag));
  };

  const removeButtons = () => [
    ...(listRef.current?.querySelectorAll<HTMLButtonElement>(
      '[data-slot="tags-input-tag-remove"]',
    ) ?? []),
  ];

  const charDelimiters = delimiters.filter((d) => d.length === 1);
  const splitPattern = new RegExp(
    `[${["\n", "\r", ...charDelimiters].map((d) => d.replace(/[\\\]^-]/g, "\\$&")).join("")}]`,
  );

  const invalid = ariaInvalid === true || ariaInvalid === "true" || error !== "";

  return (
    <div data-slot="tags-input" className={cn("flex w-full min-w-0 flex-col gap-1", className)}>
      {/* biome-ignore lint/a11y/noStaticElementInteractions lint/a11y/useKeyWithClickEvents: a click on the frame's padding focuses the input, which takes the keys itself. */}
      <div
        data-disabled={disabled ? "" : undefined}
        data-invalid={invalid ? "" : undefined}
        className="group/tags-input relative isolate flex min-h-8 w-full min-w-0 cursor-text flex-wrap items-center gap-1 rounded-lg px-1.5 py-1 has-[input:focus-visible]:ring-3 has-[input:focus-visible]:ring-ring/50 data-disabled:cursor-not-allowed data-disabled:halftone-light data-disabled:text-muted-foreground data-invalid:ring-3 data-invalid:ring-destructive/20 data-invalid:[--ink:var(--destructive)] dark:data-invalid:ring-destructive/40"
        onClick={(event) => {
          if (event.target === event.currentTarget) inputRef.current?.focus();
        }}
      >
        <InkFrame
          as="span"
          fill="paper"
          className="pointer-events-none absolute inset-0 -z-1 rounded-lg group-data-disabled/tags-input:[--paper:transparent]"
        />
        {tags.length > 0 && (
          // biome-ignore lint/a11y/noRedundantRoles: `display: contents` drops the implicit role in some browsers.
          <ul ref={listRef} role="list" className="contents">
            {tags.map((tag, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: tags may repeat (allowDuplicates); position tells them apart.
              <li key={`${tag}-${index}`} data-slot="tags-input-tag" className="flex min-w-0">
                <Badge
                  variant="outline"
                  className="h-6 max-w-full gap-1 pr-0.5 font-[family-name:inherit] text-xs tracking-normal normal-case"
                >
                  <span className="truncate">{tag}</span>
                  <button
                    type="button"
                    data-slot="tags-input-tag-remove"
                    aria-label={words.remove(tag)}
                    disabled={disabled}
                    className="relative inline-flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-sm outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    onClick={() => {
                      remove(index);
                      inputRef.current?.focus();
                    }}
                    onKeyDown={(event) => {
                      const buttons = removeButtons();
                      const at = buttons.indexOf(event.currentTarget);
                      if (event.key === "ArrowLeft" && at > 0) {
                        event.preventDefault();
                        buttons[at - 1].focus();
                      } else if (event.key === "ArrowRight") {
                        event.preventDefault();
                        (buttons[at + 1] ?? inputRef.current)?.focus();
                      }
                    }}
                  >
                    <XIcon aria-hidden="true" />
                  </button>
                </Badge>
              </li>
            ))}
          </ul>
        )}
        <input
          ref={inputRef}
          type="text"
          data-slot="tags-input-input"
          id={id}
          value={draft}
          placeholder={tags.length === 0 ? placeholder : undefined}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          aria-describedby={[describedBy, error && errorId].filter(Boolean).join(" ") || undefined}
          className="h-6 min-w-[8ch] flex-1 bg-transparent px-1 text-base outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed md:text-sm"
          onChange={(event) => {
            setDraft(event.target.value);
            setError("");
          }}
          onKeyDown={(event) => {
            onKeyDown?.(event);
            if (event.defaultPrevented || event.nativeEvent.isComposing) return;
            const input = event.currentTarget;
            if (delimiters.includes(event.key)) {
              if (event.key === "Enter" && draft.trim() === "") return;
              event.preventDefault();
              if (add([draft])) setDraft("");
            } else if (event.key === "Backspace" && draft === "" && tags.length > 0) {
              event.preventDefault();
              remove(tags.length - 1);
            } else if (
              event.key === "ArrowLeft" &&
              input.selectionStart === 0 &&
              input.selectionEnd === 0 &&
              tags.length > 0
            ) {
              event.preventDefault();
              removeButtons().at(-1)?.focus();
            }
          }}
          onPaste={(event) => {
            onPaste?.(event);
            if (event.defaultPrevented || !addOnPaste) return;
            const text = event.clipboardData.getData("text");
            if (!splitPattern.test(text)) return;
            event.preventDefault();
            // The typed draft joins the paste, so "a" then a pasted "b, c" adds all three.
            add(
              `${draft}
${text}`.split(splitPattern),
            );
            setDraft("");
          }}
          onBlur={(event) => {
            onBlur?.(event);
            if (addOnBlur && draft.trim() !== "" && add([draft])) setDraft("");
          }}
          {...props}
        />
      </div>
      {error && (
        <p id={errorId} data-slot="tags-input-error" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {/* A disabled field posts nothing, as a native disabled control. */}
      {name &&
        !disabled &&
        tags.map((tag, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: tags may repeat (allowDuplicates); position tells them apart.
          <input key={`${tag}-${index}`} type="hidden" name={name} value={tag} />
        ))}
      {/* One polite announcement per add, removal or refusal. */}
      <span role="status" className="sr-only">
        {announcement}
      </span>
    </div>
  );
}
