import { describe, expect, it } from "vitest";
import { Select } from "./select";

describe("Select", () => {
  it("renders a wrapper, screen-element surface, hidden native select, and listbox", () => {
    const html = Select({
      id: "t-theme",
      name: "theme",
      value: "dark",
      options: [
        { value: "light", label: "Light" },
        { value: "dark", label: "Dark" },
      ],
    });
    expect(html).toContain("data-select");
    expect(html).toContain("data-select-surface");
    expect(html).toContain("data-select-trigger");
    expect(html).toContain("data-select-value");
    expect(html).toContain("data-select-list");
    expect(html).toContain('id="t-theme"');
    expect(html).toContain('id="t-theme-native"');
    expect(html).toContain("visually-hidden");
    expect(html).toContain("data-select-native");
    expect(html).toContain('name="theme"');
    expect(html).toContain('role="listbox"');
    expect(html).toContain('id="t-theme-listbox"');
    expect(html).toContain('role="option"');
    expect(html).toContain('data-select-option');
  });

  it("embeds data-rich-label when option.labelHtml is set", () => {
    const html = Select({
      id: "t-rich",
      name: "season_id",
      value: "1",
      options: [
        {
          value: "1",
          label: "Plain fallback",
          labelHtml: '<span class="select__season-option"><span class="select__season-title">Rich</span></span>',
        },
      ],
    });
    expect(html).toContain("data-rich-label=");
    expect(html).toContain("%3Cspan%20class%3D%22select__season-option");
  });
});
