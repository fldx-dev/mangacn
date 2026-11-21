import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Editor } from "@tiptap/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectDemosAccessible } from "@/lib/test/axe";
import { RichTextEditor, RichTextEditorContent, RichTextEditorToolbar } from "./rich-text-editor";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const textbox = () => screen.getByRole("textbox");
const tool = (name: string) => screen.getByRole("button", { name });

/** The tiptap editor behind the mounted region (ProseMirror keeps it on its element). */
async function mounted(): Promise<Editor> {
  let editor: Editor | undefined;
  await waitFor(() => {
    editor = (textbox() as HTMLElement & { editor?: Editor }).editor;
    expect(editor).toBeDefined();
  });
  return editor as Editor;
}

describe("RichTextEditor", () => {
  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));

  it("renders a toolbar over a multiline textbox, both named, in one frame", async () => {
    render(<RichTextEditor aria-label="Note" defaultValue="<p>Hi</p>" />);
    await mounted();
    const toolbar = screen.getByRole("toolbar", { name: "Formatting" });
    expect(textbox().getAttribute("aria-multiline")).toBe("true");
    expect(screen.getByRole("textbox", { name: "Note" })).toBe(textbox());
    expect(textbox().dataset.slot).toBe("rich-text-editor-input");
    const root = document.querySelector('[data-slot="rich-text-editor"]');
    expect(root?.firstElementChild?.getAttribute("data-slot")).toBe("ink-frame");
    expect(root?.contains(toolbar)).toBe(true);
    const names = [...toolbar.querySelectorAll("button")].map((b) => b.getAttribute("aria-label"));
    expect(names).toEqual([
      "Bold",
      "Italic",
      "Strikethrough",
      "Code",
      "Heading 2",
      "Heading 3",
      "Bullet list",
      "Numbered list",
      "Quote",
      "Horizontal rule",
      "Undo",
      "Redo",
    ]);
  });

  it("gives every toggle a pressed state and every shortcut tool its keys", async () => {
    render(<RichTextEditor aria-label="Note" />);
    await mounted();
    for (const name of ["Bold", "Italic", "Strikethrough", "Code", "Heading 2", "Quote"]) {
      expect(tool(name).getAttribute("aria-pressed"), name).toBe("false");
    }
    expect(tool("Bold").getAttribute("aria-keyshortcuts")).toBe("Control+B Meta+B");
    expect(tool("Numbered list").getAttribute("aria-keyshortcuts")).toBe(
      "Control+Shift+7 Meta+Shift+7",
    );
    expect(tool("Undo").getAttribute("aria-keyshortcuts")).toBe("Control+Z Meta+Z");
    // Actions are not toggles: no pressed state, and undo starts off.
    expect(tool("Undo").hasAttribute("aria-pressed")).toBe(false);
    expect(tool("Undo").getAttribute("aria-disabled")).toBe("true");
  });

  it("is one tab stop with roving arrows across the groups", async () => {
    render(<RichTextEditor aria-label="Note" />);
    await mounted();
    const buttons = [...screen.getByRole("toolbar").querySelectorAll("button")];
    expect(buttons.filter((b) => b.tabIndex === 0)).toHaveLength(1);
    act(() => buttons[3].focus());
    act(() => {
      fireEvent.keyDown(buttons[3], { key: "ArrowRight" });
    });
    await waitFor(() => expect(document.activeElement).toBe(tool("Heading 2")));
    act(() => {
      fireEvent.keyDown(document.activeElement as Element, { key: "ArrowLeft" });
    });
    await waitFor(() => expect(document.activeElement).toBe(tool("Code")));
    // From the first tool, ArrowLeft wraps to the last, which stays focusable while off.
    act(() => tool("Bold").focus());
    act(() => {
      fireEvent.keyDown(tool("Bold"), { key: "ArrowLeft" });
    });
    await waitFor(() => expect(document.activeElement).toBe(tool("Redo")));
  });

  it("follows the selection: a bold word presses Bold, a heading presses Heading 2", async () => {
    render(
      <RichTextEditor
        aria-label="Note"
        defaultValue="<h2>Title</h2><p><strong>Ink</strong> and paper</p>"
      />,
    );
    const editor = await mounted();
    act(() => {
      editor.commands.setTextSelection(3);
    });
    expect(tool("Heading 2").getAttribute("aria-pressed")).toBe("true");
    expect(tool("Bold").getAttribute("aria-pressed")).toBe("false");
    act(() => {
      editor.commands.setTextSelection(9);
    });
    expect(tool("Heading 2").getAttribute("aria-pressed")).toBe("false");
    expect(tool("Bold").getAttribute("aria-pressed")).toBe("true");
  });

  it("applies a tool to the selection and emits the HTML with the text", async () => {
    const onValueChange = vi.fn();
    render(
      <RichTextEditor aria-label="Note" defaultValue="<p>Ink</p>" onValueChange={onValueChange} />,
    );
    const editor = await mounted();
    act(() => {
      editor.commands.selectAll();
    });
    fireEvent.click(tool("Bold"));
    expect(onValueChange).toHaveBeenLastCalledWith("<p><strong>Ink</strong></p>", { text: "Ink" });
    expect(tool("Bold").getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(tool("Bullet list"));
    expect(onValueChange).toHaveBeenLastCalledWith(
      "<ul><li><p><strong>Ink</strong></p></li></ul>",
      { text: "Ink" },
    );
    expect(tool("Undo").getAttribute("aria-disabled")).toBe("false");
    fireEvent.click(tool("Undo"));
    expect(onValueChange).toHaveBeenLastCalledWith("<p><strong>Ink</strong></p>", { text: "Ink" });
  });

  it("emits an empty string, not an empty paragraph, when the text is cleared", async () => {
    const onValueChange = vi.fn();
    render(
      <RichTextEditor aria-label="Note" defaultValue="<p>Ink</p>" onValueChange={onValueChange} />,
    );
    const editor = await mounted();
    act(() => {
      editor.commands.clearContent(true);
    });
    expect(onValueChange).toHaveBeenLastCalledWith("", { text: "" });
  });

  it("posts the HTML through a hidden input under name, and nothing when disabled", async () => {
    const { rerender } = render(
      <form data-testid="form">
        <RichTextEditor aria-label="Note" name="note" defaultValue="<p>Ink</p>" />
      </form>,
    );
    const editor = await mounted();
    const form = () => new FormData(screen.getByTestId("form") as HTMLFormElement);
    expect(form().get("note")).toBe("<p>Ink</p>");
    act(() => {
      editor.commands.selectAll();
      editor.commands.toggleItalic();
    });
    expect(form().get("note")).toBe("<p><em>Ink</em></p>");
    rerender(
      <form data-testid="form">
        <RichTextEditor aria-label="Note" name="note" defaultValue="<p>Ink</p>" disabled />
      </form>,
    );
    expect(form().get("note")).toBeNull();
  });

  it("is controlled with value", async () => {
    const onValueChange = vi.fn();
    const { rerender } = render(
      <RichTextEditor aria-label="Note" value="<p>One</p>" onValueChange={onValueChange} />,
    );
    const editor = await mounted();
    rerender(<RichTextEditor aria-label="Note" value="<p>Two</p>" onValueChange={onValueChange} />);
    expect(editor.getHTML()).toBe("<p>Two</p>");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("puts id, aria-invalid and aria-describedby on the region, and updates them", async () => {
    const { rerender } = render(
      <>
        <label id="note-label" htmlFor="note">
          Note
        </label>
        <RichTextEditor id="note" aria-labelledby="note-label" aria-describedby="note-hint" />
      </>,
    );
    const editor = await mounted();
    const field = screen.getByRole("textbox", { name: "Note" });
    expect(field.id).toBe("note");
    expect(field.getAttribute("aria-invalid")).toBeNull();
    rerender(
      <>
        <label id="note-label" htmlFor="note">
          Note
        </label>
        <RichTextEditor
          id="note"
          aria-labelledby="note-label"
          aria-describedby="note-hint note-error"
          aria-invalid
        />
      </>,
    );
    await waitFor(() => expect(textbox().getAttribute("aria-invalid")).toBe("true"));
    expect(textbox().getAttribute("aria-describedby")).toBe("note-hint note-error");
    // A click on the label focuses the region.
    fireEvent.click(screen.getByText("Note"));
    await waitFor(() => expect(document.activeElement).toBe(textbox()));
    expect(editor.isFocused).toBe(true);
  });

  it("lets Tab leave a list item instead of indenting it", async () => {
    render(
      <RichTextEditor
        aria-label="Note"
        defaultValue="<ul><li><p>A</p></li><li><p>B</p></li></ul>"
      />,
    );
    const editor = await mounted();
    act(() => {
      editor.commands.setTextSelection(7);
    });
    const event = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
    act(() => {
      textbox().dispatchEvent(event);
    });
    expect(event.defaultPrevented).toBe(false);
    expect(editor.getHTML()).toBe("<ul><li><p>A</p></li><li><p>B</p></li></ul>");
  });

  it("turns editing off when disabled, and reads only without a toolbar when not editable", async () => {
    const { rerender } = render(<RichTextEditor aria-label="Note" defaultValue="<p>Ink</p>" />);
    const editor = await mounted();
    rerender(<RichTextEditor aria-label="Note" defaultValue="<p>Ink</p>" disabled />);
    await waitFor(() => expect(editor.isEditable).toBe(false));
    expect(textbox().getAttribute("aria-disabled")).toBe("true");
    expect((tool("Bold") as HTMLButtonElement).disabled).toBe(true);
    cleanup();
    render(<RichTextEditor aria-label="Note" defaultValue="<p>Ink</p>" editable={false} />);
    const readonly = await mounted();
    expect(readonly.isEditable).toBe(false);
    expect(textbox().getAttribute("aria-readonly")).toBe("true");
    expect(screen.queryByRole("toolbar")).toBeNull();
  });

  it("shows the placeholder only while empty", async () => {
    render(<RichTextEditor aria-label="Note" placeholder="Write something" />);
    const editor = await mounted();
    const placeholder = () => document.querySelector('[data-slot="rich-text-editor-placeholder"]');
    expect(placeholder()?.textContent).toBe("Write something");
    expect(textbox().getAttribute("aria-placeholder")).toBe("Write something");
    act(() => {
      editor.commands.insertContent("Ink");
    });
    expect(placeholder()).toBeNull();
  });

  it("takes a custom layout from the exported parts", async () => {
    render(
      <RichTextEditor aria-label="Note">
        <RichTextEditorContent className="custom-content" />
        <RichTextEditorToolbar aria-label="Tools" />
      </RichTextEditor>,
    );
    await mounted();
    const content = document.querySelector('[data-slot="rich-text-editor-content"]') as Element;
    expect(content.classList.contains("custom-content")).toBe(true);
    expect(
      content.compareDocumentPosition(screen.getByRole("toolbar", { name: "Tools" })) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("prerenders the HTML statically, in the same region, before tiptap mounts", () => {
    const html = renderToString(
      <RichTextEditor aria-label="Note" defaultValue="<h2>Title</h2><p><strong>Ink</strong></p>" />,
    );
    expect(html).toContain('role="textbox"');
    expect(html).toContain('aria-label="Note"');
    expect(html).toContain('class="ProseMirror"');
    expect(html).toContain("<h2>Title</h2><p><strong>Ink</strong></p>");
    expect(html).toContain('role="toolbar"');
  });

  it("keeps only the schema's elements in the static HTML", () => {
    const html = renderToString(
      <RichTextEditor
        aria-label="Note"
        defaultValue={`<p onclick="x()">A<script>alert(1)</script><img src=x onerror="alert(2)"><a href="javascript:y">B</a></p><p title=">">C</p>`}
      />,
    );
    expect(html).not.toMatch(/<script|<img|<a |onclick|onerror/);
    // The quote and bracket left of an attribute become text, never markup.
    expect(html).toContain("<p>AB</p><p>&#34;&#62;C</p>");
    expect(renderToString(<RichTextEditor aria-label="Note" />)).toContain("<p><br></p>");
  });

  it("reads no clock in render: the same markup on two different days", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 0, 1, 9, 0));
    const ui = <RichTextEditor aria-label="Note" name="note" defaultValue="<p>Ink</p>" />;
    const first = renderToString(ui);
    vi.setSystemTime(new Date(2031, 6, 15, 23, 30));
    expect(renderToString(ui)).toBe(first);
  });
});
