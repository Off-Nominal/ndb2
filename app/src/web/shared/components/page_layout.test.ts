import { createElement } from "@kitajs/html";
import { describe, expect, it } from "vitest";
import { PageLayout } from "./page_layout";

describe("PageLayout", () => {
  it("renders a full document with head, themed html, and center + page-layout wrapper", () => {
    const html = PageLayout({
      theme: "dark",
      colorScheme: "nebula",
      title: "Test",
      children: createElement("p", null, "hello"),
    });
    expect(html).toContain('<html lang="en" data-theme="dark" data-color-scheme="nebula">');
    expect(html).toContain('<body class="app-bg-glass">');
    expect(html).toContain("<title>Test</title>");
    expect(html).toContain('<div class="[ center ] [ page-layout ]"><p>hello</p></div>');
  });

  it("sets hx-headers on body when hxHeaders is provided", () => {
    const html = PageLayout({
      theme: "system",
      colorScheme: "neptune",
      title: "T",
      hxHeaders: '{"X-CSRF-Token":"abc"}',
      children: createElement("span", null, "x"),
    });
    expect(html).toContain('class="app-bg-glass"');
    expect(html).toContain('hx-headers="{&#34;X-CSRF-Token&#34;:&#34;abc&#34;}"');
  });
});
