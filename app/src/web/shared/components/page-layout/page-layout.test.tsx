import { createElement } from "@kitajs/html";
import { describe, expect, it } from "vitest";
import type { WebAuthAuthenticated } from "../../../middleware/auth/session";
import { AuthenticatedPageLayout, PageLayout } from "./page-layout";

const testAuth: WebAuthAuthenticated = {
  status: "authenticated",
  userId: "user-id",
  discordId: "_discord_",
  sessionId: "session-id",
  csrfToken: "test-csrf-token",
  lastDiscordAuthzAt: new Date(0),
};

describe("PageLayout", () => {
  it("renders a document with a solo main column and no site nav chrome", () => {
    const html = PageLayout({
      theme: "dark",
      colorScheme: "nebula",
      title: "Test",
      children: createElement("p", null, "hello"),
    });
    expect(html).toContain('<html lang="en" data-theme="dark" data-color-scheme="nebula">');
    expect(html).toContain('<body class="[ glass-background ]">');
    expect(html).toContain("<title>Test</title>");
    expect(html).toContain("<main>");
    expect(html).toContain('<div class="[ center-inline ]"><p>hello</p></div>');
    expect(html).not.toContain('id="app-site-nav-reveal"');
    expect(html).not.toContain("nav-drawer");
  });

  it("sets hx-headers on body when hxHeaders is provided", () => {
    const html = PageLayout({
      theme: "system",
      colorScheme: "neptune",
      title: "T",
      hxHeaders: '{"X-CSRF-Token":"abc"}',
      children: createElement("span", null, "x"),
    });
    expect(html).toContain('class="[ glass-background ]"');
    expect(html).toContain('hx-headers="{&#34;X-CSRF-Token&#34;:&#34;abc&#34;}"');
  });
});

describe("AuthenticatedPageLayout", () => {
  it("renders main plus right nav shell, drawer, and centered content", () => {
    const html = AuthenticatedPageLayout({
      theme: "dark",
      colorScheme: "nebula",
      title: "Auth",
      auth: testAuth,
      children: createElement("p", null, "hello"),
    });
    expect(html).toContain('<html lang="en" data-theme="dark" data-color-scheme="nebula">');
    expect(html).toContain('<body class="[ glass-background ]">');
    expect(html).toContain("<title>Auth</title>");
    expect(html).toContain('id="app-site-nav-reveal"');
    expect(html).toContain('<main id="main">');
    expect(html).toContain('<div class="[ center-inline ]"><p>hello</p></div>');
    expect(html).toContain("site-nav");
    expect(html).toContain("nav-drawer");
    expect(html).not.toContain("app-shell__main");
    expect(html).toContain('action="/auth/logout"');
    expect(html).toContain('name="_csrf"');
    expect(html).toContain("test-csrf-token");
    expect(html).toContain('action="/preferences"');
    expect(html).toContain("form-field");
    expect(html).toContain('hx-post="/preferences"');
    expect(html).toContain('hx-trigger="change from:select"');
  });
});
