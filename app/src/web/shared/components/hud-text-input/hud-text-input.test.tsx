import { describe, expect, it } from "vitest";
import { HudTextInput } from "./hud-text-input";

describe("HudTextInput", () => {
  it("renders a prompt glyph and a single-line input", () => {
    const html = HudTextInput({
      id: "q-keyword",
      name: "keyword",
    });
    expect(html).toContain('data-hud-text-input-prompt');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toMatch(
      /data-hud-text-input-prompt[\s\S]*?<\/span>[\s\S]*?<input/,
    );
    expect(html).toContain('type="text"');
    expect(html).toContain('id="q-keyword"');
    expect(html).toContain('name="keyword"');
  });

  it("forwards maxlength and aria-describedby to the input", () => {
    const html = HudTextInput({
      id: "f",
      name: "creator",
      maxlength: 500,
      "aria-describedby": "f-hint",
    });
    expect(html).toContain('maxlength="500"');
    expect(html).toContain('aria-describedby="f-hint"');
  });

  it("allows overriding input type", () => {
    const html = HudTextInput({
      id: "x",
      name: "x",
      type: "search",
    });
    expect(html).toContain('type="search"');
  });
});
