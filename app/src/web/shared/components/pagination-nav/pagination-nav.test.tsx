import { describe, expect, it } from "vitest";
import { PaginationNav } from "./pagination-nav";

function buttonOpenTags(html: string): string[] {
  return [...html.matchAll(/<button\b[^>]*>/g)].map((m) => m[0]);
}

describe("PaginationNav", () => {
  it("renders a nav landmark with default aria-label", () => {
    const html = PaginationNav({ page: 2, hasNextPage: true });
    expect(html).toMatch(/<nav\b[^>]*\baria-label="Results pagination"/);
  });

  it("uses custom navAriaLabel when provided", () => {
    const html = PaginationNav({
      page: 2,
      hasNextPage: true,
      navAriaLabel: "Prediction results pages",
    });
    expect(html).toMatch(
      /<nav\b[^>]*\baria-label="Prediction results pages"/,
    );
  });

  it("falls back to default nav aria-label when navAriaLabel is empty string", () => {
    const html = PaginationNav({
      page: 2,
      hasNextPage: true,
      navAriaLabel: "",
    });
    expect(html).toMatch(/<nav\b[^>]*\baria-label="Results pagination"/);
  });

  it("exposes page index in an aria-live polite region", () => {
    const html = PaginationNav({ page: 7, hasNextPage: true });
    expect(html).toMatch(
      /<span\b[^>]*aria-live="polite"[^>]*>Page 7<\/span>/,
    );
  });

  it("disables Previous when page is 1", () => {
    const html = PaginationNav({ page: 1, hasNextPage: true });
    const [prev, next] = buttonOpenTags(html);
    expect(prev).toContain("disabled");
    expect(next).not.toContain("disabled");
  });

  it("disables Next when hasNextPage is false", () => {
    const html = PaginationNav({ page: 3, hasNextPage: false });
    const [prev, next] = buttonOpenTags(html);
    expect(prev).not.toContain("disabled");
    expect(next).toContain("disabled");
  });

  it("does not disable either control when page > 1 and hasNextPage", () => {
    const html = PaginationNav({ page: 2, hasNextPage: true });
    const [prev, next] = buttonOpenTags(html);
    expect(prev).not.toContain("disabled");
    expect(next).not.toContain("disabled");
  });

  it("sets default button aria-labels when navigation is available", () => {
    const html = PaginationNav({ page: 2, hasNextPage: true });
    expect(html).toMatch(/\baria-label="Previous page"/);
    expect(html).toMatch(/\baria-label="Next page"/);
  });

  it("sets concise aria-labels when at first or last page", () => {
    const first = PaginationNav({ page: 1, hasNextPage: true });
    expect(first).toMatch(/\baria-label="No previous pages"/);
    expect(first).toMatch(/\baria-label="Next page"/);

    const last = PaginationNav({ page: 3, hasNextPage: false });
    expect(last).toMatch(/\baria-label="Previous page"/);
    expect(last).toMatch(/\baria-label="No more pages"/);
  });

  it("allows overriding button aria-label via passthrough props", () => {
    const html = PaginationNav({
      page: 2,
      hasNextPage: true,
      previousButtonProps: { "aria-label": "Earlier predictions" },
      nextButtonProps: { "aria-label": "Later predictions" },
    });
    expect(html).toMatch(/\baria-label="Earlier predictions"/);
    expect(html).toMatch(/\baria-label="Later predictions"/);
    expect(html).not.toMatch(/\baria-label="Previous page"/);
    expect(html).not.toMatch(/\baria-label="Next page"/);
  });

  it("renders arrow labels when previous and next are available", () => {
    const html = PaginationNav({ page: 2, hasNextPage: true });
    expect(html).toContain("← Previous");
    expect(html).toContain("Next →");
  });

  it("renders concise labels when a direction is unavailable", () => {
    const start = PaginationNav({ page: 1, hasNextPage: true });
    expect(start).toContain("No previous pages");
    expect(start).toContain("Next →");

    const end = PaginationNav({ page: 3, hasNextPage: false });
    expect(end).toContain("← Previous");
    expect(end).toContain("No more pages");
  });

  it("forwards passthrough attributes except class (merged) onto buttons", () => {
    const html = PaginationNav({
      page: 2,
      hasNextPage: true,
      nextButtonProps: {
        "hx-get": "/predictions/list?page=3",
        'hx-target': "#results",
      },
    });
    expect(html).toContain('hx-get="/predictions/list?page=3"');
    expect(html).toContain('hx-target="#results"');
  });

  it("merges passthrough class onto pager buttons", () => {
    const html = PaginationNav({
      page: 2,
      hasNextPage: true,
      previousButtonProps: { class: "[ js-prev ]" },
    });
    expect(html).toMatch(/class="[^"]*\bpagination-nav__pager\b[^"]*\bjs-prev\b/);
  });
});
