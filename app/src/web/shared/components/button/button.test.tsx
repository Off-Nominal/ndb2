import { describe, expect, it } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("renders a link with [ button ] when href is set", () => {
    const html = Button({ href: "/x", children: "Go" });
    expect(html).toContain('class="[ screen-element ] [ ring ] [ button ]"');
    expect(html).toContain('href="/x"');
    expect(html).toContain(">Go<");
  });

  it("renders a native button when href is absent", () => {
    const html = Button({ children: "Act" });
    expect(html).toContain("button");
    expect(html).toContain('class="[ screen-element ] [ ring ] [ button ]"');
    expect(html).toContain('type="button"');
  });
});
