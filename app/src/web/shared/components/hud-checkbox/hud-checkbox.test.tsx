import { describe, expect, it } from "vitest";
import { HudCheckbox } from "./hud-checkbox";

describe("HudCheckbox", () => {
  it("renders a wrapper and checkbox input with id and name", () => {
    const html = HudCheckbox({
      id: "cb-include",
      name: "include_non_season_applicable",
    });
    expect(html).toContain('type="checkbox"');
    expect(html).toContain('id="cb-include"');
    expect(html).toContain('name="include_non_season_applicable"');
    expect(html).toMatch(/<div[\s\S]*?<input[\s\S]*?type="checkbox"/);
  });

  it("forwards value, checked, and disabled to the input", () => {
    const html = HudCheckbox({
      id: "x",
      name: "flag",
      value: "1",
      checked: true,
      disabled: true,
    });
    expect(html).toContain('value="1"');
    expect(html).toMatch(/\bchecked\b(?:\s|\/>|>)/);
    expect(html).toMatch(/\bdisabled\b(?:\s|\/>|>)/);
  });

  it("wraps in label and emits trimmed labelText", () => {
    const html = HudCheckbox({
      id: "terms",
      name: "terms",
      labelText: " Accept terms ",
    });
    expect(html).toContain("<label");
    expect(html).toContain("Accept terms");
    expect(html).toMatch(/<label[\s\S]*type="checkbox"/);
  });

  it("does not wrap in label when labelText is empty or whitespace", () => {
    expect(
      HudCheckbox({
        id: "a",
        name: "a",
        labelText: "",
      }),
    ).not.toContain("<label");

    expect(
      HudCheckbox({
        id: "b",
        name: "b",
        labelText: "   ",
      }),
    ).not.toContain("<label");
  });

  it("forwards aria-describedby to the input", () => {
    const html = HudCheckbox({
      id: "c",
      name: "c",
      "aria-describedby": "c-hint",
    });
    expect(html).toContain('aria-describedby="c-hint"');
  });
});
