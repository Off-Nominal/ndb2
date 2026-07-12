import { HeadingScreenElement } from "@web/shared/components/heading-screen-element";
import { CardScreenElement } from "@web/shared/components/card-screen-element";
import type { ErrorPageBody } from "@web/shared/components/error-page/error-page";
import {
  SeasonEndWebhookForm,
} from "./components/season-end-webhook-form";
import type { SeasonEndWebhookFormProps } from "./components/season-end-webhook-form";
import { AddSeasonForm } from "./components/add-season-form";
import type { AddSeasonFormProps } from "./components/add-season-form";

export type AdminPageBanner = {
  kind: "success" | "error";
  title: string;
  body: ErrorPageBody;
};

export type AdminPageProps = SeasonEndWebhookFormProps &
  AddSeasonFormProps & {
    banner?: AdminPageBanner;
  };

/** Admin tools shell for **`GET /admin`**. */
export function AdminPage(props: AdminPageProps): JSX.Element {
  return (
    <div class="[ stack ] [ main-menu ] [ admin-page ]">
      <HeadingScreenElement>
        <h1 class="[ canvas-knockout-text ]">Admin</h1>
      </HeadingScreenElement>
      {props.banner ? (
        <div
          role={props.banner.kind === "error" ? "alert" : "status"}
          class="[ stack ]"
        >
          <p>{props.banner.title}</p>
          {typeof props.banner.body === "string" ? (
            <p>{props.banner.body}</p>
          ) : (
            props.banner.body
          )}
        </div>
      ) : null}
      <div class="[ admin-page__tools ]">
        <CardScreenElement heading="Add season" headingElement="h2">
          <AddSeasonForm
            latestSeason={props.latestSeason}
            name={props.name}
            start={props.start}
            end={props.end}
            payout_formula={props.payout_formula}
          />
        </CardScreenElement>
        <CardScreenElement
          heading="Re-send season end webhook"
          headingElement="h2"
        >
          <SeasonEndWebhookForm
            seasons={props.seasons}
            selectedSeasonId={props.selectedSeasonId}
          />
        </CardScreenElement>
      </div>
    </div>
  );
}
