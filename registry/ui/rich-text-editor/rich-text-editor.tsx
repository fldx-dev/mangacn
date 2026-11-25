"use client";

import { Toolbar as ToolbarPrimitive } from "@base-ui/react/toolbar";
import {
  type Editor,
  EditorContent,
  type UseEditorOptions,
  useEditor,
  useEditorState,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { cn } from "cn";
import {
  BoldIcon,
  CodeIcon,
  Heading2Icon,
  Heading3Icon,
  ItalicIcon,
  ListIcon,
  ListOrderedIcon,
  MinusIcon,
  Redo2Icon,
  StrikethroughIcon,
  TextQuoteIcon,
  Undo2Icon,
} from "lucide-react";
import * as React from "react";
import { InkFrame } from "@/components/ink-frame";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

// mangacn rich text editor: tiptap's StarterKit as the engine, mangacn's toggle groups and
// buttons as the toolbar, one paper InkFrame around it all. No tiptap stylesheet: the content
// is styled through ProseMirror's own elements. tiptap mounts after hydration
// (`immediatelyRender: false`); until then the same HTML renders statically in the same box.

/**
 * StarterKit without the parts the toolbar does not offer (links, underline, code blocks), and
 * without the trailing paragraph it adds after a final list or quote, which would post an empty
 * `<p></p>` and make the mounted editor taller than the static HTML.
 */
const extensions = [
  StarterKit.configure({
    heading: { levels: [2, 3] },
    codeBlock: false,
    link: false,
    underline: false,
    trailingNode: false,
  }),
];

/** Marks by tag, written as the editor writes them. */
const MARKS: Record<string, Mark> = {
  strong: "strong",
  b: "strong",
  em: "em",
  i: "em",
  s: "s",
  del: "s",
  strike: "s",
  code: "code",
};
type Mark = "strong" | "em" | "s" | "code";
/** The schema's mark order (bold, italic, strike), which is the order the editor nests them. */
const MARK_ORDER: Mark[] = ["strong", "em", "s"];
const TEXTBLOCKS = new Set(["p", "h2", "h3"]);
const CONTAINERS = new Set(["ul", "ol", "li", "blockquote"]);
/** prosemirror-model's `blockTags` that the schema has no rule for: each ends a paragraph. */
const FOREIGN_BLOCKS = new Set(
  "address article aside body canvas dd div dl fieldset figcaption figure footer form h1 h4 h5 h6 header hgroup output pre section table tfoot".split(
    " ",
  ),
);
/** Elements whose content the parser ignores (prosemirror-model's `ignoreTags`, and the like). */
const SKIPPED = new Set(
  "head iframe noscript object script style template textarea title".split(" "),
);
/** A tag at the cursor. `[^<>]` stops at the next `<`, so an unclosed `<` costs nothing. */
const TAG = /<(\/?)([a-z][a-z0-9]*)\b[^<>]*>/iy;
/** The whitespace ProseMirror collapses; not U+3000 or a no-break space. */
const WS = "[ \\t\\r\\n\\f]";
const WS_RUN = new RegExp(`${WS}+`, "g");
const NOT_WS = /[^ \t\r\n\f]/;
const escapeText = (text: string) => text.replace(/[<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
/** The static render of an empty editor: one paragraph with the editor's line break. */
const EMPTY_HTML = "<p><br></p>";

/**
 * The HTML shown before the editor mounts, parsed the way tiptap's parser reads it, so the static
 * render takes the editor's shape and height. Stored HTML often comes from users and this path
 * skips tiptap's parser, so it writes only the schema's elements, without attributes, and every
 * other `<`, `>` and quote as text. Inline content outside a paragraph (in the document, a quote
 * or a list item) gets one; other block elements (`div`, `h1`, `pre`…) end the paragraph;
 * whitespace collapses, none at a block's edges, except in a `pre`, whose lines become line
 * breaks; a block that is empty or ends in a line break gets the editor's extra one. One pass,
 * linear in the input's length.
 */
function staticHtml(html: string): string {
  const lower = html.toLowerCase();
  let out = "";
  let block: string | null = null;
  let filled = false;
  /** A collapsed space waiting for the next inline content, with the marks it had. */
  let space: Mark[] | null = null;
  let written: Mark[] = [];
  const markCount: Record<Mark, number> = { strong: 0, em: 0, s: 0, code: 0 };
  const open: string[] = [];
  const openCount: Record<string, number> = { ul: 0, ol: 0, li: 0, blockquote: 0 };
  let pre = 0;
  /** Right after a `<pre>`, where the HTML parser drops one line break. */
  let preStart = false;

  // Code excludes every other mark, as in the schema.
  const activeMarks = (): Mark[] =>
    markCount.code > 0 ? ["code"] : MARK_ORDER.filter((mark) => markCount[mark] > 0);
  const writeMarks = (target: Mark[]) => {
    let same = 0;
    while (same < written.length && written[same] === target[same]) same++;
    while (written.length > same) out += `</${written.pop()}>`;
    for (const mark of target.slice(same)) out += `<${mark}>`;
    written = [...target];
  };
  const closeBlock = () => {
    if (!block) return;
    writeMarks([]);
    // ProseMirror shows an empty block, or a last line break, with a line of its own.
    out += `${!filled || out.endsWith("<br>") ? "<br>" : ""}</${block}>`;
    block = null;
  };
  const push = (name: string) => {
    out += `<${name}>`;
    open.push(name);
    openCount[name]++;
  };
  const openBlock = (name = "p") => {
    closeBlock();
    // Inline content straight in a list gets an item, as the parser gives it.
    const top = open.at(-1);
    if (top === "ul" || top === "ol") push("li");
    out += `<${name}>`;
    block = name;
    filled = false;
    space = null;
  };
  /** Opens a paragraph if none is, writes a pending space with its marks, then the marks. */
  const inline = () => {
    if (!block) openBlock();
    if (space && filled) {
      writeMarks(space);
      out += " ";
    }
    space = null;
    writeMarks(activeMarks());
  };
  const text = (raw: string) => {
    if (pre > 0) {
      // In a pre, whitespace stays and each line break is a hard break.
      const value = preStart ? raw.replace(/^\r?\n|^\r/, "") : raw;
      preStart = false;
      if (!block && !NOT_WS.test(value)) return;
      inline();
      for (const [index, line] of value.split(/\r?\n|\r/).entries()) {
        if (index > 0) out += "<br>";
        out += escapeText(line);
      }
      filled = true;
      return;
    }
    const value = raw.replace(WS_RUN, " ");
    if (value.startsWith(" ") && !space) space = activeMarks();
    if (!NOT_WS.test(value)) return;
    inline();
    out += escapeText(value.replace(/^ | $/g, ""));
    filled = true;
    if (value.endsWith(" ")) space = activeMarks();
  };
  const element = (close: boolean, name: string) => {
    preStart = false;
    const mark = MARKS[name];
    if (mark) {
      if (!close) markCount[mark]++;
      else if (markCount[mark] > 0) markCount[mark]--;
    } else if (name === "br") {
      inline();
      out += "<br>";
      filled = true;
      space = null;
    } else if (TEXTBLOCKS.has(name)) {
      if (close) closeBlock();
      else openBlock(name);
    } else if (CONTAINERS.has(name)) {
      closeBlock();
      if (!close) push(name);
      else if (openCount[name] > 0) {
        while (open.length > 0) {
          const last = open.pop() as string;
          openCount[last]--;
          // An empty item or quote holds one empty paragraph in the editor.
          if ((last === "li" || last === "blockquote") && out.endsWith(`<${last}>`)) {
            out += EMPTY_HTML;
          }
          out += `</${last}>`;
          if (last === name) break;
        }
      }
    } else if (name === "hr") {
      closeBlock();
      out += "<hr>";
    } else if (FOREIGN_BLOCKS.has(name)) {
      closeBlock();
      if (name === "pre") {
        pre = Math.max(0, pre + (close ? -1 : 1));
        preStart = !close;
      }
    }
  };

  let at = 0;
  while (at < html.length) {
    const lt = html.indexOf("<", at);
    if (lt === -1 || lt > at) {
      text(html.slice(at, lt === -1 ? undefined : lt));
      if (lt === -1) break;
      at = lt;
    }
    if (html.startsWith("<!--", at)) {
      const end = html.indexOf("-->", at + 4);
      at = end === -1 ? html.length : end + 3;
      continue;
    }
    TAG.lastIndex = at;
    const tag = TAG.exec(html);
    if (!tag) {
      text("<");
      at++;
      continue;
    }
    at = TAG.lastIndex;
    const close = tag[1] === "/";
    const name = tag[2].toLowerCase();
    if (!close && SKIPPED.has(name)) {
      // Its content is not shown; an unclosed one hides the rest, as in the browser.
      const end = lower.indexOf(`</${name}`, at);
      if (end === -1) break;
      const after = lower.indexOf(">", end);
      at = after === -1 ? html.length : after + 1;
      continue;
    }
    element(close, name);
  }
  closeBlock();
  while (open.length > 0) out += `</${open.pop()}>`;
  return out || EMPTY_HTML;
}

/** The editor's HTML, or "" when it holds no text, so a required check sees an empty field. */
const htmlOf = (editor: Editor) => (editor.isEmpty ? "" : editor.getHTML());

const subscribeToNothing = () => () => {};

/** `false` in a server or prerender render and while hydrating, `true` on the client after. */
const useIsClient = () =>
  React.useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );

/**
 * Runs `useEditor` and hands the editor up. It renders only on the client: `useEditor` calls
 * `Math.random()` while rendering, which under `cacheComponents` would end the prerendered shell
 * at the editor, so the server render holds the static HTML alone.
 */
function EditorEngine({
  options,
  onEditor,
}: {
  options: UseEditorOptions;
  onEditor: (editor: Editor | null) => void;
}) {
  const editor = useEditor(options);
  React.useEffect(() => {
    onEditor(editor);
    return () => onEditor(null);
  }, [editor, onEditor]);
  return null;
}

/** What `onValueChange` passes besides the HTML. */
export interface RichTextEditorChangeDetails {
  /** The text without markup or line breaks, for character counters and length checks. */
  text: string;
}

interface RichTextEditorContextValue {
  editor: Editor | null;
  /** The HTML of the last render, shown statically until the editor mounts. */
  html: string;
  /** `html` as the static render shows it (`staticHtml`), computed once per change. */
  rendered: string;
  placeholder?: string;
  disabled: boolean;
  editable: boolean;
  /** The editable region's attributes: role, name, description, state. */
  attributes: Record<string, string>;
}

const RichTextEditorContext = React.createContext<RichTextEditorContextValue | null>(null);

function useRichTextEditor(part: string) {
  const context = React.useContext(RichTextEditorContext);
  if (!context) throw new Error(`${part} must be used inside <RichTextEditor>.`);
  return context;
}

export interface RichTextEditorProps {
  /** The content as HTML, controlled. */
  value?: string;
  /** The content as HTML it starts with, uncontrolled. */
  defaultValue?: string;
  /** Called with the HTML ("" when empty) and its text on every change. */
  onValueChange?: (html: string, details: RichTextEditorChangeDetails) => void;
  /** The form field name; a hidden input posts the HTML with a plain `<form>`. */
  name?: string;
  /** A muted line shown while the editor is empty. */
  placeholder?: string;
  /**
   * Turns the editor and its toolbar off; a disabled editor posts nothing.
   * @default false
   */
  disabled?: boolean;
  /**
   * `false` renders the content read-only, without the toolbar; it still posts.
   * @default true
   */
  editable?: boolean;
  /** The editable region's id. A `<label>` cannot name it: pair the label with `aria-labelledby`. */
  id?: string;
  "aria-label"?: string;
  /** The id of the visible label, such as a `FieldLabel`. */
  "aria-labelledby"?: string;
  /** Ids of the description and error, such as `FieldDescription` and `FieldError`. */
  "aria-describedby"?: string;
  "aria-invalid"?: boolean | "true" | "false";
  /** The toolbar and content, for a custom layout. Defaults to the toolbar over the content. */
  children?: React.ReactNode;
  /** Classes for the frame, which fills its container. */
  className?: string;
}

export function RichTextEditor({
  value,
  defaultValue = "",
  onValueChange,
  name,
  placeholder,
  disabled = false,
  editable = true,
  id,
  "aria-label": ariaLabel,
  "aria-labelledby": labelledBy,
  "aria-describedby": describedBy,
  "aria-invalid": ariaInvalid,
  children,
  className,
}: RichTextEditorProps) {
  const [inner, setInner] = React.useState(defaultValue);
  const html = value ?? inner;
  // The static render and the empty check read it; one pass per change, not per use.
  const rendered = React.useMemo(() => staticHtml(html), [html]);
  const invalid = ariaInvalid === true || ariaInvalid === "true";
  const canEdit = editable && !disabled;

  const attributes = React.useMemo(() => {
    const entries: Record<string, string | undefined> = {
      id,
      role: "textbox",
      "aria-multiline": "true",
      "aria-label": ariaLabel,
      "aria-labelledby": labelledBy,
      "aria-describedby": describedBy,
      "aria-invalid": invalid ? "true" : undefined,
      "aria-placeholder": placeholder,
      "aria-readonly": !editable ? "true" : undefined,
      "aria-disabled": disabled ? "true" : undefined,
      "data-slot": "rich-text-editor-input",
    };
    return Object.fromEntries(
      Object.entries(entries).filter((entry): entry is [string, string] => entry[1] !== undefined),
    );
  }, [id, ariaLabel, labelledBy, describedBy, invalid, placeholder, editable, disabled]);

  // The latest callback and value, read by tiptap's handlers without recreating the editor. Synced
  // after each commit, not while rendering: the handlers run only in events and effects.
  const latest = React.useRef({ onValueChange, controlled: value !== undefined, html });
  React.useLayoutEffect(() => {
    latest.current = { onValueChange, controlled: value !== undefined, html };
  });

  const client = useIsClient();
  const [editor, setEditor] = React.useState<Editor | null>(null);
  const options: UseEditorOptions = {
    immediatelyRender: false,
    // No tiptap stylesheet in the page: proseClasses carries the rules it would inject.
    injectCSS: false,
    extensions,
    content: html,
    editable: canEdit,
    editorProps: {
      attributes,
      handleDOMEvents: {
        // Tab and Shift-Tab leave the editor: returning true skips the list keymap (which
        // would indent the item) and leaves the browser's own focus move alone.
        keydown: (_view, event) =>
          event.key === "Tab" && !event.ctrlKey && !event.metaKey && !event.altKey,
      },
    },
    onUpdate: ({ editor }) => {
      const next = htmlOf(editor);
      if (next === latest.current.html) return;
      latest.current.html = next;
      if (!latest.current.controlled) setInner(next);
      latest.current.onValueChange?.(next, { text: editor.state.doc.textContent });
    },
  };

  // useEditor passes changed options (the attributes above) to the editor on each render, but
  // keeps its editable flag: that one is set here.
  React.useEffect(() => {
    if (editor && editor.isEditable !== canEdit) editor.setEditable(canEdit, false);
  }, [editor, canEdit]);

  // A `<label for>` cannot focus a contenteditable region by itself: a click on it does here.
  React.useEffect(() => {
    if (!editor || !id) return;
    const focus = () => editor.commands.focus();
    const labels = document.querySelectorAll(`label[for="${CSS.escape(id)}"]`);
    for (const label of labels) label.addEventListener("click", focus);
    return () => {
      for (const label of labels) label.removeEventListener("click", focus);
    };
  }, [editor, id]);

  // A controlled value from outside (a reset, a loaded draft) replaces the content; the value
  // the editor itself just emitted is skipped, so typing keeps the cursor.
  React.useEffect(() => {
    if (editor && value !== undefined && value !== htmlOf(editor)) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  const context = React.useMemo(
    () => ({ editor, html, rendered, placeholder, disabled, editable, attributes }),
    [editor, html, rendered, placeholder, disabled, editable, attributes],
  );

  return (
    <RichTextEditorContext.Provider value={context}>
      <div
        data-slot="rich-text-editor"
        data-disabled={disabled ? "" : undefined}
        data-invalid={invalid ? "" : undefined}
        className={cn(
          "group/rich-text-editor relative isolate flex w-full min-w-0 flex-col rounded-lg has-[[role=textbox]:focus]:ring-3 has-[[role=textbox]:focus]:ring-ring/50 data-disabled:cursor-not-allowed data-disabled:halftone-light data-disabled:text-muted-foreground data-invalid:ring-3 data-invalid:ring-destructive/20 dark:data-invalid:ring-destructive/40",
          className,
        )}
      >
        <InkFrame
          as="span"
          fill="paper"
          className="pointer-events-none absolute inset-0 -z-1 rounded-lg group-data-disabled/rich-text-editor:[--paper:transparent] group-data-invalid/rich-text-editor:[--ink:var(--destructive)]"
        />
        {children ?? (
          <>
            {editable && <RichTextEditorToolbar />}
            <RichTextEditorContent />
          </>
        )}
        {client && <EditorEngine options={options} onEditor={setEditor} />}
        {/* A disabled field posts nothing, as a native disabled control. */}
        {name && !disabled && (
          <input type="hidden" name={name} value={rendered === EMPTY_HTML ? "" : html} />
        )}
      </div>
    </RichTextEditorContext.Provider>
  );
}

/** Control and Meta both, since `Mod` is Control on Windows and Linux and Command on macOS. */
const mod = (key: string) => `Control+${key} Meta+${key}`;

type Chain = ReturnType<Editor["chain"]>;

interface Tool {
  value: string;
  label: string;
  icon: React.ComponentType<{ "aria-hidden"?: boolean }>;
  keys?: string;
  active?: (editor: Editor) => boolean;
  run: (chain: Chain) => Chain;
  can?: (editor: Editor) => boolean;
}

const markTools: Tool[] = [
  {
    value: "bold",
    label: "Bold",
    icon: BoldIcon,
    keys: mod("B"),
    active: (e) => e.isActive("bold"),
    run: (c) => c.toggleBold(),
  },
  {
    value: "italic",
    label: "Italic",
    icon: ItalicIcon,
    keys: mod("I"),
    active: (e) => e.isActive("italic"),
    run: (c) => c.toggleItalic(),
  },
  {
    value: "strike",
    label: "Strikethrough",
    icon: StrikethroughIcon,
    keys: mod("Shift+S"),
    active: (e) => e.isActive("strike"),
    run: (c) => c.toggleStrike(),
  },
  {
    value: "code",
    label: "Code",
    icon: CodeIcon,
    keys: mod("E"),
    active: (e) => e.isActive("code"),
    run: (c) => c.toggleCode(),
  },
];

const blockTools: Tool[] = [
  {
    value: "h2",
    label: "Heading 2",
    icon: Heading2Icon,
    keys: mod("Alt+2"),
    active: (e) => e.isActive("heading", { level: 2 }),
    run: (c) => c.toggleHeading({ level: 2 }),
  },
  {
    value: "h3",
    label: "Heading 3",
    icon: Heading3Icon,
    keys: mod("Alt+3"),
    active: (e) => e.isActive("heading", { level: 3 }),
    run: (c) => c.toggleHeading({ level: 3 }),
  },
  {
    value: "bullet-list",
    label: "Bullet list",
    icon: ListIcon,
    keys: mod("Shift+8"),
    active: (e) => e.isActive("bulletList"),
    run: (c) => c.toggleBulletList(),
  },
  {
    value: "ordered-list",
    label: "Numbered list",
    icon: ListOrderedIcon,
    keys: mod("Shift+7"),
    active: (e) => e.isActive("orderedList"),
    run: (c) => c.toggleOrderedList(),
  },
  {
    value: "blockquote",
    label: "Quote",
    icon: TextQuoteIcon,
    keys: mod("Shift+B"),
    active: (e) => e.isActive("blockquote"),
    run: (c) => c.toggleBlockquote(),
  },
];

const actionTools: Tool[] = [
  {
    value: "horizontal-rule",
    label: "Horizontal rule",
    icon: MinusIcon,
    run: (c) => c.setHorizontalRule(),
  },
  {
    value: "undo",
    label: "Undo",
    icon: Undo2Icon,
    keys: mod("Z"),
    run: (c) => c.undo(),
    can: (e) => e.can().undo(),
  },
  {
    value: "redo",
    label: "Redo",
    icon: Redo2Icon,
    keys: `${mod("Shift+Z")} ${mod("Y")}`,
    run: (c) => c.redo(),
    can: (e) => e.can().redo(),
  },
];

const allTools = [...markTools, ...blockTools, ...actionTools];

/** Which tools are pressed and which can run, recomputed on each editor transaction. */
function useToolState(editor: Editor | null) {
  return useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor) return null;
      const pressed: string[] = [];
      const blocked: string[] = [];
      for (const tool of allTools) {
        if (tool.active?.(editor)) pressed.push(tool.value);
        if (tool.can && !tool.can(editor)) blocked.push(tool.value);
      }
      return { pressed, blocked };
    },
  });
}

/** Keeps the editor's selection when the pointer presses a tool. */
const keepSelection = (event: React.MouseEvent) => event.preventDefault();

export interface RichTextEditorToolbarProps {
  /** Classes for the toolbar row, which wraps onto a second row in a narrow field. */
  className?: string;
  /**
   * The toolbar's accessible name.
   * @default "Formatting"
   */
  "aria-label"?: string;
}

export function RichTextEditorToolbar({
  className,
  "aria-label": ariaLabel = "Formatting",
}: RichTextEditorToolbarProps) {
  const { editor, disabled, editable } = useRichTextEditor("RichTextEditorToolbar");
  const state = useToolState(editor);
  // Until the editor mounts the tools render unpressed, in their final places and looks, and do
  // nothing; undo and redo start off, as on a fresh editor. A read-only editor (a custom layout
  // can still show the toolbar) takes no tool.
  const off = disabled || !editable;
  const pressed = state?.pressed ?? [];
  const blocked = state?.blocked ?? ["undo", "redo"];
  const run = (tool: Tool) => {
    if (editor && !off) tool.run(editor.chain()).run();
  };
  const toggles = (tools: Tool[]) => (
    <ToggleGroup
      multiple
      size="sm"
      value={pressed.filter((value) => tools.some((tool) => tool.value === value))}
      disabled={off}
    >
      {tools.map((tool) => (
        <ToggleGroupItem
          key={tool.value}
          value={tool.value}
          aria-label={tool.label}
          aria-keyshortcuts={tool.keys}
          onMouseDown={keepSelection}
          onClick={() => run(tool)}
        >
          <tool.icon aria-hidden />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );

  return (
    <div data-slot="rich-text-editor-toolbar" className="relative">
      <ToolbarPrimitive.Root
        aria-label={ariaLabel}
        disabled={off}
        className={cn("flex flex-wrap items-center gap-1.5 p-1.5", className)}
      >
        {toggles(markTools)}
        {toggles(blockTools)}
        <div className="flex items-center gap-0.5">
          {actionTools.map((tool) => (
            <ToolbarPrimitive.Button
              key={tool.value}
              disabled={off || blocked.includes(tool.value)}
              aria-label={tool.label}
              aria-keyshortcuts={tool.keys}
              onMouseDown={keepSelection}
              onClick={() => run(tool)}
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="data-disabled:pointer-events-none data-disabled:text-muted-foreground"
                />
              }
            >
              <tool.icon aria-hidden />
            </ToolbarPrimitive.Button>
          ))}
        </div>
      </ToolbarPrimitive.Root>
      {/* The hand-drawn rule between the toolbar and the page. */}
      <InkFrame
        as="span"
        shape="line"
        fill="none"
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 block h-(--outline-width)"
      />
    </div>
  );
}

/**
 * Ink prose: ProseMirror's elements, styled from the theme's tokens only. tiptap injects no CSS
 * (`injectCSS: false`); the rules ProseMirror needs from it are here as utilities, on the static
 * render too: its whitespace and ligatures, the zero-size separator image, a hidden selection
 * for a selected rule, and the gap cursor as an ink line, shown only while the editor has focus.
 */
const proseClasses =
  "relative text-base md:text-sm [&_.ProseMirror]:relative [&_.ProseMirror]:min-h-24 [&_.ProseMirror]:px-3 [&_.ProseMirror]:py-2 [&_.ProseMirror]:break-words [&_.ProseMirror]:whitespace-break-spaces [&_.ProseMirror]:[font-variant-ligatures:none] [&_.ProseMirror]:[font-feature-settings:'liga'_0] [&_.ProseMirror]:outline-none [&_img.ProseMirror-separator]:inline! [&_img.ProseMirror-separator]:size-0! [&_img.ProseMirror-separator]:m-0! [&_img.ProseMirror-separator]:border-0! [&_.ProseMirror-hideselection_*]:caret-transparent [&_.ProseMirror-hideselection_*]:selection:bg-transparent [&_.ProseMirror-gapcursor]:pointer-events-none [&_.ProseMirror-gapcursor]:absolute [&_.ProseMirror-gapcursor]:m-0 [&_.ProseMirror-gapcursor]:hidden [&_.ProseMirror-focused_.ProseMirror-gapcursor]:block [&_.ProseMirror-gapcursor]:after:absolute [&_.ProseMirror-gapcursor]:after:-top-0.5 [&_.ProseMirror-gapcursor]:after:block [&_.ProseMirror-gapcursor]:after:w-5 [&_.ProseMirror-gapcursor]:after:border-t-(length:--outline-width) [&_.ProseMirror-gapcursor]:after:border-ink [&_.ProseMirror>*+*]:mt-2 [&_h2]:font-display [&_h2]:text-xl [&_h2]:leading-tight [&_h2]:tracking-wide [&_h3]:font-display [&_h3]:text-lg [&_h3]:leading-tight [&_h3]:tracking-wide [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li>p]:my-0.5 [&_blockquote]:border-l-(length:--outline-width-heavy) [&_blockquote]:border-ink [&_blockquote]:pl-3 [&_blockquote]:italic [&_code]:rounded-sm [&_code]:bg-muted [&_code]:px-1 [&_code]:font-mono [&_code]:text-[0.9em] [&_hr]:my-3 [&_hr]:border-0 [&_hr]:border-t-(length:--outline-width) [&_hr]:border-ink [&_s]:decoration-ink";

export interface RichTextEditorContentProps {
  /** Classes for the content area; the editable region inside grows with its text. */
  className?: string;
}

export function RichTextEditorContent({ className }: RichTextEditorContentProps) {
  const { editor, rendered, placeholder, attributes } = useRichTextEditor("RichTextEditorContent");
  const empty =
    useEditorState({ editor, selector: ({ editor }) => editor?.isEmpty ?? null }) ??
    rendered === EMPTY_HTML;
  return (
    <div data-slot="rich-text-editor-content" className={cn(proseClasses, className)}>
      {editor ? (
        <EditorContent editor={editor} />
      ) : (
        // The same element tiptap mounts, with the same attributes, so nothing moves on hydrate.
        <div>
          <div
            {...attributes}
            className="ProseMirror"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: staticHtml keeps only the schema's elements, without attributes.
            dangerouslySetInnerHTML={{ __html: rendered }}
          />
        </div>
      )}
      {empty && placeholder && (
        <span
          aria-hidden="true"
          data-slot="rich-text-editor-placeholder"
          className="pointer-events-none absolute top-2 left-3 text-muted-foreground"
        >
          {placeholder}
        </span>
      )}
    </div>
  );
}
