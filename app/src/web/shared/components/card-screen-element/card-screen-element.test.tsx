import { describe, expect, it } from "vitest";
import { CardScreenElement } from "./card-screen-element";

describe("CardScreenElement", () => {
  it("renders heading in the requested element and knockout title bar + body", () => {
    const html = CardScreenElement({
      headingElement: "h3",
      heading: "Widget",
      children: <p>Inside.</p>,
    });
    expect(html).toMatch(/<h3[^>]*>Widget<\/h3>/);
    expect(html).toContain("<p>Inside.</p>");
  });
});
