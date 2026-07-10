import { createElement } from "@kitajs/html";
import { describe, expect, it } from "vitest";
import type { WebAuthAuthenticated } from "../../../middleware/auth/session";
import { documentTitle } from "@web/shared/utils/document_title";
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
      title: documentTitle("Test"),
      children: createElement("p", null, "hello"),
    });
    expect(html).toContain('<html lang="en" data-theme="dark" data-color-scheme="nebula">');
    expect(html).toContain("<title>Test · NDB2</title>");
    expect(html).toContain("<main>");
    expect(html).toMatch(/<main\b[^>]*>[\s\S]*<p>hello<\/p>/);
    expect(html).not.toContain('id="app-site-nav-reveal"');
    expect(html).not.toContain("nav-drawer");
  });

  it("sets hx-headers on body when hxHeaders is provided", () => {
    const html = PageLayout({
      theme: "system",
      colorScheme: "neptune",
      title: documentTitle("T"),
      hxHeaders: '{"X-CSRF-Token":"abc"}',
      children: createElement("span", null, "x"),
    });
    expect(html).toContain('hx-headers="{&#34;X-CSRF-Token&#34;:&#34;abc&#34;}"');
  });
});

const testProfile = {
  displayName: "Nav User",
  avatarUrl: "https://cdn.discordapp.com/embed/avatars/0.png",
};

describe("AuthenticatedPageLayout", () => {
  it("renders main plus right nav shell, drawer, and centered content", () => {
    const html = AuthenticatedPageLayout({
      theme: "dark",
      colorScheme: "nebula",
      title: documentTitle("Auth"),
      auth: testAuth,
      discordProfile: testProfile,
      children: createElement("p", null, "hello"),
    });
    expect(html).toContain('<html lang="en" data-theme="dark" data-color-scheme="nebula">');
    expect(html).toContain("<title>Auth · NDB2</title>");
    expect(html).toContain('id="app-site-nav-reveal"');
    expect(html).toContain('<main id="main">');
    expect(html).toMatch(/<main\b[^>]*\bid="main"[^>]*>[\s\S]*<p>hello<\/p>/);
    expect(html).toContain("site-nav");
    expect(html).toContain("nav-drawer");
    expect(html).toContain('action="/auth/logout"');
    expect(html).toContain('name="_csrf"');
    expect(html).toContain("test-csrf-token");
    expect(html).toContain("data-preferences-form");
    expect(html).toContain("Nav User");
  });

  it("renders Admin nav link when showAdminNav is true", () => {
    const html = AuthenticatedPageLayout({
      theme: "dark",
      colorScheme: "nebula",
      title: documentTitle("Auth"),
      auth: testAuth,
      discordProfile: testProfile,
      showAdminNav: true,
      children: createElement("p", null, "hello"),
    });
    expect(html).toContain('href="/admin"');
    expect(html).toContain(">Admin</");
  });

  it("omits Admin nav link when showAdminNav is false", () => {
    const html = AuthenticatedPageLayout({
      theme: "dark",
      colorScheme: "nebula",
      title: documentTitle("Auth"),
      auth: testAuth,
      discordProfile: testProfile,
      showAdminNav: false,
      children: createElement("p", null, "hello"),
    });
    expect(html).not.toContain('href="/admin"');
  });
});
