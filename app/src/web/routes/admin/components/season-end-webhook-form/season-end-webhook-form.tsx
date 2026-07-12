import type * as API from "@offnominal/ndb2-api-types/v2";
import { Button } from "@web/shared/components/button";
import { FormField } from "@web/shared/components/form-field";
import { Select, type SelectOption } from "@web/shared/components/select";

export type SeasonEndWebhookFormProps = {
  seasons: API.Entities.Seasons.Season[];
  selectedSeasonId: string;
};

export function formatSeasonEndWebhookOptionLabel(
  season: API.Entities.Seasons.Season,
): string {
  const endDate = season.end.slice(0, 10);
  return `${season.name} (#${season.id}) — ${endDate}`;
}

/** HTMX form to re-send the season_end webhook for a past closed season. */
export function SeasonEndWebhookForm(props: SeasonEndWebhookFormProps): JSX.Element {
  const options: SelectOption[] = props.seasons.map((season) => ({
    value: String(season.id),
    label: formatSeasonEndWebhookOptionLabel(season),
  }));

  return (
    <section class="[ stack ] [ season-end-webhook-form ]">
      <p>
        Re-post the season_end webhook payload to Mission Control for a past
        closed season. This does not close the season or emit the internal event
        bus.
      </p>
      {props.seasons.length === 0 ? (
        <p>No past closed seasons are available.</p>
      ) : (
        <>
          <form
            id="season-end-webhook-form"
            class="[ stack ]"
            method="post"
            action="/admin/season-end-event"
            hx-post="/admin/season-end-event"
            hx-target="#season-end-webhook-feedback"
            hx-swap="innerHTML"
            hx-indicator="#season-end-webhook-loading"
            hx-disabled-elt="find button[type='submit']"
          >
            <div class="[ split-pair ] [ season-end-webhook-form__controls ]">
              <FormField label="Season" fieldId="season-end-season">
                <Select
                  id="season-end-season"
                  name="season_id"
                  value={props.selectedSeasonId}
                  options={options}
                  aria-label="Season"
                />
              </FormField>
              <Button type="submit">Re-send webhook</Button>
            </div>
            <div
              id="season-end-webhook-loading"
              class="[ htmx-indicator ]"
              aria-hidden="true"
            >
              Sending…
            </div>
          </form>
          <div id="season-end-webhook-feedback" aria-live="polite" />
        </>
      )}
    </section>
  );
}
