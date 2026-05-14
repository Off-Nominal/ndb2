import { HeadingScreenElement } from "@web/shared/components/heading-screen-element";
import { HudCheckbox } from "@web/shared/components/hud-checkbox";
import { HudTextInput } from "@web/shared/components/hud-text-input";
import { PaginationNav } from "@web/shared/components/pagination-nav";
import { PredictionStatusLattice } from "./components/prediction-status-lattice";

const PREVIEW_FIELD_ID = "predictions-hud-input-preview";
const PREVIEW_CHECKBOX_ID = "predictions-hud-checkbox-preview";
const PREVIEW_CHECKBOX_DISABLED_ID = "predictions-hud-checkbox-disabled-preview";
const PREVIEW_CHECKBOX_DISABLED_UNCHECKED_ID = "predictions-hud-checkbox-disabled-unchecked-preview";

/** Shell for **`GET /predictions`** (browse UI lands here in later plan steps). */
export function PredictionsPage(): JSX.Element {
  return (
    <div class="[ stack ] [ main-menu ]">
      <HeadingScreenElement>
        <h1 class="[ canvas-knockout-text ]">Predictions</h1>
      </HeadingScreenElement>
      <p>Browse UI scaffold — filter form and results arrive in later milestones.</p>
      <div class="[ form-field ] [ stack ]">
        <label for={PREVIEW_FIELD_ID}>Keyword (preview)</label>
        <HudTextInput
          id={PREVIEW_FIELD_ID}
          name="keyword"
          placeholder="Try typing…"
          maxlength={500}
          autocomplete="off"
        />
      </div>
      <p>Status lattice (preview — open + closed checked)</p>
      <PredictionStatusLattice
        controlIdPrefix="predictions-status-preview-checked"
        selected={["open", "closed"]}
      />
      <HudCheckbox
        id={PREVIEW_CHECKBOX_ID}
        name="include_non_season_applicable"
        value="1"
        labelText="Include non-season-applicable (preview)"
      />
      <HudCheckbox
        id={PREVIEW_CHECKBOX_DISABLED_ID}
        name="preview_checkbox_disabled"
        value="1"
        checked={true}
        disabled={true}
        labelText="Disabled + checked (preview)"
      />
      <HudCheckbox
        id={PREVIEW_CHECKBOX_DISABLED_UNCHECKED_ID}
        name="preview_checkbox_disabled_unchecked"
        value="1"
        checked={false}
        disabled={true}
        labelText="Disabled + unchecked (preview)"
      />
      <p>Pagination (preview — Previous disabled on first page)</p>
      <PaginationNav page={1} hasNextPage={true} />
      <PaginationNav page={2} hasNextPage={true} />

    </div>
  );
}
