import { format } from "date-fns";
import { marked } from "marked";
import { Entities } from "@offnominal/ndb2-api-types/v2";
import type { SelectOption } from "@web/shared/components/select";

export type PredictionSeasonRowForSelect = {
  id: number;
  name: string;
  start: string;
  end: string;
  identifier: Entities.Seasons.Identifier;
};

type SeasonMarker = "current" | "last";

function stripInlineHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

function seasonMarkerPlainSuffix(marker: SeasonMarker | undefined): string {
  if (marker === "current") {
    return " · This season";
  }
  if (marker === "last") {
    return " · Last season";
  }
  return "";
}

function seasonRowRichHtml(
  row: PredictionSeasonRowForSelect,
  marker: SeasonMarker | undefined,
): string {
  const titleInline = String(marked.parseInline(row.name));
  const startLabel = format(new Date(row.start), "yyyy-MMM-dd");
  const endLabel = format(new Date(row.end), "yyyy-MMM-dd");
  const badges =
    marker === "current"
      ? `<span class="select__season-badge">This season</span>`
      : marker === "last"
        ? `<span class="select__season-badge select__season-badge--muted">Last season</span>`
        : "";
  const markersRow =
    badges !== ""
      ? `<span class="select__season-option-markers">${badges}</span>`
      : "";

  return `<span class="select__season-option">${markersRow}<span class="select__season-title">${titleInline}</span><span class="select__season-dates">${startLabel} → ${endLabel}</span></span>`;
}

function seasonRowPlainLabel(
  row: PredictionSeasonRowForSelect,
  marker: SeasonMarker | undefined,
): string {
  const titlePlain = stripInlineHtml(String(marked.parseInline(row.name)));
  const startLabel = format(new Date(row.start), "yyyy-MMM-dd");
  const endLabel = format(new Date(row.end), "yyyy-MMM-dd");
  return `${titlePlain} (${startLabel}–${endLabel})${seasonMarkerPlainSuffix(marker)}`;
}

/**
 * **`Select`** options for prediction browse: **`getAll`** order (**`end`** desc), markdown titles,
 * date span, optional **This season** / **Last season** markers, **All-time** last.
 */
export function buildPredictionSeasonSelectOptions(
  rows: readonly PredictionSeasonRowForSelect[],
): SelectOption[] {
  const currentId = rows.find((r) => r.identifier === "current")?.id;

  const pastRows = rows.filter((r) => r.identifier === "past");
  let lastId: number | undefined;
  if (pastRows.length > 0) {
    const sorted = [...pastRows].sort(
      (a, b) => new Date(b.end).getTime() - new Date(a.end).getTime(),
    );
    lastId = sorted[0]?.id;
  }

  const mapped: SelectOption[] = rows.map((row) => {
    let marker: SeasonMarker | undefined;
    if (currentId !== undefined && row.id === currentId) {
      marker = "current";
    } else if (lastId !== undefined && row.id === lastId) {
      marker = "last";
    }

    const labelHtml = seasonRowRichHtml(row, marker);

    return {
      value: String(row.id),
      label: seasonRowPlainLabel(row, marker),
      labelHtml,
    };
  });

  return [
    ...mapped,
    {
      value: "",
      label: "All-time",
    },
  ];
}
