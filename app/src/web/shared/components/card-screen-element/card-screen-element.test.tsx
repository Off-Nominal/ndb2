import { describe, expect, it } from "vitest";
import { CardScreenElement } from "./card-screen-element";

describe("CardScreenElement", () => {
  it("renders heading in the requested element and knockout title bar + body", () => {
    const html = CardScreenElement({
      headingElement: "h3",
      heading: "Widget",
      children: <p>Inside.</p>,
    });
    expect(html).toContain(
      'class="[ screen-element ] [ card-screen-element ] [ glass-primary-frost ]"',
    );
    expect(html).toContain('<h3 class="[ card-screen-element__heading ]">Widget</h3>');
    expect(html).toContain('[ card-screen-element__bar ] [ primary-specular-gradient ]');
    expect(html).toContain('[ card-screen-element__body ]');
    expect(html).toContain("<p>Inside.</p>");
  });
});
