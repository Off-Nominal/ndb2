import { describe, expect, it } from "vitest";
import { Table } from "./table";

describe("Table", () => {
  it("renders native table with table styling hook and forwards attributes", () => {
    const html = Table({
      children: (
        <tbody>
          <tr>
            <td>A</td>
          </tr>
        </tbody>
      ),
    });

    expect(html).toContain("<table");
    expect(html).toContain("[ table ]");
    expect(html).not.toContain("screen-element");
    expect(html).toContain("<tbody");
  });
});
