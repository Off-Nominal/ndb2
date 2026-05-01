import { describe, expect, it } from "vitest";
import { Table } from "./table";

describe("Table", () => {
  it("renders table with screen-element class and forwards attributes", () => {
    const html = Table({
      "aria-label": "Scores",
      children: (
        <tbody>
          <tr>
            <td>A</td>
          </tr>
        </tbody>
      ),
    });

    expect(html).toContain("<table");
    expect(html).toContain("screen-element");
    expect(html).toContain('aria-label="Scores"');
    expect(html).toContain("<tbody");
  });
});
