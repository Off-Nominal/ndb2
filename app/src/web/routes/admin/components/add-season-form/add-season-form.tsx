import { Button } from "@web/shared/components/button";
import { FormField } from "@web/shared/components/form-field";
import { HudDateInput } from "@web/shared/components/hud-date-input";
import { HudTextInput } from "@web/shared/components/hud-text-input";

export type AddSeasonLatestSnapshot = {
  id: number;
  name: string;
  start: string;
  end: string;
  payout_formula: string;
};

export type AddSeasonFormProps = {
  latestSeason: AddSeasonLatestSnapshot | null;
  name: string;
  start: string;
  end: string;
  payout_formula: string;
};

function formatUtcDate(iso: string): string {
  return iso.slice(0, 10);
}

/** HTMX form to insert a new seasons row with next-quarter defaults. */
export function AddSeasonForm(props: AddSeasonFormProps): JSX.Element {
  return (
    <section class="[ stack ] [ add-season-form ]">
      <p>
        Create the next contiguous season window. Edit dates or formula if this
        quarter is special. Times are UTC. Creating a season can take several
        seconds while database triggers update related prediction data.
      </p>

      {props.latestSeason == null ? (
        <p class="[ add-season-form__latest ]">No seasons in the database yet.</p>
      ) : (
        <p class="[ add-season-form__latest ]">
          <span class="[ add-season-form__latest-label ]">Latest</span>
          {props.latestSeason.name} (#{props.latestSeason.id})
          <span aria-hidden="true"> · </span>
          {formatUtcDate(props.latestSeason.start)} →{" "}
          {formatUtcDate(props.latestSeason.end)} UTC
          <span aria-hidden="true"> · </span>
          <code>{props.latestSeason.payout_formula}</code>
        </p>
      )}

      <form
        id="add-season-form"
        class="[ stack ]"
        method="post"
        action="/admin/seasons"
        hx-post="/admin/seasons"
        hx-target="#add-season-feedback"
        hx-swap="innerHTML"
        hx-indicator="#add-season-loading"
        hx-disabled-elt="#add-season-form"
      >
        <FormField label="Name" fieldId="add-season-name">
          <HudTextInput
            id="add-season-name"
            name="name"
            value={props.name}
            required
            autocomplete="off"
            aria-label="Season name"
          />
        </FormField>
        <FormField label="Start (UTC)" fieldId="add-season-start">
          <HudDateInput
            mode="datetime"
            id="add-season-start"
            name="start"
            value={props.start}
            required
            aria-label="Season start"
          />
        </FormField>
        <FormField label="End (UTC)" fieldId="add-season-end">
          <HudDateInput
            mode="datetime"
            id="add-season-end"
            name="end"
            value={props.end}
            required
            aria-label="Season end"
          />
        </FormField>
        <FormField label="Payout formula" fieldId="add-season-formula">
          <HudTextInput
            id="add-season-formula"
            name="payout_formula"
            value={props.payout_formula}
            required
            autocomplete="off"
            aria-label="Payout formula"
          />
        </FormField>
        <Button type="submit">Create season</Button>
        <div
          id="add-season-loading"
          class="[ htmx-indicator ]"
          aria-live="polite"
          aria-hidden="true"
        >
          Creating season… This can take a while while database triggers update
          related data.
        </div>
      </form>
      <div id="add-season-feedback" aria-live="polite" />
    </section>
  );
}
