import { createElement } from "@kitajs/html";
import { describe, expect, it } from "vitest";
import { PageLayout } from "./page_layout";

describe("PageLayout", () => {
  it("wraps children in center + page-layout bracket classes", () => {
    expect(PageLayout({ children: createElement("p", null, "hello") })).toBe(
      '<div class="[ center ] [ page-layout ]"><p>hello</p></div>',
    );
  });
});
