import { HeadingScreenElement } from "@web/shared/components/heading-screen-element";
import type { SelectOption } from "@web/shared/components/select";
import { PredictionBrowseForm } from "./components/prediction-browse-form";
import type { PredictionBrowseQuery } from "./parse-prediction-browse-query";

export type PredictionsPageProps = {
  browseQuery: PredictionBrowseQuery;
  viewerDiscordId: string;
  seasonOptions: readonly SelectOption[];
  predictorOptions: readonly SelectOption[];
};

/** Authenticated **`GET /predictions`** — filter form + HTMX results target (fragment in plan step 33). */
export function PredictionsPage(props: PredictionsPageProps): JSX.Element {
  return (
    <div class="[ stack ] [ main-menu ]">
      <HeadingScreenElement>
        <h1 class="[ canvas-knockout-text ]">Predictions</h1>
      </HeadingScreenElement>

      <PredictionBrowseForm
        browseQuery={props.browseQuery}
        viewerDiscordId={props.viewerDiscordId}
        seasonOptions={props.seasonOptions}
        predictorOptions={props.predictorOptions}
      />

      <section id="predictions-results" aria-live="polite" />
    </div>
  );
}
