import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectDemosAccessible } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from "./attachment";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const framesOf = (element: HTMLElement | null) => [
  ...(element?.querySelectorAll<HTMLElement>(':scope > [data-slot="ink-frame"]') ?? []),
];

function Row(props: Partial<React.ComponentProps<typeof Attachment>>) {
  return (
    <AttachmentGroup data-testid="group">
      <Attachment data-testid="attachment" className="custom-class" {...props}>
        <AttachmentMedia data-testid="media">M</AttachmentMedia>
        <AttachmentContent data-testid="content">
          <AttachmentTitle data-testid="title">page-01.png</AttachmentTitle>
          <AttachmentDescription data-testid="description">1.1 MB</AttachmentDescription>
        </AttachmentContent>
        <AttachmentActions data-testid="actions">
          <AttachmentAction aria-label="Remove">x</AttachmentAction>
        </AttachmentActions>
        <AttachmentTrigger aria-label="Open page-01.png" />
      </Attachment>
    </AttachmentGroup>
  );
}

describe("Attachment", () => {
  it("renders stock slots and state attributes with a forwarded className", () => {
    render(<Row size="sm" orientation="vertical" />);
    const attachment = screen.getByTestId("attachment");
    expect(attachment.getAttribute("data-slot")).toBe("attachment");
    expect(attachment.getAttribute("data-state")).toBe("done");
    expect(attachment.getAttribute("data-size")).toBe("sm");
    expect(attachment.getAttribute("data-orientation")).toBe("vertical");
    expect(attachment.classList.contains("custom-class")).toBe(true);
    const slots = {
      group: "attachment-group",
      media: "attachment-media",
      content: "attachment-content",
      title: "attachment-title",
      description: "attachment-description",
      actions: "attachment-actions",
    };
    for (const [id, slot] of Object.entries(slots)) {
      expect(screen.getByTestId(id).getAttribute("data-slot"), id).toBe(slot);
    }
    expect(screen.getByRole("button", { name: "Remove" }).getAttribute("data-slot")).toBe(
      "attachment-action",
    );
    const trigger = screen.getByRole("button", { name: "Open page-01.png" });
    expect(trigger.getAttribute("data-slot")).toBe("attachment-trigger");
    expect(trigger.getAttribute("type")).toBe("button");
  });

  it("draws an outlined paper card as its first child, with no CSS border", () => {
    render(<Row />);
    const attachment = screen.getByTestId("attachment");
    const [frame] = framesOf(attachment);
    expect(attachment.firstElementChild).toBe(frame);
    expect(frame?.getAttribute("data-fill")).toBe("paper");
    expect(attachment.classList.contains("border-0")).toBe(true);
    expect(attachment.classList.contains("border")).toBe(false);
  });

  it("dashes the outline while idle and inks it spot on error", () => {
    const dashed = (state: "idle" | "done") => {
      const observers = stubResizeObserver();
      render(<Row state={state} />);
      observers.drawAll(200, 56);
      const frame = framesOf(screen.getByTestId("attachment"))[0];
      const result = frame?.querySelector("svg [stroke-dasharray]") !== null;
      expect(frame?.className).not.toContain("[--ink:var(--spot)]");
      cleanup();
      vi.unstubAllGlobals();
      return result;
    };
    expect(dashed("idle")).toBe(true);
    expect(dashed("done")).toBe(false);
    render(<Row state="error" />);
    const error = framesOf(screen.getByTestId("attachment"))[0];
    expect(error?.className).toContain("[--ink:var(--spot)]");
    expect(screen.getByTestId("description").className).toContain(
      "group-data-[state=error]/attachment:text-destructive",
    );
    expect(screen.getByTestId("description").className).not.toContain("/80");
  });

  it("frames the media last, over the picture, in a thinner pen", () => {
    render(<Row />);
    const media = screen.getByTestId("media");
    const [frame] = framesOf(media);
    expect(media.lastElementChild).toBe(frame);
    expect(frame?.getAttribute("data-fill")).toBe("none");
    expect(frame?.classList.contains("z-1")).toBe(true);
    expect(media.classList.contains("overflow-hidden")).toBe(false);
  });

  it("pulses the preview, not the text, while uploading, only where motion is allowed", () => {
    render(<Row state="uploading" />);
    expect(screen.getByTestId("media").className).toContain(
      "group-data-[state=uploading]/attachment:motion-safe:animate-pulse",
    );
    const title = screen.getByTestId("title");
    expect(title.className).not.toContain("animate-pulse");
    expect(title.className).not.toContain("shimmer");
  });

  it("uses mangacn's ghost icon button for actions", () => {
    render(<Row />);
    const action = screen.getByRole("button", { name: "Remove" });
    expect(action.className).toContain("size-6");
  });

  it("scrolls the group without a gradient fade", () => {
    render(<Row />);
    const group = screen.getByTestId("group");
    expect(group.className).not.toContain("scroll-fade");
    expect(group.classList.contains("overflow-x-auto")).toBe(true);
  });

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
});
