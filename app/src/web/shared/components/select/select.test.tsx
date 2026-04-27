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
    expect(html).toContain('[ select ]');
    expect(html).toContain('class="[ screen-element ] [ select__surface ]"');
    expect(html).toContain('class="[ select__trigger ]"');
    expect(html).toContain('id="t-theme"');
    expect(html).toContain('id="t-theme-native"');
    expect(html).toContain("select__native");
    expect(html).toContain("data-select-native");
    expect(html).toContain('name="theme"');
    expect(html).toContain('role="listbox"');
    expect(html).toContain('id="t-theme-listbox"');
    expect(html).toContain('role="option"');
    expect(html).toContain('data-select-option');
  });
});
