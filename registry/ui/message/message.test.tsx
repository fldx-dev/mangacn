import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { expectDemosAccessible } from "@/lib/test/axe";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
  MessageHeader,
} from "./message";

afterEach(() => {
  cleanup();
});

describe("Message", () => {
  it("renders stock slots with forwarded classNames and an alignment", () => {
    render(
      <MessageGroup data-testid="group" className="group-class">
        <Message data-testid="message" align="end" className="message-class">
          <MessageAvatar data-testid="avatar">A</MessageAvatar>
          <MessageContent data-testid="content">
            <MessageHeader data-testid="header">Ren</MessageHeader>
            <MessageFooter data-testid="footer">21:04</MessageFooter>
          </MessageContent>
        </Message>
      </MessageGroup>,
    );
    const slots = {
      group: "message-group",
      message: "message",
      avatar: "message-avatar",
      content: "message-content",
      header: "message-header",
      footer: "message-footer",
    };
    for (const [id, slot] of Object.entries(slots)) {
      expect(screen.getByTestId(id).getAttribute("data-slot"), id).toBe(slot);
    }
    const message = screen.getByTestId("message");
    expect(message.getAttribute("data-align")).toBe("end");
    expect(message.classList.contains("message-class")).toBe(true);
    expect(screen.getByTestId("group").classList.contains("group-class")).toBe(true);
  });

  it("defaults to start alignment", () => {
    render(<Message data-testid="message" />);
    expect(screen.getByTestId("message").getAttribute("data-align")).toBe("start");
  });

  it("draws nothing of its own and leaves the avatar unclipped, with no grey fill", () => {
    const { container } = render(
      <Message>
        <MessageAvatar data-testid="avatar">A</MessageAvatar>
        <MessageContent>Hi</MessageContent>
      </Message>,
    );
    expect(container.querySelector('[data-slot="ink-frame"]')).toBeNull();
    const avatar = screen.getByTestId("avatar");
    expect(avatar.classList.contains("overflow-hidden")).toBe(false);
    expect(avatar.classList.contains("bg-muted")).toBe(false);
  });

  it("sets the header in the display face at a small size, footer in muted text", () => {
    render(
      <Message>
        <MessageContent>
          <MessageHeader data-testid="header">Ren</MessageHeader>
          <MessageFooter data-testid="footer">Read</MessageFooter>
        </MessageContent>
      </Message>,
    );
    const header = screen.getByTestId("header");
    expect(header.classList.contains("font-display")).toBe(true);
    expect(header.classList.contains("text-xs")).toBe(true);
    expect(screen.getByTestId("footer").classList.contains("text-muted-foreground")).toBe(true);
  });

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
});
