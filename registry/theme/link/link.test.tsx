import { cleanup, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { expectVariantsAccessible } from "@/lib/test/axe";
import { Link } from "./link";

afterEach(cleanup);

describe("Link", () => {
  it("renders a plain <a> with every prop passed through", () => {
    render(
      <Link
        href="/library"
        className="underline"
        target="_self"
        data-testid="link"
        aria-current="page"
      >
        Library
      </Link>,
    );
    const link = screen.getByRole("link", { name: "Library" });
    expect(link.tagName).toBe("A");
    expect(link.getAttribute("href")).toBe("/library");
    expect(link.className).toBe("underline");
    expect(link.getAttribute("target")).toBe("_self");
    expect(link.getAttribute("aria-current")).toBe("page");
    expect(link.dataset.testid).toBe("link");
    expect(link.attributes).toHaveLength(5);
  });

  it("forwards its ref to the anchor", () => {
    const ref = createRef<HTMLAnchorElement>();
    render(<Link ref={ref} href="/" />);
    expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
  });

  expectVariantsAccessible(import.meta.glob("./variants/*.tsx"));
});
