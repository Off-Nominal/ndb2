import { CardScreenElement } from "@web/shared/components/card-screen-element";
import { HeadingScreenElement } from "@web/shared/components/heading-screen-element";
import { SeasonCard } from "./components/season-card";

/** Prediction buckets shown on the home season card — duplicated shape for decoupling from API/types. */
export interface HomePageSeasonPredictionCounts {
  open: number;
  checking: number;
  closed: number;
  successful: number;
  failed: number;
  retired: number;
}

/** Season snapshot passed into the main menu (decoupled from domain entities). */
export interface HomePageSeasonSnapshot {
  name: string;
  predictions: HomePageSeasonPredictionCounts;
  start: string;
  end: string;
}

export interface HomePageProps {
  discordId: string;
  season: HomePageSeasonSnapshot | null;
}

/** Body content for `/` (Kitajs HTML JSX → string); document shell is {@link AuthenticatedPageLayout} in the handler. */
export function HomePage(props: HomePageProps): JSX.Element {
  return (
    <div class="[ stack ] [ main-menu ]">
      <HeadingScreenElement>
        <h1 class="[ canvas-knockout-text ]">Main Menu</h1>
      </HeadingScreenElement>

      <div class="[ grid ]">
        <SeasonCard
          name={props.season?.name ?? ""}
          predictions={props.season?.predictions ?? null}
          startDate={props.season?.start ?? ""}
          endDate={props.season?.end ?? ""}
        />
        <CardScreenElement headingElement="h2" heading="Performance">
          <p>
            Signed in as Discord user <code>{props.discordId}</code>. Have a nice day.
          </p>
        </CardScreenElement>

      </div>
    </div>
  );
}
