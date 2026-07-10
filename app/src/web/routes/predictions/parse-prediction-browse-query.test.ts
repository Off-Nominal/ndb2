import { describe, expect, it } from "vitest";
import { Entities } from "@offnominal/ndb2-api-types/v2";
import {
  PREDICTION_BROWSE_DEFAULT_PAGE,
  PREDICTION_BROWSE_DEFAULT_PAGE_SIZE,
  PREDICTION_BROWSE_DEFAULT_SORT_BY,
  parsePredictionBrowseQuery,
  serializePredictionBrowseQuery,
  type PredictionBrowseQuery,
} from "./parse-prediction-browse-query";
import { PREDICTION_SEARCH_PREDICTOR_UNBETTER_DISTINCT_MESSAGE } from "@domain/predictions/prediction-search-query-fields";

const DID_A = "111111111111111111";
const DID_B = "222222222222222222";

function expressQueryFromSearchParams(sp: URLSearchParams): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  for (const key of new Set(sp.keys())) {
    const all = sp.getAll(key);
    out[key] = all.length === 1 ? all[0]! : all;
  }
  return out;
}

describe("parsePredictionBrowseQuery", () => {
  it("accepts an empty query and applies browse defaults", () => {
    const r = parsePredictionBrowseQuery({});
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data).toEqual({
      status: [],
      sort_by: PREDICTION_BROWSE_DEFAULT_SORT_BY,
      keyword: undefined,
      predictor: undefined,
      unbetter: undefined,
      season_id: undefined,
      include_non_season_applicable: false,
      page: PREDICTION_BROWSE_DEFAULT_PAGE,
      page_size: PREDICTION_BROWSE_DEFAULT_PAGE_SIZE,
    } satisfies PredictionBrowseQuery);
  });

  it.each<
    [
      string,
      Record<string, string | string[] | undefined>,
      PredictionBrowseQuery,
    ]
  >([
    [
      "keyword + non-default sort",
      { keyword: "mars landing", sort_by: "created_date-desc" },
      {
        status: [],
        sort_by: "created_date-desc",
        keyword: "mars landing",
        predictor: undefined,
        unbetter: undefined,
        season_id: undefined,
        include_non_season_applicable: false,
        page: PREDICTION_BROWSE_DEFAULT_PAGE,
        page_size: PREDICTION_BROWSE_DEFAULT_PAGE_SIZE,
      },
    ],
    [
      "pager beyond defaults",
      { page: "3", page_size: "25" },
      {
        status: [],
        sort_by: PREDICTION_BROWSE_DEFAULT_SORT_BY,
        keyword: undefined,
        predictor: undefined,
        unbetter: undefined,
        season_id: undefined,
        include_non_season_applicable: false,
        page: 3,
        page_size: 25,
      },
    ],
    [
      "repeated status (cold URL parity)",
      { status: ["open", "closed"] },
      {
        status: ["open", "closed"],
        sort_by: PREDICTION_BROWSE_DEFAULT_SORT_BY,
        keyword: undefined,
        predictor: undefined,
        unbetter: undefined,
        season_id: undefined,
        include_non_season_applicable: false,
        page: PREDICTION_BROWSE_DEFAULT_PAGE,
        page_size: PREDICTION_BROWSE_DEFAULT_PAGE_SIZE,
      },
    ],
    [
      "season + include flag",
      {
        season_id: "12",
        include_non_season_applicable: "true",
      },
      {
        status: [],
        sort_by: PREDICTION_BROWSE_DEFAULT_SORT_BY,
        keyword: undefined,
        predictor: undefined,
        unbetter: undefined,
        season_id: 12,
        include_non_season_applicable: true,
        page: PREDICTION_BROWSE_DEFAULT_PAGE,
        page_size: PREDICTION_BROWSE_DEFAULT_PAGE_SIZE,
      },
    ],
    [
      "predictor + unbetter_id (location bar; wire creator)",
      { creator: DID_A, unbetter_id: DID_B },
      {
        status: [],
        sort_by: PREDICTION_BROWSE_DEFAULT_SORT_BY,
        keyword: undefined,
        predictor: DID_A,
        unbetter: DID_B,
        season_id: undefined,
        include_non_season_applicable: false,
        page: PREDICTION_BROWSE_DEFAULT_PAGE,
        page_size: PREDICTION_BROWSE_DEFAULT_PAGE_SIZE,
      },
    ],
    [
      "legacy unbetter alias merges like unbetter_id",
      { unbetter: DID_B },
      {
        status: [],
        sort_by: PREDICTION_BROWSE_DEFAULT_SORT_BY,
        keyword: undefined,
        predictor: undefined,
        unbetter: DID_B,
        season_id: undefined,
        include_non_season_applicable: false,
        page: PREDICTION_BROWSE_DEFAULT_PAGE,
        page_size: PREDICTION_BROWSE_DEFAULT_PAGE_SIZE,
      },
    ],
  ])("parses cold URL: %s", (_label, query, expected) => {
    const r = parsePredictionBrowseQuery(query);
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data).toEqual(expected);
  });

  it("rejects when unbetter_id and unbetter disagree", () => {
    const r = parsePredictionBrowseQuery({
      unbetter_id: DID_A,
      unbetter: DID_B,
    });
    expect(r.success).toBe(false);
    if (r.success) return;
    expect(r.error.issues.some((i) => i.path.includes("unbetter_id"))).toBe(true);
    expect(
      r.error.issues.some((i) =>
        String(i.message).includes(
          "Query parameters unbetter_id and unbetter disagree",
        ),
      ),
    ).toBe(true);
  });

  it("rejects when predictor matches unbetter after merge", () => {
    const r = parsePredictionBrowseQuery({
      creator: DID_A,
      unbetter_id: DID_A,
    });
    expect(r.success).toBe(false);
    if (r.success) return;
    expect(
      r.error.issues.some((i) => i.message === PREDICTION_SEARCH_PREDICTOR_UNBETTER_DISTINCT_MESSAGE),
    ).toBe(true);
  });

  it("rejects invalid page_size", () => {
    expect(parsePredictionBrowseQuery({ page_size: "99" }).success).toBe(false);
  });

  it("rejects invalid lifecycle status value", () => {
    expect(parsePredictionBrowseQuery({ status: "not-a-status" }).success).toBe(false);
  });

  it("rejects keyword longer than 500 characters", () => {
    expect(
      parsePredictionBrowseQuery({ keyword: "x".repeat(501) }).success,
    ).toBe(false);
  });

  it("rejects short discord snowflake for predictor (wire creator)", () => {
    expect(parsePredictionBrowseQuery({ creator: "12" }).success).toBe(false);
  });
});

describe("serializePredictionBrowseQuery", () => {
  it("omits defaults so an empty browse serializes to an empty string", () => {
    const base = parsePredictionBrowseQuery({});
    expect(base.success).toBe(true);
    if (!base.success) return;
    expect(serializePredictionBrowseQuery(base.data).toString()).toBe("");
  });

  it("includes page and page_size only when away from defaults", () => {
    const parsed = parsePredictionBrowseQuery({ page: "2", page_size: "10" });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    const sp = serializePredictionBrowseQuery(parsed.data);
    expect(sp.get("page")).toBe("2");
    expect(sp.get("page_size")).toBeNull();
  });

  it("includes page_size when not default", () => {
    const parsed = parsePredictionBrowseQuery({ page_size: "50" });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    const sp = serializePredictionBrowseQuery(parsed.data);
    expect(sp.get("page_size")).toBe("50");
    expect(sp.get("page")).toBeNull();
  });

  it("writes unbetter as unbetter_id on the wire", () => {
    const parsed = parsePredictionBrowseQuery({
      unbetter_id: DID_B,
    });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    const sp = serializePredictionBrowseQuery(parsed.data);
    expect(sp.get("unbetter_id")).toBe(DID_B);
    expect(sp.get("unbetter")).toBeNull();
  });

  it("serializes multiple status entries", () => {
    const q: PredictionBrowseQuery = {
      status: ["open", "checking"],
      sort_by: PREDICTION_BROWSE_DEFAULT_SORT_BY,
      keyword: undefined,
      predictor: undefined,
      unbetter: undefined,
      season_id: undefined,
      include_non_season_applicable: false,
      page: PREDICTION_BROWSE_DEFAULT_PAGE,
      page_size: PREDICTION_BROWSE_DEFAULT_PAGE_SIZE,
    };
    const sp = serializePredictionBrowseQuery(q);
    expect(sp.getAll("status")).toEqual(["open", "checking"]);
  });

  it("serializes include_non_season_applicable only when true", () => {
    const off = parsePredictionBrowseQuery({});
    expect(off.success).toBe(true);
    if (!off.success) return;
    expect(
      serializePredictionBrowseQuery(off.data).get("include_non_season_applicable"),
    ).toBeNull();

    const on = parsePredictionBrowseQuery({
      include_non_season_applicable: "true",
    });
    expect(on.success).toBe(true);
    if (!on.success) return;
    expect(
      serializePredictionBrowseQuery(on.data).get("include_non_season_applicable"),
    ).toBe("true");
  });
});

describe("parse + serialize round-trip (shareable URLs)", () => {
  it.each<
    [string, Record<string, string | string[] | undefined>]
  >([
    ["empty", {}],
    [
      "filters + pager",
      {
        keyword: "probe",
        sort_by: "due_date-desc",
        status: ["open"],
        page: "2",
        page_size: "25",
        season_id: "3",
      },
    ],
    [
      "predictor vs unbetter_id (wire creator)",
      { creator: DID_A, unbetter_id: DID_B },
    ],
    [
      "include_non_season_applicable",
      { include_non_season_applicable: "true", page_size: "50" },
    ],
  ])("round-trip: %s", (_label, raw) => {
    const first = parsePredictionBrowseQuery(raw);
    expect(first.success).toBe(true);
    if (!first.success) return;

    const qs = serializePredictionBrowseQuery(first.data).toString();
    const again = parsePredictionBrowseQuery(expressQueryFromSearchParams(new URLSearchParams(qs)));

    expect(again.success).toBe(true);
    if (!again.success) return;
    expect(again.data).toEqual(first.data);
  });

  it("round-trip preserves every lifecycle value used in filters", () => {
    const statuses = [...Entities.Predictions.PREDICTION_LIFECYCLE_VALUES];
    const raw: Record<string, string | string[]> = {
      status: statuses,
      page_size: "25",
    };
    const first = parsePredictionBrowseQuery(raw);
    expect(first.success).toBe(true);
    if (!first.success) return;

    const qs = serializePredictionBrowseQuery(first.data).toString();
    const second = parsePredictionBrowseQuery(
      expressQueryFromSearchParams(new URLSearchParams(qs)),
    );

    expect(second.success).toBe(true);
    if (!second.success) return;
    expect([...second.data.status].sort()).toEqual([...statuses].sort());
    expect(second.data.page_size).toBe(25);
  });
});
