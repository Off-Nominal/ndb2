import { createElement } from "@kitajs/html";
import { describe, expect, it } from "vitest";
import { page_layout } from "./page_layout";

describe("page_layout", () => {
  it("wraps children in region + content-column (markup-driven composition)", () => {
    expect(page_layout({ children: createElement("p", null, "hello") })).toBe(
      '<div class="[ region ] [ content-column ]"><p>hello</p></div>',
    );
  });
});
