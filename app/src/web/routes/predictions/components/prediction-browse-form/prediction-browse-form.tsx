import * as API from "@offnominal/ndb2-api-types/v2";
import { Button } from "@web/shared/components/button";
import { FormField } from "@web/shared/components/form-field";
import { HudCheckbox } from "@web/shared/components/hud-checkbox";
import { HudTextInput } from "@web/shared/components/hud-text-input";
import { Select, type SelectOption } from "@web/shared/components/select";
import { mergeClass } from "@web/shared/utils/merge_class.js";
import type { PredictionBrowseQuery } from "../../parse-prediction-browse-query";
import { PredictionStatusLattice } from "../prediction-status-lattice";

const KEYWORD_FIELD_ID = "predictions-keyword";
const CREATOR_FIELD_ID = "predictions-creator";
const UNBETTER_FIELD_ID = "predictions-unbetter-id";
const EXCLUDE_MY_BETS_CHECKBOX_ID = "predictions-exclude-my-bets";
const INCLUDE_NON_SEASON_CHECKBOX_ID = "predictions-include-non-season-applicable";
const SORT_FIELD_ID = "predictions-sort-by";
const SEASON_FIELD_ID = "predictions-season-id";
const PAGE_SIZE_FIELD_ID = "predictions-page-size";
const PAGE_HIDDEN_ID = "predictions-page-hidden";

const SORT_OPTIONS: readonly SelectOption[] =
  API.Endpoints.Predictions.GET_Search.SORT_BY_VALUES.map((value) => ({
    value,
    label: value.replace(/_/g, " ").replace("-", " · "),
  }));

const PAGE_SIZE_OPTIONS: readonly SelectOption[] =
  API.Endpoints.Predictions.GET_Search.PAGE_SIZE_VALUES.map((n) => ({
    value: String(n),
    label: `${n} per page`,
  }));

/** Wire value **`""`** ↔ omits **`season_id`** on **`GET`** (see {@link serializePredictionBrowseQuery}). */
const ALL_TIME_OPTION: SelectOption = { value: "", label: "All-time" };

export type PredictionBrowseFormProps = {
  browseQuery: PredictionBrowseQuery;
  /** Session Discord snowflake — preset **`unbetter_id`** when “exclude my bets” is checked. */
  viewerDiscordId: string;
  /**
   * Seasons **`Select`** — newest first; **`All-time`** (**`value=""`**) last unless already included
   * (see handler **`seasons.getAll`** **`ORDER BY end DESC`**).
   */
  seasonOptions: readonly SelectOption[];
  class?: string;
};

/**
 * **`GET`** filter shell for **`/predictions`** — **`#predictions-filter-form`** for **`hx-include`** (pager).
 * HTMX wiring lands in plan step 34 (**`/predictions/list`**); **`action`** keeps no‑JS navigation to **`/predictions`**.
 */
export function PredictionBrowseForm(props: PredictionBrowseFormProps): JSX.Element {
  const excludeMineChecked =
    props.browseQuery.unbetter !== undefined &&
    props.browseQuery.unbetter === props.viewerDiscordId;

  const unbetterTextValue =
    excludeMineChecked ? "" : (props.browseQuery.unbetter ?? "");

  const seasonSelectOptions: readonly SelectOption[] = props.seasonOptions.some(
    (o) => o.value === "",
  )
    ? props.seasonOptions
    : [...props.seasonOptions, ALL_TIME_OPTION];

  return (
    <form
      id="predictions-filter-form"
      class={mergeClass("[ predictions-browse-form ] [ stack ]", props.class)}
      method="get"
      action="/predictions"
      hx-get="/predictions/list"
      hx-target="#predictions-results"
      hx-swap="innerHTML"
    >
      <div class="predictions-browse-form-fields [ stack ]">
        <FormField label="Keyword" fieldId={KEYWORD_FIELD_ID}>
          <HudTextInput
            id={KEYWORD_FIELD_ID}
            name="keyword"
            value={props.browseQuery.keyword ?? ""}
            placeholder="Search text…"
            maxlength={500}
            autocomplete="off"
          />
        </FormField>

        <FormField label="Creator (Discord ID)" fieldId={CREATOR_FIELD_ID}>
          <HudTextInput
            id={CREATOR_FIELD_ID}
            name="creator"
            value={props.browseQuery.creator ?? ""}
            placeholder="Discord snowflake…"
            maxlength={32}
            autocomplete="off"
          />
        </FormField>

        <FormField
          label="Exclude bets by user (Discord ID)"
          fieldId={UNBETTER_FIELD_ID}
        >
          <HudTextInput
            id={UNBETTER_FIELD_ID}
            {...(excludeMineChecked ? {} : { name: "unbetter_id" })}
            value={unbetterTextValue}
            placeholder="Discord snowflake…"
            maxlength={32}
            autocomplete="off"
            disabled={excludeMineChecked}
          />
        </FormField>

        <div class="predictions-browse-form-checkboxes [ stack ]">
          <HudCheckbox
            id={EXCLUDE_MY_BETS_CHECKBOX_ID}
            name="unbetter_id"
            value={props.viewerDiscordId}
            checked={excludeMineChecked}
            labelText="Exclude predictions I've bet on"
          />
          <HudCheckbox
            id={INCLUDE_NON_SEASON_CHECKBOX_ID}
            name="include_non_season_applicable"
            value="true"
            checked={props.browseQuery.include_non_season_applicable}
            labelText="Include non-season-applicable predictions"
          />
        </div>

        <FormField label="Sort by" fieldId={SORT_FIELD_ID}>
          <Select
            id={SORT_FIELD_ID}
            name="sort_by"
            value={props.browseQuery.sort_by}
            options={SORT_OPTIONS}
            aria-label="Sort predictions"
          />
        </FormField>

        <FormField label="Season" fieldId={SEASON_FIELD_ID}>
          <Select
            id={SEASON_FIELD_ID}
            name="season_id"
            value={
              props.browseQuery.season_id !== undefined
                ? String(props.browseQuery.season_id)
                : ""
            }
            options={seasonSelectOptions}
            valueLayout="multiline"
            aria-label="Season (All-time = every season)"
          />
        </FormField>

        <FormField label="Page size" fieldId={PAGE_SIZE_FIELD_ID}>
          <Select
            id={PAGE_SIZE_FIELD_ID}
            name="page_size"
            value={String(props.browseQuery.page_size)}
            options={PAGE_SIZE_OPTIONS}
            aria-label={`${props.browseQuery.page_size} results per page`}
          />
        </FormField>
      </div>

      <PredictionStatusLattice selected={props.browseQuery.status} />

      <input
        id={PAGE_HIDDEN_ID}
        type="hidden"
        name="page"
        value={String(props.browseQuery.page)}
      />

      <p>
        <Button type="submit">Apply filters</Button>
      </p>
    </form>
  );
}
